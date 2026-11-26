// IS audit capacity & risk-mitigation model. Mirrors src/lib/roi.ts for the Edge Function.

export interface RoiInputs {
  auditorCount: number;
  weeklyHoursSaved: number;
  avgLossPreventedAED: number;
  detectionLiftPct: number;
}

export const ROI_ASSUMPTIONS = {
  workingWeeksPerYear: 48,
  loadedCostPerHourAED: 1_200,
  baselineAuditsPerAuditorPerYear: 8,
  annualPlatformCostAED: 60_000_000,
  pilotDays: 90,
};

export interface RoiOutputs {
  annualHoursReclaimed: number;
  operationalEfficiencyAED: number;
  auditsPerYear: number;
  incrementalDetectionsPerYear: number;
  lossPreventedAED: number;
  breakEvenAudits: number;
  pilotLossPreventedAED: number;
  roiMultiple: number;
}

export function computeRoi(i: RoiInputs, a = ROI_ASSUMPTIONS): RoiOutputs {
  const annualHoursReclaimed = i.auditorCount * i.weeklyHoursSaved * a.workingWeeksPerYear;
  const operationalEfficiencyAED = annualHoursReclaimed * a.loadedCostPerHourAED;
  const auditsPerYear = i.auditorCount * a.baselineAuditsPerAuditorPerYear;
  const incrementalDetectionsPerYear = auditsPerYear * (i.detectionLiftPct / 100);
  const lossPreventedAED = incrementalDetectionsPerYear * i.avgLossPreventedAED;
  const breakEvenAudits =
    i.avgLossPreventedAED > 0
      ? Math.ceil(a.annualPlatformCostAED / i.avgLossPreventedAED)
      : Infinity;
  const pilotLossPreventedAED = lossPreventedAED * (a.pilotDays / 365);
  const roiMultiple = (lossPreventedAED + operationalEfficiencyAED) / a.annualPlatformCostAED;
  return {
    annualHoursReclaimed,
    operationalEfficiencyAED,
    auditsPerYear,
    incrementalDetectionsPerYear,
    lossPreventedAED,
    breakEvenAudits,
    pilotLossPreventedAED,
    roiMultiple,
  };
}
