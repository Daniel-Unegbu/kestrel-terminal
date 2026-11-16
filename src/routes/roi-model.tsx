import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FileText, Printer, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { savePilotSimulation } from "@/lib/pilot.functions";
import { computeRoi, formatAEDCompact, ROI_ASSUMPTIONS, ROI_DEFAULTS, sensitivityCurve, type RoiInputs } from "@/lib/roi";

export const Route = createFileRoute("/roi-model")({
  head: () => ({
    meta: [
      { title: "Wholesale Mandate & Fee-Income Simulator — Kestrel Terminal" },
      {
        name: "description",
        content: "Model RM capacity reclaimed, incremental non-interest fee income and 90-day pilot break-even for FAB Wholesale Banking and IB&M.",
      },
      { property: "og:title", content: "Wholesale Mandate & Fee-Income Simulator — Kestrel Terminal" },
      { property: "og:description", content: "How many incremental mandates pay back the platform? Model it live." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoiModel,
});

const SLIDERS: Array<{ key: keyof RoiInputs; label: string; min: number; max: number; step: number; fmt: (v: number) => string }> = [
  { key: "rmCount", label: "Wholesale & IB&M coverage RMs", min: 20, max: 600, step: 5, fmt: (v) => `${v} RMs` },
  { key: "weeklyHoursSaved", label: "Research hours saved / RM / week", min: 0.5, max: 12, step: 0.5, fmt: (v) => `${v.toFixed(1)} hrs` },
  { key: "avgMandateFeeAED", label: "Avg. annual fee & spread per mandate", min: 100_000, max: 3_000_000, step: 25_000, fmt: (v) => `AED ${(v / 1000).toFixed(0)}K` },
  { key: "conversionLiftPct", label: "Incremental mandate conversion lift", min: 0, max: 10, step: 0.1, fmt: (v) => `${v.toFixed(1)}%` },
];

function RoiModel() {
  const [inputs, setInputs] = useState<RoiInputs>(ROI_DEFAULTS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saved, setSaved] = useState<{ id: string; createdAt: string } | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "draft">("idle");
  const save = useServerFn(savePilotSimulation);
  const out = useMemo(() => computeRoi(inputs), [inputs]);
  const curve = useMemo(() => sensitivityCurve(inputs), [inputs]);

  const openSheet = async () => {
    setSheetOpen(true);
    setSaved(null);
    setSaveState("saving");
    const res = await save({ data: inputs }).catch(() => null);
    if (res?.ok) {
      setSaved({ id: res.id, createdAt: res.createdAt });
      setSaveState("saved");
      return;
    }
    setSaveState("draft");
    toast.error("Term sheet ready, but this scenario couldn't be saved.");
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-6 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Pillar 5 · Commercial impact</div>
          <h1 className="mt-2 text-3xl font-semibold">Wholesale Mandate & Fee-Income Simulator</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Non-interest fee and spread income drives 43% of FAB's operating income. Move the levers to see what faster,
            better-prepared coverage is worth.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="terminal" onClick={() => setInputs(ROI_DEFAULTS)}>
            <RotateCcw /> Reset
          </Button>
          <Button variant="gold" onClick={openSheet}>
            <FileText /> Export 90-Day Pilot Term Sheet
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="panel space-y-7 p-5">
          {SLIDERS.map((s) => (
            <div key={s.key}>
              <div className="flex items-baseline justify-between gap-3">
                <label className="text-sm text-muted-foreground">{s.label}</label>
                <span className="num text-sm text-gold">{s.fmt(inputs[s.key])}</span>
              </div>
              <Slider
                className="mt-3"
                min={s.min}
                max={s.max}
                step={s.step}
                value={[inputs[s.key]]}
                onValueChange={([v]) => setInputs((p) => ({ ...p, [s.key]: v ?? p[s.key] }))}
                aria-label={s.label}
              />
            </div>
          ))}
          <div className="border-t border-border pt-4">
            <div className="eyebrow !text-[10px]">Model assumptions</div>
            <dl className="mt-2 grid grid-cols-2 gap-y-1.5 text-xs">
              <dt className="text-muted-foreground">Working weeks / yr</dt>
              <dd className="num text-right">{ROI_ASSUMPTIONS.workingWeeksPerYear}</dd>
              <dt className="text-muted-foreground">Loaded RM cost / hr</dt>
              <dd className="num text-right">AED {ROI_ASSUMPTIONS.loadedCostPerHourAED}</dd>
              <dt className="text-muted-foreground">Baseline mandates / RM / yr</dt>
              <dd className="num text-right">{ROI_ASSUMPTIONS.baselineMandatesPerRmPerYear}</dd>
              <dt className="text-muted-foreground">Annual platform cost</dt>
              <dd className="num text-right">{formatAEDCompact(ROI_ASSUMPTIONS.annualPlatformCostAED)}</dd>
            </dl>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <OutputCard
              eyebrow="RM & analyst capacity reclaimed"
              value={`${Math.round(out.annualHoursReclaimed).toLocaleString()} hrs`}
              sub={`${formatAEDCompact(out.operationalEfficiencyAED)} operating cost efficiency / yr`}
            />
            <OutputCard
              eyebrow="Incremental non-interest fee income"
              value={formatAEDCompact(out.incrementalFeeIncomeAED)}
              sub={`${out.incrementalMandatesPerYear.toFixed(1)} incremental mandates / yr`}
              gold
            />
            <OutputCard
              eyebrow="90-day pilot break-even"
              value={`${Number.isFinite(out.breakEvenMandates) ? out.breakEvenMandates : "—"} mandates`}
              sub={`Closing ${out.breakEvenMandates} incremental mandate${out.breakEvenMandates === 1 ? "" : "s"} pays back 100% of annual Azure deployment`}
            />
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Fee-income sensitivity to conversion lift</h3>
                <div className="mt-0.5 text-xs text-muted-foreground">AED millions per year · current point highlighted</div>
              </div>
              <div className="num text-right text-xs text-muted-foreground">
                ROI multiple <span className="text-lg text-emerald">{out.roiMultiple.toFixed(1)}x</span>
              </div>
            </div>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={curve} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="lift" type="number" domain={[0, 10]} tickFormatter={(v) => `${v}%`} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${Math.round(v)}`} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 12 }}
                    formatter={(v: number) => [`AED ${v.toFixed(1)}M`, "Fee income"]}
                    labelFormatter={(l) => `Lift ${l}%`}
                  />
                  <Line type="monotone" dataKey="feeM" stroke="var(--color-gold)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <ReferenceDot x={inputs.conversionLiftPct} y={out.incrementalFeeIncomeAED / 1e6} r={5} fill="var(--color-gold)" stroke="var(--color-background)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>90-Day Pilot Term Sheet</DialogTitle>
          </DialogHeader>
          <div id="term-sheet" className="space-y-4 text-sm">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <div className="font-semibold">Kestrel Terminal × First Abu Dhabi Bank</div>
                <div className="text-xs text-muted-foreground">Prepared for FAB Innovation committee review</div>
              </div>
              <div className="num text-right text-[11px] text-muted-foreground">
                {saved ? (
                  <>Ref {saved.id.slice(0, 8).toUpperCase()}<br />{new Date(saved.createdAt).toLocaleDateString("en-GB")}</>
                ) : saveState === "saving" ? (
                  "Saving…"
                ) : (
                  <>Draft<br />{new Date().toLocaleDateString("en-GB")}</>
                )}
              </div>
            </div>
            <Section title="Scope">
              Proof-of-value for {Math.min(35, inputs.rmCount)} Wholesale Banking RMs over {ROI_ASSUMPTIONS.pilotDays} days,
              deployed as containers inside FAB's Microsoft Azure UAE North tenant behind a single governed AI gateway.
            </Section>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Coverage RMs modelled", `${inputs.rmCount}`],
                  ["Research hours saved / RM / week", inputs.weeklyHoursSaved.toFixed(1)],
                  ["Avg. annual fee & spread per mandate", formatAEDCompact(inputs.avgMandateFeeAED)],
                  ["Conversion lift", `${inputs.conversionLiftPct.toFixed(1)}%`],
                  ["Annual capacity reclaimed", `${Math.round(out.annualHoursReclaimed).toLocaleString()} hrs`],
                  ["Projected incremental fee income / yr", formatAEDCompact(out.incrementalFeeIncomeAED)],
                  ["Projected fee income in pilot window", formatAEDCompact(out.pilotFeeIncomeAED)],
                  ["Break-even", `${out.breakEvenMandates} incremental mandates`],
                ].map(([k, v]) => (
                  <tr key={k} className="border-t border-border">
                    <td className="py-1.5 text-muted-foreground">{k}</td>
                    <td className="num py-1.5 text-right">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Section title="Milestones">
              Weeks 1–2: container deployment in Azure sandbox · Weeks 3–6: 35-RM Wholesale Banking cohort ·
              Weeks 7–12: mandate conversion & hours-saved audit.
            </Section>
            <Section title="Success criteria">
              ≥ {inputs.weeklyHoursSaved.toFixed(1)} research hours saved per RM per week (time-logged), 100% of dossier metrics
              source-cited, and ≥ {out.breakEvenMandates} attributable incremental mandates in pipeline.
            </Section>
            <Section title="Governance">
              UAE data residency, no external model training, RBAC, single ephemeral session token and immutable audit logs
              for credit committee review.
            </Section>
          </div>
          <div className="flex justify-end gap-2 pt-2 no-print">
            <Button variant="terminal" onClick={() => window.print()}>
              <Printer /> Print / Save PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow !text-[10px]">{title}</div>
      <p className="mt-1 leading-relaxed">{children}</p>
    </div>
  );
}

function OutputCard({ eyebrow, value, sub, gold }: { eyebrow: string; value: string; sub: string; gold?: boolean }) {
  return (
    <div className={`panel p-5 ${gold ? "shadow-gold" : ""}`}>
      <div className="eyebrow !text-[10px]">{eyebrow}</div>
      <div className={`num mt-2 text-3xl ${gold ? "text-gold" : "text-foreground"}`}>{value}</div>
      <div className="mt-2 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
