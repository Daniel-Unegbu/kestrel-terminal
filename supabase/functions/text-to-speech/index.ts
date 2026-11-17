import { z } from "npm:zod@3";
import { requirePublishableKey } from "../_shared/auth.ts";
import { encodeBase64 } from "../_shared/base64.ts";
import { corsHeaders, originAllowed, preflight } from "../_shared/cors.ts";
import { errorMessage, json } from "../_shared/http.ts";

const inputSchema = z.object({ text: z.string().min(1).max(2000) });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const cors = corsHeaders(req);
  if (!originAllowed(req)) return json({ ok: false, error: "Origin not allowed" }, 403, cors);
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, cors);

  const authError = requirePublishableKey(req, cors);
  if (authError) return authError;

  const key = Deno.env.get("DEEPGRAM_API_KEY");
  if (!key) {
    return json({ ok: false, error: "voice-not-configured" }, 200, cors);
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return json({ ok: false, error: "Invalid input" }, 400, cors);
    }

    const response = await fetch(
      "https://api.deepgram.com/v1/speak?model=aura-2-orion-en&encoding=mp3",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: parsed.data.text }),
      },
    );

    if (!response.ok) {
      console.error("Deepgram TTS", response.status, await response.text().catch(() => ""));
      return json({ ok: false, error: "tts-failed" }, 200, cors);
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    return json({ ok: true, audioBase64: encodeBase64(bytes), mime: "audio/mpeg" }, 200, cors);
  } catch (error) {
    console.error("Deepgram TTS failed", errorMessage(error));
    return json({ ok: false, error: "tts-failed" }, 200, cors);
  }
});
