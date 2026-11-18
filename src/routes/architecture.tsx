import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Boxes, Cloud, FileLock2, KeyRound, Lock, ScrollText, ServerCog, ShieldCheck, Users } from "lucide-react";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "Sovereign Azure & Governance Blueprint — Kestrel Terminal" },
      {
        name: "description",
        content: "Two-container deployment in Azure UAE North behind a single governed orchestration core, with CBUAE & ADGM compliance controls and a 90-day proof-of-value roadmap.",
      },
      { property: "og:title", content: "Sovereign Azure & Governance Blueprint — Kestrel Terminal" },
      { property: "og:description", content: "100% UAE data residency, one ephemeral session token, auditable for credit committee." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Architecture,
});

const PHASES = {
  mvp: {
    label: "Phase 1 · Rapid prototype",
    note: "The application tier calls research and voice connectors directly while the orchestration core governs model inference only — the fastest path to a working pilot.",
    app: ["Internal Database · session & dossier cache", "Microsoft Entra ID (SSO) · RBAC", "Research, Search & Voice connectors"],
    core: ["Ephemeral session token", "Model routing · approved endpoint"],
  },
  enterprise: {
    label: "Phase 2 · Zero-secret enterprise",
    note: "Every upstream credential is consolidated inside the orchestration core. The application container holds a single ephemeral session token, and the model provider can be repointed to a private Azure OpenAI endpoint with one configuration change — no application code changes.",
    app: ["Internal Database · session & dossier cache", "Microsoft Entra ID (SSO) · RBAC", "M365 triggers · Outlook & Teams sync"],
    core: [
      "Single ephemeral session token · zero key sprawl",
      "Research, Search & Voice agents · ingestion & synthesis",
      "Citation guardrails · grounding & audit logs",
    ],
  },
} as const;

const AZURE_NODE = [
  "Model-agnostic routing to approved Azure OpenAI endpoints",
  "Verified filings, market news & sanctions feeds, in-tenant",
  "100% UAE data residency · zero external model training",
];

const CONTROLS = [
  { icon: Users, title: "Role-based access control", tag: "CBUAE", body: "RM, analyst and credit-committee roles scoped by segment and booking entity; Entra ID SSO." },
  { icon: KeyRound, title: "Ephemeral token isolation", tag: "InfoSec", body: "No long-lived provider credentials in the application container; rotation, budgets and rate limits enforced in the orchestration core." },
  { icon: ScrollText, title: "Immutable audit logs", tag: "Credit committee", body: "Every prompt, source set and dossier version is hashed and retained for review." },
  { icon: ShieldCheck, title: "Source-level citation verification", tag: "Model risk", body: "Metrics without a resolvable source are flagged, never silently presented." },
  { icon: Lock, title: "UAE data residency", tag: "ADGM / CBUAE", body: "Workloads, logs and vector caches pinned to Azure UAE North; no external model training." },
  { icon: FileLock2, title: "Sanctions & adverse-media screening", tag: "Compliance", body: "Radar findings link to OFAC / regulator sources and route CRITICAL items for review." },
];

const ROADMAP = [
  { weeks: "Weeks 1–2", title: "Container deployment in Azure sandbox", body: "App + orchestration containers in the UAE North tenant; SSO, logging and network policies." },
  { weeks: "Weeks 3–6", title: "35-RM Wholesale Banking cohort", body: "Live coverage use across GRE, corporate and FI books with weekly feedback loops." },
  { weeks: "Weeks 7–12", title: "Mandate conversion & hours-saved audit", body: "Time-logged hours saved and attributable pipeline reviewed with Finance and Innovation." },
];

