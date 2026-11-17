import { fetchWithTimeout } from "./http.ts";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * One GEMINI_API_KEY covers every model — the tier only changes the model name
 * in the request path. Keep these in sync with the two synthesis modes.
 */
const MODELS = {
  standard: "gemini-3.5-flash-lite",
  deep: "gemini-3.8-flash",
  lastResort: "gemini-2.5-flash",
} as const;

/** Edge Functions are killed at 150s wall clock; leave room for Tavily + the upsert. */
const TOTAL_BUDGET_MS = 100_000;
const ATTEMPT_TIMEOUT_MS = 45_000;
/** The Pro-tier model is capacity-constrained today; don't let a hang cost 45s. */
const DEEP_ATTEMPT_TIMEOUT_MS = 30_000;

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
  deep?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Fallback order per tier. A 404/400 (model not available on this key) moves
 * straight to the next model; 429/5xx are retried once more, because Google
 * returns 503 "high demand" spikes fairly often.
 */
function modelChain(deep: boolean): string[] {
  return deep
    ? [MODELS.deep, MODELS.standard, MODELS.lastResort]
    : [MODELS.standard, MODELS.lastResort];
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

export interface GeminiJsonResult {
  data: unknown;
  /** The model that actually answered — may be a fallback when the primary is busy. */
  model: string;
}

/** Calls the Gemini REST API directly and returns the parsed JSON body. */
export async function generateJson(request: GeminiJsonRequest): Promise<GeminiJsonResult> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let lastError: GeminiError | undefined;

  for (const model of modelChain(!!request.deep)) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const remaining = deadline - Date.now();
      if (remaining < 5_000) {
        lastError ??= new GeminiError("Gemini time budget exhausted", 504, model);
        return Promise.reject(lastError);
      }

      let response: Response;
      let raw: string;
      try {
        response = await fetchWithTimeout(
          `${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent`,
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
          Math.min(model === MODELS.deep ? DEEP_ATTEMPT_TIMEOUT_MS : ATTEMPT_TIMEOUT_MS, remaining),
        );
        raw = await response.text();
      } catch (fetchError) {
        // Timeouts and network resets land here — try the next model instead.
        console.error(`Gemini ${model} transport failure: ${String(fetchError)}`);
        lastError = new GeminiError(`Gemini ${model} timed out`, 504, model);
        break;
      }

      if (response.ok) {
        // A usable envelope with malformed JSON is worth retrying on the next model.
        try {
          const text = extractText(raw);
          if (!text) throw new Error("empty response");
          return { data: JSON.parse(stripFences(text)), model };
        } catch (parseError) {
          console.error(`Gemini ${model} returned unusable JSON: ${String(parseError)}`);
          lastError = new GeminiError(`Gemini ${model} returned unusable JSON`, 502, model);
          break;
        }
      }

      // Never log the key or request headers.
      console.error(`Gemini ${model} failed (${response.status}): ${raw.slice(0, 300)}`);
      lastError = new GeminiError(`Gemini ${response.status}`, response.status, model);

      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable) break;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  throw lastError ?? new Error("Gemini request failed");
}
