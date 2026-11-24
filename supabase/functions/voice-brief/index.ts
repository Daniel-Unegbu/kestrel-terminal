import { z } from "npm:zod@3";
import { requirePublishableKey } from "../_shared/auth.ts";
import { corsHeaders, originAllowed, preflight } from "../_shared/cors.ts";
import { speak } from "../_shared/deepgram.ts";
import { errorMessage, json } from "../_shared/http.ts";

const inputSchema = z.object({
  script: z.string().trim().min(1).max(4000).optional(),
  text: z.string().trim().min(1).max(4000).optional(),
  voice: z.enum(["female", "lead"]).optional().default("lead"),
});

/**
 * voice-brief: Deepgram Aura TTS only. Returns raw MP3 bytes so the browser can
 * play them straight in an <audio> element.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const cors = corsHeaders(req);
  if (!originAllowed(req)) return json({ ok: false, error: "Origin not allowed" }, 403, cors);
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, cors);

  const authError = requirePublishableKey(req, cors);
  if (authError) return authError;

  if (!Deno.env.get("DEEPGRAM_API_KEY")) {
    return json({ ok: false, error: "voice-not-configured" }, 200, cors);
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) return json({ ok: false, error: "Invalid input" }, 400, cors);

    const script = parsed.data.script ?? parsed.data.text;
    if (!script) return json({ ok: false, error: "Invalid input" }, 400, cors);

    const audio = await speak(script, parsed.data.voice);

    return new Response(audio, {
      status: 200,
      headers: {
        ...cors,
        "content-type": "audio/mpeg",
        "content-length": String(audio.byteLength),
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("voice-brief failed", errorMessage(error));
    return json({ ok: false, error: "tts-failed" }, 200, cors);
  }
});
