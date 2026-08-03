-- Trial infrastructure for the Pro plan.
-- trial_ends_at: when set to a future date, the user has Pro features during the trial.
-- trial_used: prevents re-starting a trial after it expires (one per account).
--
-- The existing profiles_owner_update RLS policy covers these columns — only the
-- owning user (and service role) can modify them.
alter table public.profiles
  add column if not exists trial_ends_at timestamptz;

alter table public.profiles
  add column if not exists trial_used boolean not null default false;
