/**
 * Deterministic Deal Desk answers.
 *
 * The Deal Desk path is SerpAPI-only, so a web snippet is the only thing it can
 * quote. That cannot answer questions about *this* client's file ("which FAB
 * division should lead?") and Google has no answer box for them either. When a
 * question asks for analysis the dossier already holds, the answer is assembled
 * from those researched facts verbatim; SerpAPI is not called at all, and the
 * citations come from the dossier.
 */

export interface DossierRisk {
  category?: string;
  severity?: string;
  finding?: string;
  sourceUrl?: string;
}

export interface DossierDebt {
  year?: string;
  maturingDebtAEDMillions?: number;
  instrumentType?: string;
}

export interface DossierDivision {
  division?: string;
  recommendedProduct?: string;
  triggerSignal?: string;
  estimatedFeePoolAED?: string;
  confidenceScore?: number;
}

export interface DealDeskDossier {
  entityName?: string;
  complianceAndRiskRadar?: DossierRisk[];
  debtMaturityProfile?: DossierDebt[];
  fabDivisionRouting?: DossierDivision[];
}

export interface DealDeskComposition {
  answerText: string;
  /** Shorter narrative for the voice relay, so the lead division is never cut. */
  spokenText: string;
  /** Dossier sources backing this answer; the client maps them to source refs. */
  sourceUrls: string[];
}

const INTENT = {
  risk: /\b(risk|risks|risky|exposure|exposures|compliance|regulatory|covenants?|downgrades?|headwinds?)\b/i,
  fx: /\b(fx|forex|currenc(?:y|ies)|corridors?|hedg\w*|convertibility|devaluation)\b/i,
  refinancing: /\b(refinanc\w*|maturit(?:y|ies)|repayment|roll[- ]?over|debt wall)\b/i,
  debt: /\b(debt|sukuk|bonds?|issuance|facilit(?:y|ies)|repay\w*|leverage|capital)\b/i,
  division: /\b(divisions?|team|coverage|route|routing|lead|owner|pitch|product)\b/i,
  profile: /\b(who|what|describe|background|overview|profile|about)\b/i,
};

const SEVERITY_RANK: Record<string, number> = { CRITICAL: 0, WATCH: 1, INFO: 2 };

