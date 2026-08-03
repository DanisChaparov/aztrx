-- Ambient activity tracking.
--
-- Unlike session_app_usage, which is tied to an active focus session, this table
-- records the user's focused window periodically regardless of whether a session
-- is running. Session-less records (session_id = null) capture the broader pattern:
-- when someone works, what tools they use, and how their habits change over time.
--
-- The desktop app syncs aggregated summaries; raw per-second events stay local
-- and are pruned after 7 days. This table stores the hourly bucketed summary that
-- the AI mentor and developer profile read from.

create table if not exists public.ambient_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- The app/process name the OS reports (e.g. "Code", "chrome", "WindowsTerminal").
  app_name text not null,
  -- The full window title at time of recording — e.g. "auth.ts — upstream-api — Visual Studio Code".
  -- This is where project/file/language detection comes from.
  window_title text,
  -- Resolved tracked-tool name (e.g. "Visual Studio Code", "Claude Code"), or null
  -- if the app isn't a known developer tool.
  tracked_tool text,
  -- Whether the detected tool is an AI coding assistant.
  is_ai_assisted boolean not null default false,
  -- Bucketed to the start of the hour this record covers.
  bucket_hour timestamptz not null,
  -- Total seconds this app was focused during this hour bucket.
  seconds_focused integer not null default 0 check (seconds_focused >= 0),
  -- If a session was active during this bucket, link it. null = ambient (no session).
  session_id uuid references public.focus_sessions(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, bucket_hour, app_name, session_id)
);

create index if not exists ambient_activity_user_id_idx on public.ambient_activity(user_id);
create index if not exists ambient_activity_bucket_hour_idx on public.ambient_activity(bucket_hour);
create index if not exists ambient_activity_session_id_idx on public.ambient_activity(session_id);

alter table public.ambient_activity enable row level security;

drop policy if exists ambient_activity_owner_all on public.ambient_activity;
create policy ambient_activity_owner_all on public.ambient_activity
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
