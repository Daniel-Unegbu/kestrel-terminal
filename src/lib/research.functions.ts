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
 * Calls the `research` Edge Function. Runs Tavily/SerpAPI retrieval, direct
 * Gemini synthesis and the dossier upsert server-side.
 */
export const runResearch = async ({
  data,
}: {
  data: { entity: string; deep?: boolean };
}): Promise<ResearchResult> => {
  try {
    return await invokeEdge<ResearchResult>("research", {
      entity: data.entity,
      deep: data.deep ?? false,
    });
  } catch (error) {
    console.error("Research failed", error);
    return {
      ok: false,
      error: "The research pipeline couldn't complete this dossier. Please try again.",
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
 * stored by older versions of the app.
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
    const provider = (value: string) =>
      (value === "TAVILY" ? "RESEARCH" : value === "SERPAPI" ? "SEARCH" : value) as SearchProvider;

    return {
      ...payload,
      id: row.id,
      sources: (payload.sources ?? []).map((source) => ({
        ...source,
        provider: provider(source.provider),
      })),
      complianceAndRiskRadar: (payload.complianceAndRiskRadar ?? []).map((item) => ({
        ...item,
        searchProvider: provider(item.searchProvider),
      })),
    };
  } catch (error) {
    console.error("Dossier lookup unavailable", error);
    return null;
  }
};
