import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type EdgeFunctionName =
  "research-entity" | "voice-brief" | "dealdesk-qa" | "pilot-simulation";

async function errorPayload(error: FunctionsHttpError): Promise<unknown | null> {
  return error.context
    .clone()
    .json()
    .catch(() => null);
}

/**
 * Invokes a JSON Edge Function. Functions return their domain failures as
 * `{ ok: false, ... }` with a JSON body, so those payloads are returned instead
 * of being swallowed as transport errors.
 */
export async function invokeEdge<T>(name: EdgeFunctionName, body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, {
    body: body as Record<string, unknown>,
  });

  if (!error) return data as T;

  if (error instanceof FunctionsHttpError) {
    const payload = await errorPayload(error);
    if (payload && typeof payload === "object" && "ok" in payload) {
      return payload as T;
    }
  }

  throw error;
}

/**
 * Invokes an Edge Function that responds with raw binary audio (voice-brief).
 * The Supabase client hands back a Blob for non-JSON content types.
 */
export async function invokeEdgeAudio(
  name: EdgeFunctionName,
  body: object,
): Promise<{ blob: Blob; mime: string }> {
  const { data, error } = await supabase.functions.invoke(name, {
    body: body as Record<string, unknown>,
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await errorPayload(error);
      if (payload && typeof payload === "object" && "ok" in payload) {
        throw Object.assign(new Error("voice-failed"), { payload });
      }
    }
    throw error;
  }

  if (data instanceof Blob) return { blob: data, mime: data.type || "audio/mpeg" };

  // Some runtimes surface binary responses as an ArrayBuffer.
  if (data instanceof ArrayBuffer) {
    return { blob: new Blob([data], { type: "audio/mpeg" }), mime: "audio/mpeg" };
  }

  throw new Error("Expected an audio response from the Voice Agent");
}
