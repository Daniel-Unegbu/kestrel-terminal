import type { DossierSource, InstitutionalDossier } from "./dossier";

// Illustrative, pre-loaded scenarios for zero-latency demos. Entities are fictional composites;
// sources point to real public reference pages (regulators, standards bodies, ecosystem partners)
// rather than entity-specific filings, and are labelled REFERENCE in the UI.

const REF = {
  insa: {
    title: "TDRA — Telecommunications and Digital Government Regulatory Authority",
    url: "https://tdra.gov.ae/",
    provider: "REFERENCE" as const,
  },
  ecysa: {
    title: "UAE Cybersecurity Council",
    url: "https://cybersecurity.gov.ae/",
    provider: "REFERENCE" as const,
  },
  iso20000: {
    title: "ISO/IEC 20000 — IT service management",
    url: "https://www.iso.org/isoiec-20000.html",
    provider: "REFERENCE" as const,
  },
  cobit: {
    title: "ISACA COBIT — IT governance framework",
    url: "https://www.isaca.org/resources/cobit",
    provider: "REFERENCE" as const,
  },
  nbe: {
    title: "Central Bank of the UAE — directives & supervision",
    url: "https://www.centralbank.ae/",
    provider: "REFERENCE" as const,
  },
  ethiotel: {
    title: "e& — network & service disclosures",
    url: "https://www.eand.com/",
    provider: "REFERENCE" as const,
  },
  customs: {
    title: "Federal Customs Authority",
    url: "https://www.mof.gov.ae/",
    provider: "REFERENCE" as const,
  },
  egov: {
    title: "UAE Pass — national digital identity",
    url: "https://selfcare.uaepass.ae/",
    provider: "REFERENCE" as const,
  },
  moj: {
    title: "UAE Ministry of Justice — Federal Decree-Law No. 35 of 2021",
    url: "https://www.moj.gov.ae/",
    provider: "REFERENCE" as const,
  },
  itu: {
    title: "ITU — Global Cybersecurity Index",
    url: "https://www.itu.int/",
    provider: "REFERENCE" as const,
  },
} satisfies Record<string, DossierSource>;

const now = "2026-11-16T08:00:00.000Z";

