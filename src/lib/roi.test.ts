import { describe, expect, it } from "vitest";
import { computeRoi, ROI_DEFAULTS } from "./roi";

describe("IS audit capacity & risk-mitigation model", () => {
  it("uses the UAE IAA defaults: 150 auditors, 5.0 hrs/week, AED 2.5M loss, 18% lift", () => {
    expect(ROI_DEFAULTS).toEqual({
      auditorCount: 150,
      weeklyHoursSaved: 5.0,
      avgLossPreventedAED: 2_500_000,
      detectionLiftPct: 18,
    });
  });

  it("reclaims 150 × 5 × 48 = 36,000 auditor hours a year at defaults", () => {
    expect(computeRoi(ROI_DEFAULTS).annualHoursReclaimed).toBe(36_000);
  });

  it("closing 24 pre-deployment audits pays back the AED 60M annual platform cost", () => {
    expect(computeRoi(ROI_DEFAULTS).breakEvenAudits).toBe(24);
  });

  it("projects loss prevented as detections × average loss per audit", () => {
    const out = computeRoi(ROI_DEFAULTS);
    // 150 auditors × 8 audits × 18% = 216 detections × AED 2.5M
    expect(out.incrementalDetectionsPerYear).toBeCloseTo(216, 5);
    expect(out.lossPreventedAED).toBeCloseTo(540_000_000, 0);
    expect(out.roiMultiple).toBeCloseTo(9.72, 5);
  });
});
