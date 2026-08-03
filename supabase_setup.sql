create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text not null,
  incident_date date not null,
  legal_era text not null check (legal_era in ('IPC', 'BNS')),
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.section_mappings (
  id uuid primary key default gen_random_uuid(),
  ipc_section text not null unique,
  ipc_title text not null,
  bns_section text not null,
  bns_title text not null,
  notes text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.chat_history enable row level security;
alter table public.section_mappings enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can read own history" on public.chat_history;
create policy "Users can read own history"
on public.chat_history for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Service role can manage history" on public.chat_history;
create policy "Service role can manage history"
on public.chat_history for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Authenticated users can read mappings" on public.section_mappings;
create policy "Authenticated users can read mappings"
on public.section_mappings for select to authenticated
using (true);

drop policy if exists "Public can read mappings" on public.section_mappings;
create policy "Public can read mappings"
on public.section_mappings for select to anon
using (true);

drop policy if exists "Service role can manage mappings" on public.section_mappings;
create policy "Service role can manage mappings"
on public.section_mappings for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- After creating your own account, make it admin by replacing the email below.
-- update public.profiles set role = 'admin' where email = 'your-email@example.com';

-- Seed the top-50 mapping rows with:
-- cd backend
-- python seed_mappings.py
