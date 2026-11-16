import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ExternalLink, Globe2, Landmark, ShieldCheck } from "lucide-react";
import type { InstitutionalDossier, Severity } from "@/lib/dossier";
import { SEGMENTS, PROVIDER_LABEL } from "@/lib/dossier";
import { AudioBrief } from "./audio-brief";
import { SourceBadge, SourceBadges } from "./source-badge";

const RATING_STYLE = {
  LOW_RISK: "border-emerald/40 bg-emerald/10 text-emerald",
  MODERATE_WATCH: "border-amber/40 bg-amber/10 text-amber",
  ELEVATED_REVIEW: "border-crimson/40 bg-crimson/10 text-crimson",
} as const;

const SEVERITY_STYLE: Record<Severity, string> = {
  INFO: "border-azure/40 text-azure",
  WATCH: "border-amber/40 text-amber",
  CRITICAL: "border-crimson/50 text-crimson",
};

const reveal = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.08 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
});

function Module({ index, title, code, children, className = "" }: { index: number; title: string; code: string; children: React.ReactNode; className?: string }) {
  return (
    <motion.section {...reveal(index)} className={`panel p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="eyebrow !text-[10px]">{code}</span>
      </div>
      {children}
    </motion.section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string | undefined }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-2.5">
      <div className="eyebrow !text-[9.5px]">{label}</div>
      <div className={`num mt-1 text-lg ${tone ?? "text-foreground"}`}>{value}</div>
    </div>
  );
}

export function DossierView({ dossier, cacheKey }: { dossier: InstitutionalDossier; cacheKey: string }) {
  const d = dossier;
  const fm = d.financialMetrics;
  const wc = d.workingCapital;
  const seg = SEGMENTS.find((s) => s.id === d.segment);
  const leverageTone = fm.netDebtToEbitda <= 2.5 ? "text-emerald" : fm.netDebtToEbitda <= 3.5 ? "text-amber" : "text-crimson";

  const years = ["2026", "2027", "2028", "2029"];
  const maturity = years.map((y) => {
    const row: Record<string, number | string> = { year: y, "Syndicated Loan": 0, "Sukuk / Bond": 0, "Trade Facility": 0 };
    d.debtMaturityProfile.filter((m) => m.year === y).forEach((m) => {
      row[m.instrumentType] = (row[m.instrumentType] as number) + m.maturingDebtAEDMillions;
    });
    return row;
  });

  const ccc = wc.dsoDays + wc.dioDays - wc.dpoDays;

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div {...reveal(0)} className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="panel p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow rounded border border-border px-1.5 py-0.5 !text-[10px]">{seg?.label}</span>
            <span className={`num rounded border px-1.5 py-0.5 text-[10px] ${RATING_STYLE[fm.creditRiskRating]}`}>
              {fm.creditRiskRating}
            </span>
            {d.isPreset ? (
              <span className="eyebrow !text-[10px]">Illustrative scenario</span>
            ) : (
              <span className="eyebrow !text-[10px] text-emerald">Live · {d.sources.length} sources</span>
            )}
          </div>
          <h2 className="mt-3 text-2xl font-semibold md:text-3xl">{d.entityName}</h2>
          <div className="mt-1 text-sm text-muted-foreground">
            {d.sector} · {d.jurisdiction}
            {d.tickerOrRegistry ? <span className="num"> · {d.tickerOrRegistry}</span> : null}
          </div>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-foreground/90">{d.executiveSummary}</p>
          <div className="num mt-4 text-[10px] text-muted-foreground">
            Updated {new Date(d.lastUpdatedIso).toUTCString().replace(" GMT", " UTC")}
          </div>
        </div>
        <AudioBrief script={d.executiveBriefAudioScript} cacheKey={cacheKey} />
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* 1 Capital structure */}
        <Module index={1} title="Capital Structure & Leverage" code="M-01" className="lg:col-span-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Metric label="Est. revenue" value={fm.estimatedRevenueAED} tone="text-gold" />
            <Metric label="EBITDA margin" value={`${fm.ebitdaMarginPct.toFixed(1)}%`} />
            <Metric label="Net debt / EBITDA" value={`${fm.netDebtToEbitda.toFixed(1)}x`} tone={leverageTone} />
            <Metric label="Interest cover" value={`${fm.interestCoverageRatio.toFixed(1)}x`} />
            <Metric label="Cash conv. cycle" value={`${Math.round(fm.cashConversionCycleDays)}d`} />
            <Metric label="Bond / sukuk prob." value={`${Math.round(d.bondIssuanceProbabilityPct)}%`} tone="text-azure" />
          </div>
          <div className="mt-3"><SourceBadges refs={fm.sourceRefs} sources={d.sources} /></div>
        </Module>

        {/* 3 Debt maturity wall */}
        <Module index={2} title="Debt Maturity Wall & Capital Markets Appetite" code="M-03" className="lg:col-span-7">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maturity} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--color-accent)", opacity: 0.4 }}
                  contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 12 }}
                  formatter={(v: number) => [`AED ${v.toLocaleString()}M`]}
                />
                <Bar dataKey="Syndicated Loan" stackId="a" fill="var(--color-gold)" />
                <Bar dataKey="Sukuk / Bond" stackId="a" fill="var(--color-azure)" />
                <Bar dataKey="Trade Facility" stackId="a" fill="var(--color-emerald)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
            <Legend color="bg-gold" label="Syndicated loan" />
            <Legend color="bg-azure" label="Sukuk / bond" />
            <Legend color="bg-emerald" label="Trade facility" />
            <span className="num ml-auto">AED millions</span>
          </div>
        </Module>

        {/* 2 Working capital */}
        <Module index={3} title="Working Capital & Liquidity Diagnostics" code="M-02" className="lg:col-span-5">
          <div className="space-y-2.5">
            {[
              { k: "DSO", v: wc.dsoDays, c: "bg-azure" },
              { k: "DIO", v: wc.dioDays, c: "bg-gold" },
              { k: "DPO", v: wc.dpoDays, c: "bg-emerald" },
            ].map((r) => (
              <div key={r.k} className="flex items-center gap-3">
                <span className="num w-9 text-xs text-muted-foreground">{r.k}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, r.v)}%` }} transition={{ duration: 0.8 }} className={`h-full ${r.c}`} />
                </div>
                <span className="num w-12 text-right text-xs">{Math.round(r.v)}d</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric label="CCC (DSO+DIO−DPO)" value={`${Math.round(ccc)}d`} />
            <Metric label="Trapped liquidity" value={`AED ${Math.round(wc.trappedLiquidityAEDMillions)}M`} tone="text-gold" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Trade finance velocity: <span className="text-foreground">{wc.tradeFinanceVelocity}</span></span>
            <SourceBadges refs={wc.sourceRefs} sources={d.sources} />
          </div>
        </Module>

        {/* 5 Product fit */}
        <Module index={4} title="FAB Division Product-Fit Matrix" code="M-05" className="lg:col-span-7">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="eyebrow !text-[9.5px] text-left">
                  <th className="pb-2 font-normal">Division / product</th>
                  <th className="pb-2 font-normal">Trigger</th>
                  <th className="pb-2 text-right font-normal">Fee pool</th>
                  <th className="pb-2 pl-3 text-right font-normal">Conf.</th>
                </tr>
              </thead>
              <tbody>
                {d.fabDivisionRouting.map((r, i) => (
                  <tr key={i} className="border-t border-border align-top">
                    <td className="py-2.5 pr-3">
                      <div className="text-[11px] text-gold">{r.division}</div>
                      <div className="mt-0.5">{r.recommendedProduct}</div>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {r.triggerSignal} <SourceBadges refs={r.sourceRefs} sources={d.sources} />
                    </td>
                    <td className="num py-2.5 text-right whitespace-nowrap">{r.estimatedFeePoolAED}</td>
                    <td className="py-2.5 pl-3 text-right">
                      <span className={`num text-xs ${r.confidenceScore >= 75 ? "text-emerald" : r.confidenceScore >= 55 ? "text-amber" : "text-muted-foreground"}`}>
                        {r.confidenceScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Module>

        {/* 4 Corridors */}
        <Module index={5} title="Cross-Border Corridor & FX Exposure" code="M-04" className="lg:col-span-5">
          <ul className="space-y-2.5">
            {d.corridors.map((c) => (
              <li key={c.corridor} className="flex items-center gap-3">
                <Globe2 className="size-3.5 shrink-0 text-azure" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate">{c.corridor}</span>
                    <span className="num text-xs text-muted-foreground">{c.fxPair}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-azure" style={{ width: `${Math.min(100, c.flowSharePct)}%` }} />
                  </div>
                </div>
                <div className="w-24 text-right">
                  <div className="num text-xs">{Math.round(c.flowSharePct)}%</div>
                  <div className="text-[10px] text-muted-foreground">FAB {c.fabHub}</div>
                </div>
              </li>
            ))}
          </ul>
        </Module>

        {/* 6 Compliance */}
        <Module index={6} title="CBUAE / Sanctions & Audit Citations" code="M-06" className="lg:col-span-7">
          <ul className="space-y-2">
            {d.complianceAndRiskRadar.map((c, i) => (
              <li key={i} className="flex gap-3 rounded-md border border-border bg-background/40 p-2.5">
                {c.severity === "CRITICAL" ? (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-crimson" />
                ) : c.category === "CBUAE / Regulatory" ? (
                  <Landmark className="mt-0.5 size-4 shrink-0 text-azure" />
                ) : (
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{c.category}</span>
                    <span className={`num rounded border px-1 text-[9.5px] ${SEVERITY_STYLE[c.severity]}`}>{c.severity}</span>
                  </div>
                  <p className="mt-1 text-sm">{c.finding}</p>
                  {c.sourceUrl && (
                    <a href={c.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-gold">
                      <ExternalLink className="size-3" /> {c.sourceTitle}
                      <span className="num">· {PROVIDER_LABEL[c.searchProvider]}</span>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Module>
      </div>

      {/* Sources */}
      <motion.section {...reveal(7)} className="panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Source ledger</h3>
          <span className="eyebrow !text-[10px]">Every badge resolves to a URL</span>
        </div>
        <ol className="grid gap-x-6 gap-y-1.5 md:grid-cols-2">
          {d.sources.map((s, i) => (
            <li key={s.url + i} className="flex items-start gap-2 text-xs">
              <SourceBadge index={i} source={s} />
              <a href={s.url} target="_blank" rel="noreferrer" className="line-clamp-1 text-muted-foreground hover:text-foreground">
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </motion.section>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2 rounded-sm ${color}`} /> {label}
    </span>
  );
}

export function DossierSkeleton({ stage }: { stage: number }) {
  const stages = ["Research Agent · retrieving sources", "Search Agent · fallback enrichment", "Orchestration core · synthesizing dossier", "Citing & saving"];
  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="flex flex-wrap gap-4">
          {stages.map((s, i) => (
            <div key={s} className={`flex items-center gap-2 text-xs ${i < stage ? "text-emerald" : i === stage ? "text-gold" : "text-muted-foreground"}`}>
              <span className={`size-1.5 rounded-full ${i < stage ? "bg-emerald" : i === stage ? "bg-gold animate-pulse-dot" : "bg-hairline-strong"}`} />
              <span className="num">{s}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 h-7 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="mt-5 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        {[5, 7, 5, 7].map((span, i) => (
          <div key={i} className={`panel h-56 p-4 ${span === 5 ? "lg:col-span-5" : "lg:col-span-7"}`}>
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, k) => (
                <div key={k} className="h-14 animate-pulse rounded bg-muted/70" style={{ animationDelay: `${k * 80}ms` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
