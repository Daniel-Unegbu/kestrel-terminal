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

function Module({
  index,
  title,
  code,
  children,
  className = "",
}: {
  index: number;
  title: string;
  code: string;
  children: React.ReactNode;
  className?: string;
}) {
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

function Metric({
  label,
  value,
  tone,
  small,
}: {
  label: string;
  value: string;
  tone?: string | undefined;
  small?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-2.5">
      <div className="eyebrow !text-[9.5px]">{label}</div>
      <div
        className={`num mt-1 ${small ? "text-[13px] leading-tight" : "text-lg"} ${tone ?? "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}

export function DossierView({
  dossier,
  cacheKey,
}: {
  dossier: InstitutionalDossier;
  cacheKey: string;
}) {
  const d = dossier;
  const fm = d.auditPosture;
  const ef = d.evidenceFlow;
  const seg = SEGMENTS.find((s) => s.id === d.segment);
  const findingsTone =
    fm.openAuditFindingsRatio <= 1.5
      ? "text-emerald"
      : fm.openAuditFindingsRatio <= 2.5
        ? "text-amber"
        : "text-crimson";

  const years = ["2026", "2027", "2028", "2029"];
  const roadmap = years.map((y) => {
    const row: Record<string, number | string> = {
      period: y,
      "Pre-Development Control": 0,
      "Post-Development Audit": 0,
      "Fraud & Access Hardening": 0,
    };
    d.remediationRoadmap
      .filter((m) => m.period === y)
      .forEach((m) => {
        row[m.workstream] = (row[m.workstream] as number) + m.findingsToRemediate;
      });
    return row;
  });

  const evidenceCycleDays = ef.evidenceCollectionDays + ef.findingClosureDays;

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div {...reveal(0)} className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="panel p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow rounded border border-border px-1.5 py-0.5 !text-[10px]">
              {seg?.label}
            </span>
            <span
              className={`num rounded border px-1.5 py-0.5 text-[10px] ${RATING_STYLE[fm.auditRiskPosture]}`}
            >
              {fm.auditRiskPosture}
            </span>
            {d.isPreset ? (
              <span className="eyebrow !text-[10px]">Illustrative scenario</span>
            ) : (
              <span className="eyebrow !text-[10px] text-emerald">
                Live · {d.sources.length} sources
              </span>
            )}
          </div>
          <h2 className="mt-3 text-2xl font-semibold md:text-3xl">{d.entityName}</h2>
          <div className="mt-1 text-sm text-muted-foreground">
            {d.sector} · {d.jurisdiction}
            {d.tickerOrRegistry ? <span className="num"> · {d.tickerOrRegistry}</span> : null}
          </div>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-foreground/90">
            {d.executiveSummary}
          </p>
          <div className="num mt-4 text-[10px] text-muted-foreground">
            Updated {new Date(d.lastUpdatedIso).toUTCString().replace(" GMT", " UTC")}
          </div>
        </div>
        <AudioBrief script={d.executiveBriefAudioScript} cacheKey={cacheKey} />
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* 1 Control posture */}
        <Module
          index={1}
          title="Control Posture & Audit Maturity"
          code="M-01"
          className="lg:col-span-5"
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Metric
              label="System criticality"
              value={fm.systemCriticalityTier}
              tone="text-gold"
              small
            />
            <Metric label="Control maturity" value={`${fm.controlMaturityPct.toFixed(0)}%`} />
            <Metric
              label="Open findings ratio"
              value={`${fm.openAuditFindingsRatio.toFixed(1)}x`}
              tone={findingsTone}
            />
            <Metric label="ISO 20000 score" value={`${fm.iso20000ComplianceScore.toFixed(0)}%`} />
            <Metric
              label="Mean time to remediate"
              value={`${Math.round(fm.meanTimeToRemediateDays)}d`}
            />
            <Metric
              label="Pre-deployment coverage"
              value={`${Math.round(d.preDeploymentCoveragePct)}%`}
              tone="text-azure"
            />
          </div>
          <div className="mt-3">
            <SourceBadges refs={fm.sourceRefs} sources={d.sources} />
          </div>
        </Module>

        {/* 3 Remediation roadmap */}
        <Module
          index={2}
          title="Remediation Roadmap & Control Hardening"
          code="M-03"
          className="lg:col-span-7"
        >
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roadmap} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{
                    fill: "var(--color-muted-foreground)",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fill: "var(--color-muted-foreground)",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-accent)", opacity: 0.4 }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v.toLocaleString()} findings`]}
                />
                <Bar dataKey="Pre-Development Control" stackId="a" fill="var(--color-gold)" />
                <Bar dataKey="Post-Development Audit" stackId="a" fill="var(--color-azure)" />
                <Bar
                  dataKey="Fraud & Access Hardening"
                  stackId="a"
                  fill="var(--color-emerald)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
            <Legend color="bg-gold" label="Pre-development control" />
            <Legend color="bg-azure" label="Post-development audit" />
            <Legend color="bg-emerald" label="Fraud & access hardening" />
            <span className="num ml-auto">Findings to remediate</span>
          </div>
        </Module>

        {/* 2 Evidence flow */}
        <Module
          index={3}
          title="Evidence Flow & Remediation Velocity"
          code="M-02"
          className="lg:col-span-5"
        >
          <div className="space-y-2.5">
            {[
              { k: "Evidence", v: ef.evidenceCollectionDays, c: "bg-azure" },
              { k: "Logs", v: ef.logRetentionDays, c: "bg-gold" },
              { k: "Closure", v: ef.findingClosureDays, c: "bg-emerald" },
            ].map((r) => (
              <div key={r.k} className="flex items-center gap-3">
                <span className="num w-14 text-xs text-muted-foreground">{r.k}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, r.v / 3.65)}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full ${r.c}`}
                  />
                </div>
                <span className="num w-12 text-right text-xs">{Math.round(r.v)}d</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric label="Evidence-to-closure" value={`${Math.round(evidenceCycleDays)}d`} />
            <Metric
              label="Open risk exposure"
              value={`ETB ${Math.round(ef.openRiskExposureETBMillions)}M`}
              tone="text-gold"
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Audit tooling maturity:{" "}
              <span className="text-foreground">{ef.auditToolingMaturity}</span>
            </span>
            <SourceBadges refs={ef.sourceRefs} sources={d.sources} />
          </div>
        </Module>

        {/* 5 EISAA pillar routing */}
        <Module index={4} title="EISAA Pillar Routing" code="M-05" className="lg:col-span-7">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="eyebrow !text-[9.5px] text-left">
                  <th className="pb-2 font-normal">EISAA pillar / service</th>
                  <th className="pb-2 font-normal">Trigger</th>
                  <th className="pb-2 text-right font-normal">Risk exposure</th>
                  <th className="pb-2 pl-3 text-right font-normal">Conf.</th>
                </tr>
              </thead>
              <tbody>
                {d.eisaaPillarRouting.map((r, i) => (
                  <tr key={i} className="border-t border-border align-top">
                    <td className="py-2.5 pr-3">
                      <div className="text-[11px] text-gold">{r.pillar}</div>
                      <div className="mt-0.5">{r.recommendedService}</div>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {r.triggerSignal} <SourceBadges refs={r.sourceRefs} sources={d.sources} />
                    </td>
                    <td className="num py-2.5 text-right whitespace-nowrap">
                      {r.estimatedRiskExposureETB}
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      <span
                        className={`num text-xs ${r.confidenceScore >= 75 ? "text-emerald" : r.confidenceScore >= 55 ? "text-amber" : "text-muted-foreground"}`}
                      >
                        {r.confidenceScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Module>

        {/* 4 Regulatory coverage */}
        <Module
          index={5}
          title="Regulatory Coverage & Ecosystem Interfaces"
          code="M-04"
          className="lg:col-span-5"
        >
          <ul className="space-y-2.5">
            {d.regulatoryCoverage.map((c) => (
              <li key={c.framework} className="flex items-center gap-3">
                <Globe2 className="size-3.5 shrink-0 text-azure" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate">{c.framework}</span>
                    <span className="num text-xs text-muted-foreground">{c.regulator}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-azure"
                      style={{ width: `${Math.min(100, c.coveragePct)}%` }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right">
                  <div className="num text-xs">{Math.round(c.coveragePct)}%</div>
                  <div className="text-[10px] text-muted-foreground">{c.ecosystemPartner}</div>
                </div>
              </li>
            ))}
          </ul>
        </Module>

        {/* 6 Governance radar */}
        <Module
          index={6}
          title="INSA / Cyber & Governance Risk Radar"
          code="M-06"
          className="lg:col-span-7"
        >
          <ul className="space-y-2">
            {d.governanceRiskRadar.map((c, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-md border border-border bg-background/40 p-2.5"
              >
                {c.severity === "CRITICAL" ? (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-crimson" />
                ) : c.category === "INSA / National Cyber Policy" ? (
                  <Landmark className="mt-0.5 size-4 shrink-0 text-azure" />
                ) : (
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{c.category}</span>
                    <span
                      className={`num rounded border px-1 text-[9.5px] ${SEVERITY_STYLE[c.severity]}`}
                    >
                      {c.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{c.finding}</p>
                  {c.sourceUrl && (
                    <a
                      href={c.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-gold"
                    >
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
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="line-clamp-1 text-muted-foreground hover:text-foreground"
              >
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
  const stages = [
    "Research Agent · retrieving sources",
    "Search Agent · fallback enrichment",
    "Orchestration core · synthesizing audit dossier",
    "Citing & saving",
  ];
  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="flex flex-wrap gap-4">
          {stages.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-2 text-xs ${i < stage ? "text-emerald" : i === stage ? "text-gold" : "text-muted-foreground"}`}
            >
              <span
                className={`size-1.5 rounded-full ${i < stage ? "bg-emerald" : i === stage ? "bg-gold animate-pulse-dot" : "bg-hairline-strong"}`}
              />
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
          <div
            key={i}
            className={`panel h-56 p-4 ${span === 5 ? "lg:col-span-5" : "lg:col-span-7"}`}
          >
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, k) => (
                <div
                  key={k}
                  className="h-14 animate-pulse rounded bg-muted/70"
                  style={{ animationDelay: `${k * 80}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
