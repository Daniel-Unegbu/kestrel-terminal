import { z } from "npm:zod@3";
import { requirePublishableKey } from "../_shared/auth.ts";
import { corsHeaders, originAllowed, preflight } from "../_shared/cors.ts";
import { slugify } from "../_shared/dossier.ts";
import { errorMessage, json } from "../_shared/http.ts";
import { retrieve, synthesize } from "../_shared/research.ts";
import { adminClient } from "../_shared/supabase.ts";

const inputSchema = z.object({
  entity: z.string().trim().min(2).max(120),
  deep: z.boolean().default(false),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const cors = corsHeaders(req);
  if (!originAllowed(req)) return json({ ok: false, error: "Origin not allowed" }, 403, cors);
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, cors);

  const authError = requirePublishableKey(req, cors);
  if (authError) return authError;

  const started = Date.now();

  try {
    const body = await req.json().catch(() => null);
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return json({ ok: false, error: "Invalid input" }, 400, cors);
    }

    const { entity, deep } = parsed.data;
    const docs = await retrieve(entity);
    if (docs.length === 0) {
      return json(
        {
          ok: false,
          error: "No live sources found for that entity. Try the full registered name.",
        },
        200,
        cors,
      );
    }

    const dossier = await synthesize(entity, docs, deep);
    const slug = slugify(dossier.entityName || entity);

    let id: string | undefined;
    try {
      const { data: row, error } = await adminClient()
        .from("institutional_dossiers")
        .upsert(
          {
            entity_slug: slug,
            entity_name: dossier.entityName,
            segment: dossier.segment,
            is_preset: false,
            dossier_payload: dossier,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "entity_slug" },
        )
        .select("id")
        .single();

      if (error) {
        console.error("Dossier save failed", error.message);
      } else {
        id = row?.id as string | undefined;
      }
    } catch (saveError) {
      console.error("Dossier save failed", errorMessage(saveError));
    }

    return json(
      {
        ok: true,
        slug,
        dossier: { ...dossier, id },
        sourceCount: docs.length,
        elapsedMs: Date.now() - started,
      },
      200,
      cors,
    );
  } catch (error) {
    console.error("Research failed", errorMessage(error));
    return json(
      {
        ok: false,
        error: "The research pipeline couldn't complete this dossier. Please try again.",
      },
      500,
      cors,
    );
  }
});
