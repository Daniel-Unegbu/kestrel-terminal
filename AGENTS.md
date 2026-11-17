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
| `research-entity`  | Tavily + Gemini               | Deep research, JSON dossier, 60s script, cached by `entity_slug` |
| `voice-brief`      | Deepgram Aura (TTS)           | Returns raw `audio/mpeg`                                         |
| `dealdesk-qa`      | Deepgram Nova (STT) + SerpAPI | Text answer + citations; **no Gemini on this path**              |
| `pilot-simulation` | none                          | ROI snapshot persistence                                         |

- One `GEMINI_API_KEY` serves every model. Both synthesis modes use
  `gemini-3.5-flash-lite` — the Pro tier is paused to protect the token quota and
  `gemini-2.5-flash` is retired. See `functions/_shared/gemini.ts`.
- Provider keys are never exposed to the browser; the client only holds the
  publishable key.
- Visible UI wording: Research Agent (Tavily), Search Agent (SerpAPI), Voice Agent
  (Deepgram), Internal Database (Supabase).
