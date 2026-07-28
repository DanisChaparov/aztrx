create table if not exists public.assistant_tts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  audio_base64 text,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists assistant_tts_user_id_status_idx on public.assistant_tts(user_id, status);

alter table public.assistant_tts enable row level security;

create policy assistant_tts_owner_all on public.assistant_tts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
