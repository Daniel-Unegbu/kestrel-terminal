// Wholesale mandate & fee-income model. Mirrors src/lib/roi.ts for the Edge Function.

export interface RoiInputs {
  rmCount: number;
  weeklyHoursSaved: number;
  avgMandateFeeAED: number;
  conversionLiftPct: number;
}

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
