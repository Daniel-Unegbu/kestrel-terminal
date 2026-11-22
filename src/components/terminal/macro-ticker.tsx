import { EISAA_COPY, EISAA_TICKER } from "@/lib/eisaa-references";

const ITEMS = EISAA_TICKER;

export function MacroTicker() {
  const row = (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {ITEMS.map((i) => (
        <div key={i.label} className="flex items-center gap-2 whitespace-nowrap">
          <span className="eyebrow !text-[10px]">{i.label}</span>
          <span className={`num text-xs ${i.tone === "gold" ? "text-gold" : "text-foreground"}`}>
            {i.value}
          </span>
          {i.delta && (
            <span
              className={`num text-[11px] ${i.tone === "down" ? "text-crimson" : "text-emerald"}`}
            >
              {i.tone === "down" ? "▼" : "▲"} {i.delta}
            </span>
          )}
          <span className="text-hairline-strong">|</span>
        </div>
      ))}
    </div>
  );
  return (
    <div className="relative flex h-8 items-center overflow-hidden border-b border-white/[0.05]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,oklch(1_0_0/3%),transparent)]" />
      <div className="z-10 flex h-full shrink-0 items-center gap-2 border-r border-white/[0.07] bg-white/[0.03] px-3 backdrop-blur-md">
        <span className="relative flex size-1.5">
          <span className="absolute inset-0 rounded-full bg-emerald animate-pulse-dot" />
          <span className="absolute inset-0 rounded-full bg-emerald blur-[3px] opacity-70" />
        </span>
        <span className="eyebrow !text-[10px] text-emerald">{EISAA_COPY.tickerBadge}</span>
      </div>
      <div className="flex animate-ticker">
        {row}
        {row}
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background/80 to-transparent" />
    </div>
  );
}
