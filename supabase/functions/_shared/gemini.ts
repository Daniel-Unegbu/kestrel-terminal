const DEFAULT_FAST_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_DEEP_MODEL = "gemini-3.8-flash";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export interface GeminiJsonRequest {
  system: string;
  user: string;
  deep?: boolean;
  temperature?: number;
}

export function stripFences(value: string): string {
  return value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

/**
 * Calls the Gemini API directly with the JSON response MIME type and returns
 * the parsed object. The Lovable AI Gateway (bifrost) is no longer involved.
 */
export async function generateJson(request: GeminiJsonRequest): Promise<unknown> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const model = request.deep
    ? (Deno.env.get("GEMINI_MODEL_DEEP") ?? DEFAULT_DEEP_MODEL)
    : (Deno.env.get("GEMINI_MODEL_FAST") ?? DEFAULT_FAST_MODEL);

  const response = await fetch(`${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: request.system }] },
      contents: [{ role: "user", parts: [{ text: request.user }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: request.temperature ?? 0.35,
        maxOutputTokens: 8192,
      },
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    // Never log the request headers or the key.
    console.error(`Gemini request failed (${response.status}): ${raw.slice(0, 500)}`);
    throw new Error(`Gemini request failed (${response.status})`);
  }

  let payload: {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error("Gemini returned a non-JSON envelope");
  }

  const text = (payload.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) throw new Error("Gemini returned an empty response");

  try {
    return JSON.parse(stripFences(text));
  } catch {
    throw new Error("Gemini returned malformed JSON");
  }
}
