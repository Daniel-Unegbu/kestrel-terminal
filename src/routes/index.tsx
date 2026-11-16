import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, AudioLines, Clock, Database, FileSearch, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — Kestrel Terminal" },
      {
        name: "description",
        content: "Macro telemetry and the coverage bottleneck across FAB's 20-market footprint, with the live research pipeline that resolves it.",
      },
      { property: "og:title", content: "Command Center — Kestrel Terminal" },
      {
        property: "og:description",
        content: "From 4–6 hours of manual research per client meeting to a cited dossier in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommandCenter,
});

const KPIS = [
  { label: "Group assets", value: "AED 1.47T", sub: "9M 2026" },
  { label: "Operating income", value: "AED 29.71B", sub: "9M 2026" },
  { label: "Non-interest income mix", value: "43%", sub: "fees & spread" },
  { label: "RoTE", value: "18.6%", sub: "CET1 14.0%" },
  { label: "Int'l franchise revenue", value: "+31%", sub: "YoY growth" },
];

const NODES = [
  {
    icon: FileSearch,
    tone: "text-azure",
    ring: "border-azure/40",
    eyebrow: "01 · Ingestion",
    title: "Live multi-source retrieval",
    body: "Advanced research retrieval with an independent search fallback for niche regional subsidiaries.",
  },
  {
    icon: Sparkles,
    tone: "text-gold",
    ring: "border-gold/50",
    eyebrow: "02 · Synthesis",
    title: "Sovereign gateway synthesis",
    body: "One governed orchestration core over FAB-approved models — repointable to Azure OpenAI in UAE North.",
  },
  {
    icon: AudioLines,
    tone: "text-emerald",
    ring: "border-emerald/40",
    eyebrow: "03 · Delivery",
    title: "Cited RM dossier + audio brief",
    body: "Six research modules, source-level citations and a 60-second voice brief.",
  },
];

const PILLARS = [
  { n: "P1", t: "Strategic problem fit", to: "/", d: "Command Center" },
  { n: "P2", t: "Product depth", to: "/sandbox", d: "Coverage Sandbox" },
  { n: "P3", t: "Technical architecture", to: "/architecture", d: "Sovereign blueprint" },
  { n: "P4", t: "Security & compliance", to: "/architecture", d: "CBUAE / ADGM matrix" },
  { n: "P5", t: "Commercial impact", to: "/roi-model", d: "Fee-income simulator" },
] as const;

function CommandCenter() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-6 lg:py-12">
      {/* Hero */}
      <section className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="eyebrow flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-gold" /> Institutional Coverage & Deal Intelligence
          </div>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] md:text-6xl">
            Walk into every client meeting with the <span className="text-gold-gradient">capital triggers</span> already mapped.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Kestrel turns live market intelligence into cited coverage dossiers for FAB's Wholesale Banking and IB&M teams —
            routed to the division that should lead, and briefed aloud in sixty seconds.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild variant="gold" size="lg">
              <Link to="/sandbox">
                Open Coverage Sandbox <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="terminal" size="lg">
              <Link to="/roi-model">Model the fee uplift</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="panel grid grid-cols-2 gap-px overflow-hidden !p-0"
        >
          {KPIS.map((k, i) => (
            <div key={k.label} className={`bg-card p-4 ${i === 0 ? "col-span-2" : ""}`}>
              <div className="eyebrow !text-[10px]">{k.label}</div>
              <div className={`num mt-1.5 ${i === 0 ? "text-4xl text-gold" : "text-2xl"}`}>{k.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{k.sub}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Problem thesis */}
      <section className="mt-14 grid gap-4 lg:grid-cols-3">
        <div className="panel p-6 lg:col-span-2">
          <div className="eyebrow">Executive problem thesis</div>
          <h2 className="mt-3 text-2xl font-semibold md:text-3xl">
            Coverage bankers spend half a day assembling what a client already knows about itself.
          </h2>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Across a 20-market footprint, relationship managers and credit analysts stitch together annual reports,
            sukuk and bond maturity schedules, cross-border corridor shifts and CBUAE / sanctions checks by hand before
            every meeting. The result: slower origination, inconsistent credit framing, and mandates that go to the bank
            that showed up first with the right idea.
          </p>
        </div>
        <div className="panel flex flex-col justify-between p-6">
          <Clock className="size-5 text-crimson" />
          <div>
            <div className="num text-5xl text-foreground">4–6 hrs</div>
            <div className="mt-2 text-sm text-muted-foreground">manual research per client meeting, per RM</div>
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <div className="num text-3xl text-emerald">~8 sec</div>
            <div className="mt-1 text-sm text-muted-foreground">to a cited Kestrel dossier on any named entity</div>
          </div>
        </div>
      </section>

      {/* Architecture flow */}
      <section className="mt-14">
        <div className="flex items-end justify-between">
          <div>
            <div className="eyebrow">Pipeline</div>
            <h2 className="mt-2 text-2xl font-semibold">Three nodes from signal to mandate</h2>
          </div>
          <Link to="/architecture" className="hidden text-sm text-muted-foreground hover:text-gold md:block">
            Full sovereign blueprint →
          </Link>
        </div>
        <div className="relative mt-6 grid gap-4 md:grid-cols-3">
          <svg className="pointer-events-none absolute left-0 top-1/2 hidden h-2 w-full -translate-y-1/2 md:block" preserveAspectRatio="none" viewBox="0 0 100 2" aria-hidden="true">
            <line x1="10" y1="1" x2="90" y2="1" className="stroke-gold/50 animate-flow" strokeWidth="0.3" strokeDasharray="1.2 1.2" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 1.5 }} />
          </svg>
          {NODES.map((n, i) => (
            <motion.div
              key={n.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="panel relative z-10 p-5 transition-colors hover:border-hairline-strong"
            >
              <div className={`flex size-10 items-center justify-center rounded-md border bg-background ${n.ring}`}>
                <n.icon className={`size-5 ${n.tone}`} />
              </div>
              <div className="eyebrow mt-4 !text-[10px]">{n.eyebrow}</div>
              <h3 className="mt-1 text-lg font-semibold">{n.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{n.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="mt-14">
        <div className="eyebrow">Evaluation map</div>
        <h2 className="mt-2 text-2xl font-semibold">Every view answers one of FAB Innovation's five pillars</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((p) => (
            <Link key={p.n} to={p.to} className="panel group p-4 transition-colors hover:border-gold/40">
              <div className="num text-xs text-gold">{p.n}</div>
              <div className="mt-2 font-medium">{p.t}</div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                {p.d} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        {[
          { icon: ShieldCheck, t: "Zero-hallucination grounding", d: "Every metric and trigger links to the exact retrieved source URL." },
          { icon: Database, t: "Persisted coverage memory", d: "Live dossiers are saved so any RM can reopen them instantly." },
          { icon: AudioLines, t: "Voice-first in transit", d: "Brief aloud between ADGM and DIFC; ask follow-ups hands-free." },
        ].map((f) => (
          <div key={f.t} className="flex gap-3 border-t border-border pt-4">
            <f.icon className="mt-0.5 size-4 shrink-0 text-gold" />
            <div>
              <div className="text-sm font-medium">{f.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
