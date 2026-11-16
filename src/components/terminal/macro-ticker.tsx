const ITEMS: Array<{ label: string; value: string; delta?: string; tone?: "up" | "gold" }> = [
  { label: "GROUP ASSETS", value: "AED 1.47T", tone: "gold" },
  { label: "OPERATING INCOME 9M", value: "AED 29.71B" },
  { label: "IB&M REVENUE", value: "AED 9.33B", delta: "+4% YoY", tone: "up" },
  { label: "WHOLESALE BANKING", value: "AED 5.14B", delta: "+13% YoY", tone: "up" },
  { label: "INT'L FRANCHISE", value: "+31% YoY", tone: "up" },
  { label: "NON-INTEREST MIX", value: "43%" },
  { label: "CET1", value: "14.0%", tone: "up" },
  { label: "RoTE", value: "18.6%", tone: "up" },
];

export function MacroTicker() {
  const row = (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {ITEMS.map((i) => (
        <div key={i.label} className="flex items-center gap-2 whitespace-nowrap">
          <span className="eyebrow !text-[10px]">{i.label}</span>
          <span className={`num text-xs ${i.tone === "gold" ? "text-gold" : "text-foreground"}`}>{i.value}</span>
          {i.delta && <span className="num text-[11px] text-emerald">▲ {i.delta}</span>}
          <span className="text-hairline-strong">|</span>
        </div>
      ))}
    </div>
  );
  return (
    <div className="relative flex h-8 items-center overflow-hidden border-b border-border bg-background/80">
      <div className="z-10 flex h-full shrink-0 items-center gap-2 border-r border-border bg-background px-3">
        <span className="size-1.5 rounded-full bg-emerald animate-pulse-dot" />
        <span className="eyebrow !text-[10px] text-emerald">FAB 9M 2026</span>
      </div>
      <div className="flex animate-ticker">
        {row}
        {row}
      </div>
    </div>
  );
}
