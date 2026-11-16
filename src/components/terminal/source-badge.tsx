import type { DossierSource } from "@/lib/dossier";
import { PROVIDER_LABEL } from "@/lib/dossier";

export function SourceBadges({ refs, sources }: { refs?: number[] | undefined; sources: DossierSource[] }) {
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

export function SourceBadge({ index, source }: { index: number; source: DossierSource }) {
  const tone =
    source.provider === "RESEARCH"
      ? "border-emerald/40 text-emerald hover:bg-emerald/10"
      : source.provider === "SEARCH"
        ? "border-azure/40 text-azure hover:bg-azure/10"
        : "border-hairline-strong text-muted-foreground hover:text-foreground";
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      title={`${source.title} — ${PROVIDER_LABEL[source.provider]}`}
      className={`num inline-flex items-center rounded border px-1.5 py-px text-[10px] transition-colors ${tone}`}
    >
      [Source {index + 1}]
    </a>
  );
}
