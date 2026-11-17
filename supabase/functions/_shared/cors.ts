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

/**
 * Matches one allow-list entry against a request Origin. Entries are literal
 * origins except for `*`, which matches any run of characters — so
 * `https://kestrel-terminal-*.vercel.app` covers every preview deployment.
 */
function matchesOrigin(pattern: string, origin: string): boolean {
  if (pattern === "*") return true;
  if (!pattern.includes("*")) return pattern === origin;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`, "i").test(origin);
}

/**
 * Non-browser callers (curl, SSR, health checks) send no Origin header. They are
 * still gated by the publishable-key check, so they are allowed through here.
 */
export function originAllowed(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  const allowed = configuredOrigins();
  if (allowed.includes("*")) return true;
  return allowed.some((pattern) => matchesOrigin(pattern, origin));
}

export function corsHeaders(req: Request): Record<string, string> {
  const allowed = configuredOrigins();
  const origin = req.headers.get("origin");

  let allowOrigin = "null";
  if (allowed.includes("*")) allowOrigin = "*";
  else if (origin && allowed.some((pattern) => matchesOrigin(pattern, origin))) {
    allowOrigin = origin;
  }

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
