-- Soft-archive for projects. Instead of deleting, projects can be archived so
-- historical session data stays linked. Archived projects don't show in the
-- active projects list but their sessions and commits remain intact.
alter table public.projects
  add column if not exists archived boolean not null default false;

-- The existing RLS policies on projects (projects_owner_all) already cover
-- this column — no new policy needed.
