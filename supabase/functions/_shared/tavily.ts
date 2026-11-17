import { fetchWithTimeout } from "./http.ts";

export interface TavilyDoc {
  title: string;
  url: string;
  content: string;
  score?: number;
}

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

/**
 * Deep financial research via Tavily. Returns an empty array when the key is
 * missing or the provider rejects the request, so the caller can return a clean
 * "no sources" message instead of a stack trace.
 */
export async function tavilySearch(query: string, maxResults = 8): Promise<TavilyDoc[]> {
  const apiKey = Deno.env.get("TAVILY_API_KEY");
  if (!apiKey) {
    console.error("TAVILY_API_KEY is not configured");
    return [];
  }

  let response: Response;
  let raw: string;
  try {
    response = await fetchWithTimeout(
      TAVILY_ENDPOINT,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: "advanced",
          max_results: maxResults,
          include_answer: false,
          include_raw_content: false,
        }),
      },
      25_000,
    );
    raw = await response.text();
  } catch (error) {
    console.error(`Tavily request failed: ${String(error)}`);
    return [];
  }

  if (!response.ok) {
    console.error(`Tavily failed (${response.status}): ${raw.slice(0, 200)}`);
    return [];
  }

  let payload: {
    results?: Array<{ title?: string; url?: string; content?: string; score?: number }>;
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    console.error("Tavily returned a non-JSON body");
    return [];
  }

  return (payload.results ?? [])
    .filter((result) => !!result.url)
    .map((result) => ({
      title: result.title ?? result.url!,
      url: result.url!,
      content: (result.content ?? "").slice(0, 1200),
      ...(typeof result.score === "number" ? { score: result.score } : {}),
    }));
}
