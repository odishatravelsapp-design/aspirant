-- Aspirant — Supabase schema for optional cloud sync.
-- Run this in your Supabase project: SQL Editor → paste → Run.
-- The app works fully offline without this; it only enables cross-device backup.

create table if not exists public.attempts (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  finished_at bigint not null,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists attempts_user_idx on public.attempts (user_id);

-- Row Level Security: every user can only read/write their OWN attempts.
alter table public.attempts enable row level security;

drop policy if exists "own attempts - select" on public.attempts;
create policy "own attempts - select"
  on public.attempts for select
  using (auth.uid() = user_id);

drop policy if exists "own attempts - upsert" on public.attempts;
create policy "own attempts - insert"
  on public.attempts for insert
  with check (auth.uid() = user_id);

drop policy if exists "own attempts - update" on public.attempts;
create policy "own attempts - update"
  on public.attempts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
