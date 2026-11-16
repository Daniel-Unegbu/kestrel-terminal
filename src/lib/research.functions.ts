import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { slugify, type InstitutionalDossier, type SearchProvider } from "./dossier";

function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Supabase environment variables are not configured");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type ResearchResult =
  | { ok: true; slug: string; dossier: InstitutionalDossier; sourceCount: number; elapsedMs: number }
  | { ok: false; error: string };

export const runResearch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ entity: z.string().trim().min(2).max(120), deep: z.boolean().default(false) }).parse(d),
  )
  .handler(async ({ data }): Promise<ResearchResult> => {
    const started = Date.now();
    const { retrieve, synthesize } = await import("./research.server");
    try {
      const docs = await retrieve(data.entity);
      if (docs.length === 0) {
        return { ok: false, error: "No live sources found for that entity. Try the full registered name." };
      }
      const dossier = await synthesize(data.entity, docs, data.deep);
      const slug = slugify(dossier.entityName || data.entity);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row, error } = await supabaseAdmin
        .from("institutional_dossiers")
        .upsert(
          {
            entity_slug: slug,
            entity_name: dossier.entityName,
            segment: dossier.segment,
            is_preset: false,
            dossier_payload: dossier as never,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "entity_slug" },
        )
        .select("id")
        .single();
      if (error) console.error("Dossier save failed", error);
      return {
        ok: true,
        slug,
        dossier: { ...dossier, id: row?.id },
        sourceCount: docs.length,
        elapsedMs: Date.now() - started,
      };
    } catch (err) {
      console.error("Research failed", err);
      return { ok: false, error: "The research pipeline couldn't complete this dossier. Please try again." };
    }
  });

export const listRecentDossiers = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data, error } = await publicClient()
      .from("institutional_dossiers")
      .select("entity_slug, entity_name, segment, updated_at")
      .eq("is_preset", false)
      .order("updated_at", { ascending: false })
      .limit(12);
    if (error) {
      console.error(error);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.error("Recent dossiers unavailable", err);
    return [];
  }
});

export const getDossier = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    try {
      const { data: row, error } = await publicClient()
        .from("institutional_dossiers")
        .select("id, dossier_payload")
        .eq("entity_slug", data.slug)
        .maybeSingle();
      if (error || !row) return null;
      const payload = row.dossier_payload as unknown as InstitutionalDossier;
      // Dossiers saved before the provider rename stored vendor names; normalise on read.
      const provider = (p: string) => (p === "TAVILY" ? "RESEARCH" : p === "SERPAPI" ? "SEARCH" : p) as SearchProvider;
      return {
        ...payload,
        id: row.id,
        sources: (payload.sources ?? []).map((s) => ({ ...s, provider: provider(s.provider) })),
        complianceAndRiskRadar: (payload.complianceAndRiskRadar ?? []).map((c) => ({
          ...c,
          searchProvider: provider(c.searchProvider),
        })),
      };
    } catch (err) {
      console.error("Dossier lookup unavailable", err);
      return null;
    }
  });
