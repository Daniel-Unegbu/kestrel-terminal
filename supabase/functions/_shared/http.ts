export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

/**
 * fetch with a hard timeout. Supabase Edge Functions are killed at 150s of wall
 * clock time, so every upstream call needs its own ceiling — otherwise one
 * stalled provider burns the whole invocation and the caller gets a 546.
 */
export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit = {},
  ms = 30_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

export async function readJsonBody(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text) return null;
  return JSON.parse(text);
}
