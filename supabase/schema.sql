-- Scripter — cloud schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.

create table if not exists public.scripts (
  id         text primary key,                 -- client-generated script id
  user_id    uuid not null references auth.users (id) on delete cascade,
  data       jsonb not null,                   -- the full Script object
  updated_at timestamptz not null default now()
);

create index if not exists scripts_user_idx on public.scripts (user_id, updated_at desc);

-- Row Level Security: every user can only see and touch their own scripts.
alter table public.scripts enable row level security;

drop policy if exists "scripts_select_own" on public.scripts;
drop policy if exists "scripts_insert_own" on public.scripts;
drop policy if exists "scripts_update_own" on public.scripts;
drop policy if exists "scripts_delete_own" on public.scripts;

create policy "scripts_select_own" on public.scripts
  for select using (auth.uid() = user_id);
create policy "scripts_insert_own" on public.scripts
  for insert with check (auth.uid() = user_id);
create policy "scripts_update_own" on public.scripts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "scripts_delete_own" on public.scripts
  for delete using (auth.uid() = user_id);

-- Sharing: a public flag + a read policy so "anyone with the link" can view.
alter table public.scripts add column if not exists is_public boolean not null default false;
drop policy if exists "scripts_public_read" on public.scripts;
create policy "scripts_public_read" on public.scripts
  for select using (is_public = true);
