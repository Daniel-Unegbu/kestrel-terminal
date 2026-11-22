# Kestrel Terminal

Backend: independent Supabase project (`jovejkbnutimnpjprsva`).

- Database schema, indexes and RLS: `supabase/migrations/`
- Server-side logic and third-party API calls: `supabase/functions/`
- Frontend reads through `@supabase/supabase-js`; no Drizzle or Lovable Cloud dependencies.
- Secrets live in Supabase Edge Function Secrets and the hosting provider (Vercel), never in source control.
- Deployment and local-run steps: `supabase/README.md`.

## Edge Functions (strict role separation, no AI gateway)

| Function           | Providers                     | Notes                                                            |
| ------------------ | ----------------------------- | ---------------------------------------------------------------- |
| `research-entity`  | Tavily + Gemini               | Deep research, JSON audit dossier, 60s brief, cached by `entity_slug` |
| `voice-brief`      | Deepgram Aura (TTS)           | Returns raw `audio/mpeg`                                         |
| `dealdesk-qa`      | Deepgram Nova (STT) + SerpAPI | AuditDesk answer + citations; **no Gemini on this path**         |
| `pilot-simulation` | none                          | IS audit capacity & risk snapshot persistence                    |

- One `GEMINI_API_KEY` serves every model. Both synthesis modes use
  `gemini-3.5-flash-lite` — the Pro tier is paused to protect the token quota and
  `gemini-2.5-flash` is retired. See `functions/_shared/gemini.ts`.
- Provider keys are never exposed to the browser; the client only holds the
  publishable key.
- Visible UI wording: Research Agent (Tavily), Search Agent (SerpAPI), Voice Agent
  (Deepgram), Internal Database (Supabase).
- Dossier payloads carry `schemaVersion: 2`. `research-entity` and the client's
  `getDossier` both treat anything older as a cache miss and re-synthesise, so the
  audit shape can change without a data migration.
- `pilot_simulations` keeps its legacy column names (`rm_count`,
  `avg_mandate_fee_aed`, `win_rate_lift_pct`, `projected_incremental_fee_aed`) and
  maps the IS audit inputs onto them in `functions/pilot-simulation/index.ts`.
