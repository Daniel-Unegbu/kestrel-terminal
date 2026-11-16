import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computeRoi } from "./roi";

export const savePilotSimulation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        rmCount: z.number().int().min(1).max(5000),
        weeklyHoursSaved: z.number().min(0).max(40),
        avgMandateFeeAED: z.number().min(0).max(100_000_000),
        conversionLiftPct: z.number().min(0).max(50),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const out = computeRoi(data);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("pilot_simulations")
      .insert({
        rm_count: data.rmCount,
        weekly_hours_saved: data.weeklyHoursSaved,
        avg_mandate_fee_aed: data.avgMandateFeeAED,
        win_rate_lift_pct: data.conversionLiftPct,
        projected_incremental_fee_aed: Math.round(out.incrementalFeeIncomeAED),
      })
      .select("id, created_at")
      .single();
    if (error) {
      console.error(error);
      return { ok: false as const };
    }
    return { ok: true as const, id: row.id, createdAt: row.created_at };
  });
