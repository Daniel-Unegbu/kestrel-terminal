// Canonical Kestrel dossier schema (client-safe; shared by UI, server functions and presets).

export type InstitutionalSegment =
  | "GRE_SOVEREIGN"
  | "IBM_CORPORATE"
  | "FINANCIAL_INSTITUTION"
  | "COMMERCIAL_SME";

export type CreditRiskRating = "LOW_RISK" | "MODERATE_WATCH" | "ELEVATED_REVIEW";
export type FabDivision =
  | "Global Corporate Finance"
  | "Global Transaction Banking"
  | "Global Markets"
  | "Islamic Banking";
export type RadarCategory =
  | "CBUAE / Regulatory"
  | "Sanctions & Adverse Media"
  | "FX & Corridor Risk"
  | "ESG / Transition Finance";
export type Severity = "INFO" | "WATCH" | "CRITICAL";
export type SearchProvider = "RESEARCH" | "SEARCH" | "REFERENCE";

/** User-facing provider labels — never expose upstream vendor names in the UI. */
export const PROVIDER_LABEL: Record<SearchProvider, string> = {
  RESEARCH: "Research Agent",
  SEARCH: "Search Agent",
  REFERENCE: "Reference",
};

export interface DossierSource {
  title: string;
  url: string;
  provider: SearchProvider;
}

export interface InstitutionalDossier {
  id?: string | undefined;
  entityName: string;
  tickerOrRegistry?: string | undefined;
  sector: string;
  jurisdiction: string;
  segment: InstitutionalSegment;
  lastUpdatedIso: string;
  executiveSummary: string;
  executiveBriefAudioScript: string;
  isPreset?: boolean | undefined;
  financialMetrics: {
    estimatedRevenueAED: string;
    ebitdaMarginPct: number;
    netDebtToEbitda: number;
    interestCoverageRatio: number;
    cashConversionCycleDays: number;
    creditRiskRating: CreditRiskRating;
    sourceRefs?: number[] | undefined;
  };
  workingCapital: {
    dsoDays: number;
    dioDays: number;
    dpoDays: number;
    trappedLiquidityAEDMillions: number;
    tradeFinanceVelocity: string;
    sourceRefs?: number[] | undefined;
  };
  debtMaturityProfile: Array<{
    year: string;
    maturingDebtAEDMillions: number;
    instrumentType: "Syndicated Loan" | "Sukuk / Bond" | "Trade Facility";
  }>;
  bondIssuanceProbabilityPct: number;
  corridors: Array<{
    corridor: string;
    flowSharePct: number;
    fxPair: string;
    fabHub: string;
  }>;
  fabDivisionRouting: Array<{
    division: FabDivision;
    recommendedProduct: string;
    triggerSignal: string;
    estimatedFeePoolAED: string;
    confidenceScore: number;
    sourceRefs?: number[] | undefined;
  }>;
  complianceAndRiskRadar: Array<{
    category: RadarCategory;
    severity: Severity;
    finding: string;
    sourceTitle: string;
    sourceUrl: string;
    searchProvider: SearchProvider;
  }>;
  sources: DossierSource[];
}

export const SEGMENTS: Array<{ id: InstitutionalSegment; label: string; short: string }> = [
  { id: "GRE_SOVEREIGN", label: "GREs & Sovereign", short: "GRE" },
  { id: "IBM_CORPORATE", label: "IB&M Corporates", short: "IB&M" },
  { id: "FINANCIAL_INSTITUTION", label: "Financial Institutions", short: "FI" },
  { id: "COMMERCIAL_SME", label: "Commercial & SME", short: "SME" },
];

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
