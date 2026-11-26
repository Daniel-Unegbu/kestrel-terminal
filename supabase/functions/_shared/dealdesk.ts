/**
 * Deterministic AuditDesk answers.
 *
 * The AuditDesk path is SerpAPI-only, so a web snippet is the only thing it can
 * quote. That cannot answer questions about *this* system's audit file ("which
 * UAE IAA pillar should lead?") and Google has no answer box for them either. When
 * a question asks for analysis the dossier already holds, the answer is
 * assembled from those researched facts verbatim; SerpAPI is not called at all,
 * and the citations come from the dossier.
 */

export interface DossierRisk {
  category?: string;
  severity?: string;
  finding?: string;
  sourceUrl?: string;
}

export interface DossierRemediation {
  period?: string;
  findingsToRemediate?: number;
  workstream?: string;
}

export interface DossierPillarRoute {
  pillar?: string;
  recommendedService?: string;
  triggerSignal?: string;
  estimatedRiskExposureAED?: string;
  confidenceScore?: number;
}

export interface DealDeskDossier {
  entityName?: string;
  governanceRiskRadar?: DossierRisk[];
  remediationRoadmap?: DossierRemediation[];
  eisaaPillarRouting?: DossierPillarRoute[];
}

export interface DealDeskComposition {
  answerText: string;
  /** Shorter narrative for the voice relay, so the lead pillar is never cut. */
  spokenText: string;
  /** Dossier sources backing this answer; the client maps them to source refs. */
  sourceUrls: string[];
}

const INTENT = {
  risk: /\b(risk|risks|risky|exposure|exposures|compliance|regulatory|control|controls|findings?|gaps?|weakness\w*)\b/i,
  cyber: /\b(insa|ecysa|cyber|security|breach|incident|vulnerab\w*|threat\w*)\b/i,
  fraud: /\b(fraud|segregation|maker[- ]checker|access|privileg\w*|misappropriat\w*)\b/i,
  remediation: /\b(remediat\w*|closure|close|roadmap|fix|fixes|timeline|backlog)\b/i,
  itsm: /\b(iso ?20000|itsm|service management|incident|change|continuity|sla)\b/i,
  pillar: /\b(pillars?|divisions?|team|coverage|route|routing|lead|owner|audit type|service)\b/i,
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

function riskParagraph(dossier: DealDeskDossier, tokens: string[]): string | null {
  const entity = dossier.entityName?.trim() || "this system";
  const risks = (dossier.governanceRiskRadar ?? [])
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

  const lead = risks.length === 1 ? "The main control gap" : "Two control gaps";
  const [first, second] = risks;

  const firstLine = `${lead} stand out for ${entity}${
    risks.length === 1 ? "s" : ""
  } — ${first.category ?? "Control risk"}, ${first.severity ?? "WATCH"}: ${clamp(
    sentence(first.finding ?? ""),
    220,
  )}`;

  if (!second) return firstLine;

  return `${firstLine} Second, ${second.category ?? "Control risk"}, ${
    second.severity ?? "WATCH"
  }: ${clamp(sentence(second.finding ?? ""), 220)}`;
}

function remediationParagraph(dossier: DealDeskDossier): string | null {
  const entity = dossier.entityName?.trim() || "this system";
  const years = [...(dossier.remediationRoadmap ?? [])]
    .filter((item) => typeof item.findingsToRemediate === "number")
    .sort((a, b) => (a.period ?? "").localeCompare(b.period ?? ""))
    .slice(0, 3);

  if (years.length === 0) return null;

  const stack = years
    .map((item) => {
      const count = Math.round(item.findingsToRemediate ?? 0);
      if (!Number.isFinite(count) || count <= 0) return null;
      const workstream = (item.workstream ?? "control hardening").toLowerCase();
      return `${count} findings in ${item.period ?? "the coming cycle"} under ${workstream}`;
    })
    .filter((value): value is string => !!value);

  if (stack.length === 0) return null;

  return `On remediation, ${entity} is tracking ${stack.join("; ")}.`;
}

function pillarParagraph(dossier: DealDeskDossier): string | null {
  const routes = (dossier.eisaaPillarRouting ?? []).filter((item) => !!item.pillar);
  if (routes.length === 0) return null;

  const lead = [...routes].sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0))[0];
  if (!lead?.pillar) return null;

  const details: string[] = [];
  if (lead.recommendedService) details.push(lead.recommendedService.toLowerCase());
  if (lead.triggerSignal) details.push(`triggered by ${lead.triggerSignal}`);
  if (lead.estimatedRiskExposureAED) {
    details.push(`risk exposure of about ${lead.estimatedRiskExposureAED}`);
  }
  if (typeof lead.confidenceScore === "number") {
    details.push(`${lead.confidenceScore}% confidence`);
  }

  const tail = details.length ? ` — ${details.join(", ")}` : "";

  return `${lead.pillar} should lead this audit${tail}.`;
}

function wantsPillar(question: string): boolean {
  return INTENT.pillar.test(question);
}

function wantsRisk(question: string): boolean {
  return (
    INTENT.risk.test(question) ||
    INTENT.cyber.test(question) ||
    INTENT.fraud.test(question) ||
    INTENT.itsm.test(question)
  );
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
    // Only add the remediation roadmap when the radar did not already cover it.
    if (INTENT.remediation.test(question)) {
      const covered = parts.some((part) => /remediat|roadmap|closure/i.test(part));
      if (!covered) {
        const roadmap = remediationParagraph(dossier);
        if (roadmap) parts.push(roadmap);
      }
    }
  } else if (INTENT.remediation.test(question)) {
    const roadmap = remediationParagraph(dossier);
    if (roadmap) parts.push(roadmap);
  }

  if (wantsPillar(question)) {
    const pillar = pillarParagraph(dossier);
    if (pillar) parts.push(pillar);
  }

  if (parts.length === 0) return null;

  const answerText = parts.join(" ");
  const spokenText = clamp(answerText, 300);

  const sourceUrls = (dossier.governanceRiskRadar ?? [])
    .map((risk) => risk.sourceUrl)
    .filter((url): url is string => !!url);

  return { answerText, spokenText, sourceUrls };
}
