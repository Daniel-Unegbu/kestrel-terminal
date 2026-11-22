import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FileText, Printer, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { savePilotSimulation } from "@/lib/pilot.functions";
import {
  computeRoi,
  formatETBCompact,
  ROI_ASSUMPTIONS,
  ROI_DEFAULTS,
  sensitivityCurve,
  type RoiInputs,
} from "@/lib/roi";

export const Route = createFileRoute("/roi-model")({
  head: () => ({
    meta: [
      { title: "IS Audit Capacity & Risk-Mitigation Simulator — Kestrel Terminal" },
      {
        name: "description",
        content:
          "Model audit hours reclaimed, ICT loss and downtime prevented, and 90-day pilot break-even for EISAA member organisations.",
      },
      {
        property: "og:title",
        content: "IS Audit Capacity & Risk-Mitigation Simulator — Kestrel Terminal",
      },
      {
        property: "og:description",
        content: "How many pre-deployment audits pay back the platform? Model it live.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoiModel,
});

const SLIDERS: Array<{
  key: keyof RoiInputs;
  label: string;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
}> = [
  {
    key: "auditorCount",
    label: "Active IS auditors across public & private teams",
    min: 25,
    max: 1000,
    step: 5,
    fmt: (v) => `${v} auditors`,
  },
  {
    key: "weeklyHoursSaved",
    label: "Manual scoping & evidence hours saved / auditor / week",
    min: 0.5,
    max: 12,
    step: 0.5,
    fmt: (v) => `${v.toFixed(1)} hrs`,
  },
  {
    key: "avgLossPreventedETB",
    label: "Avg. ICT fraud / downtime loss prevented per pre-deployment audit",
    min: 250_000,
    max: 20_000_000,
    step: 250_000,
    fmt: (v) => formatETBCompact(v),
  },
  {
    key: "detectionLiftPct",
    label: "Control-gap detection lift from continuous intelligence",
    min: 0,
    max: 40,
    step: 0.5,
    fmt: (v) => `${v.toFixed(1)}%`,
  },
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
    toast.error("Charter ready, but this scenario couldn't be saved.");
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-6 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Pillar 5 · Capacity & risk impact</div>
          <h1 className="mt-2 text-3xl font-semibold">
            IS Audit Capacity & Risk-Mitigation Simulator
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            ICT fraud, failed controls and unplanned downtime erode public trust and institutional
            budgets. Move the levers to see what faster, better-evidenced IS audit coverage is worth
            for EISAA member organisations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="terminal" onClick={() => setInputs(ROI_DEFAULTS)}>
            <RotateCcw /> Reset
          </Button>
          <Button variant="gold" onClick={openSheet}>
            <FileText /> Export 90-Day EISAA Pilot Charter
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="panel top-hairline space-y-7 p-5">
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
              <dt className="text-muted-foreground">Loaded auditor cost / hr</dt>
              <dd className="num text-right">
                ETB {ROI_ASSUMPTIONS.loadedCostPerHourETB.toLocaleString()}
              </dd>
              <dt className="text-muted-foreground">Baseline audits / auditor / yr</dt>
              <dd className="num text-right">{ROI_ASSUMPTIONS.baselineAuditsPerAuditorPerYear}</dd>
              <dt className="text-muted-foreground">Annual platform cost</dt>
              <dd className="num text-right">
                {formatETBCompact(ROI_ASSUMPTIONS.annualPlatformCostETB)}
              </dd>
            </dl>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <OutputCard
              eyebrow="Audit capacity reclaimed"
              value={`${Math.round(out.annualHoursReclaimed).toLocaleString()} hrs`}
              sub={`${formatETBCompact(out.operationalEfficiencyETB)} operating cost efficiency / yr`}
            />
            <OutputCard
              eyebrow="ICT loss & downtime prevented"
              value={formatETBCompact(out.lossPreventedETB)}
              sub={`${out.incrementalDetectionsPerYear.toFixed(0)} control gaps caught / yr`}
              gold
            />
            <OutputCard
              eyebrow="Break-even coverage"
              value={`${Number.isFinite(out.breakEvenAudits) ? out.breakEvenAudits : "—"} audits`}
              sub={`Closing ${out.breakEvenAudits} pre-deployment audit${out.breakEvenAudits === 1 ? "" : "s"} pays back 100% of annual platform cost`}
            />
          </div>

          <div className="panel top-hairline p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">
                  Loss-prevented sensitivity to detection lift
                </h3>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  ETB millions per year · current point highlighted
                </div>
              </div>
              <div className="num text-right text-xs text-muted-foreground">
                ROI multiple{" "}
                <span className="text-lg text-emerald">{out.roiMultiple.toFixed(1)}x</span>
              </div>
            </div>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={curve} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="lift"
                    type="number"
                    domain={[0, 40]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{
                      fill: "var(--color-muted-foreground)",
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${Math.round(v)}`}
                    tick={{
                      fill: "var(--color-muted-foreground)",
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 6,
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`ETB ${v.toFixed(1)}M`, "Loss prevented"]}
                    labelFormatter={(l) => `Lift ${l}%`}
                  />
                  <Line
                    type="monotone"
                    dataKey="lossM"
                    stroke="var(--color-gold)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <ReferenceDot
                    x={inputs.detectionLiftPct}
                    y={out.lossPreventedETB / 1e6}
                    r={5}
                    fill="var(--color-gold)"
                    stroke="var(--color-background)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>90-Day EISAA Member Pilot & Capacity-Building Charter</DialogTitle>
          </DialogHeader>
          <div id="term-sheet" className="space-y-4 text-sm">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <div className="font-semibold">Kestrel Terminal × EISAA Member Institutions</div>
                <div className="text-xs text-muted-foreground">
                  Prepared for EISAA technical committee review
                </div>
              </div>
              <div className="num text-right text-[11px] text-muted-foreground">
                {saved ? (
                  <>
                    Ref {saved.id.slice(0, 8).toUpperCase()}
                    <br />
                    {new Date(saved.createdAt).toLocaleDateString("en-GB")}
                  </>
                ) : saveState === "saving" ? (
                  "Saving…"
                ) : (
                  <>
                    Draft
                    <br />
                    {new Date().toLocaleDateString("en-GB")}
                  </>
                )}
              </div>
            </div>
            <Section title="Scope">
              Proof-of-value for {Math.min(30, inputs.auditorCount)} IS auditors over{" "}
              {ROI_ASSUMPTIONS.pilotDays} days, deployed inside a sovereign or on-premise cloud
              boundary with INSA-aligned controls and a full audit trail for pre- and
              post-development reviews.
            </Section>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Active IS auditors modelled", `${inputs.auditorCount}`],
                  [
                    "Manual scoping & evidence hours saved / auditor / week",
                    inputs.weeklyHoursSaved.toFixed(1),
                  ],
                  [
                    "Avg. ICT loss / downtime prevented per pre-deployment audit",
                    formatETBCompact(inputs.avgLossPreventedETB),
                  ],
                  ["Control-gap detection lift", `${inputs.detectionLiftPct.toFixed(1)}%`],
                  [
                    "Annual audit capacity reclaimed",
                    `${Math.round(out.annualHoursReclaimed).toLocaleString()} hrs`,
                  ],
                  ["Projected loss prevented / yr", formatETBCompact(out.lossPreventedETB)],
                  [
                    "Projected loss prevented in pilot window",
                    formatETBCompact(out.pilotLossPreventedETB),
                  ],
                  ["Break-even", `${out.breakEvenAudits} pre-deployment audits`],
                ].map(([k, v]) => (
                  <tr key={k} className="border-t border-border">
                    <td className="py-1.5 text-muted-foreground">{k}</td>
                    <td className="num py-1.5 text-right">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Section title="Milestones">
              Weeks 1–2: sandbox setup with the EISAA technical committee · Weeks 3–6: pilot cohort
              of 30 IS auditors & training integration · Weeks 7–12: audit hours saved &
              pre-development risk report.
            </Section>
            <Section title="Success criteria">
              ≥ {inputs.weeklyHoursSaved.toFixed(1)} evidence hours saved per auditor per week
              (time-logged), 100% of dossier findings source-cited, and ≥ {out.breakEvenAudits}{" "}
              attributable pre-deployment audits in the pilot pipeline.
            </Section>
            <Section title="Governance">
              National data sovereignty, no external model training, role-based access control, a
              single ephemeral session token and immutable audit logs for the EISAA technical
              committee.
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

function OutputCard({
  eyebrow,
  value,
  sub,
  gold,
}: {
  eyebrow: string;
  value: string;
  sub: string;
  gold?: boolean;
}) {
  return (
    <div
      className={`panel glow-hover top-hairline group relative overflow-hidden p-5 ${
        gold ? "shadow-gold !border-gold/35" : ""
      }`}
    >
      {gold && (
        <span className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-gold/15 blur-3xl" />
      )}
      <div className="eyebrow !text-[10px]">{eyebrow}</div>
      <div
        className={`num mt-2 text-3xl transition-all duration-500 ${
          gold ? "text-gold drop-shadow-[0_0_22px_oklch(0.8_0.13_90/35%)]" : "text-foreground"
        }`}
      >
        {value}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
