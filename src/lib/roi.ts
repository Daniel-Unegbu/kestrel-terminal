// IS audit capacity & risk-mitigation model. Pure functions so the numbers are testable.

export interface RoiInputs {
  auditorCount: number;
  weeklyHoursSaved: number;
  avgLossPreventedETB: number;
  detectionLiftPct: number;
}

export const ROI_DEFAULTS: RoiInputs = {
  auditorCount: 150,
  weeklyHoursSaved: 5.0,
  avgLossPreventedETB: 2_500_000,
  detectionLiftPct: 18,
};

/** Model assumptions surfaced in the UI. */
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

/** Loss prevented across detection-lift values 0–40% for the sensitivity curve. */
export function sensitivityCurve(i: RoiInputs, steps = 21) {
  return Array.from({ length: steps }, (_, k) => {
    const lift = (40 * k) / (steps - 1);
    const out = computeRoi({ ...i, detectionLiftPct: lift });
    return { lift: Number(lift.toFixed(1)), lossM: out.lossPreventedETB / 1_000_000 };
  });
}

export function formatETBCompact(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e9) return `ETB ${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `ETB ${(v / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `ETB ${(v / 1e3).toFixed(0)}K`;
  return `ETB ${v.toFixed(0)}`;
}