export const PRESET_DOSSIERS: Array<InstitutionalDossier & { slug: string }> = [
  {
    slug: "national-digital-id-egov-portal",
    schemaVersion: 2,
    isPreset: true,
    entityName: "UAE Pass & Federal E-Government Portal",
    tickerOrRegistry: "Federal programme · TDRA oversight (illustrative)",
    sector: "National digital identity & citizen services",
    jurisdiction: "UAE — Dubai",
    segment: "PUBLIC_SECTOR_INFRA",
    lastUpdatedIso: now,
    executiveSummary:
      "Federal identity programme consolidating citizen records into a single national digital ID and e-government portal, with a new API gateway linking ministries, banks and telecom operators. Pre-development review is still open on API authentication and citizen-data minimisation, while production logs show privileged access to the identity vault is only partially segregated. TDRA resilience requirements and Federal Decree-Law No. 35 of 2021 governance obligations make the next audit cycle decisive for public trust.",
    executiveBriefAudioScript:
      "Good morning. Ahead of your audit scoping for the UAE Pass and Federal E-Government Portal, three control priorities stand out. First, the citizen-facing API gateway is still in design, so the Pre-Development System Audit pillar should lead with authentication, rate-limiting and fraud-by-design controls before the interface is frozen. Second, privileged access to the identity vault is only partially segregated; Post-Development and Fraud Audit should test production log integrity and maker-checker enforcement across ministries. Third, service desk evidence for portal releases is thin, so ISO 20000 governance needs a change and availability baseline. Control maturity sits at 68 percent, with an open findings ratio of 1.6 times and a 42-day mean time to remediate. Lead with the pre-development API review and privileged-access testing.",
    auditPosture: {
      systemCriticalityTier: "Tier-1 National ICT",
      controlMaturityPct: 68,
      openAuditFindingsRatio: 1.6,
      iso20000ComplianceScore: 74,
      meanTimeToRemediateDays: 42,
      auditRiskPosture: "MODERATE_WATCH",
      sourceRefs: [0, 1],
    },
    evidenceFlow: {
      evidenceCollectionDays: 21,
      logRetentionDays: 180,
      findingClosureDays: 48,
      openRiskExposureAEDMillions: 12.4,
      auditToolingMaturity: "Developing — manual evidence packs",
      sourceRefs: [0, 2],
    },
    remediationRoadmap: [
      { period: "2026", findingsToRemediate: 34, workstream: "Pre-Development Control" },
      { period: "2027", findingsToRemediate: 22, workstream: "Fraud & Access Hardening" },
      { period: "2028", findingsToRemediate: 15, workstream: "Post-Development Audit" },
      { period: "2029", findingsToRemediate: 8, workstream: "Pre-Development Control" },
    ],
    preDeploymentCoveragePct: 61,
    regulatoryCoverage: [
      {
        framework: "TDRA national cyber policy",
        coveragePct: 72,
        regulator: "TDRA",
        ecosystemPartner: "UAE Cybersecurity Council",
      },
      {
        framework: "Federal Decree-Law No. 35 of 2021 governance",
        coveragePct: 80,
        regulator: "UAE Ministry of Justice",
        ecosystemPartner: "UAE IAA",
      },
      {
        framework: "ISO/IEC 20000 service management",
        coveragePct: 58,
        regulator: "ISO",
        ecosystemPartner: "Khazna",
      },
      {
        framework: "COBIT 2019 governance objectives",
        coveragePct: 64,
        regulator: "ISACA",
        ecosystemPartner: "UAE IAA",
      },
    ],
    eisaaPillarRouting: [
      {
        pillar: "Pre-Development System Audit",
        recommendedService: "API security & fraud-by-design review",
        triggerSignal: "Citizen API gateway entering design freeze",
        estimatedRiskExposureAED: "AED 18.5M",
        confidenceScore: 88,
        sourceRefs: [0, 1],
      },
      {
        pillar: "Post-Development & Fraud Audit",
        recommendedService: "Production log integrity & privileged-access review",
        triggerSignal: "Identity-vault administrators can self-approve",
        estimatedRiskExposureAED: "AED 12.0M",
        confidenceScore: 84,
        sourceRefs: [1, 2],
      },
      {
        pillar: "ISO 20000 & ITSM Governance",
        recommendedService: "Change & availability management baseline",
        triggerSignal: "Release change records incomplete",
        estimatedRiskExposureAED: "AED 6.4M",
        confidenceScore: 71,
        sourceRefs: [2],
      },
      {
        pillar: "IS Auditor Capacity & Training",
        recommendedService: "TDRA-aligned cloud & API assurance upskilling",
        triggerSignal: "Audit team lacks API assurance coverage",
        estimatedRiskExposureAED: "AED 3.2M",
        confidenceScore: 66,
        sourceRefs: [0, 3],
      },
    ],
    governanceRiskRadar: [
      {
        category: "TDRA / National Cyber Policy",
        severity: "WATCH",
        finding:
          "The portal's public API gateway has no documented rate-limiting or mutual-TLS standard, leaving citizen lookups exposed to enumeration under the TDRA national cyber policy.",
        sourceTitle: REF.insa.title,
        sourceUrl: REF.insa.url,
        searchProvider: "REFERENCE",
      },
      {
        category: "Fraud & Internal Control Risk",
        severity: "CRITICAL",
        finding:
          "Identity-vault administrators can approve their own access changes; maker-checker is enforced on paper but not in the production workflow.",
        sourceTitle: REF.ecysa.title,
        sourceUrl: REF.ecysa.url,
        searchProvider: "REFERENCE",
      },
      {
        category: "Federal Decree-Law No. 35 of 2021 & Governance",
        severity: "INFO",
        finding:
          "Board-level audit committee minutes are current, but the IS audit charter does not yet delegate pre-development sign-off authority.",
        sourceTitle: REF.moj.title,
        sourceUrl: REF.moj.url,
        searchProvider: "REFERENCE",
      },
      {
        category: "ISO 20000 / Service Continuity",
        severity: "WATCH",
        finding:
          "Release change records are incomplete for two of the last five portal deployments, weakening the ISO 20000 change-management evidence trail.",
        sourceTitle: REF.iso20000.title,
        sourceUrl: REF.iso20000.url,
        searchProvider: "REFERENCE",
      },
    ],
    sources: [REF.insa, REF.ecysa, REF.iso20000, REF.egov, REF.cobit, REF.moj],
  },
  {
    slug: "dubai-core-banking-switch",
    schemaVersion: 2,
    isPreset: true,
    entityName: "Emirates NBD Core Banking & UAE Instant Payment Switch",
    tickerOrRegistry: "Consortium programme · CBUAE oversight (illustrative)",
    sector: "Banking core systems & payment switching",
    jurisdiction: "UAE — Dubai",
    segment: "FINANCIAL_CORE_SYSTEMS",
    lastUpdatedIso: now,
    executiveSummary:
      "Consortium replacing a legacy core banking platform and interbank switch, with real-time settlement, mobile wallets and a new reconciliation engine. Post-development transaction audit trails are strong on the retail path but incomplete on the switch, where two operators retain standing production credentials. Segregation of duties and anti-fraud controls across the settlement path are the dominant audit themes for the next cycle.",
    executiveBriefAudioScript:
      "Good morning. Ahead of your audit scoping for the Dubai Core Banking and Interbank Switch programme, three control priorities stand out. First, two switch operators hold standing production database credentials outside the privileged-access vault, so the Post-Development and Fraud Audit pillar should lead with segregation-of-duties and settlement-trail testing. Second, vendor patches reach production without the pre-development gate, so the Pre-Development System Audit should extend the change-design review to third-party releases. Third, disaster-recovery failover has not been exercised for eleven months, well beyond the ISO 20000 continuity expectation. Control maturity is 72 percent, with a 1.1 times open findings ratio and a 28-day mean time to remediate. Lead with privileged-access remediation and switch transaction-trail testing.",
    auditPosture: {
      systemCriticalityTier: "Tier-1 Financial Market",
      controlMaturityPct: 72,
      openAuditFindingsRatio: 1.1,
      iso20000ComplianceScore: 80,
      meanTimeToRemediateDays: 28,
      auditRiskPosture: "MODERATE_WATCH",
      sourceRefs: [0, 1],
    },
    evidenceFlow: {
      evidenceCollectionDays: 18,
      logRetentionDays: 365,
      findingClosureDays: 32,
      openRiskExposureAEDMillions: 9.8,
      auditToolingMaturity: "Defined — SIEM-assisted evidence",
      sourceRefs: [0, 2],
    },
    remediationRoadmap: [
      { period: "2026", findingsToRemediate: 28, workstream: "Post-Development Audit" },
      { period: "2027", findingsToRemediate: 19, workstream: "Fraud & Access Hardening" },
      { period: "2028", findingsToRemediate: 11, workstream: "Post-Development Audit" },
      { period: "2029", findingsToRemediate: 6, workstream: "Pre-Development Control" },
    ],
    preDeploymentCoveragePct: 74,
    regulatoryCoverage: [
      {
        framework: "CBUAE payment system directive",
        coveragePct: 84,
        regulator: "Central Bank of the UAE",
        ecosystemPartner: "UAE IAA",
      },
      {
        framework: "TDRA national cyber policy",
        coveragePct: 76,
        regulator: "TDRA",
        ecosystemPartner: "UAE Cybersecurity Council",
      },
      {
        framework: "ISO/IEC 20000 service management",
        coveragePct: 68,
        regulator: "ISO",
        ecosystemPartner: "Khazna",
      },
      {
        framework: "Federal Decree-Law No. 35 of 2021 governance",
        coveragePct: 80,
        regulator: "UAE Ministry of Justice",
        ecosystemPartner: "UAE IAA",
      },
    ],
    eisaaPillarRouting: [
      {
        pillar: "Post-Development & Fraud Audit",
        recommendedService: "Settlement audit-trail & segregation-of-duties testing",
        triggerSignal: "Standing switch credentials outside the vault",
        estimatedRiskExposureAED: "AED 24.0M",
        confidenceScore: 91,
        sourceRefs: [0, 1],
      },
      {
        pillar: "Pre-Development System Audit",
        recommendedService: "Core upgrade design & patch-gate review",
        triggerSignal: "Vendor patches bypass the pre-development gate",
        estimatedRiskExposureAED: "AED 14.5M",
        confidenceScore: 79,
        sourceRefs: [1, 2],
      },
      {
        pillar: "ISO 20000 & ITSM Governance",
        recommendedService: "Disaster-recovery & change-management assurance",
        triggerSignal: "Failover untested for eleven months",
        estimatedRiskExposureAED: "AED 9.8M",
        confidenceScore: 74,
        sourceRefs: [2],
      },
      {
        pillar: "IS Auditor Capacity & Training",
        recommendedService: "Payment-switch audit simulation programme",
        triggerSignal: "Auditors need switch-level transaction testing",
        estimatedRiskExposureAED: "AED 4.1M",
        confidenceScore: 68,
        sourceRefs: [0, 3],
      },
    ],
    governanceRiskRadar: [
      {
        category: "Fraud & Internal Control Risk",
        severity: "CRITICAL",
        finding:
          "Two switch operators hold standing production database credentials outside the privileged-access vault, breaking segregation of duties on the interbank settlement path.",
        sourceTitle: REF.nbe.title,
        sourceUrl: REF.nbe.url,
        searchProvider: "REFERENCE",
      },
      {
        category: "TDRA / National Cyber Policy",
        severity: "WATCH",
        finding:
          "The switch's network segmentation has not been re-tested since the last core upgrade; TDRA baseline controls require documented re-validation.",
        sourceTitle: REF.insa.title,
        sourceUrl: REF.insa.url,
        searchProvider: "REFERENCE",
      },
      {
        category: "ISO 20000 / Service Continuity",
        severity: "WATCH",
        finding:
          "Disaster-recovery failover for the switch was last exercised eleven months ago, beyond the six-month ISO 20000 service-continuity expectation.",
        sourceTitle: REF.iso20000.title,
        sourceUrl: REF.iso20000.url,
        searchProvider: "REFERENCE",
      },
      {
        category: "Federal Decree-Law No. 35 of 2021 & Governance",
        severity: "INFO",
        finding:
          "Audit committee oversight is in place, but the pre-development gate is applied to new modules only, not to vendor patches.",
        sourceTitle: REF.moj.title,
        sourceUrl: REF.moj.url,
        searchProvider: "REFERENCE",
      },
    ],
    sources: [REF.nbe, REF.insa, REF.iso20000, REF.cobit, REF.ecysa, REF.moj],
  },
  {
    slug: "khazna-cloud-managed-services",
    schemaVersion: 2,
    isPreset: true,
    entityName: "Khazna Cloud & Enterprise Managed Services (ITSM)",
    tickerOrRegistry: "Managed services provider · ISO/IEC 20000 alignment (illustrative)",
    sector: "Cloud hosting & managed IT services",
    jurisdiction: "UAE — Dubai",
    segment: "TELECOM_CLOUD_ITSM",
    lastUpdatedIso: now,
    executiveSummary:
      "Managed cloud and infrastructure provider serving banks, ministries and logistics operators from two Dubai data centres. Multi-tenant isolation and incident-response SLAs are the weakest links: escalation stops at the account manager, export logs are retained for only 30 days, and isolation testing is not documented against TDRA guidance. ISO/IEC 20000 alignment is the natural entry point for a structured service-management audit.",
    executiveBriefAudioScript:
      "Good morning. Ahead of your audit scoping for Khazna Cloud and Enterprise Managed Services, three control priorities stand out. First, incident-response SLAs are breached on multi-tenant outages because escalation stops at the account manager, so the ISO 20000 and ITSM Governance pillar should lead with an incident, problem and change baseline. Second, tenant administrators can export client data without a second approver and export logs vanish after thirty days, so Post-Development and Fraud Audit should test data-export controls and log retention. Third, multi-tenant isolation has not been tested against TDRA segmentation guidance, so the Pre-Development System Audit should review the tenancy design before the next platform release. Control maturity is 64 percent, with a 2.2 times open findings ratio and a 55-day mean time to remediate. Lead with the ISO 20000 incident baseline and tenant-isolation review.",
    auditPosture: {
      systemCriticalityTier: "Tier-2 Enterprise Cloud",
      controlMaturityPct: 64,
      openAuditFindingsRatio: 2.2,
      iso20000ComplianceScore: 66,
      meanTimeToRemediateDays: 55,
      auditRiskPosture: "ELEVATED_REVIEW",
      sourceRefs: [0, 1],
    },
    evidenceFlow: {
      evidenceCollectionDays: 26,
      logRetentionDays: 120,
      findingClosureDays: 61,
      openRiskExposureAEDMillions: 15.2,
      auditToolingMaturity: "Emerging — ticket-based evidence",
      sourceRefs: [0, 2],
    },
    remediationRoadmap: [
      { period: "2026", findingsToRemediate: 41, workstream: "Post-Development Audit" },
      { period: "2027", findingsToRemediate: 27, workstream: "Fraud & Access Hardening" },
      { period: "2028", findingsToRemediate: 18, workstream: "Pre-Development Control" },
      { period: "2029", findingsToRemediate: 9, workstream: "Post-Development Audit" },
    ],
    preDeploymentCoveragePct: 52,
    regulatoryCoverage: [
      {
        framework: "ISO/IEC 20000 service management",
        coveragePct: 66,
        regulator: "ISO",
        ecosystemPartner: "Khazna",
      },
      {
        framework: "TDRA national cyber policy",
        coveragePct: 58,
        regulator: "TDRA",
        ecosystemPartner: "UAE Cybersecurity Council",
      },
      {
        framework: "UAE Cybersecurity Council incident-reporting guidance",
        coveragePct: 61,
        regulator: "UAE Cybersecurity Council",
        ecosystemPartner: "UAE IAA",
      },
      {
        framework: "Federal Decree-Law No. 35 of 2021 governance",
        coveragePct: 72,
        regulator: "UAE Ministry of Justice",
        ecosystemPartner: "UAE IAA",
      },
    ],
    eisaaPillarRouting: [
      {
        pillar: "ISO 20000 & ITSM Governance",
        recommendedService: "Incident, SLA & change-management baseline",
        triggerSignal: "Multi-tenant outage escalation stalls",
        estimatedRiskExposureAED: "AED 16.8M",
        confidenceScore: 90,
        sourceRefs: [0, 1],
      },
      {
        pillar: "Post-Development & Fraud Audit",
        recommendedService: "Tenant data-export & access review",
        triggerSignal: "Exports lack a second approver",
        estimatedRiskExposureAED: "AED 11.2M",
        confidenceScore: 82,
        sourceRefs: [1, 2],
      },
      {
        pillar: "Pre-Development System Audit",
        recommendedService: "Multi-tenant isolation design review",
        triggerSignal: "Isolation not tested against TDRA guidance",
        estimatedRiskExposureAED: "AED 8.6M",
        confidenceScore: 76,
        sourceRefs: [0, 2],
      },
      {
        pillar: "IS Auditor Capacity & Training",
        recommendedService: "ISO 20000 lead-auditor certification track",
        triggerSignal: "Team lacks certified ITSM auditors",
        estimatedRiskExposureAED: "AED 5.0M",
        confidenceScore: 72,
        sourceRefs: [0, 3],
      },
    ],
    governanceRiskRadar: [
      {
        category: "ISO 20000 / Service Continuity",
        severity: "CRITICAL",
        finding:
          "Incident response SLAs are breached on multi-tenant outages because the escalation matrix stops at the account manager rather than the service owner.",
        sourceTitle: REF.iso20000.title,
        sourceUrl: REF.iso20000.url,
        searchProvider: "REFERENCE",
      },
      {
        category: "Fraud & Internal Control Risk",
        severity: "WATCH",
        finding:
          "Tenant administrators can export client data without a second approver, and export logs are retained for only 30 days.",
        sourceTitle: REF.ethiotel.title,
        sourceUrl: REF.ethiotel.url,
        searchProvider: "REFERENCE",
      },
      {
        category: "TDRA / National Cyber Policy",
        severity: "WATCH",
        finding:
          "Multi-tenant isolation testing is not documented against TDRA segmentation guidance, leaving shared-storage boundaries unproven.",
        sourceTitle: REF.insa.title,
        sourceUrl: REF.insa.url,
        searchProvider: "REFERENCE",
      },
      {
        category: "Federal Decree-Law No. 35 of 2021 & Governance",
        severity: "INFO",
        finding:
          "The provider's audit charter covers managed services, but subcontractor assurance is not yet in scope.",
        sourceTitle: REF.moj.title,
        sourceUrl: REF.moj.url,
        searchProvider: "REFERENCE",
      },
    ],
    sources: [REF.iso20000, REF.ethiotel, REF.insa, REF.ecysa, REF.cobit, REF.moj],
  },
  {
    slug: "dpworld-logistics-customs-erp",
    schemaVersion: 2,
    isPreset: true,
    entityName: "DP World Logistics & Customs ERP Integration",
    tickerOrRegistry: "Private-sector ERP · Customs Commission interface (illustrative)",
    sector: "Logistics, supply chain & customs ERP",
    jurisdiction: "UAE — Dubai & GCC trade corridor",
    segment: "ENTERPRISE_ERP_GOV",
    lastUpdatedIso: now,
    executiveSummary:
      "Logistics operator integrating its ERP with customs clearance, freight settlement and GCC trade corridors. Change-management approvals are recorded after deployment, and three active users combine vendor creation with payment release. Procurement fraud prevention and pre-deployment change control are the dominant audit themes, with rollback and continuity evidence missing for two recent integration releases.",
    executiveBriefAudioScript:
      "Good morning. Ahead of your audit scoping for DP World Logistics and Customs ERP Integration, three control priorities stand out. First, change-management approvals are recorded after deployment, so the Pre-Development System Audit pillar should lead with a design review of the customs integration gate and procurement workflow. Second, three active users combine vendor creation with payment release, so Post-Development and Fraud Audit should run procurement-to-payment fraud testing and role-mining. Third, rollback plans are missing for two integration changes and continuity tests skip the customs cut-over window, so ISO 20000 governance should baseline change and continuity evidence. Control maturity is 59 percent, with a 2.8 times open findings ratio and a 63-day mean time to remediate. Lead with the procurement-fraud review and the pre-deployment change gate.",
    auditPosture: {
      systemCriticalityTier: "Tier-2 Enterprise ERP",
      controlMaturityPct: 59,
      openAuditFindingsRatio: 2.8,
      iso20000ComplianceScore: 61,
      meanTimeToRemediateDays: 63,
      auditRiskPosture: "ELEVATED_REVIEW",
      sourceRefs: [0, 1],
    },
    evidenceFlow: {
      evidenceCollectionDays: 31,
      logRetentionDays: 90,
      findingClosureDays: 70,
      openRiskExposureAEDMillions: 18.6,
      auditToolingMaturity: "Manual — spreadsheet-based evidence",
      sourceRefs: [0, 2],
    },
    remediationRoadmap: [
      { period: "2026", findingsToRemediate: 46, workstream: "Pre-Development Control" },
      { period: "2027", findingsToRemediate: 31, workstream: "Fraud & Access Hardening" },
      { period: "2028", findingsToRemediate: 20, workstream: "Post-Development Audit" },
      { period: "2029", findingsToRemediate: 10, workstream: "Pre-Development Control" },
    ],
    preDeploymentCoveragePct: 44,
    regulatoryCoverage: [
      {
        framework: "Customs Commission integration directive",
        coveragePct: 63,
        regulator: "UAE Customs Commission",
        ecosystemPartner: "UAE IAA",
      },
      {
        framework: "Federal Decree-Law No. 35 of 2021 governance",
        coveragePct: 70,
        regulator: "UAE Ministry of Justice",
        ecosystemPartner: "UAE IAA",
      },
      {
        framework: "ISO/IEC 20000 service management",
        coveragePct: 54,
        regulator: "ISO",
        ecosystemPartner: "Khazna",
      },
      {
        framework: "TDRA national cyber policy",
        coveragePct: 49,
        regulator: "TDRA",
        ecosystemPartner: "UAE Cybersecurity Council",
      },
    ],
    eisaaPillarRouting: [
      {
        pillar: "Pre-Development System Audit",
        recommendedService: "Change-management & procurement design review",
        triggerSignal: "Approvals recorded after deployment",
        estimatedRiskExposureAED: "AED 21.0M",
        confidenceScore: 87,
        sourceRefs: [0, 1],
      },
      {
        pillar: "Post-Development & Fraud Audit",
        recommendedService: "Procurement-to-payment fraud testing",
        triggerSignal: "Three users combine vendor creation & payment release",
        estimatedRiskExposureAED: "AED 19.5M",
        confidenceScore: 85,
        sourceRefs: [1, 2],
      },
      {
        pillar: "ISO 20000 & ITSM Governance",
        recommendedService: "Rollback & continuity assurance",
        triggerSignal: "Rollback plans missing for integration changes",
        estimatedRiskExposureAED: "AED 7.9M",
        confidenceScore: 69,
        sourceRefs: [2],
      },
      {
        pillar: "IS Auditor Capacity & Training",
        recommendedService: "ERP access-matrix audit workshop",
        triggerSignal: "Auditors need ERP role-mining skills",
        estimatedRiskExposureAED: "AED 4.4M",
        confidenceScore: 70,
        sourceRefs: [0, 3],
      },
    ],
    governanceRiskRadar: [
      {
        category: "Fraud & Internal Control Risk",
        severity: "CRITICAL",
        finding:
          "Procurement-to-payment roles in the customs ERP can be held by the same user, and three active accounts combine vendor creation with payment release.",
        sourceTitle: REF.customs.title,
        sourceUrl: REF.customs.url,
        searchProvider: "REFERENCE",
      },
      {
        category: "Federal Decree-Law No. 35 of 2021 & Governance",
        severity: "WATCH",
        finding:
          "Change-management approvals are recorded after deployment for customs integration releases, so the pre-development control gate is not evidenced.",
        sourceTitle: REF.moj.title,
        sourceUrl: REF.moj.url,
        searchProvider: "REFERENCE",
      },
      {
        category: "TDRA / National Cyber Policy",
        severity: "WATCH",
        finding:
          "The customs interface exchanges declarations over a legacy channel without current TDRA-aligned encryption evidence.",
        sourceTitle: REF.insa.title,
        sourceUrl: REF.insa.url,
        searchProvider: "REFERENCE",
      },
      {
        category: "ISO 20000 / Service Continuity",
        severity: "WATCH",
        finding:
          "Rollback plans are missing for two ERP integration changes, and service-continuity tests do not cover the customs cut-over window.",
        sourceTitle: REF.iso20000.title,
        sourceUrl: REF.iso20000.url,
        searchProvider: "REFERENCE",
      },
    ],
    sources: [REF.customs, REF.insa, REF.iso20000, REF.moj, REF.cobit, REF.ecysa],
  },
];

export function findPreset(slug: string | undefined) {
  if (!slug) return undefined;
  return PRESET_DOSSIERS.find((d) => d.slug === slug);
}
