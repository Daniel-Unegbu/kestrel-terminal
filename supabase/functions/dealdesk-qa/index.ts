import { z } from "npm:zod@3";
import { requirePublishableKey } from "../_shared/auth.ts";
import { decodeBase64 } from "../_shared/base64.ts";
import { corsHeaders, originAllowed, preflight } from "../_shared/cors.ts";
import { transcribe } from "../_shared/deepgram.ts";
import { errorMessage, json } from "../_shared/http.ts";
import { googleSearch } from "../_shared/serp.ts";

const inputSchema = z.object({
  questionText: z.string().trim().min(2).max(600).optional(),
  entityName: z.string().trim().max(160).optional(),
  audioBase64: z.string().min(10).max(8_000_000).optional(),
  mime: z.string().max(80).optional(),
  transcribeOnly: z.boolean().optional().default(false),
});

/**
 * dealdesk-qa: Deepgram Nova speech-to-text + SerpAPI Google search.
 * No Gemini call happens on this path — the answer is read out of the search
 * payload so every response is traceable to a live source.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const cors = corsHeaders(req);
  if (!originAllowed(req)) return json({ ok: false, error: "Origin not allowed" }, 403, cors);
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, cors);

  const authError = requirePublishableKey(req, cors);
  if (authError) return authError;

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let questionText: string | undefined;
    let entityName: string | undefined;
    let audio: Uint8Array | undefined;
    let mime = "audio/webm";
    let transcribeOnly = false;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("audio");
      entityName =
        typeof form.get("entityName") === "string" ? String(form.get("entityName")) : undefined;
      transcribeOnly = form.get("transcribeOnly") === "true";
      if (file instanceof File) {
        audio = new Uint8Array(await file.arrayBuffer());
        mime = file.type || mime;
      }
    } else {
      const body = await req.json().catch(() => null);
      const parsed = inputSchema.safeParse(body);
      if (!parsed.success) return json({ ok: false, error: "Invalid input" }, 400, cors);

      questionText = parsed.data.questionText;
      entityName = parsed.data.entityName;
      transcribeOnly = parsed.data.transcribeOnly;
      mime = parsed.data.mime ?? mime;
      if (parsed.data.audioBase64) audio = decodeBase64(parsed.data.audioBase64);
    }

    if (!audio && !questionText) return json({ ok: false, error: "Invalid input" }, 400, cors);

    let transcript = questionText ?? "";
    if (audio) {
      transcript = await transcribe(audio, mime);
      if (!transcript) {
        return json({ ok: false, error: "stt-empty" }, 200, cors);
      }
    }

    if (transcribeOnly) return json({ ok: true, transcript }, 200, cors);

    const searchQuery = [entityName, transcript].filter(Boolean).join(" ").trim();
    const { answerText, results } = await googleSearch(searchQuery, 4);

    return json({ ok: true, transcript, answerText, results }, 200, cors);
  } catch (error) {
    const message = errorMessage(error);
    console.error("dealdesk-qa failed", message);
    const isVoice = message.includes("DEEPGRAM") || message.toLowerCase().includes("deepgram");
    return json({ ok: false, error: isVoice ? "stt-failed" : "search-failed" }, 200, cors);
  }
});
