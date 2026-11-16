import { describe, expect, it } from "vitest";
import { computeRoi, ROI_DEFAULTS } from "./roi";

describe("Wholesale ROI model", () => {
  it("uses the blueprint defaults: 180 RMs, 4.5 hrs/week, AED 650K fee, 3.5% lift", () => {
    expect(ROI_DEFAULTS).toEqual({
      rmCount: 180,
      weeklyHoursSaved: 4.5,
      avgMandateFeeAED: 650_000,
      conversionLiftPct: 3.5,
    });
  });

  it("reclaims 180 × 4.5 × 48 = 38,880 RM hours a year at defaults", () => {
    expect(computeRoi(ROI_DEFAULTS).annualHoursReclaimed).toBe(38_880);
  });

  it("closing 2 incremental mandates pays back the annual platform cost at AED 650K", () => {
    expect(computeRoi(ROI_DEFAULTS).breakEvenMandates).toBe(2);
  });

  it("projects incremental fee income as mandates × average fee", () => {
    const out = computeRoi(ROI_DEFAULTS);
    // 180 RMs × 12 mandates × 3.5% = 75.6 mandates × AED 650K
    expect(out.incrementalMandatesPerYear).toBeCloseTo(75.6, 5);
    expect(out.incrementalFeeIncomeAED).toBeCloseTo(49_140_000, 0);
  });
});
