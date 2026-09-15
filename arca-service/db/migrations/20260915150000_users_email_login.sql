-- Up Migration
-- Switches login from username to email. `username`/`display_name` are unchanged
-- and stay as non-auth display fields (see components using user.username as a
-- displayName fallback, e.g. kyra-ipm-v4/src/components/Sidebar.jsx) — only the
-- login credential moves to `email`. See src/routes/auth.js.

alter table public.users add column email text;

-- Backfill any pre-existing row (this repo has exactly one dev user, "mai") with a
-- placeholder so the NOT NULL constraint below can be added safely on an
-- already-migrated database. `npm run seed` overwrites this immediately after
-- migrating (mai -> info@wearekyra.com) — see db/seed.mjs.
update public.users set email = lower(username) || '@wearekyra.com' where email is null;

alter table public.users
  alter column email set not null,
  add constraint users_email_format_check
    check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');

create unique index users_email_unique_idx on public.users (lower(email));

-- Down Migration
drop index if exists public.users_email_unique_idx;
alter table public.users drop constraint if exists users_email_format_check;
alter table public.users drop column if exists email;
