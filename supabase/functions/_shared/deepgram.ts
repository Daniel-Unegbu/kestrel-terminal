import { fetchWithTimeout } from "./http.ts";

const DEEPGRAM_SPEAK = "https://api.deepgram.com/v1/speak";
const DEEPGRAM_LISTEN = "https://api.deepgram.com/v1/listen";

function apiKey(): string {
  const key = Deno.env.get("DEEPGRAM_API_KEY");
  if (!key) throw new Error("DEEPGRAM_API_KEY is not configured");
  return key;
}

function ttsModels(voice: "female" | "lead"): string[] {
  if (voice === "female") return ["aura-2-asteria-en", "aura-asteria-en"];
  const configured = Deno.env.get("DEEPGRAM_TTS_MODEL")?.trim();
  // Aura-2 and Aura-1 use different model ids for the same voice.
  return [...new Set([configured, "aura-2-orion-en", "aura-orion-en"].filter(Boolean))] as string[];
}

/** Deepgram Aura text-to-speech. Returns the raw MP3 bytes. */
export async function speak(text: string, voice: "female" | "lead" = "lead"): Promise<Uint8Array> {
  const key = apiKey();
  let lastStatus = 0;

  for (const model of ttsModels(voice)) {
    const response = await fetchWithTimeout(
      `${DEEPGRAM_SPEAK}?model=${encodeURIComponent(model)}&encoding=mp3`,
      {
        method: "POST",
        headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      },
      60_000,
    );

    if (response.ok) return new Uint8Array(await response.arrayBuffer());

    lastStatus = response.status;
    console.error(`Deepgram speak ${model} failed (${response.status})`);
    if (response.status === 401 || response.status === 403) break;
  }

  throw new Error(`Deepgram TTS failed (${lastStatus})`);
}

/** Deepgram Nova speech-to-text. Returns the transcript, or "" if silent. */
export async function transcribe(audio: Uint8Array, mime: string): Promise<string> {
  const key = apiKey();
  const model = Deno.env.get("DEEPGRAM_STT_MODEL")?.trim() || "nova-2";
  const contentType = mime.split(";")[0]?.trim() || "audio/webm";

  const url = new URL(DEEPGRAM_LISTEN);
  url.searchParams.set("model", model);
  url.searchParams.set("smart_format", "true");
  url.searchParams.set("punctuate", "true");

  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { Authorization: `Token ${key}`, "Content-Type": contentType },
      body: audio,
    },
    60_000,
  );

  const raw = await response.text();
  if (!response.ok) {
    console.error(`Deepgram listen failed (${response.status}): ${raw.slice(0, 200)}`);
    throw new Error(`Deepgram STT failed (${response.status})`);
  }

  let payload: {
    results?: { channels?: Array<{ alternatives?: Array<{ transcript?: string }> }> };
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error("Deepgram returned a non-JSON body");
  }

  return payload.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";
}
