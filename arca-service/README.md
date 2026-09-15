# arca-service

Backend for the Kyra invoicing system: auth, billing entities, clients, and (later)
ARCA/AFIP emission. Node.js + Express (ESM), PostgreSQL via `pg`. Replaces Supabase
entirely — see [`docs/phase-2-handoff.md`](docs/phase-2-handoff.md) for the migration
rationale.

## Requirements

- Node.js 20+
- A local PostgreSQL 16 (native install or Docker — either works, see below)

## Quick start

```bash
cp .env.example .env          # defaults already match a local Postgres on 5432
npm install

# Option A — you already have Postgres running locally on 5432 with user/password
# postgres/postgres: just create the database.
createdb arca                 # or: psql -U postgres -c "create database arca"

# Option B — Docker instead of a native install:
npm run db:up                 # docker compose up -d (postgres:16)

npm run migrate                # runs db/migrations/ with node-pg-migrate
npm run seed                   # dev data: user mai / KyraLocal2026, 3 entities, 12 clients
npm run dev                    # node --watch server.js, http://localhost:3001
```

`GET /` returns `{"status":"ok","service":"arca-service"}` once it's up.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the API with `node --watch` |
| `npm start` | Start the API (no watch) |
| `npm run db:up` / `db:down` | `docker compose up -d` / `down` for local Postgres |
| `npm run migrate` / `migrate:down` | Apply / roll back `db/migrations/` |
| `npm run reset` | Drop, re-apply every migration, and reseed (dev convenience) |
| `npm run seed` | Load dev data from `db/seed.mjs` |
| `npm test` | Run the vitest + supertest suite against a throwaway `arca_test` database |

## Layout

```
server.js            # bootstraps the app, listens on PORT
src/
  app.js             # express app + middleware + router wiring
  config.js           # env var reading, one place
  db/pool.js         # pg Pool, withTransaction, withActor (sets app.user_id per tx)
  lib/               # jwt, username normalization, pg error -> HTTP status, signed links
  middleware/        # authMiddleware, errorHandler
  routes/            # auth, entities, clients, catalogs, files
  services/          # entities/clients query assembly, local-fs PDF storage
db/
  migrations/        # node-pg-migrate SQL, ported from kyra-ipm-v4/supabase/migrations
  seed.mjs           # dev data
test/                # vitest + supertest integration suite (own arca_test database)
storage/             # gitignored — uploaded ARCA PDFs land here (STORAGE_DIR)
```

## Auth

`POST /auth/login { username, password }` sets a signed httpOnly cookie
(`arca_session`); the frontend must call with `credentials: 'include'`. There's no
sign-up flow — users are provisioned directly in the `users` table (see `db/seed.mjs`
for the pattern: bcrypt-hash the password, insert with a role).

## What's ported from Supabase, and what changed

Every table, constraint, index, and RPC (`save_billing_entity`, `save_client`,
`register_arca_document`, ...) from `kyra-ipm-v4/supabase/migrations/` was ported as-is
into `db/migrations/`, with three changes:

- `auth.users` → `public.users` (a plain table now; `profiles` folded into it).
- `auth.uid()` → `private.current_actor()`, fed by `SET LOCAL app.user_id` per
  transaction (see `withActor` in `src/db/pool.js`).
- RLS, policies, grants, and the Storage bucket are gone — a single trusted DB
  connection plus Express route guards replace them.

The RPC error contract (SQLSTATE codes like `40001`/`23505`/`23514`, and message
strings like `INVALID_FISCAL_ID`) is preserved byte-for-byte in every JSON error
response (`{ error, message }`), because the frontend's repository error mappers
(`kyra-ipm-v4/src/services/*Repository.js`) key on exactly those values.

ARCA PDFs live on the local filesystem (`STORAGE_DIR`) instead of a Supabase Storage
bucket, served through short-lived HMAC-signed links (`GET /files/:token`) instead of
`createSignedUrl`.

## Emission (WSAA/WSFE)

Still on hold pending fiscal definitions (comprobante types, IVA condition, punto de
venta, concepto, currency) — see `docs/phase-2-handoff.md`.
