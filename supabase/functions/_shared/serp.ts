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
  /** Which SERP feature produced the answer — useful when tuning. */
  answerSource: "answer_box" | "related_questions" | "knowledge_graph" | "organic" | "none";
  results: SerpResult[];
}

interface RelatedQuestion {
  question?: string;
  snippet?: string;
  title?: string;
  link?: string;
}

interface SerpPayload {
  answer_box?: {
    answer?: unknown;
    snippet?: string;
    title?: string;
    link?: string;
    list?: unknown;
  };
  knowledge_graph?: { description?: string; title?: string; source?: { link?: string } };
  organic_results?: Array<{ title?: string; snippet?: string; link?: string }>;
  news_results?: Array<{ title?: string; snippet?: string; link?: string; date?: string }>;
  related_questions?: RelatedQuestion[];
  error?: string;
}

/**
 * Question words, connectives and AuditDesk-specific vocabulary. Google returns
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
  "audit",
  "audited",
  "auditor",
  "auditors",
  "control",
  "controls",
  "could",
  "did",
  "do",
  "does",
  "doing",
  "down",
  "during",
  "each",
  "few",
  "finding",
  "findings",
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
  "pillar",
  "pillars",
  "system",
  "systems",
  "risk",
  "risks",
]);

const MAX_KEYWORDS = 6;

/** Only explicit news/recency intent switches to Google News — forcing it for
 * "risk" questions replaces Google's answer box with bare headlines. */
const NEWS_INTENT = /\b(news|latest|recent|today|this week|update|announcement|announced)\b/i;

/** Regulators, standards bodies and reputable outlets first; forums last. */
const AUTHORITATIVE = [
  "insa.gov.et",
  "ecysa.gov.et",
  "nbe.gov.et",
  "egov.et",
  "customs.gov.et",
  "moj.gov.et",
  "ethiotelecom.et",
  "isaca.org",
  "iso.org",
  "iia.global",
  "itu.int",
  "worldbank.org",
  "imf.org",
  "afdb.org",
  "reuters.com",
  "ft.com",
  "thereporterethiopia.com",
  "addisstandard.com",
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

/**
 * Google's knowledge panel carries the fact itself (`ceo`, `headquarters`,
 * `founded`, …). When the question names one of those attributes, return the
 * value instead of the generic company description.
 */
function knowledgeFact(
  knowledge: Record<string, unknown> | undefined,
  keywords: string[],
): string | null {
  if (!knowledge) return null;

  const skipped = new Set(["description", "title", "source", "type", "image", "thumbnail", "link"]);

  for (const [key, value] of Object.entries(knowledge)) {
    if (skipped.has(key)) continue;
    const keyTokens = tokenize(key);
    if (!keyTokens.some((token) => keywords.includes(token))) continue;

    const record = value as { name?: unknown; value?: unknown } | null;
    const text = asText(value) || asText(record?.name) || asText(record?.value);
    if (!text || text.length > 300) continue;

    const label = key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
    return `${label}: ${text}`;
  }

  return null;
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

/** Prefers the same features Google itself uses to answer a query directly. */
function pickAnswer(
  payload: SerpPayload,
  ranked: Array<{ title?: string; snippet?: string; link?: string }>,
  keywords: string[],
): { text: string; source: SerpAnswer["answerSource"] } {
  const box = payload.answer_box;
  const direct = asText(box?.answer) || asText(box?.snippet) || asText(box?.list);
  if (direct) return { text: direct, source: "answer_box" };

  // "People also ask" rows are literal question/answer pairs from Google.
  const related = (payload.related_questions ?? [])
    .filter((item) => !!item.snippet)
    .sort(
      (a, b) =>
        overlap(`${b.question ?? ""} ${b.snippet ?? ""}`, keywords) -
        overlap(`${a.question ?? ""} ${a.snippet ?? ""}`, keywords),
    );
  if (related[0]?.snippet) {
    return { text: asText(related[0].snippet), source: "related_questions" };
  }

  const fact = knowledgeFact(
    payload.knowledge_graph as Record<string, unknown> | undefined,
    keywords,
  );
  if (fact) return { text: fact, source: "knowledge_graph" };

  const knowledge = asText(payload.knowledge_graph?.description);
  if (knowledge) return { text: knowledge, source: "knowledge_graph" };

  // For the answer itself, topical relevance beats outlet prestige; the citation
  // list keeps its authority-first ordering.
  const best = [...ranked].sort((a, b) => {
    const overlapA = overlap(`${a.title ?? ""} ${a.snippet ?? ""}`, keywords);
    const overlapB = overlap(`${b.title ?? ""} ${b.snippet ?? ""}`, keywords);
    if (overlapB !== overlapA) return overlapB - overlapA;
    return domainRank(b.link!) - domainRank(a.link!);
  })[0];

  const top = asText(best?.snippet) || asText(best?.title);
  if (top) return { text: top, source: "organic" };

  return { text: "No direct audit source found for that specific query.", source: "none" };
}

/**
 * Google native search through SerpAPI. The answer is read straight out of the
 * payload — no LLM is involved in the AuditDesk path.
 */
export async function googleSearch(
  entityName: string,
  question: string,
  num = 10,
): Promise<SerpAnswer> {
  const apiKey = Deno.env.get("SERPAPI_API_KEY");
  if (!apiKey) throw new Error("SERPAPI_API_KEY is not configured");

  const query = buildSearchQuery(entityName, question);

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(num));
  url.searchParams.set("gl", "et");
  url.searchParams.set("hl", "en");
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

  const { text: answerText, source: answerSource } = pickAnswer(payload, ranked, keywords);

  const results = ranked.slice(0, 3).map((item) => ({
    title: item.title ?? item.link!,
    snippet: (item.snippet ?? "").slice(0, 400),
    url: item.link!,
  }));

  return { query, answerText, answerSource, results };
}
