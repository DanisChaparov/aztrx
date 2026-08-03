-- Profile fields for notifications and personalization.
-- Email comes from Supabase Auth (auth.users.email) — we just mirror it here
-- for convenience in queries that need user info without joining auth.users.

alter table public.profiles
  add column if not exists display_name text;

alter table public.profiles
  add column if not exists phone text;

-- Notification preferences: which events trigger a notification.
-- All default to true so new users get the full experience; they can opt out.
alter table public.profiles
  add column if not exists notify_session_complete boolean not null default true;

alter table public.profiles
  add column if not exists notify_deadline boolean not null default true;

alter table public.profiles
  add column if not exists notify_achievement boolean not null default true;

alter table public.profiles
  add column if not exists notify_streak_risk boolean not null default true;

-- Existing RLS policies cover these columns — no new policies needed.
