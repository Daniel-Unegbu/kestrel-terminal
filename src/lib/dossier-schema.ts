import { z } from "zod";

// Lenient runtime validation for model output: coerces numbers, clamps enums to safe defaults.
const num = (d = 0) => z.coerce.number().catch(d);
const refs = z.array(z.coerce.number().int()).optional().catch(undefined);

export const generatedDossierSchema = z.object({
  entityName: z.string(),
  tickerOrRegistry: z.string().optional().catch(undefined),
  sector: z.string().catch("Undisclosed"),
  jurisdiction: z.string().catch("Undisclosed"),
  segment: z
    .enum(["GRE_SOVEREIGN", "IBM_CORPORATE", "FINANCIAL_INSTITUTION", "COMMERCIAL_SME"])
    .catch("IBM_CORPORATE"),
  executiveSummary: z.string().catch(""),
  executiveBriefAudioScript: z.string().catch(""),
  financialMetrics: z.object({
    estimatedRevenueAED: z.string().catch("Undisclosed"),
    ebitdaMarginPct: num(),
    netDebtToEbitda: num(),
    interestCoverageRatio: num(),
    cashConversionCycleDays: num(),
    creditRiskRating: z.enum(["LOW_RISK", "MODERATE_WATCH", "ELEVATED_REVIEW"]).catch("MODERATE_WATCH"),
    sourceRefs: refs,
  }),
  workingCapital: z
    .object({
      dsoDays: num(),
      dioDays: num(),
      dpoDays: num(),
      trappedLiquidityAEDMillions: num(),
      tradeFinanceVelocity: z.string().catch("Undisclosed"),
      sourceRefs: refs,
    })
    .catch({ dsoDays: 0, dioDays: 0, dpoDays: 0, trappedLiquidityAEDMillions: 0, tradeFinanceVelocity: "Undisclosed" }),
  debtMaturityProfile: z
    .array(
      z.object({
        year: z.coerce.string(),
        maturingDebtAEDMillions: num(),
        instrumentType: z.enum(["Syndicated Loan", "Sukuk / Bond", "Trade Facility"]).catch("Syndicated Loan"),
      }),
    )
    .catch([]),
  bondIssuanceProbabilityPct: num(),
  corridors: z
    .array(
      z.object({
        corridor: z.string(),
        flowSharePct: num(),
        fxPair: z.string().catch(""),
        fabHub: z.string().catch(""),
      }),
    )
    .catch([]),
  fabDivisionRouting: z
    .array(
      z.object({
        division: z
          .enum(["Global Corporate Finance", "Global Transaction Banking", "Global Markets", "FAB Siraj Islamic Banking"])
          .catch("Global Corporate Finance"),
        recommendedProduct: z.string(),
        triggerSignal: z.string().catch(""),
        estimatedFeePoolAED: z.string().catch("—"),
        confidenceScore: num(50),
        sourceRefs: refs,
      }),
    )
    .catch([]),
  complianceAndRiskRadar: z
    .array(
      z.object({
        category: z
          .enum(["CBUAE / Regulatory", "Sanctions & Adverse Media", "FX & Corridor Risk", "ESG / Transition Finance"])
          .catch("CBUAE / Regulatory"),
        severity: z.enum(["INFO", "WATCH", "CRITICAL"]).catch("INFO"),
        finding: z.string(),
        sourceIndex: z.coerce.number().int().optional().catch(undefined),
      }),
    )
    .catch([]),
});

export type GeneratedDossier = z.infer<typeof generatedDossierSchema>;
