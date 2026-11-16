// Wholesale mandate & fee-income model. Pure functions so the numbers are testable.

export interface RoiInputs {
  rmCount: number;
  weeklyHoursSaved: number;
  avgMandateFeeAED: number;
  conversionLiftPct: number;
}

export const ROI_DEFAULTS: RoiInputs = {
  rmCount: 180,
  weeklyHoursSaved: 4.5,
  avgMandateFeeAED: 650_000,
  conversionLiftPct: 3.5,
};

/** Model assumptions surfaced in the UI. */
export const ROI_ASSUMPTIONS = {
  workingWeeksPerYear: 48,
  loadedCostPerHourAED: 420,
  baselineMandatesPerRmPerYear: 12,
  annualPlatformCostAED: 1_100_000,
  pilotDays: 90,
};

export interface RoiOutputs {
  annualHoursReclaimed: number;
  operationalEfficiencyAED: number;
  incrementalMandatesPerYear: number;
  incrementalFeeIncomeAED: number;
  breakEvenMandates: number;
  pilotFeeIncomeAED: number;
  roiMultiple: number;
}

export function computeRoi(i: RoiInputs, a = ROI_ASSUMPTIONS): RoiOutputs {
  const annualHoursReclaimed = i.rmCount * i.weeklyHoursSaved * a.workingWeeksPerYear;
  const operationalEfficiencyAED = annualHoursReclaimed * a.loadedCostPerHourAED;
  const incrementalMandatesPerYear =
    i.rmCount * a.baselineMandatesPerRmPerYear * (i.conversionLiftPct / 100);
  const incrementalFeeIncomeAED = incrementalMandatesPerYear * i.avgMandateFeeAED;
  const breakEvenMandates =
    i.avgMandateFeeAED > 0 ? Math.ceil(a.annualPlatformCostAED / i.avgMandateFeeAED) : Infinity;
  const pilotFeeIncomeAED = incrementalFeeIncomeAED * (a.pilotDays / 365);
  const roiMultiple =
    (incrementalFeeIncomeAED + operationalEfficiencyAED) / a.annualPlatformCostAED;
  return {
    annualHoursReclaimed,
    operationalEfficiencyAED,
    incrementalMandatesPerYear,
    incrementalFeeIncomeAED,
    breakEvenMandates,
    pilotFeeIncomeAED,
    roiMultiple,
  };
}

/** Fee income across conversion-lift values 0–10% for the sensitivity curve. */
export function sensitivityCurve(i: RoiInputs, steps = 21) {
  return Array.from({ length: steps }, (_, k) => {
    const lift = (10 * k) / (steps - 1);
    const out = computeRoi({ ...i, conversionLiftPct: lift });
    return { lift: Number(lift.toFixed(1)), feeM: out.incrementalFeeIncomeAED / 1_000_000 };
  });
}

export function formatAEDCompact(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e9) return `AED ${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `AED ${(v / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `AED ${(v / 1e3).toFixed(0)}K`;
  return `AED ${v.toFixed(0)}`;
}
