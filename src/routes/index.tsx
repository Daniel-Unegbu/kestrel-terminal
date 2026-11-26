import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  AudioLines,
  Clock,
  Database,
  FileSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — Kestrel Terminal" },
      {
        name: "description",
        content:
          "Governance telemetry and the IS audit bottleneck across UAE's public and private sectors, with the live research pipeline that resolves it.",
      },
      { property: "og:title", content: "Command Center — Kestrel Terminal" },
      {
        property: "og:description",
        content:
          "From 4–6 hours of manual audit scoping per system review to a cited dossier in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommandCenter,
});

const KPIS = [
  { label: "Association charter", value: "Federal Decree-Law No. 35 of 2021", sub: "registered October 2021" },
  { label: "Audit scope", value: "Pre & post-development", sub: "information system audits" },
  { label: "Core frameworks", value: "ISO 20000 · COBIT", sub: "TDRA cyber standards" },
  { label: "Ecosystem partners", value: "TDRA · UAE Cybersecurity Council", sub: "Khazna · Emirates NBD · e&" },
  { label: "Primary mandate", value: "ICT protection", sub: "fraud prevention & governance" },
];

const NODES = [
  {
    icon: FileSearch,
    tone: "text-azure",
    ring: "border-azure/40",
    eyebrow: "01 · Ingestion",
    title: "Live multi-source retrieval",
    body: "TDRA directives, proclamations, vulnerability advisories and audit guidance, with an independent search fallback for niche systems.",
  },
  {
    icon: Sparkles,
    tone: "text-gold",
    ring: "border-gold/50",
    eyebrow: "02 · Synthesis",
    title: "Sovereign audit synthesis",
    body: "One governed orchestration core over approved models — repointable to an on-premise or sovereign cloud endpoint.",
  },
  {
    icon: AudioLines,
    tone: "text-emerald",
    ring: "border-emerald/40",
    eyebrow: "03 · Delivery",
    title: "Cited audit dossier + Lead Auditor brief",
    body: "Six audit modules, source-level citations and a 60-second spoken brief for the audit lead.",
  },
];

const PILLARS = [
  { n: "P1", t: "Strategic problem fit", to: "/", d: "Command Center" },
  { n: "P2", t: "Product depth", to: "/sandbox", d: "Audit Sandbox" },
  { n: "P3", t: "Technical architecture", to: "/architecture", d: "Sovereign blueprint" },
  { n: "P4", t: "Security & compliance", to: "/architecture", d: "TDRA / Federal law matrix" },
  { n: "P5", t: "Capacity & risk impact", to: "/roi-model", d: "Audit impact simulator" },
] as const;

