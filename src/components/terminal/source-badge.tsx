import type { DossierSource, SearchProvider } from "@/lib/dossier";
import { PROVIDER_LABEL } from "@/lib/dossier";

export function SourceBadges({
  refs,
  sources,
}: {
  refs?: number[] | undefined;
  sources: DossierSource[];
}) {
  if (!refs?.length) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {refs.map((r) => {
        const s = sources[r];
        if (!s) return null;
        return <SourceBadge key={r} index={r} source={s} />;
      })}
    </span>
  );
}

const TONE: Record<SearchProvider, string> = {
  RESEARCH: "border-emerald/35 text-emerald/90 hover:border-emerald/60 hover:bg-emerald/12",
  SEARCH: "border-azure/35 text-azure/90 hover:border-azure/60 hover:bg-azure/12",
  REFERENCE:
    "border-white/12 text-muted-foreground hover:border-white/25 hover:bg-white/[0.07] hover:text-foreground",
};

const GLOW: Record<SearchProvider, string> = {
  RESEARCH: "hover:shadow-[0_0_18px_-6px_oklch(0.7_0.15_163/80%)]",
  SEARCH: "hover:shadow-[0_0_18px_-6px_oklch(0.75_0.14_233/80%)]",
  REFERENCE: "hover:shadow-[0_0_18px_-8px_oklch(1_0_0/25%)]",
};

export function SourceBadge({ index, source }: { index: number; source: DossierSource }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      title={`${source.title} — ${PROVIDER_LABEL[source.provider]}`}
      className={`num inline-flex items-center rounded-full border px-2 py-px text-[10px] backdrop-blur-sm transition-all duration-300 hover:-translate-y-px ${TONE[source.provider]} ${GLOW[source.provider]}`}
    >
      [Source {index + 1}]
    </a>
  );
}
