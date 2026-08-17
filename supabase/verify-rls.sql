-- RLS verification for the Aztrx external audit (F-2).
-- Run in the Supabase SQL editor against the PRODUCTION project.
-- Every query below should return the result noted in its comment.

-- 1. Every `public` table must have row level security enabled.
--    Expected: every row shows rls_enabled = true.
select c.relname as table_name,
       c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;

-- 2. No policy may grant the anonymous role access.
--    Expected: ZERO rows returned.
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and 'anon' = any (roles);

-- 3. The account-deletion RPC must not be executable by anonymous clients.
--    Expected: `anon` and `public` are absent from the proacl / grants list.
select p.proname,
       p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'delete_user_account';
