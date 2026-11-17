import type { DossierSource, InstitutionalDossier } from "./dossier.ts";
import { generatedDossierSchema } from "./dossier-schema.ts";
import { generateJson } from "./gemini.ts";

export interface RetrievedDoc extends DossierSource {
  snippet: string;
}

export async function tavilySearch(query: string): Promise<RetrievedDoc[]> {
  const key = Deno.env.get("TAVILY_API_KEY");
  if (!key) return [];

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      query,
      search_depth: "advanced",
      max_results: 8,
      include_answer: false,
    }),
  });

  if (!res.ok) {
    console.error("Tavily error", res.status, await res.text().catch(() => ""));
    return [];
  }

  const json = (await res.json()) as {
    results?: Array<{ title?: string; url?: string; content?: string }>;
  };

  return (json.results ?? [])
    .filter((result) => result.url)
    .map((result) => ({
      title: result.title ?? result.url!,
      url: result.url!,
      snippet: (result.content ?? "").slice(0, 900),
      provider: "RESEARCH" as const,
    }));
}

export async function serpSearch(query: string): Promise<RetrievedDoc[]> {
  const key = Deno.env.get("SERPAPI_API_KEY");
  if (!key) return [];

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_news");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", key);

  const res = await fetch(url);
  if (!res.ok) {
    console.error("SerpAPI error", res.status);
    return [];
  }

  const json = (await res.json()) as {
    news_results?: Array<{
      title?: string;
      link?: string;
      snippet?: string;
      source?: { name?: string };
    }>;
  };

  return (json.news_results ?? [])
    .filter((result) => result.link)
    .slice(0, 6)
    .map((result) => ({
      title: result.title ?? result.link!,
      url: result.link!,
      snippet: (result.snippet ?? result.source?.name ?? "").slice(0, 600),
      provider: "SEARCH" as const,
    }));
}

export async function retrieve(entity: string): Promise<RetrievedDoc[]> {
  const query = `${entity} financial results debt bonds sukuk refinancing expansion news`;
  const [primary, sanctions] = await Promise.all([
    tavilySearch(query),
    tavilySearch(`${entity} regulatory sanctions ESG news`),
  ]);

  let docs = dedupe([...primary, ...sanctions]);
  if (docs.length < 4) {
    docs = dedupe([...docs, ...(await serpSearch(entity))]);
  }
  return docs.slice(0, 12);
}

function dedupe(docs: RetrievedDoc[]) {
  const seen = new Set<string>();
  return docs.filter((doc) => (seen.has(doc.url) ? false : (seen.add(doc.url), true)));
}

const SYSTEM = `You are a senior credit analyst in First Abu Dhabi Bank's Wholesale Banking and IB&M coverage team.
You turn retrieved web sources into a strict JSON institutional dossier. Rules:
- Ground every figure in the numbered SOURCES. If a figure is not disclosed, give a conservative analyst estimate and keep it plausible; never invent sources.
- sourceRefs / sourceIndex are 0-based indexes into SOURCES.
- Amounts in AED (convert USD at 3.6725).
- executiveBriefAudioScript: ~140 words, spoken morning-call style, starting "Good morning. Ahead of your coverage meeting with <entity>, three capital triggers stand out." Mention which FAB division should lead.
- debtMaturityProfile: exactly years 2026, 2027, 2028, 2029.
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

export async function synthesize(
  entity: string,
  docs: RetrievedDoc[],
  deep: boolean,
): Promise<InstitutionalDossier> {
  const sourcesBlock = docs
    .map((doc, index) => `[${index}] ${doc.title}\nURL: ${doc.url}\n${doc.snippet}`)
    .join("\n\n");

  const parsed = generatedDossierSchema.parse(
    await generateJson({
      system: SYSTEM,
      user: `ENTITY: ${entity}\n\nSOURCES:\n${sourcesBlock || "(no sources retrieved)"}\n\nReturn the dossier JSON.`,
      deep,
      temperature: 0.3,
    }),
  );

  const maxRef = docs.length - 1;
  const cleanRefs = (refs?: number[]) => refs?.filter((n) => n >= 0 && n <= maxRef);

  return {
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
}