function words(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function relevance(text: string, tokens: string[]): number {
  const haystack = text.toLowerCase();
  return tokens.reduce((score, token) => (haystack.includes(token) ? score + 1 : score), 0);
}

/** Findings already end with a full stop, so only add one when it is missing. */
function sentence(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function clamp(value: string, limit: number): string {
  if (value.length <= limit) return value;
  const slice = value.slice(0, limit);
  const cut = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("; "), slice.lastIndexOf(", "));
  return `${(cut > limit * 0.5 ? slice.slice(0, cut) : slice).trimEnd()}…`;
}

function formatAed(millions: number | undefined): string | null {
  if (typeof millions !== "number" || !Number.isFinite(millions) || millions <= 0) return null;
  if (millions >= 1000) return `AED ${(millions / 1000).toFixed(2).replace(/\.?0+$/, "")}B`;
  return `AED ${Math.round(millions)}M`;
}

function riskParagraph(dossier: DealDeskDossier, tokens: string[]): string | null {
  const entity = dossier.entityName?.trim() || "this client";
  const risks = (dossier.complianceAndRiskRadar ?? [])
    .filter((risk) => !!risk.finding)
    .sort((a, b) => {
      const severity =
        (SEVERITY_RANK[a.severity ?? ""] ?? 3) - (SEVERITY_RANK[b.severity ?? ""] ?? 3);
      if (severity !== 0) return severity;
      const text = (risk: DossierRisk) => `${risk.category ?? ""} ${risk.finding ?? ""}`;
      return relevance(text(b), tokens) - relevance(text(a), tokens);
    })
    .slice(0, 2);

  if (risks.length === 0) return null;

  const lead = risks.length === 1 ? "The main risk" : "Two risks";
  const [first, second] = risks;

  const firstLine = `${lead} stand out for ${entity}${
    risks.length === 1 ? "s" : ""
  } — ${first.category ?? "Risk"}, ${first.severity ?? "WATCH"}: ${clamp(
    sentence(first.finding ?? ""),
    220,
  )}`;

  if (!second) return firstLine;

  return `${firstLine} Second, ${second.category ?? "Risk"}, ${
    second.severity ?? "WATCH"
  }: ${clamp(sentence(second.finding ?? ""), 220)}`;
}

function debtParagraph(dossier: DealDeskDossier): string | null {
  const entity = dossier.entityName?.trim() || "this client";
  const maturities = [...(dossier.debtMaturityProfile ?? [])]
    .filter((item) => typeof item.maturingDebtAEDMillions === "number")
    .sort((a, b) => (b.maturingDebtAEDMillions ?? 0) - (a.maturingDebtAEDMillions ?? 0))
    .slice(0, 2);

  if (maturities.length === 0) return null;

  const stack = maturities
    .map((item) => {
      const amount = formatAed(item.maturingDebtAEDMillions);
      if (!amount) return null;
      return `${amount} of ${(item.instrumentType ?? "debt").toLowerCase()} in ${item.year ?? "the coming year"}`;
    })
    .filter(Boolean);

  if (stack.length === 0) return null;

  return `On refinancing, ${entity} faces ${stack.join(", and the next largest is ")}.`;
}

function divisionParagraph(dossier: DealDeskDossier): string | null {
  const divisions = (dossier.fabDivisionRouting ?? []).filter((item) => !!item.division);
  if (divisions.length === 0) return null;

  const lead = [...divisions].sort(
    (a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0),
  )[0];
  if (!lead?.division) return null;

  const details: string[] = [];
  if (lead.recommendedProduct) details.push(lead.recommendedProduct.toLowerCase());
  if (lead.triggerSignal) details.push(`triggered by ${lead.triggerSignal}`);
  if (lead.estimatedFeePoolAED) details.push(`a fee pool of about ${lead.estimatedFeePoolAED}`);
  if (typeof lead.confidenceScore === "number") {
    details.push(`${lead.confidenceScore}% confidence`);
  }

  const tail = details.length ? ` — ${details.join(", ")}` : "";

  return `${lead.division} should lead this client${tail}.`;
}

function wantsDivision(question: string): boolean {
  return INTENT.division.test(question);
}

function wantsRisk(question: string): boolean {
  return INTENT.risk.test(question) || INTENT.fx.test(question) || INTENT.refinancing.test(question);
}

/**
 * Returns `null` when the question is not answerable from the dossier, so the
 * caller falls through to SerpAPI.
 */
export function composeDealDeskAnswer(
  question: string,
  dossier: DealDeskDossier | undefined,
): DealDeskComposition | null {
  if (!dossier) return null;
  if (!question || question.trim().length < 2) return null;

  const tokens = words(question).filter((token) => token.length > 3);
  const parts: string[] = [];

  if (wantsRisk(question)) {
    const risk = riskParagraph(dossier, tokens);
    if (risk) parts.push(risk);
    // Only add the maturity wall when the risk radar did not already cover it.
    if (INTENT.refinancing.test(question) || INTENT.debt.test(question)) {
      const covered = parts.some((part) => /matur|refinanc|sukuk|bond/i.test(part));
      if (!covered) {
        const debt = debtParagraph(dossier);
        if (debt) parts.push(debt);
      }
    }
  } else if (INTENT.debt.test(question) || INTENT.refinancing.test(question)) {
    const debt = debtParagraph(dossier);
    if (debt) parts.push(debt);
  }

  if (wantsDivision(question)) {
    const division = divisionParagraph(dossier);
    if (division) parts.push(division);
  }

  if (parts.length === 0) return null;

  const answerText = parts.join(" ");
  const spokenText = clamp(answerText, 300);

  const sourceUrls = (dossier.complianceAndRiskRadar ?? [])
    .map((risk) => risk.sourceUrl)
    .filter((url): url is string => !!url);

  return { answerText, spokenText, sourceUrls };
}
