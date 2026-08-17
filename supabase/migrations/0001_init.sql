-- Aztrx initial schema
-- Auth/users come from Supabase Auth (auth.users); every table below scopes rows to auth.uid().

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  deadline timestamptz,
  github_repo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  planned_duration_min integer not null,
  status text not null default 'active' check (status in ('active', 'completed', 'broken')),
  verified boolean not null default false
);

create table if not exists public.distraction_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.focus_sessions(id) on delete cascade,
  source text not null check (source in ('extension', 'desktop')),
  domain_or_app text not null,
  occurred_at timestamptz not null default now()
);

create table if not exists public.dependency_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  ecosystem text not null default 'npm' check (ecosystem in ('npm')),
  created_at timestamptz not null default now(),
  unique (project_id, name, ecosystem)
);

create table if not exists public.impact_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.focus_sessions(id) on delete cascade,
  dependency_id uuid not null references public.dependency_snapshots(id) on delete cascade,
  simulated_amount integer not null check (simulated_amount >= 0), -- whole cents
  created_at timestamptz not null default now()
);

create index if not exists focus_sessions_user_id_idx on public.focus_sessions(user_id);
create index if not exists focus_sessions_project_id_idx on public.focus_sessions(project_id);
create index if not exists distraction_events_session_id_idx on public.distraction_events(session_id);
create index if not exists dependency_snapshots_project_id_idx on public.dependency_snapshots(project_id);
create index if not exists impact_ledger_user_id_idx on public.impact_ledger(user_id);

-- Row Level Security: every user can only see/touch their own data.

alter table public.projects enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.distraction_events enable row level security;
alter table public.dependency_snapshots enable row level security;
alter table public.impact_ledger enable row level security;

drop policy if exists "projects_owner_all" on public.projects;
create policy "projects_owner_all" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "focus_sessions_owner_all" on public.focus_sessions;
create policy "focus_sessions_owner_all" on public.focus_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "distraction_events_owner_all" on public.distraction_events;
create policy "distraction_events_owner_all" on public.distraction_events
  for all using (
    exists (
      select 1 from public.focus_sessions s
      where s.id = distraction_events.session_id and s.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.focus_sessions s
      where s.id = distraction_events.session_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "dependency_snapshots_owner_all" on public.dependency_snapshots;
create policy "dependency_snapshots_owner_all" on public.dependency_snapshots
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = dependency_snapshots.project_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.projects p
      where p.id = dependency_snapshots.project_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "impact_ledger_owner_all" on public.impact_ledger;
create policy "impact_ledger_owner_all" on public.impact_ledger
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
