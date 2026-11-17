import { z } from "npm:zod@3";
import { requirePublishableKey } from "../_shared/auth.ts";
import { decodeBase64 } from "../_shared/base64.ts";
import { corsHeaders, originAllowed, preflight } from "../_shared/cors.ts";
import { errorMessage, json } from "../_shared/http.ts";

const inputSchema = z.object({
  audioBase64: z.string().min(10).max(8_000_000),
  mime: z.string().max(60),
});

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

    const contentType = parsed.data.mime.split(";")[0] || "audio/webm";
    const response = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${key}`,
          "Content-Type": contentType,
        },
        body: decodeBase64(parsed.data.audioBase64),
      },
    );

    if (!response.ok) {
      console.error("Deepgram STT", response.status, await response.text().catch(() => ""));
      return json({ ok: false, error: "stt-failed" }, 200, cors);
    }

    const payload = (await response.json()) as {
      results?: {
        channels?: Array<{ alternatives?: Array<{ transcript?: string }> }>;
      };
    };

    const transcript = payload.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";

    return json({ ok: true, transcript }, 200, cors);
  } catch (error) {
    console.error("Deepgram STT failed", errorMessage(error));
    return json({ ok: false, error: "stt-failed" }, 200, cors);
  }
});
