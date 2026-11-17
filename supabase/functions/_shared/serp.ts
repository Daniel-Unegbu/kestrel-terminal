import { fetchWithTimeout } from "./http.ts";

export interface SerpResult {
  title: string;
  snippet: string;
  url: string;
}

export interface SerpAnswer {
  /** The trimmed query actually sent to Google. */
  query: string;
  answerText: string;
  results: SerpResult[];
}

interface SerpPayload {
  answer_box?: {
    answer?: unknown;
    snippet?: string;
    title?: string;
    link?: string;
  };
  knowledge_graph?: { description?: string; title?: string; source?: { link?: string } };
  organic_results?: Array<{ title?: string; snippet?: string; link?: string }>;
  news_results?: Array<{ title?: string; snippet?: string; link?: string; date?: string }>;
  error?: string;
}

/**
 * Question words, connectives and DealDesk-specific vocabulary. Google returns
 * brand homepages for long conversational sentences, so only the substantive
 * terms are forwarded.
 */
const STOPWORDS = new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "best",
  "between",
  "both",
  "but",
  "by",
  "can",
  "client",
  "clients",
  "company",
  "could",
  "did",
  "do",
  "does",
  "doing",
  "down",
  "during",
  "each",
  "entity",
  "few",
  "for",
  "from",
  "further",
  "give",
  "had",
  "has",
  "have",
  "having",
  "he",
  "her",
  "here",
  "hers",
  "him",
  "his",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "itself",
  "just",
  "know",
  "latest",
  "lead",
  "like",
  "me",
  "more",
  "most",
  "my",
  "need",
  "needs",
  "no",
  "nor",
  "not",
  "now",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "ought",
  "our",
  "ours",
  "out",
  "over",
  "own",
  "please",
  "same",
  "she",
  "should",
  "show",
  "so",
  "some",
  "such",
  "tell",
  "than",
  "that",
  "the",
  "their",
  "theirs",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "to",
  "too",
  "top",
  "two",
  "under",
  "until",
  "up",
  "us",
  "very",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "whom",
  "why",
  "will",
  "with",
  "would",
  "you",
  "your",
  "yours",
  "division",
  "divisions",
  "fab",
]);

const MAX_KEYWORDS = 6;

/** Questions about risk/outlook/markets are better served by Google News. */
const NEWS_INTENT =
  /\b(news|latest|recent|today|outlook|risk|risks|rating|ratings|market|update|2026)\b/i;

/** Reputable outlets first; forums and lead-gen blogs last. */
const AUTHORITATIVE = [
  "reuters.com",
  "bloomberg.com",
  "ft.com",
  "wsj.com",
  "thenationalnews.com",
  "gulfnews.com",
  "khaleejtimes.com",
  "zawya.com",
  "spglobal.com",
  "moodys.com",
  "fitchratings.com",
  "msci.com",
  "bankfab.com",
  "centralbank.ae",
  "dfm.ae",
  "adx.ae",
  "imf.org",
  "worldbank.org",
  "bis.org",
];

const LOW_QUALITY = [
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "pinterest.com",
  "tiktok.com",
];

function domainRank(url: string): number {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (LOW_QUALITY.some((domain) => host.endsWith(domain))) return 0;
    if (AUTHORITATIVE.some((domain) => host === domain || host.endsWith(`.${domain}`))) return 3;
    return 1;
  } catch {
    return 0;
  }
}

function tokenize(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

/** The fewest words Google needs: the entity, then the substantive terms. */
export function buildSearchQuery(entityName: string, question: string): string {
  const entity = entityName.trim();
  const entityTokens = new Set(tokenize(entity));

  const keywords = [...new Set(tokenize(question))].filter(
    (token) => token.length > 1 && !STOPWORDS.has(token) && !entityTokens.has(token),
  );

  return [entity, ...keywords.slice(0, MAX_KEYWORDS)]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
}

function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(" ");
  return "";
}

function overlap(text: string, keywords: string[]): number {
  const haystack = text.toLowerCase();
  return keywords.reduce((score, word) => (haystack.includes(word) ? score + 1 : score), 0);
}

/** A company's own landing page rarely answers a question — rank it last. */
function isEntityHomepage(url: string, entityName: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.pathname !== "/" && parsed.pathname !== "") return false;
    const host = parsed.hostname.replace(/^www\./, "");
    return tokenize(entityName).some((token) => token.length > 3 && host.includes(token));
  } catch {
    return false;
  }
}

/**
 * Google native search through SerpAPI. The answer is read straight out of the
 * payload — no LLM is involved in the Deal Desk path.
 */
export async function googleSearch(
  entityName: string,
  question: string,
  num = 4,
): Promise<SerpAnswer> {
  const apiKey = Deno.env.get("SERPAPI_API_KEY");
  if (!apiKey) throw new Error("SERPAPI_API_KEY is not configured");

  const query = buildSearchQuery(entityName, question);

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(num));
  if (NEWS_INTENT.test(question)) url.searchParams.set("tbm", "nws");
  url.searchParams.set("api_key", apiKey);

  const response = await fetchWithTimeout(url, {}, 25_000);
  const raw = await response.text();

  if (!response.ok) {
    console.error(`SerpAPI failed (${response.status}): ${raw.slice(0, 200)}`);
    throw new Error(`SerpAPI ${response.status}`);
  }

  let payload: SerpPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error("SerpAPI returned a non-JSON body");
  }

  if (payload.error) {
    console.error(`SerpAPI error: ${payload.error}`);
    throw new Error("SerpAPI request rejected");
  }

  const keywords = tokenize(question).filter((token) => !STOPWORDS.has(token));

  const seenLinks = new Set<string>();
  const candidates = [...(payload.news_results ?? []), ...(payload.organic_results ?? [])].filter(
    (item) => {
      if (!item.link || seenLinks.has(item.link)) return false;
      seenLinks.add(item.link);
      return true;
    },
  );

  const score = (item: (typeof candidates)[number]) => {
    if (isEntityHomepage(item.link!, entityName)) return -5;
    return (
      domainRank(item.link!) * 3 + overlap(`${item.title ?? ""} ${item.snippet ?? ""}`, keywords)
    );
  };

  const ranked = [...candidates].sort((a, b) => score(b) - score(a));

  const answerText =
    asText(payload.answer_box?.answer) ||
    asText(payload.answer_box?.snippet) ||
    asText(payload.knowledge_graph?.description) ||
    asText(ranked[0]?.snippet) ||
    asText(ranked[0]?.title) ||
    "No direct market filing found for that specific query.";

  const results = ranked.slice(0, 3).map((item) => ({
    title: item.title ?? item.link!,
    snippet: (item.snippet ?? "").slice(0, 400),
    url: item.link!,
  }));

  return { query, answerText, results };
}
