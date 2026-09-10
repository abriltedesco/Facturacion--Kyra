# arca-service — Phase 2 handoff

## Where things stand (Phase 1, done)

- New standalone microservice at `arca-service/` (sibling of `kyra-ipm-v4/`).
- Node.js + Express, ESM (`"type": "module"`).
- `server.js`: Express + `cors` (origin `http://localhost:5173`, override via `CORS_ORIGIN`) + `express.json()` + `GET /` -> `200 {"status":"ok","service":"arca-service"}` + listener on `PORT` (default 3001).
- Dependencies installed: `express`, `cors`, `dotenv`, `@afipsdk/afip.js` (the real npm package for "afip.js" is `@afipsdk/afip.js`).
- `.env.example`: `PORT`, `CUIT`, `CERT_PATH`, `KEY_PATH`, `NODE_ENV`.
- `.gitignore`: `node_modules/`, `.env`, `*.crt`, `*.key`, `*.pem`.
- Run: `cd arca-service && npm run dev` (uses `node --watch`).

**Cleanup note:** a stray `.env` with `PORT=3001` was created at the repo root by mistake. Delete it; only `arca-service/.env` is needed.

Phase 2 (WSAA auth + WSFE emission endpoints) is on hold until the fiscal definitions arrive
(comprobante types, IVA condition of the issuer, punto de venta, concepto, currency).

---

## Decision: replace Supabase entirely

The `arca-service` Express backend becomes the **only** backend. Supabase (DB hosting,
Auth, Storage, Edge Functions, `@supabase/supabase-js`) is removed. The frontend talks
only to `arca-service` over HTTP.

### Database engine: still PostgreSQL

Keep PostgreSQL — do not switch to MySQL/Mongo. Invoicing data is fiscal: it needs ACID
transactions, referential integrity, and years of auditability. Only the *hosting* and the
*access path* change.

- **Managed:** Neon, Railway, Render, DigitalOcean Managed Postgres, or AWS RDS.
- **Local dev:** Docker `postgres:16` (`docker compose` with one service + a named volume).
- Connect from Node with **`pg`** (node-postgres) and a `DATABASE_URL` env var.

### Migrations

The existing SQL migrations in `kyra-ipm-v4/supabase/migrations/` are plain PostgreSQL and
stay valid, **except** the Supabase-specific parts that must be rewritten:

- `auth.users`, `auth.uid()` references -> replace with your own `users` table and pass the
  current user id from the app layer.
- Row Level Security (RLS) policies -> move authorization into Express middleware / query
  filters. Drop the `policy` / `enable row level security` statements or keep RLS only if
  you also issue per-request Postgres roles (more complex; app-level checks are simpler).
- `SECURITY DEFINER` RPCs (`register_arca_document`, `save_billing_entity`, ...) -> keep as
  Postgres functions **or** reimplement as `pg` transactions inside the service.

Move the migration files into `arca-service/` (e.g. `arca-service/db/migrations/`) and run
them with a Node migration tool: **`node-pg-migrate`** or **`drizzle-kit`**. If you adopt an
ORM, `drizzle-orm` (ESM-first, lightweight) fits this stack better than Prisma.

### Auth (replaces Supabase Auth)

Current frontend uses `supabase.auth` with username -> technical email
(`src/domain/authIdentity.js`, `src/context/AuthContext.jsx`).

Replacement in `arca-service`:

- `users` table: `id`, `username`, `password_hash` (bcrypt / argon2), `role`, timestamps.
- `POST /auth/login` -> verify password, return a signed **JWT** (`jsonwebtoken`) +
  optional refresh token.
- `authMiddleware` verifies the JWT on protected routes and puts `req.user` in scope.
- Frontend stores the token (httpOnly cookie preferred) and sends it on every request.
- Libraries: `bcrypt` (or `argon2`), `jsonwebtoken`. Optional higher-level: `lucia`.
  A hosted option (Clerk / Auth0) also works if you want to avoid owning auth.

### File storage (replaces Supabase Storage, bucket `arca-documents`)

The `upload-arca-document` Edge Function stores ARCA PDFs. Replace with:

- **S3-compatible object storage:** Cloudflare R2 (no egress fees) or AWS S3; MinIO for
  local dev. Access with `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`.
- Express route `POST /entities/:id/arca-document` using `multer` (memory storage) for the
  multipart upload; keep the existing validations (PDF signature `%PDF-`, 10 MB max,
  entity checks), upload to the bucket, then insert the metadata row in one transaction
  (port `register_arca_document`).

### Edge Functions -> Express routes

Port `kyra-ipm-v4/supabase/functions/upload-arca-document/index.ts` to an Express handler
in `arca-service`. Same request/response contract so the frontend change is minimal.

### Frontend changes (`kyra-ipm-v4`)

Remove `@supabase/supabase-js` and rewrite these files to call `arca-service` via `fetch`:

- `src/lib/supabase.js` -> `src/lib/api.js` (base URL + auth header helper).
- `src/context/AuthContext.jsx` -> login/logout against `/auth/*`, token in memory/cookie.
- `src/context/EntitiesContext.jsx`, `src/context/ClientsContext.jsx`
- `src/services/entityRepository.js`, `src/services/clientRepository.js`
- `src/pages/EntidadDetallePage.jsx`
- Drop `supabase:*` scripts and the `supabase` dev dependency from `package.json`.

### New `arca-service` dependencies (Phase 2+)

`pg`, `jsonwebtoken`, `bcrypt` (or `argon2`), `multer`, `@aws-sdk/client-s3`,
`@aws-sdk/s3-request-presigner`, `zod` (input validation), and a migration tool
(`node-pg-migrate` or `drizzle-orm` + `drizzle-kit`). Dev: `vitest` or `node:test`.

### Suggested `arca-service` structure

```
arca-service/
  server.js            # app bootstrap (done)
  src/
    app.js             # express app, middleware wiring
    routes/            # auth, entities, clients, arca (emission)
    middleware/        # authMiddleware, error handler
    db/
      pool.js          # pg Pool from DATABASE_URL
      migrations/      # ported + rewritten SQL
    services/          # arca (WSAA/WSFE), storage (S3), ...
    lib/               # afip client factory, jwt helpers
  docs/
```

### What must NOT go in the database

- ARCA certificate / private key -> filesystem (`CERT_PATH`, `KEY_PATH`) or a secret manager.
- Any secret in plaintext columns.

### Summary

| Concern | Before (Supabase) | After |
| --- | --- | --- |
| DB engine | PostgreSQL (Supabase-hosted) | PostgreSQL (Neon/Railway/RDS/Docker) |
| DB access | `@supabase/supabase-js` from browser | `pg` from `arca-service` only |
| Migrations | Supabase CLI | `node-pg-migrate` / `drizzle-kit` |
| Auth | Supabase Auth | JWT in Express (`bcrypt` + `jsonwebtoken`) |
| Authorization | RLS policies | Express middleware + query filters |
| File storage | Supabase Storage bucket | S3-compatible (R2 / S3 / MinIO) |
| Server logic | Edge Functions (Deno) | Express routes (Node) |
| Frontend data layer | `supabase.from()/auth/storage` | `fetch` to `arca-service` |
