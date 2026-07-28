-- Stores each user's GitHub OAuth access token (captured client-side from the
-- Supabase sign-in session) so the verify-session Edge Function can call the
-- GitHub API server-side without ever exposing the token to other users.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  github_access_token text,
  github_username text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_owner_select" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_owner_upsert" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_owner_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Edge Functions run with the service role key and bypass RLS by design,
-- so verify-session can read tokens across users without a dedicated policy.
