// Supabase browser/SSR client. Uses the project's publishable key; safe to expose.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function readEnv(name: string): string | undefined {
  const viteEnv = import.meta.env as Record<string, string | undefined>;
  if (viteEnv[name]) return viteEnv[name];
  if (typeof process !== "undefined") return process.env[name];
  return undefined;
}

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

function createSupabaseClient() {
  const url = readEnv("VITE_SUPABASE_URL") ?? readEnv("SUPABASE_URL");
  const key = readEnv("VITE_SUPABASE_ANON_KEY") ?? readEnv("SUPABASE_ANON_KEY");

  if (!url || !key) {
    const missing = [
      ...(!url ? ["VITE_SUPABASE_URL"] : []),
      ...(!key ? ["VITE_SUPABASE_ANON_KEY"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  const inBrowser = typeof window !== "undefined";

  return createClient<Database>(url, key, {
    global: { fetch: createSupabaseFetch(key) },
    auth: {
      persistSession: inBrowser,
      autoRefreshToken: true,
      detectSessionInUrl: inBrowser,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
