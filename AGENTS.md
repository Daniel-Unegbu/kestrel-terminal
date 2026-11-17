# Kestrel Terminal

Backend: independent Supabase project (`jovejkbnutimnpjprsva`).

- Database schema, indexes and RLS: `supabase/migrations/`
- Server-side logic and third-party API calls: `supabase/functions/`
- Frontend reads through `@supabase/supabase-js`; no Drizzle or Lovable Cloud dependencies.
- Secrets live in Supabase Edge Function Secrets and the hosting provider (Vercel), never in source control.
- Deployment and local-run steps: `supabase/README.md`.
