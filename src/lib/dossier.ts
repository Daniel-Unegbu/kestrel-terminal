// Canonical Kestrel dossier schema (client-safe; shared by UI, server functions and presets).

export type InstitutionalSegment =
  "PUBLIC_SECTOR_INFRA" | "FINANCIAL_CORE_SYSTEMS" | "TELECOM_CLOUD_ITSM" | "ENTERPRISE_ERP_GOV";

export type AuditRiskPosture = "LOW_RISK" | "MODERATE_WATCH" | "ELEVATED_REVIEW";
export type EisaaPillar =
  | "Pre-Development System Audit"
  | "Post-Development & Fraud Audit"
  | "ISO 20000 & ITSM Governance"
  | "IS Auditor Capacity & Training";
export type RadarCategory =
  | "TDRA / National Cyber Policy"
  | "Federal Decree-Law No. 35 of 2021 & Governance"
  | "Fraud & Internal Control Risk"
  | "ISO 20000 / Service Continuity";
export type Severity = "INFO" | "WATCH" | "CRITICAL";
export type SearchProvider = "RESEARCH" | "SEARCH" | "REFERENCE";
export type RemediationWorkstream =
  "Pre-Development Control" | "Post-Development Audit" | "Fraud & Access Hardening";

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
  /** Bumped whenever the payload shape changes; legacy cached rows are a cache miss. */
  schemaVersion?: 2 | undefined;
  entityName: string;
  tickerOrRegistry?: string | undefined;
  sector: string;
  jurisdiction: string;
  segment: InstitutionalSegment;
  lastUpdatedIso: string;
  executiveSummary: string;
  executiveBriefAudioScript: string;
  isPreset?: boolean | undefined;
  auditPosture: {
    systemCriticalityTier: string;
    controlMaturityPct: number;
    openAuditFindingsRatio: number;
    iso20000ComplianceScore: number;
    meanTimeToRemediateDays: number;
    auditRiskPosture: AuditRiskPosture;
    sourceRefs?: number[] | undefined;
  };
  evidenceFlow: {
    evidenceCollectionDays: number;
    logRetentionDays: number;
    findingClosureDays: number;
    openRiskExposureAEDMillions: number;
    auditToolingMaturity: string;
    sourceRefs?: number[] | undefined;
  };
  remediationRoadmap: Array<{
    period: string;
    findingsToRemediate: number;
    workstream: RemediationWorkstream;
  }>;
  preDeploymentCoveragePct: number;
  regulatoryCoverage: Array<{
    framework: string;
    coveragePct: number;
    regulator: string;
    ecosystemPartner: string;
  }>;
  eisaaPillarRouting: Array<{
    pillar: EisaaPillar;
    recommendedService: string;
    triggerSignal: string;
    estimatedRiskExposureAED: string;
    confidenceScore: number;
    sourceRefs?: number[] | undefined;
  }>;
  governanceRiskRadar: Array<{
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
  {
    id: "PUBLIC_SECTOR_INFRA",
    label: "Public Sector & National Digital Infrastructure",
    short: "Public",
  },
  {
    id: "FINANCIAL_CORE_SYSTEMS",
    label: "Banking, Payments & FinTech Core Systems",
    short: "FinTech",
  },
  {
    id: "TELECOM_CLOUD_ITSM",
    label: "Telecom, Cloud & IT Service Management",
    short: "ITSM",
  },
  {
    id: "ENTERPRISE_ERP_GOV",
    label: "Enterprise ERP & Fraud Control",
    short: "ERP",
  },
];

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
