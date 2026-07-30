-- Plans. Nothing is charged for yet — this exists so that when payment lands it
-- flips a value rather than requiring a schema change under live accounts.
alter table public.profiles
  add column if not exists plan text not null default 'free';

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check check (plan in ('free', 'pro'));

-- Set to a real timestamp when a subscription starts; null means "free, or
-- granted manually" and is what every account has today.
alter table public.profiles
  add column if not exists plan_since timestamptz;

-- Deliberately no update policy for `plan`: the existing owner-update policy on
-- profiles would otherwise let anyone set their own plan to 'pro' straight from
-- the browser, since the anon key is public by design. Upgrades must come from
-- the service role — a webhook, or the SQL editor.
create or replace function public.prevent_self_plan_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.plan is distinct from old.plan and auth.role() <> 'service_role' then
    raise exception 'plan can only be changed by the service role';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_plan_guard on public.profiles;
create trigger profiles_plan_guard
  before update on public.profiles
  for each row execute function public.prevent_self_plan_change();
