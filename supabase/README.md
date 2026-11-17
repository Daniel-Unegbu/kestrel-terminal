# Kestrel Terminal — Supabase backend

Project ref: `jovejkbnutimnpjprsva` (independent Supabase project, no Lovable Cloud).

| Path | Purpose |
| --- | --- |
| `migrations/` | Postgres schema, indexes, grants, RLS |
| `functions/research/` | Tavily + SerpAPI retrieval, direct Gemini synthesis, dossier upsert |
| `functions/pilot-simulation/` | ROI save (pure `computeRoi` runs on the client too) |
| `functions/deal-desk/` | Grounded Q&A over a dossier JSON with direct Gemini |
| `functions/text-to-speech/` | Deepgram Aura TTS, returns base64 MP3 |
| `functions/speech-to-text/` | Deepgram Nova STT, returns transcript |
| `functions/_shared/` | CORS, publishable-key gate, admin client, Gemini client, schema, ROI model |

## 1. Secrets

Only third-party keys need to be set; the runtime injects `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEYS` and
`SUPABASE_SECRET_KEYS` automatically.

```bash
npx supabase@latest secrets set \
  GEMINI_API_KEY=... \
  TAVILY_API_KEY=... \
  SERPAPI_API_KEY=... \
  DEEPGRAM_API_KEY=... \
  --project-ref jovejkbnutimnpjprsva
```

Optional overrides: `GEMINI_MODEL_FAST` (default `gemini-3.8-flash`),
`GEMINI_MODEL_DEEP` (default `gemini-3.1-pro-preview`), `ALLOWED_ORIGINS`
(comma-separated list; unset means `*`).

Never put `GEMINI_API_KEY`, `TAVILY_API_KEY`, `SERPAPI_API_KEY`,
`DEEPGRAM_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in Vercel or in the repo.

## 2. Apply the schema

Either paste `migrations/20261117000000_init_schema.sql` into the Dashboard SQL
editor, or:

```bash
npx supabase@latest link --project-ref jovejkbnutimnpjprsva
npx supabase@latest db push
```

The migration is idempotent. `institutional_dossiers` is publicly readable
(RLS select policy for `anon`/`authenticated`); `pilot_simulations` has no
policy at all, so only the secret key can reach it. Both tables are written only
by Edge Functions using the secret key.

## 3. Deploy the functions

`verify_jwt = false` is set per function in `config.toml` because publishable and
secret keys are not JWTs; each function validates the `apikey` header itself.

```bash
npx supabase@latest functions deploy research --project-ref jovejkbnutimnpjprsva
npx supabase@latest functions deploy pilot-simulation --project-ref jovejkbnutimnpjprsva
npx supabase@latest functions deploy deal-desk --project-ref jovejkbnutimnpjprsva
npx supabase@latest functions deploy text-to-speech --project-ref jovejkbnutimnpjprsva
npx supabase@latest functions deploy speech-to-text --project-ref jovejkbnutimnpjprsva
```

All five are ESM TypeScript on Deno 2 (`Deno.serve`, `npm:` specifiers), so they
run unchanged on the hosted runtime.

## 4. Smoke tests

```bash
curl -i -X POST "https://jovejkbnutimnpjprsva.supabase.co/functions/v1/pilot-simulation" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "content-type: application/json" \
  -d '{"rmCount":180,"weeklyHoursSaved":4.5,"avgMandateFeeAED":650000,"conversionLiftPct":3.5}'
```

Expect `{"ok":true,"id":"…","createdAt":"…"}`. A missing or wrong `apikey` must
return `401 {"ok":false,"error":"Unauthorized"}`.

## 5. Local development

```bash
cp functions/.env.example functions/.env   # fill in the third-party keys
npx supabase@latest functions serve --env-file functions/.env
```

The browser never talks to Gemini, Tavily, SerpAPI or Deepgram directly: it calls
these functions through `supabase.functions.invoke` in `src/lib/edge.ts`.
