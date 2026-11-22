// IS audit capacity & risk-mitigation model. Mirrors src/lib/roi.ts for the Edge Function.

export interface RoiInputs {
  auditorCount: number;
  weeklyHoursSaved: number;
  avgLossPreventedETB: number;
  detectionLiftPct: number;
}

export const ROI_ASSUMPTIONS = {
  workingWeeksPerYear: 48,
  loadedCostPerHourETB: 1_200,
  baselineAuditsPerAuditorPerYear: 8,
  annualPlatformCostETB: 60_000_000,
  pilotDays: 90,
};

export interface RoiOutputs {
  annualHoursReclaimed: number;
  operationalEfficiencyETB: number;
  auditsPerYear: number;
  incrementalDetectionsPerYear: number;
  lossPreventedETB: number;
  breakEvenAudits: number;
  pilotLossPreventedETB: number;
  roiMultiple: number;
}

export function computeRoi(i: RoiInputs, a = ROI_ASSUMPTIONS): RoiOutputs {
  const annualHoursReclaimed = i.auditorCount * i.weeklyHoursSaved * a.workingWeeksPerYear;
  const operationalEfficiencyETB = annualHoursReclaimed * a.loadedCostPerHourETB;
  const auditsPerYear = i.auditorCount * a.baselineAuditsPerAuditorPerYear;
  const incrementalDetectionsPerYear = auditsPerYear * (i.detectionLiftPct / 100);
  const lossPreventedETB = incrementalDetectionsPerYear * i.avgLossPreventedETB;
  const breakEvenAudits =
    i.avgLossPreventedETB > 0
      ? Math.ceil(a.annualPlatformCostETB / i.avgLossPreventedETB)
      : Infinity;
  const pilotLossPreventedETB = lossPreventedETB * (a.pilotDays / 365);
  const roiMultiple = (lossPreventedETB + operationalEfficiencyETB) / a.annualPlatformCostETB;
  return {
    annualHoursReclaimed,
    operationalEfficiencyETB,
    auditsPerYear,
    incrementalDetectionsPerYear,
    lossPreventedETB,
    breakEvenAudits,
    pilotLossPreventedETB,
    roiMultiple,
  };
}
