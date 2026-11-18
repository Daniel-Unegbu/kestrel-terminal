// FAB-focused experience, parked for later reversion.
//
// The general-market demo temporarily replaces FAB branding and the FAB
// balance-sheet ticker with UAE equity-market data. When switching back, restore
// the strings below in:
//   - src/components/terminal/macro-ticker.tsx   (tickerBadge, tickerItems)
//   - src/components/terminal/app-header.tsx     (headerSubtitle)
//   - src/routes/__root.tsx                      (footerFigures)
//   - src/routes/index.tsx, roi-model.tsx, architecture.tsx, sandbox.tsx,
//     dossier-view.tsx, deal-desk.tsx            (body copy)

export type TickerItem = {
  label: string;
  value: string;
  delta?: string;
  tone?: "up" | "down" | "gold";
};

export const FAB_EXPERIENCE = {
  headerSubtitle: "Institutional Coverage · FAB",
  tickerBadge: "FAB 9M 2026",
  footerFigures: "Figures: FAB 9M 2026 disclosures · Preset clients are illustrative",
  tickerItems: [
    { label: "GROUP ASSETS", value: "AED 1.47T", tone: "gold" },
    { label: "OPERATING INCOME 9M", value: "AED 29.71B" },
    { label: "IB&M REVENUE", value: "AED 9.33B", delta: "+4% YoY", tone: "up" },
    { label: "WHOLESALE BANKING", value: "AED 5.14B", delta: "+13% YoY", tone: "up" },
    { label: "INT'L FRANCHISE", value: "+31% YoY", tone: "up" },
    { label: "NON-INTEREST MIX", value: "43%" },
    { label: "CET1", value: "14.0%", tone: "up" },
    { label: "RoTE", value: "18.6%", tone: "up" },
  ] satisfies TickerItem[],
  references: {
    investorRelations: {
      title: "FAB Investor Relations — financial results & disclosures",
      url: "https://www.bankfab.com/en-ae/about-fab/investor-relations",
    },
    sustainability: {
      title: "FAB Sustainability — sustainable finance commitments",
      url: "https://www.bankfab.com/en-ae/about-fab/sustainability",
    },
  },
} as const;

// Temporary general-market identity used until the FAB experience is restored.
export const UAE_MARKET_TICKER: TickerItem[] = [
  { label: "DFM GENERAL", value: "4,318.72", delta: "+0.42%", tone: "up" },
  { label: "ADX GENERAL", value: "9,406.18", delta: "+0.31%", tone: "up" },
  { label: "EMAAR", value: "AED 8.14", delta: "+1.05%", tone: "up" },
  { label: "EMIRATES NBD", value: "AED 19.55", delta: "+0.72%", tone: "up" },
  { label: "DEWA", value: "AED 2.48", delta: "-0.40%", tone: "down" },
  { label: "ADNOC DISTRIBUTION", value: "AED 3.86", delta: "-0.26%", tone: "down" },
  { label: "TAQA", value: "AED 3.21", delta: "+0.63%", tone: "up" },
  { label: "IHC", value: "AED 401.00", delta: "+0.25%", tone: "up" },
];

export const UAE_MARKET_COPY = {
  headerSubtitle: "Institutional Coverage · UAE Markets",
  tickerBadge: "UAE MARKETS",
  footerFigures: "Market data is illustrative · Preset clients are illustrative",
};
