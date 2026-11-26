import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { History, Loader2, Search, Zap } from "lucide-react";
import { toast } from "sonner";
import { DossierSkeleton, DossierView } from "@/components/terminal/dossier-view";
import { useTerminal } from "@/components/terminal/terminal-context";
import { SEGMENTS, type InstitutionalDossier } from "@/lib/dossier";
import { findPreset, PRESET_DOSSIERS } from "@/lib/presets";
import { getDossier, listRecentDossiers, runResearch } from "@/lib/research.functions";

const recentQuery = queryOptions({
  queryKey: ["recent-dossiers"],
  queryFn: () => listRecentDossiers(),
});

export const Route = createFileRoute("/sandbox")({
  validateSearch: (s: Record<string, unknown>): { entity?: string; focus?: string } => ({
    ...(typeof s["entity"] === "string" ? { entity: s["entity"] } : {}),
    ...(typeof s["focus"] === "string" ? { focus: s["focus"] } : {}),
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(recentQuery),
  head: () => ({
    meta: [
      { title: "IS Audit & Governance Sandbox — Kestrel Terminal" },
      {
        name: "description",
        content:
          "Generate cited IS audit dossiers for UAE public sector systems, financial core platforms, telecom and cloud services, and enterprise ERP — with control gaps, remediation roadmaps and UAE IAA pillar routing.",
      },
      { property: "og:title", content: "IS Audit & Governance Sandbox — Kestrel Terminal" },
      {
        property: "og:description",
        content: "Cited audit dossiers in seconds, routed to the UAE IAA pillar that should lead.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Sandbox,
});

function Sandbox() {
  const { entity, focus } = Route.useSearch();
  const navigate = useNavigate({ from: "/sandbox" });
  const qc = useQueryClient();
  const { data: recent } = useSuspenseQuery(recentQuery);
  const { setActiveDossier } = useTerminal();
  const research = useServerFn(runResearch);

  const [query, setQuery] = useState("");
  const [deep, setDeep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [live, setLive] = useState<{ slug: string; dossier: InstitutionalDossier } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const preset = findPreset(entity) ?? (!entity ? PRESET_DOSSIERS[1] : undefined);
  const needsFetch = !!entity && !preset && live?.slug !== entity;
  const saved = useQuery({
    queryKey: ["dossier", entity],
    queryFn: () => getDossier({ data: { slug: entity! } }),
    enabled: needsFetch,
  });

  const current: { key: string; dossier: InstitutionalDossier } | null = preset
    ? { key: preset.slug, dossier: preset }
    : live && live.slug === entity
      ? { key: live.slug, dossier: live.dossier }
      : saved.data
        ? { key: entity!, dossier: saved.data }
        : null;

  useEffect(() => {
    if (current) setActiveDossier(current.dossier);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.key]);

  useEffect(() => {
    if (focus === "search") inputRef.current?.focus();
  }, [focus]);

  useEffect(() => {
    if (!loading) return;
    setStage(0);
    const timers = [1800, 3200, 6500].map((ms, i) => setTimeout(() => setStage(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  const activeSegment = current?.dossier.segment ?? "PUBLIC_SECTOR_INFRA";

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2 || loading) return;
    setLoading(true);
    const res = await research({ data: { entity: q, deep } }).catch(() => null);
    setLoading(false);
    if (!res || !res.ok) {
      toast.error(res && !res.ok ? res.error : "Research failed. Please try again.");
      return;
    }
    setLive({ slug: res.slug, dossier: res.dossier });
    toast.success(
      `Dossier ready · ${res.sourceCount} sources · ${(res.elapsedMs / 1000).toFixed(1)}s`,
    );
    void qc.invalidateQueries({ queryKey: ["recent-dossiers"] });
    void navigate({ search: { entity: res.slug } });
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-6 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Pillar 2 · IS Audit, IT Governance & Cyber Risk</div>
          <h1 className="mt-2 text-3xl font-semibold">IS Audit & Governance Sandbox</h1>
        </div>
      </div>

      {/* Segment tabs */}
      <div className="mt-6 flex gap-1.5 overflow-x-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-1.5 backdrop-blur-xl">
        {SEGMENTS.map((s) => {
          const p = PRESET_DOSSIERS.find((d) => d.segment === s.id)!;
          const active =
            preset?.segment === s.id || (!preset && activeSegment === s.id && !!current);
          return (
            <button
              key={s.id}
              onClick={() => navigate({ search: { entity: p.slug } })}
              className={`relative whitespace-nowrap rounded-xl px-4 py-2.5 text-left transition-all duration-300 ${
                active
                  ? "bg-white/[0.07] text-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/9%),0_10px_28px_-18px_oklch(0_0_0/90%)]"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              }`}
            >
              <div className="text-sm font-medium">{s.label}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{p.entityName}</div>
              {active && (
                <motion.span
                  layoutId="segment-underline"
                  className="absolute inset-x-4 -bottom-[7px] h-px rounded-full bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_12px_1px_oklch(0.8_0.13_90/60%)]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Live search */}
      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <form
          onSubmit={runSearch}
          className="panel flex items-center gap-2 p-2 transition-shadow duration-500 focus-within:shadow-[0_0_0_1px_oklch(0.8_0.13_90/30%),0_0_44px_-14px_oklch(0.8_0.13_90/45%)]"
        >
          <Search className="ml-2 size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Live system search — e.g. UAE Pass, e&, Dubai interbank switch, Federal Customs Authority"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            maxLength={120}
          />
          <label className="hidden cursor-pointer items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-gold/35 hover:text-foreground sm:flex">
            <input
              type="checkbox"
              checked={deep}
              onChange={(e) => setDeep(e.target.checked)}
              className="accent-[var(--color-gold)]"
            />
            Deep audit synthesis <span className="num text-[10px]">(refresh)</span>
          </label>
          <button
            type="submit"
            disabled={loading || query.trim().length < 2}
            className="sheen flex h-10 items-center gap-2 rounded-full bg-gold-gradient px-5 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_0_40px_-8px_oklch(0.8_0.13_90/75%)] disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
            Generate dossier
          </button>
        </form>
        {recent.length > 0 && (
          <div className="panel flex items-center gap-2 overflow-x-auto p-2 lg:max-w-md">
            <History className="ml-1 size-4 shrink-0 text-muted-foreground" />
            {recent.slice(0, 6).map((r) => (
              <button
                key={r.entity_slug}
                onClick={() => navigate({ search: { entity: r.entity_slug } })}
                className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs transition-all duration-300 ${
                  entity === r.entity_slug
                    ? "border-gold/50 bg-gold/10 text-gold shadow-[0_0_22px_-8px_oklch(0.8_0.13_90/70%)]"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground"
                }`}
              >
                {r.entity_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        {loading ? (
          <DossierSkeleton stage={stage} />
        ) : current ? (
          <DossierView key={current.key} dossier={current.dossier} cacheKey={current.key} />
        ) : saved.isLoading ? (
          <DossierSkeleton stage={3} />
        ) : (
          <div className="panel p-10 text-center text-muted-foreground">
            That audit dossier isn't available. Pick a segment above or run a live system search.
          </div>
        )}
      </div>
    </div>
  );
}
