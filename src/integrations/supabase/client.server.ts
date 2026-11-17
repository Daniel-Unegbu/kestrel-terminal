// Server-side Supabase client with a secret key. Bypasses RLS.
// Only import this from server-only code. Never expose it to the browser bundle.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function isNewApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, name) => headers.set(name, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (isNewApiKey(key) && headers.get("authorization") === `Bearer ${key}`) {
      headers.delete("authorization");
    }

    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

function createSupabaseAdminClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["SUPABASE_SECRET_KEY"];

  if (!url || !key) {
    const missing = [
      ...(!url ? ["SUPABASE_URL"] : []),
      ...(!key ? ["SUPABASE_SERVICE_ROLE_KEY"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(url, key, {
    global: { fetch: createSupabaseFetch(key) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

// Server-side Supabase client with secret-key access - bypasses RLS.
// SECURITY: Only use this for trusted server-side operations, never expose it to client code.
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
