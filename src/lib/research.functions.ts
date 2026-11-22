import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { invokeEdge } from "./edge";
import type { InstitutionalDossier, SearchProvider } from "./dossier";

export type ResearchResult =
  | {
      ok: true;
      slug: string;
      dossier: InstitutionalDossier;
      sourceCount: number;
      elapsedMs: number;
    }
  | { ok: false; error: string };

type DossierRow = Database["public"]["Tables"]["institutional_dossiers"]["Row"];

/**
 * Calls the `research-entity` Edge Function: Tavily deep research, direct
 * Gemini synthesis and the dossier upsert all happen server-side.
 */
export const runResearch = async ({
  data,
}: {
  data: { entity: string; deep?: boolean };
}): Promise<ResearchResult> => {
  try {
    return await invokeEdge<ResearchResult>("research-entity", {
      query: data.entity,
      // "Deep synthesis" also forces a refresh so the Pro model is used on new data.
      forceRefresh: data.deep ?? false,
      deep: data.deep ?? false,
    });
  } catch (error) {
    console.error("Research failed", error);
    const detail = error instanceof Error ? error.message : "";
    return {
      ok: false,
      error: detail
        ? `The research pipeline couldn't complete this dossier (${detail}). Please try again.`
        : "The research pipeline couldn't complete this dossier. Please try again.",
    };
  }
};

/** Reads the recent dossier strip directly from PostgREST (public RLS select). */
export const listRecentDossiers = async (): Promise<
  Array<Pick<DossierRow, "entity_slug" | "entity_name" | "segment" | "updated_at">>
> => {
  try {
    const { data, error } = await supabase
      .from("institutional_dossiers")
      .select("entity_slug, entity_name, segment, updated_at")
      .eq("is_preset", false)
      .order("updated_at", { ascending: false })
      .limit(12);

    if (error) {
      console.error("Recent dossiers unavailable", error);
      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error("Recent dossiers unavailable", error);
    return [];
  }
};

/**
 * Reads a saved dossier directly from PostgREST and normalises provider names
 * stored by older versions of the app. Payloads written before `schemaVersion`
 * 2 are treated as missing so the caller re-runs the research pipeline.
 */
export const getDossier = async ({
  data,
}: {
  data: { slug: string };
}): Promise<InstitutionalDossier | null> => {
  try {
    const { data: row, error } = await supabase
      .from("institutional_dossiers")
      .select("id, dossier_payload")
      .eq("entity_slug", data.slug)
      .maybeSingle();

    if (error || !row) return null;

    const payload = row.dossier_payload as unknown as InstitutionalDossier;
    if (payload?.schemaVersion !== 2) return null;

    const provider = (value: string) =>
      (value === "TAVILY" ? "RESEARCH" : value === "SERPAPI" ? "SEARCH" : value) as SearchProvider;

    return {
      ...payload,
      id: row.id,
      sources: (payload.sources ?? []).map((source) => ({
        ...source,
        provider: provider(source.provider),
      })),
      governanceRiskRadar: (payload.governanceRiskRadar ?? []).map((item) => ({
        ...item,
        searchProvider: provider(item.searchProvider),
      })),
    };
  } catch (error) {
    console.error("Dossier lookup unavailable", error);
    return null;
  }
};
