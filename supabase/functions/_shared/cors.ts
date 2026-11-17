const ALLOWED_HEADERS = "authorization, x-client-info, apikey, content-type";
const ALLOWED_METHODS = "POST, OPTIONS";

function configuredOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS")?.trim();
  if (!raw || raw === "*") return ["*"];
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function originAllowed(req: Request): boolean {
  const allowed = configuredOrigins();
  if (allowed.includes("*")) return true;
  const origin = req.headers.get("origin");
  return !!origin && allowed.includes(origin);
}

export function corsHeaders(req: Request): Record<string, string> {
  const allowed = configuredOrigins();
  const origin = req.headers.get("origin") ?? "";
  const allowOrigin = allowed.includes("*") ? "*" : allowed.includes(origin) ? origin : "null";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function preflight(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
