import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type EdgeFunctionName =
  "research-entity" | "voice-brief" | "dealdesk-qa" | "pilot-simulation";

/**
 * Reads the body of a failed function call. The Edge gateway returns JSON for
 * its own errors (e.g. `{"code":"404","message":"Requested function was not
 * found"}`), so keep a text fallback instead of assuming JSON.
 */
async function errorPayload(error: FunctionsHttpError): Promise<unknown | null> {
  const raw = await error.context
    .clone()
    .text()
    .catch(() => "");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function describeFailure(
  name: EdgeFunctionName,
  error: FunctionsHttpError,
  payload: unknown,
): string {
  const status = error.context?.status;
  const detail =
    typeof payload === "string"
      ? payload.slice(0, 180)
      : payload
        ? JSON.stringify(payload).slice(0, 180)
        : error.message;
  return `Edge Function ${name} failed${status ? ` (${status})` : ""}: ${detail}`;
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
    throw new Error(describeFailure(name, error, payload));
  }

  throw new Error(`Edge Function ${name} could not be reached: ${error.message}`);
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
      throw new Error(describeFailure(name, error, payload));
    }
    throw new Error(`Edge Function ${name} could not be reached: ${error.message}`);
  }

  if (data instanceof Blob) return { blob: data, mime: data.type || "audio/mpeg" };

  // Some runtimes surface binary responses as an ArrayBuffer.
  if (data instanceof ArrayBuffer) {
    return { blob: new Blob([data], { type: "audio/mpeg" }), mime: "audio/mpeg" };
  }

  throw new Error("Expected an audio response from the Voice Agent");
}
