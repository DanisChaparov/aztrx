-- Optional user-provided Anthropic API key for free-tier AI features.
-- Free users who don't have Claude Code installed can provide their own API key
-- to unlock the AI mentor without upgrading to Pro. The key is only used for
-- AI calls the user initiates through Aztrx and is never shared or logged.
--
-- Stored in the profiles table alongside the GitHub token. RLS policies on
-- profiles already restrict access to the owning user (via auth.uid() = id),
-- and the existing profiles_owner_update policy covers updates.
alter table public.profiles
  add column if not exists anthropic_api_key text;
