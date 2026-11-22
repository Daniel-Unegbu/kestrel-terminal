import { z } from "npm:zod@3";
import { requirePublishableKey } from "../_shared/auth.ts";
import { corsHeaders, originAllowed, preflight } from "../_shared/cors.ts";
import { slugify, type InstitutionalDossier } from "../_shared/dossier.ts";
import { GeminiError } from "../_shared/gemini.ts";
import { errorMessage, json } from "../_shared/http.ts";
import { retrieve, synthesize } from "../_shared/research.ts";
import { adminClient } from "../_shared/supabase.ts";

const SEGMENTS = [
  "PUBLIC_SECTOR_INFRA",
  "FINANCIAL_CORE_SYSTEMS",
  "TELECOM_CLOUD_ITSM",
  "ENTERPRISE_ERP_GOV",
] as const;

/** Bumped whenever the dossier payload shape changes; older rows are a cache miss. */
const DOSSIER_SCHEMA_VERSION = 2;

const inputSchema = z.object({
  query: z.string().trim().min(2).max(120).optional(),
  entity: z.string().trim().min(2).max(120).optional(),
  segment: z.enum(SEGMENTS).optional(),
  forceRefresh: z.boolean().optional().default(false),
  deep: z.boolean().optional().default(false),
});

/**
 * research-entity: Tavily deep research + Gemini structured synthesis.
 * Cached first by entity_slug, then upserted back into institutional_dossiers.
 */
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
    if (!parsed.success) return json({ ok: false, error: "Invalid input" }, 400, cors);

    const query = parsed.data.query ?? parsed.data.entity;
    if (!query) return json({ ok: false, error: "Invalid input" }, 400, cors);

    const slug = slugify(query);
    if (!slug) return json({ ok: false, error: "Invalid input" }, 400, cors);

    const db = adminClient();

    if (!parsed.data.forceRefresh) {
      const { data: cached, error: cacheError } = await db
        .from("institutional_dossiers")
        .select("id, dossier_payload")
        .eq("entity_slug", slug)
        .maybeSingle();

      if (cacheError) console.error("Dossier cache lookup failed", cacheError.message);
      else if (cached) {
        const payload = cached.dossier_payload as unknown as InstitutionalDossier;
        // Legacy dossiers were shaped for the old coverage model. Treat them as a
        // cache miss so the entity is re-synthesised against the current schema.
        if (payload?.schemaVersion === DOSSIER_SCHEMA_VERSION) {
          return json(
            {
              ok: true,
              cached: true,
              slug,
              dossier: { ...payload, id: cached.id as string },
              sourceCount: payload.sources?.length ?? 0,
              elapsedMs: Date.now() - started,
            },
            200,
            cors,
          );
        }
      }
    }

    const docs = await retrieve(query);
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

    const { dossier, model } = await synthesize(query, docs, parsed.data.deep);
    const segment = parsed.data.segment ?? dossier.segment;
    const record = { ...dossier, segment };

    let id: string | undefined;
    const { data: row, error: saveError } = await db
      .from("institutional_dossiers")
      .upsert(
        {
          entity_slug: slug,
          entity_name: record.entityName,
          segment,
          is_preset: false,
          dossier_payload: record,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "entity_slug" },
      )
      .select("id")
      .single();

    if (saveError) console.error("Dossier save failed", saveError.message);
    else id = row?.id as string | undefined;

    return json(
      {
        ok: true,
        cached: false,
        slug,
        dossier: { ...record, id },
        sourceCount: docs.length,
        synthesisModel: model,
        elapsedMs: Date.now() - started,
      },
      200,
      cors,
    );
  } catch (error) {
    if (error instanceof GeminiError) {
      console.error("research-entity synthesis failed", error.message, error.model);
      return json(
        {
          ok: false,
          error: "The Research Agent is busy right now. Please try the search again.",
          code: "synthesis_unavailable",
        },
        502,
        cors,
      );
    }

    console.error("research-entity failed", errorMessage(error));
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
