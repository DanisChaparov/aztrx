-- Multi-provider auth support.
-- Adds auth_provider tracking so the app knows HOW a user signed up, and
-- avatar_url so the UI can show the user's profile picture from whichever
-- provider they used (GitHub, Google, Facebook, Twitter/X, or email).

alter table public.profiles
  add column if not exists auth_provider text,
  add column if not exists avatar_url text;

-- Backfill: anyone who has a github_username already signed in with GitHub.
update public.profiles
  set auth_provider = 'github'
  where auth_provider is null and github_username is not null;
