import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type EdgeFunctionName =
  "research" | "pilot-simulation" | "deal-desk" | "text-to-speech" | "speech-to-text";

/**
 * Invokes a Supabase Edge Function. Functions return their domain failures as
 * `{ ok: false, ... }` with a JSON body, so those payloads are returned instead
 * of being swallowed as transport errors.
 */
export async function invokeEdge<T>(name: EdgeFunctionName, body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, {
    body: body as Record<string, unknown>,
  });

  if (!error) return data as T;

  if (error instanceof FunctionsHttpError) {
    const payload = await error.context
      .clone()
      .json()
      .catch(() => null);

    if (payload && typeof payload === "object" && "ok" in payload) {
      return payload as T;
    }
  }

  throw error;
}
