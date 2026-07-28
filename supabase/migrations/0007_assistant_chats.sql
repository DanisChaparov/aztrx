create table if not exists public.assistant_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  history jsonb not null default '[]'::jsonb,
  model text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  reply text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists assistant_chats_user_id_status_idx on public.assistant_chats(user_id, status);

alter table public.assistant_chats enable row level security;

create policy assistant_chats_owner_all on public.assistant_chats
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
