import { json } from "./http.ts";

/**
 * Publishable/secret keys are not JWTs. The platform `verify_jwt` check is
 * therefore disabled in supabase/config.toml, and every function validates the
 * caller's `apikey` header against the project's publishable key(s) here.
 */
function publishableKeys(): string[] {
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const keys = Object.values(parsed).filter(
        (value): value is string => typeof value === "string",
      );
      if (keys.length > 0) return keys;
    } catch {
      console.error("SUPABASE_PUBLISHABLE_KEYS is not valid JSON");
    }
  }

  const single =
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  return single ? [single] : [];
}

export function requirePublishableKey(req: Request, cors: Record<string, string>): Response | null {
  const keys = publishableKeys();
  if (keys.length === 0) {
    console.error("No Supabase publishable key is available to the Edge Function runtime");
    return json({ ok: false, error: "Function auth is not configured" }, 500, cors);
  }

  const authorization = req.headers.get("authorization") ?? "";
  const bearer = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
  const provided = req.headers.get("apikey") ?? bearer;

  if (!provided || !keys.includes(provided)) {
    return json({ ok: false, error: "Unauthorized" }, 401, cors);
  }

  return null;
}
