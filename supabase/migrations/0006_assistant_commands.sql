alter table public.projects add column if not exists local_path text;

create table if not exists public.assistant_commands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('launch_app', 'run_dev_command', 'run_shell')),
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed', 'failed')),
  result text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists assistant_commands_user_id_status_idx on public.assistant_commands(user_id, status);

alter table public.assistant_commands enable row level security;

drop policy if exists assistant_commands_owner_all on public.assistant_commands;
create policy assistant_commands_owner_all on public.assistant_commands
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
