import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Command, Mic } from "lucide-react";
import { EISAA_COPY } from "@/lib/eisaa-references";
import { KestrelMark } from "./kestrel-mark";
import { MacroTicker } from "./macro-ticker";
import { useTerminal } from "./terminal-context";

const NAV = [
  { to: "/", label: "Command Center", pillar: "P1" },
  { to: "/sandbox", label: "Audit Sandbox", pillar: "P2" },
  { to: "/roi-model", label: "Impact Model", pillar: "P5" },
  { to: "/architecture", label: "Architecture", pillar: "P3·4" },
] as const;

export function AppHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setPaletteOpen, setDeskOpen } = useTerminal();
  return (
    <header className="glass-bar sticky top-0 z-40 border-b border-white/[0.07] shadow-[0_20px_50px_-38px_oklch(0_0_0/95%)] no-print">
      <MacroTicker />
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-6 px-4 lg:px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="relative flex size-9 items-center justify-center rounded-xl border border-gold/25 bg-gold/[0.06] transition-all duration-500 group-hover:border-gold/50 group-hover:bg-gold/[0.12] group-hover:shadow-[0_0_28px_-6px_oklch(0.8_0.13_90/45%)]">
            <KestrelMark />
          </span>
          <div className="leading-none">
            <div className="text-[15px] font-semibold tracking-tight">Kestrel Terminal</div>
            <div className="eyebrow !text-[9px] mt-1">{EISAA_COPY.headerSubtitle}</div>
          </div>
        </Link>
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`relative rounded-lg px-3 py-2 text-sm transition-all duration-300 ${
                  active
                    ? "bg-white/[0.06] text-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/8%)]"
                    : "text-muted-foreground hover:bg-white/[0.035] hover:text-foreground"
                }`}
              >
                <span className="num mr-1.5 text-[10px] text-muted-foreground">{n.pillar}</span>
                {n.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-[7px] h-px rounded-full bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_12px_1px_oklch(0.8_0.13_90/60%)]"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setDeskOpen(true)}
            className="hidden items-center gap-2 rounded-full border border-azure/25 bg-azure/[0.07] px-3 py-1.5 text-xs text-azure/90 transition-all duration-300 hover:border-azure/60 hover:bg-azure/[0.14] hover:shadow-[0_0_26px_-8px_oklch(0.75_0.14_233/70%)] sm:flex"
          >
            <Mic className="size-3.5" /> AuditDesk
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-muted-foreground transition-all duration-300 hover:border-gold/45 hover:bg-white/[0.09] hover:text-foreground hover:shadow-[0_0_26px_-8px_oklch(0.8_0.13_90/60%)]"
          >
            <Command className="size-3.5" />
            <span className="hidden sm:inline">Jump to…</span>
            <kbd className="num rounded border border-white/12 bg-white/[0.04] px-1 text-[10px]">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-white/[0.06] px-2 md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="whitespace-nowrap rounded-md px-3 py-2.5 text-xs text-muted-foreground transition-colors"
            activeProps={{ className: "text-gold" }}
            activeOptions={{ exact: n.to === "/" }}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
