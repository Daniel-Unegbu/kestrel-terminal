# Kestrel Terminal — Supabase backend

Project ref: `jovejkbnutimnpjprsva` (independent Supabase project, no Lovable Cloud,
no Drizzle, no external AI gateway).

| Path                          | Purpose                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| `migrations/`                 | Postgres schema, indexes, grants, RLS                                                   |
| `functions/research-entity/`  | Tavily deep research + direct Gemini JSON synthesis, cached in `institutional_dossiers` |
| `functions/voice-brief/`      | Deepgram Aura TTS only — returns raw `audio/mpeg`; optionally accepts `voice: "female"` |
| `functions/dealdesk-qa/`      | Deepgram Nova STT + SerpAPI Google search — **no Gemini**                               |
| `functions/pilot-simulation/` | Snapshots for the IS Audit Capacity & Risk-Mitigation Simulator                         |
| `functions/_shared/`          | CORS, publishable-key gate, admin client, provider adapters, schema, ROI model          |

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

| Mode                               | Model                   | Behaviour                              |
| ---------------------------------- | ----------------------- | -------------------------------------- |
| Standard synthesis (`deep: false`) | `gemini-3.5-flash-lite` | cached when possible                   |
| Deep synthesis (`deep: true`)      | `gemini-3.5-flash-lite` | forces a refresh, larger prompt budget |

There is **no** fallback model and no Pro tier: the Pro tier is paused to
protect the token quota and `gemini-2.5-flash` is retired. Failures are retried
twice on `429`/`5xx` (a rejected call costs no tokens), then return
`502 synthesis_unavailable`.

`research-entity` returns `synthesisModel` so the model that answered is explicit.
Cached rows are only reused when `dossier_payload.schemaVersion === 2`; anything
older is treated as a cache miss and re-synthesised against the current audit
schema.

`pilot_simulations` keeps its original column names so no migration is needed.
The IS audit inputs are mapped onto them in `functions/pilot-simulation/index.ts`:

| Column                          | Now stores                                  |
| ------------------------------- | ------------------------------------------- |
| `rm_count`                      | active IS auditors                          |
| `weekly_hours_saved`            | manual scoping hours saved / auditor / week |
| `avg_mandate_fee_aed`           | average ICT loss prevented per audit (ETB)  |
| `win_rate_lift_pct`             | control-gap detection lift (%)              |
| `projected_incremental_fee_aed` | projected loss prevented (ETB)              |

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
  -d '{"query":"Ethio Telecom","forceRefresh":false}'

# Same call again must return {"ok":true,"cached":true,...}
curl -s -X POST "$BASE/research-entity" -H "apikey: $KEY" \
  -H "content-type: application/json" -d '{"query":"Ethio Telecom"}'

# Voice Agent — Deepgram Aura, expect audio/mpeg bytes
curl -s -o brief.mp3 -w '%{http_code} %{content_type} %{size_download}\n' \
  -X POST "$BASE/voice-brief" -H "apikey: $KEY" \
  -H "content-type: application/json" \
  -d '{"script":"Good morning. Three control priorities stand out."}'

# AuditDesk female voice — same endpoint and response format
curl -s -o auditdesk.mp3 -w '%{http_code} %{content_type} %{size_download}\n' \
  -X POST "$BASE/voice-brief" -H "apikey: $KEY" \
  -H "content-type: application/json" \
  -d '{"script":"Review access controls first.","voice":"female"}'

# Search Agent — SerpAPI only, no LLM
curl -s -X POST "$BASE/dealdesk-qa" -H "apikey: $KEY" \
  -H "content-type: application/json" \
  -d '{"questionText":"latest INSA cyber directive","entityName":"Ethio Telecom"}'
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

The Vite client reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` at build
time. If the host provides neither, `src/integrations/supabase/client.ts` falls
back to the bundled public project URL and publishable key, so a deploy still
connects. Setting them explicitly is preferred:

```bash
VITE_SUPABASE_URL=https://jovejkbnutimnpjprsva.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Both values are public and protected by RLS — they are not secrets. If the key is
ever rotated, update the fallback in `client.ts` as well as the host variables.

Set them in Vercel for Production/Preview and rebuild. A Vite build that ran
without them ships a bundle that cannot reach the project, so every dossier load
and every function call fails even though the Edge Functions themselves are
healthy.
