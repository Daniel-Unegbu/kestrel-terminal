create table public.institutional_dossiers (
  id uuid primary key default gen_random_uuid(),
  entity_slug text unique not null,
  entity_name text not null,
  segment text not null,
  is_preset boolean not null default false,
  dossier_payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.institutional_dossiers to anon, authenticated;
grant all on public.institutional_dossiers to service_role;
alter table public.institutional_dossiers enable row level security;
create policy "Dossiers are publicly readable" on public.institutional_dossiers
  for select to anon, authenticated using (true);

create table public.pilot_simulations (
  id uuid primary key default gen_random_uuid(),
  rm_count integer not null,
  weekly_hours_saved numeric(4,1) not null,
  avg_mandate_fee_aed numeric(12,2) not null,
  win_rate_lift_pct numeric(4,2) not null,
  projected_incremental_fee_aed numeric(14,2) not null,
  created_at timestamptz not null default now()
);
grant all on public.pilot_simulations to service_role;
alter table public.pilot_simulations enable row level security;