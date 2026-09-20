-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- One row per user holds their whole board as JSON; row-level security ensures
-- each user can only read and write their own row.

create table if not exists public.boards (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.boards enable row level security;

create policy "Users can read their own board"
  on public.boards for select
  using (auth.uid() = user_id);

create policy "Users can insert their own board"
  on public.boards for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own board"
  on public.boards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
