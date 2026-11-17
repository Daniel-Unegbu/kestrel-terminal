import { z } from "npm:zod@3";
import { requirePublishableKey } from "../_shared/auth.ts";
import { corsHeaders, originAllowed, preflight } from "../_shared/cors.ts";
import { errorMessage, json } from "../_shared/http.ts";
import { computeRoi } from "../_shared/roi.ts";
import { adminClient } from "../_shared/supabase.ts";

const inputSchema = z.object({
  rmCount: z.number().int().min(1).max(5000),
  weeklyHoursSaved: z.number().min(0).max(40),
  avgMandateFeeAED: z.number().min(0).max(100_000_000),
  conversionLiftPct: z.number().min(0).max(50),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const cors = corsHeaders(req);
  if (!originAllowed(req)) return json({ ok: false, error: "Origin not allowed" }, 403, cors);
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, cors);

  const authError = requirePublishableKey(req, cors);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => null);
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return json({ ok: false, error: "Invalid input" }, 400, cors);
    }

    const input = parsed.data;
    const output = computeRoi(input);

    const { data: row, error } = await adminClient()
      .from("pilot_simulations")
      .insert({
        rm_count: input.rmCount,
        weekly_hours_saved: input.weeklyHoursSaved,
        avg_mandate_fee_aed: input.avgMandateFeeAED,
        win_rate_lift_pct: input.conversionLiftPct,
        projected_incremental_fee_aed: Math.round(output.incrementalFeeIncomeAED),
      })
      .select("id, created_at")
      .single();

    if (error || !row) {
      console.error("Pilot simulation insert failed", error?.message);
      return json({ ok: false }, 500, cors);
    }

    return json({ ok: true, id: row.id as string, createdAt: row.created_at as string }, 200, cors);
  } catch (error) {
    console.error("Pilot simulation failed", errorMessage(error));
    return json({ ok: false }, 500, cors);
  }
});
