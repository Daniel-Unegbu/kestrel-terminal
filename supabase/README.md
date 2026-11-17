# Kestrel Terminal — Supabase backend

Project ref: `jovejkbnutimnpjprsva` (independent Supabase project, no Lovable Cloud,
no Drizzle, no external AI gateway).

| Path | Purpose |
| --- | --- |
| `migrations/` | Postgres schema, indexes, grants, RLS |
| `functions/research-entity/` | Tavily deep research + direct Gemini JSON synthesis, cached in `institutional_dossiers` |
| `functions/voice-brief/` | Deepgram Aura TTS only — returns raw `audio/mpeg` |
| `functions/dealdesk-qa/` | Deepgram Nova STT + SerpAPI Google search — **no Gemini** |
| `functions/pilot-simulation/` | ROI snapshots for the Wholesale ROI Simulator |
| `functions/_shared/` | CORS, publishable-key gate, admin client, provider adapters, schema, ROI model |

## 1. Secrets

Only the four third-party keys need to be set. The runtime injects `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEYS` and
`SUPABASE_SECRET_KEYS` automatically.

```bash
npx supabase@latest secrets set \
  GEMINI_API_KEY=... \
  TAVILY_API_KEY=... \
  SERPAPI_API_KEY=... \
  DEEPGRAM_API_KEY=... \
  --remote jovejkbnutimnpjprsva
```

Optional: `ALLOWED_ORIGINS` (comma-separated list; unset means `*`),
`DEEPGRAM_TTS_MODEL`, `DEEPGRAM_STT_MODEL`.

**One `GEMINI_API_KEY` covers every Gemini model.** Tier selection is only a model
name in the request path (`functions/_shared/gemini.ts`):

| Mode | Model | Fallback chain |
| --- | --- | --- |
| Standard synthesis (`deep: false`) | `gemini-3.5-flash-lite` | `gemini-2.5-flash` |
| Deep synthesis (`deep: true`) | `gemini-3.8-flash` | `gemini-3.5-flash-lite` → `gemini-2.5-flash` |

`research-entity` returns `synthesisModel` so a silent fallback is visible. A
`503 UNAVAILABLE` means Google is throttling that model — the request still
succeeds on the next model in the chain.

Never put any of these keys in Vercel or in the repo. The browser only ever holds
the publishable key.

## 2. Apply the schema

Either paste `migrations/20261117000000_init_schema.sql` into the Dashboard SQL
editor, or:

```bash
npx supabase@latest link --project-ref jovejkbnutimnpjprsva
npx supabase@latest db push
```

The migration is idempotent. `institutional_dossiers` is publicly readable (RLS
select policy for `anon`/`authenticated`); `pilot_simulations` has no policy at
all, so only the secret key can reach it. Both tables are written only by Edge
Functions using the secret key.

## 3. Deploy the functions

`verify_jwt = false` is set per function in `config.toml` because publishable and
secret keys are not JWTs; each function validates the `apikey` header itself.

```bash
export SUPABASE_ACCESS_TOKEN=...
npx supabase@latest functions deploy research-entity --project-ref jovejkbnutimnpjprsva
npx supabase@latest functions deploy voice-brief --project-ref jovejkbnutimnpjprsva
npx supabase@latest functions deploy dealdesk-qa --project-ref jovejkbnutimnpjprsva
npx supabase@latest functions deploy pilot-simulation --project-ref jovejkbnutimnpjprsva
```

All are ESM TypeScript on Deno 2 (`Deno.serve`, `npm:` specifiers), so they run
unchanged on the hosted runtime. Every upstream call has a hard timeout: a stalled
provider can never reach the 150s wall-clock kill (which surfaces as HTTP 546).

## 4. Smoke tests

```bash
BASE=https://jovejkbnutimnpjprsva.supabase.co/functions/v1
KEY=$SUPABASE_PUBLISHABLE_KEY

# Research Agent — Tavily + Gemini (slow, ~10-25s)
curl -s -X POST "$BASE/research-entity" -H "apikey: $KEY" \
  -H "content-type: application/json" \
  -d '{"query":"Emirates NBD","forceRefresh":false}'

# Same call again must return {"ok":true,"cached":true,...}
curl -s -X POST "$BASE/research-entity" -H "apikey: $KEY" \
  -H "content-type: application/json" -d '{"query":"Emirates NBD"}'

# Voice Agent — Deepgram Aura, expect audio/mpeg bytes
curl -s -o brief.mp3 -w '%{http_code} %{content_type} %{size_download}\n' \
  -X POST "$BASE/voice-brief" -H "apikey: $KEY" \
  -H "content-type: application/json" \
  -d '{"script":"Good morning. Three capital triggers stand out."}'

# Search Agent — SerpAPI only, no LLM
curl -s -X POST "$BASE/dealdesk-qa" -H "apikey: $KEY" \
  -H "content-type: application/json" \
  -d '{"questionText":"latest credit rating","entityName":"Emirates NBD"}'
```

A missing or wrong `apikey` must return `401 {"ok":false,"error":"Unauthorized"}`.

## 5. Local development

```bash
cp functions/.env.example functions/.env   # fill in the third-party keys
npx supabase@latest functions serve --env-file functions/.env
```

The browser never talks to Gemini, Tavily, SerpAPI or Deepgram directly: it calls
these functions through `supabase.functions.invoke` in `src/lib/edge.ts`.

## 6. Frontend variables

The Vite client needs the project URL and publishable key at build time. These
are **public** values, safe to expose:

```bash
VITE_SUPABASE_URL=https://jovejkbnutimnpjprsva.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Set them in Vercel for Production/Preview and rebuild. A Vite build that ran
without them ships a bundle that cannot reach the project, so every dossier load
and every function call fails even though the Edge Functions themselves are
healthy.
