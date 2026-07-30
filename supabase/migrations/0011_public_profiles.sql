-- Opt-in public developer profiles.
--
-- Off by default and never inferred: a profile makes claims about how someone
-- works ("most projects go quiet after three weeks"), and publishing that about
-- a person who never asked for it is not something a default should decide.

alter table public.profiles
  add column if not exists public_profile boolean not null default false;

-- Anonymous visitors must NOT be given select on public.profiles. The row holds
-- github_access_token, and no column-level policy protects it once select is
-- granted — one careless `select *` and every opted-in user's token is public.
--
-- Instead, a security-definer function returns only the safe field. It runs with
-- the owner's rights, so the table stays unreadable to anon while this one
-- lookup works.
create or replace function public.get_public_profile(lookup_username text)
returns table (github_username text)
language sql
security definer
set search_path = public
as $$
  select p.github_username
  from public.profiles p
  where p.public_profile = true
    and lower(p.github_username) = lower(lookup_username)
  limit 1;
$$;

revoke all on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;
