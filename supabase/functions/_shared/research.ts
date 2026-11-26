import type { DossierSource, InstitutionalDossier } from "./dossier.ts";
import { generatedDossierSchema } from "./dossier-schema.ts";
import { generateJson } from "./gemini.ts";
import { tavilySearch } from "./tavily.ts";

export interface RetrievedDoc extends DossierSource {
  snippet: string;
}

/** Deep IS audit research for one system, Tavily only. */
export async function retrieve(query: string): Promise<RetrievedDoc[]> {
  const docs = await tavilySearch(
    `${query} UAE ICT infrastructure cybersecurity IS audit governance TDRA ISO 20000 digital transformation`,
    8,
  );

  const seen = new Set<string>();
  return docs
    .filter((doc) => (seen.has(doc.url) ? false : (seen.add(doc.url), true)))
    .slice(0, 8)
    .map((doc) => ({
      title: doc.title,
      url: doc.url,
      snippet: doc.content,
      provider: "RESEARCH" as const,
    }));
}

const SYSTEM = `You are a Lead Information Systems (IS) Auditor and IT Governance Specialist supporting the UAE Information System Audit Association (UAE IAA).
You turn retrieved web sources into a strict JSON IS audit dossier. Rules:
- Ground every figure and finding in the numbered SOURCES. If a figure is not disclosed, give a conservative auditor estimate and keep it plausible; never invent sources.
- sourceRefs / sourceIndex are 0-based indexes into SOURCES.
- Amounts in UAE dirhams (AED). Convert USD at a reasonable reference rate and present uncertain figures as estimates.
- executiveBriefAudioScript: a crisp ~140 word (60 second) spoken morning-call brief for the Lead IS Auditor. Start with "Good morning. Ahead of your audit scoping for <entity>, three control priorities stand out." Name the UAE IAA pillar that should lead. No markdown, no bullets, no citations read aloud.
- remediationRoadmap: exactly the periods 2026, 2027, 2028, 2029.
- eisaaPillarRouting: 3-4 items, pillars only from: Pre-Development System Audit, Post-Development & Fraud Audit, ISO 20000 & ITSM Governance, IS Auditor Capacity & Training.
- governanceRiskRadar: 2-4 items, categories only from: "TDRA / National Cyber Policy", "Federal Decree-Law No. 35 of 2021 & Governance", "Fraud & Internal Control Risk", "ISO 20000 / Service Continuity".
Return JSON only with this shape:
{"entityName":string,"tickerOrRegistry":string,"sector":string,"jurisdiction":string,"segment":"PUBLIC_SECTOR_INFRA"|"FINANCIAL_CORE_SYSTEMS"|"TELECOM_CLOUD_ITSM"|"ENTERPRISE_ERP_GOV","executiveSummary":string,"executiveBriefAudioScript":string,
"auditPosture":{"systemCriticalityTier":string,"controlMaturityPct":number,"openAuditFindingsRatio":number,"iso20000ComplianceScore":number,"meanTimeToRemediateDays":number,"auditRiskPosture":"LOW_RISK"|"MODERATE_WATCH"|"ELEVATED_REVIEW","sourceRefs":number[]},
"evidenceFlow":{"evidenceCollectionDays":number,"logRetentionDays":number,"findingClosureDays":number,"openRiskExposureAEDMillions":number,"auditToolingMaturity":string,"sourceRefs":number[]},
"remediationRoadmap":[{"period":string,"findingsToRemediate":number,"workstream":"Pre-Development Control"|"Post-Development Audit"|"Fraud & Access Hardening"}],
"preDeploymentCoveragePct":number,
"regulatoryCoverage":[{"framework":string,"coveragePct":number,"regulator":string,"ecosystemPartner":string}],
"eisaaPillarRouting":[{"pillar":string,"recommendedService":string,"triggerSignal":string,"estimatedRiskExposureAED":string,"confidenceScore":number,"sourceRefs":number[]}],
"governanceRiskRadar":[{"category":string,"severity":"INFO"|"WATCH"|"CRITICAL","finding":string,"sourceIndex":number}]}`;

export interface SynthesisResult {
  dossier: InstitutionalDossier;
  /** Model that produced the dossier (may be a fallback). */
  model: string;
}

export async function synthesize(
  entity: string,
  docs: RetrievedDoc[],
  deep: boolean,
): Promise<SynthesisResult> {
  const sourcesBlock = docs
    .map((doc, index) => `[${index}] ${doc.title}\nURL: ${doc.url}\n${doc.snippet}`)
    .join("\n\n");

  const generated = await generateJson({
    system: SYSTEM,
    user: `ENTITY: ${entity}\n\nSOURCES:\n${sourcesBlock || "(no sources retrieved)"}\n\nReturn the dossier JSON.`,
    deep,
    temperature: 0.3,
  });

  const parsed = generatedDossierSchema.parse(generated.data);

  const maxRef = docs.length - 1;
  const cleanRefs = (refs?: number[]) => refs?.filter((n) => n >= 0 && n <= maxRef);

  const dossier: InstitutionalDossier = {
    ...parsed,
    schemaVersion: 2,
    entityName: parsed.entityName || entity,
    lastUpdatedIso: new Date().toISOString(),
    auditPosture: {
      ...parsed.auditPosture,
      sourceRefs: cleanRefs(parsed.auditPosture.sourceRefs),
    },
    evidenceFlow: {
      ...parsed.evidenceFlow,
      sourceRefs: cleanRefs(parsed.evidenceFlow.sourceRefs),
    },
    eisaaPillarRouting: parsed.eisaaPillarRouting.map((route) => ({
      ...route,
      confidenceScore: Math.max(0, Math.min(100, Math.round(route.confidenceScore))),
      sourceRefs: cleanRefs(route.sourceRefs),
    })),
    governanceRiskRadar: parsed.governanceRiskRadar.map((item) => {
      const source = item.sourceIndex != null ? docs[item.sourceIndex] : undefined;
      return {
        category: item.category,
        severity: item.severity,
        finding: item.finding,
        sourceTitle: source?.title ?? "No direct source",
        sourceUrl: source?.url ?? "",
        searchProvider: source?.provider ?? ("REFERENCE" as const),
      };
    }),
    sources: docs.map(({ title, url, provider }) => ({ title, url, provider })),
  };

  return { dossier, model: generated.model };
}
