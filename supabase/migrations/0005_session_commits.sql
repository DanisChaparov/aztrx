create table if not exists public.session_commits (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.focus_sessions(id) on delete cascade,
  sha text not null,
  message text not null,
  html_url text not null,
  additions integer,
  deletions integer,
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, sha)
);

create index if not exists session_commits_session_id_idx on public.session_commits(session_id);

alter table public.session_commits enable row level security;

drop policy if exists session_commits_owner_all on public.session_commits;
create policy session_commits_owner_all on public.session_commits
  for all
  using (exists (select 1 from public.focus_sessions fs where fs.id = session_id and fs.user_id = auth.uid()))
  with check (exists (select 1 from public.focus_sessions fs where fs.id = session_id and fs.user_id = auth.uid()));
