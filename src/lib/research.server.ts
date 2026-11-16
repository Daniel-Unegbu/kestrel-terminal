import { generateChatCompletion } from "@lovable.dev/ai-gateway";
import type { DossierSource, InstitutionalDossier } from "./dossier";
import { generatedDossierSchema } from "./dossier-schema";

export interface RetrievedDoc extends DossierSource {
  snippet: string;
}

export async function tavilySearch(query: string): Promise<RetrievedDoc[]> {
  const key = process.env["TAVILY_API_KEY"];
  if (!key) return [];
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query, search_depth: "advanced", max_results: 8, include_answer: false }),
  });
  if (!res.ok) {
    console.error("Tavily error", res.status, await res.text().catch(() => ""));
    return [];
  }
  const json = (await res.json()) as { results?: Array<{ title?: string; url?: string; content?: string }> };
  return (json.results ?? [])
    .filter((r) => r.url)
    .map((r) => ({ title: r.title ?? r.url!, url: r.url!, snippet: (r.content ?? "").slice(0, 900), provider: "TAVILY" as const }));
}

export async function serpSearch(query: string): Promise<RetrievedDoc[]> {
  const key = process.env["SERPAPI_API_KEY"];
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
    news_results?: Array<{ title?: string; link?: string; snippet?: string; source?: { name?: string } }>;
  };
  return (json.news_results ?? [])
    .filter((r) => r.link)
    .slice(0, 6)
    .map((r) => ({
      title: r.title ?? r.link!,
      url: r.link!,
      snippet: (r.snippet ?? r.source?.name ?? "").slice(0, 600),
      provider: "SERPAPI" as const,
    }));
}

export async function retrieve(entity: string): Promise<RetrievedDoc[]> {
  const q = `${entity} financial results debt bonds sukuk refinancing expansion news`;
  const [primary, sanctions] = await Promise.all([
    tavilySearch(q),
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
  return docs.filter((d) => (seen.has(d.url) ? false : (seen.add(d.url), true)));
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
    .map((d, i) => `[${i}] ${d.title}\nURL: ${d.url}\n${d.snippet}`)
    .join("\n\n");
  const messages = [
    { role: "system" as const, content: SYSTEM },
    { role: "user" as const, content: `ENTITY: ${entity}\n\nSOURCES:\n${sourcesBlock || "(no sources retrieved)"}\n\nReturn the dossier JSON.` },
  ];
  const response = deep
    ? await generateChatCompletion({ model: "google/gemini-3.1-pro-preview", messages, response_format: { type: "json_object" } })
    : await generateChatCompletion({ model: "google/gemini-3.8-flash", messages, response_format: { type: "json_object" } });

  const raw = extractText(response.choices?.[0]?.message?.content);
  const parsed = generatedDossierSchema.parse(JSON.parse(stripFences(raw)));
  const maxRef = docs.length - 1;
  const cleanRefs = (r?: number[]) => r?.filter((n) => n >= 0 && n <= maxRef);

  return {
    ...parsed,
    entityName: parsed.entityName || entity,
    lastUpdatedIso: new Date().toISOString(),
    financialMetrics: { ...parsed.financialMetrics, sourceRefs: cleanRefs(parsed.financialMetrics.sourceRefs) },
    workingCapital: { ...parsed.workingCapital, sourceRefs: cleanRefs(parsed.workingCapital.sourceRefs) },
    fabDivisionRouting: parsed.fabDivisionRouting.map((r) => ({
      ...r,
      confidenceScore: Math.max(0, Math.min(100, Math.round(r.confidenceScore))),
      sourceRefs: cleanRefs(r.sourceRefs),
    })),
    complianceAndRiskRadar: parsed.complianceAndRiskRadar.map((c) => {
      const src = c.sourceIndex != null ? docs[c.sourceIndex] : undefined;
      return {
        category: c.category,
        severity: c.severity,
        finding: c.finding,
        sourceTitle: src?.title ?? "No direct source",
        sourceUrl: src?.url ?? "",
        searchProvider: src?.provider ?? "REFERENCE",
      };
    }),
    sources: docs.map(({ title, url, provider }) => ({ title, url, provider })),
  };
}

export function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((p) => (p && typeof p === "object" && "text" in p ? String((p as { text: unknown }).text) : ""))
      .join("");
  }
  return "";
}

export function stripFences(s: string) {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}
