-- Up Migration
-- Core building blocks shared by the entities and clients modules.
-- Ported from kyra-ipm-v4/supabase/migrations, minus the Supabase-specific parts:
--   * `private.handle_new_user()` + the `auth.users` trigger are dropped
--   * `auth.uid()` is replaced by `private.current_actor()` (reads `app.user_id`,
--     set per-transaction by src/db/pool.js `withActor`)
--   * `public.profiles` is folded into `public.users` (username + display_name live here)

create schema if not exists private;
revoke all on schema private from public;

-- Current acting user id, set per-transaction via set_config('app.user_id', ...).
create or replace function private.current_actor()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid;
$$;

create or replace function private.is_valid_cuit(value text)
returns boolean
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  digits text := regexp_replace(value, '[^0-9]', '', 'g');
  weights integer[] := array[5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  total integer := 0;
  verifier integer;
begin
  if length(digits) <> 11 or digits ~ '^(.)\1+$' then
    return false;
  end if;

  for digit_index in 1..10 loop
    total := total + substring(digits from digit_index for 1)::integer * weights[digit_index];
  end loop;

  verifier := 11 - (total % 11);
  if verifier = 11 then
    verifier := 0;
  elsif verifier = 10 then
    verifier := 9;
  end if;

  return verifier = right(digits, 1)::integer;
end;
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Application users (replaces Supabase Auth + public.profiles).
create table public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null check (username ~ '^[a-z0-9][a-z0-9._-]{2,31}$'),
  display_name text not null check (length(btrim(display_name)) between 2 and 100),
  password_hash text not null,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index users_username_unique_idx on public.users (lower(username));

create trigger users_set_updated_at
before update on public.users
for each row execute function private.set_updated_at();

-- Down Migration
drop table if exists public.users;
drop function if exists private.set_updated_at();
drop function if exists private.is_valid_cuit(text);
drop function if exists private.current_actor();
drop schema if exists private;
