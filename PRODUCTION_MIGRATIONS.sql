-- ============================================================================
-- Aztrx — All Production Migrations
-- Paste this ENTIRE file into:
-- https://supabase.com/dashboard/project/cexmcxpdkdxlaqjwrxni/sql/new
-- Then click "Run"
-- ============================================================================

-- 0001_init.sql
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
  simulated_amount integer not null check (simulated_amount >= 0),
  created_at timestamptz not null default now()
);

create index if not exists focus_sessions_user_id_idx on public.focus_sessions(user_id);
create index if not exists focus_sessions_project_id_idx on public.focus_sessions(project_id);
create index if not exists distraction_events_session_id_idx on public.distraction_events(session_id);
create index if not exists dependency_snapshots_project_id_idx on public.dependency_snapshots(project_id);
create index if not exists impact_ledger_user_id_idx on public.impact_ledger(user_id);

alter table public.projects enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.distraction_events enable row level security;
alter table public.dependency_snapshots enable row level security;
alter table public.impact_ledger enable row level security;

create policy "projects_owner_all" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "focus_sessions_owner_all" on public.focus_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "distraction_events_owner_all" on public.distraction_events for all using (exists (select 1 from public.focus_sessions s where s.id = distraction_events.session_id and s.user_id = auth.uid())) with check (exists (select 1 from public.focus_sessions s where s.id = distraction_events.session_id and s.user_id = auth.uid()));
create policy "dependency_snapshots_owner_all" on public.dependency_snapshots for all using (exists (select 1 from public.projects p where p.id = dependency_snapshots.project_id and p.user_id = auth.uid())) with check (exists (select 1 from public.projects p where p.id = dependency_snapshots.project_id and p.user_id = auth.uid()));
create policy "impact_ledger_owner_all" on public.impact_ledger for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 0002_profiles.sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  github_access_token text,
  github_username text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "profiles_owner_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_owner_upsert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_owner_update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- 0003_push_subscriptions.sql
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
create policy "push_subscriptions_owner_all" on public.push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 0004_session_app_usage.sql
create table if not exists public.session_app_usage (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.focus_sessions(id) on delete cascade,
  app_name text not null,
  window_title text,
  tracked_tool text,
  is_ai_assisted boolean not null default false,
  seconds_focused integer not null default 0 check (seconds_focused >= 0),
  created_at timestamptz not null default now(),
  unique (session_id, app_name, window_title)
);

create index if not exists session_app_usage_session_id_idx on public.session_app_usage(session_id);
alter table public.session_app_usage enable row level security;
create policy "session_app_usage_owner_all" on public.session_app_usage for all using (exists (select 1 from public.focus_sessions s where s.id = session_app_usage.session_id and s.user_id = auth.uid())) with check (exists (select 1 from public.focus_sessions s where s.id = session_app_usage.session_id and s.user_id = auth.uid()));

-- 0005_session_commits.sql
create table if not exists public.session_commits (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.focus_sessions(id) on delete cascade,
  sha text not null,
  message text,
  html_url text,
  additions integer,
  deletions integer,
  committed_at timestamptz,
  unique (session_id, sha)
);

create index if not exists session_commits_session_id_idx on public.session_commits(session_id);
alter table public.session_commits enable row level security;
create policy "session_commits_owner_all" on public.session_commits for all using (exists (select 1 from public.focus_sessions s where s.id = session_commits.session_id and s.user_id = auth.uid())) with check (exists (select 1 from public.focus_sessions s where s.id = session_commits.session_id and s.user_id = auth.uid()));

-- 0006_assistant_commands.sql
create table if not exists public.assistant_commands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.focus_sessions(id) on delete set null,
  command text not null,
  response text,
  created_at timestamptz not null default now()
);

create index if not exists assistant_commands_user_id_idx on public.assistant_commands(user_id);
alter table public.assistant_commands enable row level security;
create policy "assistant_commands_owner_all" on public.assistant_commands for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 0007_assistant_chats.sql
create table if not exists public.assistant_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now()
);

create index if not exists assistant_chats_user_id_idx on public.assistant_chats(user_id);
alter table public.assistant_chats enable row level security;
create policy "assistant_chats_owner_all" on public.assistant_chats for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 0008_assistant_tts.sql
create table if not exists public.assistant_tts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chat_id uuid references public.assistant_chats(id) on delete cascade,
  voice_id text,
  audio_url text,
  created_at timestamptz not null default now()
);

create index if not exists assistant_tts_user_id_idx on public.assistant_tts(user_id);
alter table public.assistant_tts enable row level security;
create policy "assistant_tts_owner_all" on public.assistant_tts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 0009_assistant_commands_type_text.sql
alter table public.assistant_commands add column if not exists type text not null default 'text';
alter table public.assistant_commands drop constraint if exists assistant_commands_type_check;
alter table public.assistant_commands add constraint assistant_commands_type_check check (type in ('text', 'voice'));

-- 0010_profile_plans.sql
alter table public.profiles add column if not exists plan text not null default 'free';
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('free', 'pro'));
alter table public.profiles add column if not exists plan_since timestamptz;

create or replace function public.prevent_self_plan_change()
returns trigger language plpgsql security definer as $$
begin
  if new.plan is distinct from old.plan and auth.role() <> 'service_role' then
    raise exception 'plan can only be changed by the service role';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_plan_guard on public.profiles;
create trigger profiles_plan_guard before update on public.profiles for each row execute function public.prevent_self_plan_change();

-- 0011_public_profiles.sql
alter table public.profiles add column if not exists public_profile boolean not null default false;

create or replace function public.get_public_profile(lookup_username text)
returns table (github_username text)
language sql security definer set search_path = public as $$
  select p.github_username from public.profiles p
  where p.public_profile = true and lower(p.github_username) = lower(lookup_username)
  limit 1;
$$;

revoke all on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;

-- 0012_ambient_activity.sql
create table if not exists public.ambient_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_name text not null,
  window_title text,
  tracked_tool text,
  is_ai_assisted boolean not null default false,
  bucket_hour timestamptz not null,
  seconds_focused integer not null default 0 check (seconds_focused >= 0),
  session_id uuid references public.focus_sessions(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, bucket_hour, app_name, session_id)
);

create index if not exists ambient_activity_user_id_idx on public.ambient_activity(user_id);
create index if not exists ambient_activity_bucket_hour_idx on public.ambient_activity(bucket_hour);
create index if not exists ambient_activity_session_id_idx on public.ambient_activity(session_id);
alter table public.ambient_activity enable row level security;
create policy ambient_activity_owner_all on public.ambient_activity for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 0013_anthropic_api_key.sql
alter table public.profiles add column if not exists anthropic_api_key text;

-- 0014_trial_columns.sql
alter table public.profiles add column if not exists trial_ends_at timestamptz;
alter table public.profiles add column if not exists trial_used boolean not null default false;

-- 0015_project_archive.sql
alter table public.projects add column if not exists archived boolean not null default false;

-- 0016_profile_notifications.sql
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists notify_session_complete boolean not null default true;
alter table public.profiles add column if not exists notify_deadline boolean not null default true;
alter table public.profiles add column if not exists notify_achievement boolean not null default true;
alter table public.profiles add column if not exists notify_streak_risk boolean not null default true;

-- 0017_multi_provider_profiles.sql
alter table public.profiles add column if not exists auth_provider text;
alter table public.profiles add column if not exists avatar_url text;
update public.profiles set auth_provider = 'github' where auth_provider is null and github_username is not null;
