create table if not exists public.session_app_usage (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.focus_sessions(id) on delete cascade,
  app_name text not null,
  seconds_active integer not null default 0 check (seconds_active >= 0),
  created_at timestamptz not null default now(),
  unique (session_id, app_name)
);

create index if not exists session_app_usage_session_id_idx on public.session_app_usage(session_id);

alter table public.session_app_usage enable row level security;

drop policy if exists session_app_usage_owner_all on public.session_app_usage;
create policy session_app_usage_owner_all on public.session_app_usage
  for all
  using (exists (select 1 from public.focus_sessions fs where fs.id = session_id and fs.user_id = auth.uid()))
  with check (exists (select 1 from public.focus_sessions fs where fs.id = session_id and fs.user_id = auth.uid()));
