import { z } from "npm:zod@3";
import { requirePublishableKey } from "../_shared/auth.ts";
import { corsHeaders, originAllowed, preflight } from "../_shared/cors.ts";
import { generateJson } from "../_shared/gemini.ts";
import { errorMessage, json } from "../_shared/http.ts";

const inputSchema = z.object({
  question: z.string().trim().min(3).max(600),
  dossierJson: z.string().max(60_000),
});

const answerSchema = z.object({
  answer: z.string(),
  spoken: z.string().catch(""),
  leadDivision: z.string().catch(""),
  sourceRefs: z.array(z.coerce.number().int()).catch([]),
});

const SYSTEM =
  'You are FAB\'s Deal Desk copilot for relationship managers. Answer ONLY from the dossier JSON provided. Be crisp and institutional. Return JSON: {"answer": string (3-5 sentences, cite sources inline as [Source N] using 1-based numbering of dossier.sources), "spoken": string (exactly 2 short sentences for text-to-speech, no brackets), "leadDivision": string (one FAB division), "sourceRefs": number[] (0-based indexes into dossier.sources)}';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const cors = corsHeaders(req);
  if (!originAllowed(req)) return json({ ok: false, error: "Origin not allowed" }, 403, cors);
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, cors);

  const authError = requirePublishableKey(req, cors);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => null);
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return json({ ok: false, error: "Invalid input" }, 400, cors);
    }

    const raw = await generateJson({
      system: SYSTEM,
      user: `DOSSIER:\n${parsed.data.dossierJson}\n\nQUESTION: ${parsed.data.question}`,
      deep: false,
      temperature: 0.25,
    });

    const answer = answerSchema.parse(raw);
    return json(
      {
        ok: true,
        ...answer,
        spoken: answer.spoken || answer.answer,
      },
      200,
      cors,
    );
  } catch (error) {
    console.error("Deal desk failed", errorMessage(error));
    return json(
      { ok: false, error: "The Deal Desk couldn't answer right now. Please try again." },
      500,
      cors,
    );
  }
});
