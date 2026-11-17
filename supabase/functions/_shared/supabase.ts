import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

function isNewApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createKeyedFetch(key: string): typeof fetch {
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

function secretKey(): string {
  // Legacy name is still injected by the platform and is what the project asked
  // us to read first. New-format projects receive SUPABASE_SECRET_KEYS instead.
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;

  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const values = Object.values(parsed).filter(
        (value): value is string => typeof value === "string" && value.length > 0,
      );
      if (values.length > 0) return values[0]!;
    } catch {
      console.error("SUPABASE_SECRET_KEYS is not valid JSON");
    }
  }

  throw new Error("No Supabase secret key is available to the Edge Function runtime");
}

let cached: SupabaseClient | undefined;

export function adminClient(): SupabaseClient {
  if (cached) return cached;

  const url = Deno.env.get("SUPABASE_URL");
  if (!url) throw new Error("SUPABASE_URL is not configured");

  const key = secretKey();
  cached = createClient(url, key, {
    global: { fetch: createKeyedFetch(key) },
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
  return cached;
}