function CommandCenter() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-6 lg:py-12">
      {/* Hero */}
      <section className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="eyebrow flex items-center gap-2">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 rounded-full bg-gold" />
              <span className="absolute inset-0 rounded-full bg-gold blur-[4px] opacity-80" />
            </span>
            IS Audit, IT Governance & Cyber Risk Intelligence
          </div>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] md:text-6xl">
            Walk into every system audit with{" "}
            <span className="text-gold-gradient text-glow">control gaps</span> and governance risks
            already mapped.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Kestrel turns live governance intelligence into cited audit dossiers for UAE IAA members —
            routed to the right UAE IAA pillar, and briefed aloud in sixty seconds.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild variant="gold" size="lg">
              <Link to="/sandbox">
                Open Audit Sandbox <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="terminal" size="lg">
              <Link to="/roi-model">Model the risk impact</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="panel top-hairline grid grid-cols-2 gap-px overflow-hidden !p-0"
        >
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className={`relative p-4 transition-colors duration-500 hover:bg-white/[0.04] ${
                i === 0
                  ? "col-span-2 bg-gradient-to-br from-gold/[0.09] to-transparent"
                  : "bg-white/[0.015]"
              }`}
            >
              <div className="eyebrow !text-[10px]">{k.label}</div>
              <div className={`num mt-1.5 ${i === 0 ? "text-2xl text-gold" : "text-xl"}`}>
                {k.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{k.sub}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Problem thesis */}
      <section className="mt-14 grid gap-4 lg:grid-cols-3">
        <div className="panel glow-hover p-6 lg:col-span-2">
          <div className="eyebrow">Executive problem thesis</div>
          <h2 className="mt-3 text-2xl font-semibold md:text-3xl">
            IS auditors spend half a day assembling what the institution already holds in its
            systems.
          </h2>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Across UAE's public and private sectors, IS auditors and IT governance teams stitch
            together system documentation, regulatory directives, prior audit findings and
            vulnerability advisories by hand before every pre- or post-development review. The
            result: slower assurance, inconsistent control framing, and fraud or continuity risks
            that surface after deployment rather than before.
          </p>
        </div>
        <div className="panel glow-hover flex flex-col justify-between p-6">
          <Clock className="size-5 text-crimson" />
          <div>
            <div className="num text-5xl text-foreground">4–6 hrs</div>
            <div className="mt-2 text-sm text-muted-foreground">
              manual audit scoping per system review, per auditor
            </div>
          </div>
          <div className="mt-6 border-t border-white/[0.07] pt-4">
            <div className="num text-3xl text-emerald">~8 sec</div>
            <div className="mt-1 text-sm text-muted-foreground">
              to a cited Kestrel dossier on any named system
            </div>
          </div>
        </div>
      </section>

      {/* Architecture flow */}
      <section className="mt-14">
        <div className="flex items-end justify-between">
          <div>
            <div className="eyebrow">Pipeline</div>
            <h2 className="mt-2 text-2xl font-semibold">
              Three nodes from signal to audit assurance
            </h2>
          </div>
          <Link
            to="/architecture"
            className="hidden text-sm text-muted-foreground hover:text-gold md:block"
          >
            Full sovereign blueprint →
          </Link>
        </div>
        <div className="relative mt-6 grid gap-4 md:grid-cols-3">
          <svg
            className="pointer-events-none absolute left-0 top-1/2 hidden h-2 w-full -translate-y-1/2 md:block"
            preserveAspectRatio="none"
            viewBox="0 0 100 2"
            aria-hidden="true"
          >
            <line
              x1="10"
              y1="1"
              x2="90"
              y2="1"
              className="stroke-gold/50 animate-flow"
              strokeWidth="0.3"
              strokeDasharray="1.2 1.2"
              vectorEffect="non-scaling-stroke"
              style={{ strokeWidth: 1.5 }}
            />
          </svg>
          {NODES.map((n, i) => (
            <motion.div
              key={n.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="panel glow-hover group relative z-10 p-5"
            >
              <div
                className={`flex size-10 items-center justify-center rounded-xl border bg-white/[0.03] backdrop-blur-md transition-all duration-500 group-hover:shadow-[0_0_28px_-8px_currentColor] ${n.ring}`}
              >
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
        <h2 className="mt-2 text-2xl font-semibold">
          Every view answers one of the five innovation pillars
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((p) => (
            <Link
              key={p.n}
              to={p.to}
              className="panel glow-hover lift-hover group relative overflow-hidden p-4 hover:border-gold/40"
            >
              <span className="pointer-events-none absolute -right-6 -top-6 size-16 rounded-full bg-gold/10 blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-0" />
              <div className="num text-xs text-gold">{p.n}</div>
              <div className="mt-2 font-medium">{p.t}</div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                {p.d}{" "}
                <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-gold" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            t: "Zero-hallucination grounding",
            d: "Every finding and control gap links to the exact retrieved source URL.",
          },
          {
            icon: Database,
            t: "Persisted audit memory",
            d: "Live dossiers are saved so any auditor can reopen them instantly.",
          },
          {
            icon: AudioLines,
            t: "Voice-first field audits",
            d: "Brief aloud between sites; ask follow-ups hands-free.",
          },
        ].map((f) => (
          <div key={f.t} className="flex gap-3 border-t border-white/[0.07] pt-4">
            <f.icon className="mt-0.5 size-4 shrink-0 text-gold drop-shadow-[0_0_10px_oklch(0.8_0.13_90/55%)]" />
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