function Architecture() {
  const [phase, setPhase] = useState<keyof typeof PHASES>("enterprise");
  const [active, setActive] = useState(0);
  const p = PHASES[phase];

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-6 lg:py-8">
      <div className="eyebrow">Pillars 3 & 4 · Architecture, security & governance</div>
      <h1 className="mt-2 text-3xl font-semibold">Sovereign Azure, container & governance blueprint</h1>

      {/* Topology */}
      <section className="panel mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <h2 className="text-sm font-semibold">Sovereign cloud topology</h2>
          <div className="relative flex rounded-md border border-border p-0.5">
            {(Object.keys(PHASES) as Array<keyof typeof PHASES>).map((k) => (
              <button key={k} onClick={() => setPhase(k)} className={`relative z-10 px-3 py-1.5 text-xs transition-colors ${phase === k ? "text-gold-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {phase === k && <motion.span layoutId="phase-pill" className="absolute inset-0 -z-10 rounded bg-gold" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                {PHASES[k].label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid-lines p-5 lg:p-8">
          <div className="rounded-lg border border-dashed border-azure/40 p-4 lg:p-6">
            <div className="flex items-center gap-2 text-xs text-azure">
              <Cloud className="size-4" /> <span className="num">Sovereign deployment boundary · Microsoft Azure UAE North · private tenant</span>
              <span className="ml-auto num text-[10px] text-muted-foreground">Core42 sovereign controls</span>
            </div>
            <div className="mt-5 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1.2fr_auto_1fr]">
              <Node
                icon={Boxes}
                title="Kestrel Presentation Terminal"
                sub="Stateless banker interface · zero local credential storage"
                items={p.app}
                tone="gold"
              />
              <Arrow />
              <Node
                icon={ServerCog}
                title="Kestrel Sovereign Orchestration Core"
                sub="Policy enforcement · citation grounding · audit trail"
                items={p.core}
                tone="azure"
              />
              <Arrow />
              <Node
                icon={Cloud}
                title="Private Azure Cloud (UAE North)"
                sub="Microsoft Azure innovation hub · Core42 sovereign controls"
                items={AZURE_NODE}
                tone="emerald"
              />
            </div>
          </div>
          <motion.p key={phase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 max-w-3xl text-sm text-muted-foreground">
            {p.note}
          </motion.p>
        </div>
      </section>

      {/* Compliance matrix */}
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">CBUAE & ADGM compliance matrix</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {CONTROLS.map((c, i) => (
            <button
              key={c.title}
              onClick={() => setActive(i)}
              className={`panel p-4 text-left transition-colors ${active === i ? "!border-gold/50 shadow-gold" : "hover:border-hairline-strong"}`}
            >
              <div className="flex items-center justify-between">
                <c.icon className={`size-5 ${active === i ? "text-gold" : "text-muted-foreground"}`} />
                <span className="num rounded border border-border px-1.5 text-[10px] text-muted-foreground">{c.tag}</span>
              </div>
              <div className="mt-3 font-medium">{c.title}</div>
              <p className="mt-1.5 text-sm text-muted-foreground">{c.body}</p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald">
                <span className="size-1.5 rounded-full bg-emerald" /> Control designed for pilot
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">60-to-90-day proof-of-value roadmap</h2>
        <ol className="relative mt-6 grid gap-4 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-[7px] hidden h-px bg-gradient-to-r from-gold via-azure to-emerald md:block" />
          {ROADMAP.map((r, i) => (
            <motion.li key={r.weeks} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative">
              <span className={`relative z-10 block size-3.5 rounded-full border-2 border-background ${i === 0 ? "bg-gold" : i === 1 ? "bg-azure" : "bg-emerald"}`} />
              <div className="panel mt-4 p-4">
                <div className="num text-xs text-gold">{r.weeks}</div>
                <div className="mt-1 font-medium">{r.title}</div>
                <p className="mt-1.5 text-sm text-muted-foreground">{r.body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>
    </div>
  );
}

const TONE = {
  gold: { border: "border-gold/40", text: "text-gold" },
  azure: { border: "border-azure/40", text: "text-azure" },
  emerald: { border: "border-emerald/40", text: "text-emerald" },
} as const;

function Node({
  icon: Icon,
  title,
  sub,
  items,
  tone,
}: {
  icon: typeof Boxes;
  title: string;
  sub: string;
  items: readonly string[];
  tone: keyof typeof TONE;
}) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${TONE[tone].border}`}>
      <Icon className={`size-5 ${TONE[tone].text}`} />
      <div className="mt-2 font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
      <ul className="mt-3 space-y-1.5">
        {items.map((it) => (
          <motion.li key={it} layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="num rounded border border-border bg-background/50 px-2 py-1 text-[11px] leading-relaxed">
            {it}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center justify-center py-1 lg:py-0" aria-hidden="true">
      <svg viewBox="0 0 60 12" className="h-3 w-12 rotate-90 lg:rotate-0">
        <line x1="0" y1="6" x2="52" y2="6" className="stroke-gold animate-flow" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d="M52 1 L60 6 L52 11 Z" className="fill-gold" />
      </svg>
    </div>
  );
}
