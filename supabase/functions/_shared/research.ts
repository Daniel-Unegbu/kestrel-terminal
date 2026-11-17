import type { DossierSource, InstitutionalDossier } from "./dossier.ts";
import { generatedDossierSchema } from "./dossier-schema.ts";
import { generateJson } from "./gemini.ts";
import { tavilySearch } from "./tavily.ts";

export interface RetrievedDoc extends DossierSource {
  snippet: string;
}

/** Deep financial research for one entity, Tavily only. */
export async function retrieve(query: string): Promise<RetrievedDoc[]> {
  const docs = await tavilySearch(
    `${query} financial performance revenue EBITDA debt sukuk expansion UAE MENA`,
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

const SYSTEM = `You are a senior credit analyst in First Abu Dhabi Bank's Wholesale Banking and IB&M coverage team.
You turn retrieved web sources into a strict JSON institutional dossier. Rules:
- Ground every figure in the numbered SOURCES. If a figure is not disclosed, give a conservative analyst estimate and keep it plausible; never invent sources.
- sourceRefs / sourceIndex are 0-based indexes into SOURCES.
- Amounts in AED (convert USD at 3.6725).
- executiveBriefAudioScript: a crisp ~140 word (60 second) spoken morning-call brief for a Relationship Manager. Start with "Good morning. Ahead of your coverage meeting with <entity>, three capital triggers stand out." Name the FAB division that should lead. No markdown, no bullets, no citations read aloud.
- debtMaturityProfile: exactly the years 2026, 2027, 2028, 2029.
- fabDivisionRouting: 3-4 items, divisions only from: Global Corporate Finance, Global Transaction Banking, Global Markets, FAB Siraj Islamic Banking.
- complianceAndRiskRadar: 2-4 items, categories only from: "CBUAE / Regulatory", "Sanctions & Adverse Media", "FX & Corridor Risk", "ESG / Transition Finance".
Return JSON only with this shape:
{"entityName":string,"tickerOrRegistry":string,"sector":string,"jurisdiction":string,"segment":"GRE_SOVEREIGN"|"IBM_CORPORATE"|"FINANCIAL_INSTITUTION"|"COMMERCIAL_SME","executiveSummary":string,"executiveBriefAudioScript":string,
"financialMetrics":{"estimatedRevenueAED":string,"ebitdaMarginPct":number,"netDebtToEbitda":number,"interestCoverageRatio":number,"cashConversionCycleDays":number,"creditRiskRating":"LOW_RISK"|"MODERATE_WATCH"|"ELEVATED_REVIEW","sourceRefs":number[]},
"workingCapital":{"dsoDays":number,"dioDays":number,"dpoDays":number,"trappedLiquidityAEDMillions":number,"tradeFinanceVelocity":string,"sourceRefs":number[]},
"debtMaturityProfile":[{"year":string,"maturingDebtAEDMillions":number,"instrumentType":"Syndicated Loan"|"Sukuk / Bond"|"Trade Facility"}],
"bondIssuanceProbabilityPct":number,
"corridors":[{"corridor":string,"flowSharePct":number,"fxPair":string,"fabHub":string}],
"fabDivisionRouting":[{"division":string,"recommendedProduct":string,"triggerSignal":string,"estimatedFeePoolAED":string,"confidenceScore":number,"sourceRefs":number[]}],
"complianceAndRiskRadar":[{"category":string,"severity":"INFO"|"WATCH"|"CRITICAL","finding":string,"sourceIndex":number}]}`;

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
    entityName: parsed.entityName || entity,
    lastUpdatedIso: new Date().toISOString(),
    financialMetrics: {
      ...parsed.financialMetrics,
      sourceRefs: cleanRefs(parsed.financialMetrics.sourceRefs),
    },
    workingCapital: {
      ...parsed.workingCapital,
      sourceRefs: cleanRefs(parsed.workingCapital.sourceRefs),
    },
    fabDivisionRouting: parsed.fabDivisionRouting.map((route) => ({
      ...route,
      confidenceScore: Math.max(0, Math.min(100, Math.round(route.confidenceScore))),
      sourceRefs: cleanRefs(route.sourceRefs),
    })),
    complianceAndRiskRadar: parsed.complianceAndRiskRadar.map((item) => {
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
