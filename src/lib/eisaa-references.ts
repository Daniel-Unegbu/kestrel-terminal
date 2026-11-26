// UAE IAA identity and governance telemetry.
//
// The association's public-facing benchmarks are illustrative in this prototype.
// Keep every visible figure here so the ticker, header and footer stay in sync.

export type TickerItem = {
  label: string;
  value: string;
  delta?: string;
  tone?: "up" | "down" | "gold";
};

export const EISAA_TICKER: TickerItem[] = [
  { label: "CHARTER", value: "Federal Decree-Law No. 35 of 2021", tone: "gold" },
  { label: "ESTABLISHED", value: "Oct 2021" },
  { label: "AUDIT SCOPE", value: "Pre & Post-Development" },
  { label: "FRAMEWORKS", value: "ISO 20000 · COBIT" },
  { label: "CYBER STANDARDS", value: "TDRA" },
  { label: "PARTNERS", value: "TDRA · UAE Cybersecurity Council · Khazna · Emirates NBD" },
  { label: "MANDATE", value: "ICT Protection & Fraud Prevention" },
  { label: "FOCUS", value: "IS Auditor Capacity" },
];

export const EISAA_COPY = {
  headerSubtitle: "IS Audit, IT Governance & Cyber Risk Intelligence",
  tickerBadge: "UAE IAA · UAE FINANCIAL MARKETS",
  footerFigures: "Association benchmarks are illustrative · Preset dossiers are illustrative",
};
