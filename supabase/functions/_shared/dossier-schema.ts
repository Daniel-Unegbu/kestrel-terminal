import { z } from "npm:zod@3";

// Lenient runtime validation for model output: coerces numbers, clamps enums to safe defaults.
const num = (d = 0) => z.coerce.number().catch(d);
const refs = z.array(z.coerce.number().int()).optional().catch(undefined);

const WORKSTREAMS = [
  "Pre-Development Control",
  "Post-Development Audit",
  "Fraud & Access Hardening",
] as const;

export const generatedDossierSchema = z.object({
  entityName: z.string(),
  tickerOrRegistry: z.string().optional().catch(undefined),
  sector: z.string().catch("Undisclosed"),
  jurisdiction: z.string().catch("Undisclosed"),
  segment: z
    .enum([
      "PUBLIC_SECTOR_INFRA",
      "FINANCIAL_CORE_SYSTEMS",
      "TELECOM_CLOUD_ITSM",
      "ENTERPRISE_ERP_GOV",
    ])
    .catch("PUBLIC_SECTOR_INFRA"),
  executiveSummary: z.string().catch(""),
  executiveBriefAudioScript: z.string().catch(""),
  auditPosture: z
    .object({
      systemCriticalityTier: z.string().catch("Undisclosed"),
      controlMaturityPct: num(),
      openAuditFindingsRatio: num(),
      iso20000ComplianceScore: num(),
      meanTimeToRemediateDays: num(),
      auditRiskPosture: z
        .enum(["LOW_RISK", "MODERATE_WATCH", "ELEVATED_REVIEW"])
        .catch("MODERATE_WATCH"),
      sourceRefs: refs,
    })
    .catch({
      systemCriticalityTier: "Undisclosed",
      controlMaturityPct: 0,
      openAuditFindingsRatio: 0,
      iso20000ComplianceScore: 0,
      meanTimeToRemediateDays: 0,
      auditRiskPosture: "MODERATE_WATCH",
    }),
  evidenceFlow: z
    .object({
      evidenceCollectionDays: num(),
      logRetentionDays: num(),
      findingClosureDays: num(),
      openRiskExposureETBMillions: num(),
      auditToolingMaturity: z.string().catch("Undisclosed"),
      sourceRefs: refs,
    })
    .catch({
      evidenceCollectionDays: 0,
      logRetentionDays: 0,
      findingClosureDays: 0,
      openRiskExposureETBMillions: 0,
      auditToolingMaturity: "Undisclosed",
    }),
  remediationRoadmap: z
    .array(
      z.object({
        period: z.coerce.string(),
        findingsToRemediate: num(),
        workstream: z.enum(WORKSTREAMS).catch("Pre-Development Control"),
      }),
    )
    .catch([]),
  preDeploymentCoveragePct: num(),
  regulatoryCoverage: z
    .array(
      z.object({
        framework: z.string(),
        coveragePct: num(),
        regulator: z.string().catch(""),
        ecosystemPartner: z.string().catch(""),
      }),
    )
    .catch([]),
  eisaaPillarRouting: z
    .array(
      z.object({
        pillar: z
          .enum([
            "Pre-Development System Audit",
            "Post-Development & Fraud Audit",
            "ISO 20000 & ITSM Governance",
            "IS Auditor Capacity & Training",
          ])
          .catch("Pre-Development System Audit"),
        recommendedService: z.string(),
        triggerSignal: z.string().catch(""),
        estimatedRiskExposureETB: z.string().catch("—"),
        confidenceScore: num(50),
        sourceRefs: refs,
      }),
    )
    .catch([]),
  governanceRiskRadar: z
    .array(
      z.object({
        category: z
          .enum([
            "INSA / National Cyber Policy",
            "Proclamation 1113/2019 & Governance",
            "Fraud & Internal Control Risk",
            "ISO 20000 / Service Continuity",
          ])
          .catch("INSA / National Cyber Policy"),
        severity: z.enum(["INFO", "WATCH", "CRITICAL"]).catch("INFO"),
        finding: z.string(),
        sourceIndex: z.coerce.number().int().optional().catch(undefined),
      }),
    )
    .catch([]),
});

export type GeneratedDossier = z.infer<typeof generatedDossierSchema>;
