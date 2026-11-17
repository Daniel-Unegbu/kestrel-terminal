import { fetchWithTimeout } from "./http.ts";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * One GEMINI_API_KEY covers every model; the tier only changes the model name.
 * There is exactly one model configured: the Pro tier is paused to protect the
 * project's token quota, and gemini-2.5-flash is no longer used at all.
 */
const MODEL = "gemini-3.5-flash-lite";

/** Edge Functions are killed at 150s wall clock; leave room for Tavily + the upsert. */
const TOTAL_BUDGET_MS = 100_000;
const ATTEMPT_TIMEOUT_MS = 45_000;
const MAX_ATTEMPTS = 2;

export class GeminiError extends Error {
  readonly status: number;
  readonly model: string;

  constructor(message: string, status: number, model: string) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
    this.model = model;
  }
}

export interface GeminiJsonRequest {
  system: string;
  user: string;
  /** Deep synthesis currently costs more tokens, not a bigger model. */
  deep?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GeminiJsonResult {
  data: unknown;
  /** The model that answered, so callers can log/return it. */
  model: string;
}

export function stripFences(value: string): string {
  return value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function extractText(raw: string): string {
  let payload: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error("Gemini returned a non-JSON envelope");
  }
  return (payload.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

/** Calls the Gemini REST API directly and returns the parsed JSON body. */
export async function generateJson(request: GeminiJsonRequest): Promise<GeminiJsonResult> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let lastError: GeminiError | undefined;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < 5_000) {
      throw lastError ?? new GeminiError("Gemini time budget exhausted", 504, MODEL);
    }

    let response: Response;
    let raw: string;
    try {
      response = await fetchWithTimeout(
        `${GEMINI_ENDPOINT}/${encodeURIComponent(MODEL)}:generateContent`,
        {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: request.system }] },
            contents: [{ role: "user", parts: [{ text: request.user }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: request.temperature ?? 0.3,
              maxOutputTokens: request.maxOutputTokens ?? 8192,
            },
          }),
        },
        Math.min(ATTEMPT_TIMEOUT_MS, remaining),
      );
      raw = await response.text();
    } catch (fetchError) {
      // Timeouts and network resets land here; one more attempt, then fail clean.
      console.error(`Gemini ${MODEL} transport failure: ${String(fetchError)}`);
      lastError = new GeminiError(`Gemini ${MODEL} timed out`, 504, MODEL);
      continue;
    }

    if (response.ok) {
      try {
        const text = extractText(raw);
        if (!text) throw new Error("empty response");
        return { data: JSON.parse(stripFences(text)), model: MODEL };
      } catch (parseError) {
        console.error(`Gemini ${MODEL} returned unusable JSON: ${String(parseError)}`);
        lastError = new GeminiError(`Gemini ${MODEL} returned unusable JSON`, 502, MODEL);
        continue;
      }
    }

    // Never log the key or request headers.
    console.error(`Gemini ${MODEL} failed (${response.status}): ${raw.slice(0, 300)}`);
    lastError = new GeminiError(`Gemini ${response.status}`, response.status, MODEL);

    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable) break;
    if (attempt < MAX_ATTEMPTS - 1) {
      await new Promise((resolve) => setTimeout(resolve, 900));
    }
  }

  throw lastError ?? new Error("Gemini request failed");
}
