import { fetchWithTimeout } from "./http.ts";

export interface SerpResult {
  title: string;
  snippet: string;
  url: string;
}

export interface SerpAnswer {
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
  error?: string;
}

function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(" ");
  return "";
}

/**
 * Google native search through SerpAPI. The answer is read straight out of the
 * payload — no LLM is involved in the Deal Desk path.
 */
export async function googleSearch(query: string, num = 4): Promise<SerpAnswer> {
  const apiKey = Deno.env.get("SERPAPI_API_KEY");
  if (!apiKey) throw new Error("SERPAPI_API_KEY is not configured");

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(num));
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

  const answerText =
    asText(payload.answer_box?.answer) ||
    asText(payload.answer_box?.snippet) ||
    asText(payload.knowledge_graph?.description) ||
    asText(payload.organic_results?.[0]?.snippet) ||
    "No direct market filing found for that specific query.";

  const results = (payload.organic_results ?? [])
    .filter((item) => !!item.link)
    .slice(0, 3)
    .map((item) => ({
      title: item.title ?? item.link!,
      snippet: (item.snippet ?? "").slice(0, 400),
      url: item.link!,
    }));

  return { answerText, results };
}
