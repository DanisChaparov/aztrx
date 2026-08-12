-- Security hardening from the Aug 2026 external audit.
--
-- F-2 (RLS). The schema is already RLS-enabled with owner-scoped policies; the
-- statements below re-assert that defensively so a missed `alter table` in an
-- older environment can't leave a table open. Idempotent by design.

alter table public.projects enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.distraction_events enable row level security;
alter table public.dependency_snapshots enable row level security;
alter table public.impact_ledger enable row level security;
alter table public.profiles enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.session_app_usage enable row level security;
alter table public.session_commits enable row level security;
alter table public.assistant_commands enable row level security;
alter table public.assistant_chats enable row level security;
alter table public.assistant_tts enable row level security;
alter table public.ambient_activity enable row level security;

-- Hardening: the account-deletion RPC is SECURITY DEFINER. PostgreSQL grants
-- EXECUTE on functions to PUBLIC by default, which would let the anonymous role
-- invoke it (a no-op today, since auth.uid() is null for anon, but still wrong).
-- Restrict it to signed-in users only.
revoke execute on function public.delete_user_account() from public;
revoke execute on function public.delete_user_account() from anon;
grant execute on function public.delete_user_account() to authenticated;
