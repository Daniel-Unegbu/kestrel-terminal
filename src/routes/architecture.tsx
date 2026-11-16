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
        content: "Dual-container deployment in Azure UAE North behind a single-virtual-key AI gateway, with CBUAE & ADGM compliance controls and a 90-day proof-of-value roadmap.",
      },
      { property: "og:title", content: "Sovereign Azure & Governance Blueprint — Kestrel Terminal" },
      { property: "og:description", content: "100% UAE data residency, zero secret sprawl, auditable for credit committee." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Architecture,
});

const PHASES = {
  mvp: {
    label: "Phase 1 · Rapid MVP",
    note: "App server routes call search & voice providers directly; the gateway governs model calls only.",
    app: ["Gateway virtual key", "Tavily key", "SerpAPI key", "Deepgram key"],
    gateway: ["Model provider: Gemini"],
  },
  enterprise: {
    label: "Phase 2 · Zero-secret enterprise",
    note: "All upstream credentials live inside the gateway. The app container holds one virtual key — swap Gemini for Azure OpenAI with a single config change.",
    app: ["Gateway virtual key"],
    gateway: ["Model provider: Gemini ⇄ Azure OpenAI", "MCP gateway: Tavily + SerpAPI", "Audio relay: Deepgram Aura / Nova"],
  },
} as const;

const CONTROLS = [
  { icon: Users, title: "Role-based access control", tag: "CBUAE", body: "RM, analyst and credit-committee roles scoped by segment and booking entity; Entra ID SSO." },
  { icon: KeyRound, title: "Single-virtual-key isolation", tag: "InfoSec", body: "No raw AI or search keys in the app container; rotation and budgets enforced at the gateway." },
  { icon: ScrollText, title: "Immutable audit logs", tag: "Credit committee", body: "Every prompt, source set and dossier version is hashed and retained for review." },
  { icon: ShieldCheck, title: "Source-level citation verification", tag: "Model risk", body: "Metrics without a resolvable source are flagged, never silently presented." },
  { icon: Lock, title: "UAE data residency", tag: "ADGM / CBUAE", body: "Workloads, logs and vector caches pinned to Azure UAE North; no external model training." },
  { icon: FileLock2, title: "Sanctions & adverse-media screening", tag: "Compliance", body: "Radar findings link to OFAC / regulator sources and route CRITICAL items for review." },
];

const ROADMAP = [
  { weeks: "Weeks 1–2", title: "Container deployment in Azure sandbox", body: "App + gateway containers in FAB's UAE North tenant; SSO, logging and network policies." },
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
              <Cloud className="size-4" /> <span className="num">Microsoft Azure · UAE North · FAB private tenant</span>
              <span className="ml-auto num text-[10px] text-muted-foreground">Core42 sovereign controls</span>
            </div>
            <div className="mt-5 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1.2fr_auto_1fr]">
              <Node icon={Boxes} title="Kestrel app container" sub="Server-rendered UI + API routes" items={p.app} tone="gold" />
              <Arrow />
              <Node icon={ServerCog} title="AI gateway container" sub="Audit · rate limits · budgets · semantic cache" items={p.gateway} tone="azure" />
              <Arrow />
              <div className="flex flex-col gap-3">
                {["Azure OpenAI (private endpoint)", "Gemini", "Tavily / SerpAPI", "Deepgram"].map((u, i) => (
                  <div key={u} className={`rounded-md border bg-card px-3 py-2.5 text-sm ${i === 0 ? "border-emerald/40" : "border-border"}`}>
                    <div className="num text-[10px] text-muted-foreground">{i === 0 ? "IN-REGION" : "UPSTREAM"}</div>
                    {u}
                  </div>
                ))}
              </div>
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

function Node({ icon: Icon, title, sub, items, tone }: { icon: typeof Boxes; title: string; sub: string; items: readonly string[]; tone: "gold" | "azure" }) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${tone === "gold" ? "border-gold/40" : "border-azure/40"}`}>
      <Icon className={`size-5 ${tone === "gold" ? "text-gold" : "text-azure"}`} />
      <div className="mt-2 font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
      <ul className="mt-3 space-y-1.5">
        {items.map((it) => (
          <motion.li key={it} layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="num rounded border border-border bg-background/50 px-2 py-1 text-[11px]">
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
