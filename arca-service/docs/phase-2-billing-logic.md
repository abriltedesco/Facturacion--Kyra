# arca-service — Phase 2: Billing Logic (WSFE emission)

Brief for the next phase of work. Captures (1) the current state of `arca-service`
handed off from the Supabase migration, and (2) the business rules confirmed by the
client for WSFE (domestic AFIP/ARCA) invoice emission. No emission code exists yet —
this doc is the starting brief, not a design.

## 1. Current `arca-service` structure

```
arca-service/
├── server.js                      # bootstraps the app, listens on PORT
├── docker-compose.yml              # postgres:16 (optional — native Postgres works too)
├── .env / .env.example / .env.test
├── package.json                    # express, pg, jsonwebtoken, bcryptjs, multer, cookie-parser,
│                                    # node-pg-migrate, zod, vitest, supertest
├── db/
│   ├── migrations/
│   │   ├── 20260902180000_core.sql            # private schema, is_valid_cuit, current_actor(),
│   │   │                                       # public.users (auth)
│   │   ├── 20260902190000_entities_module.sql # billing_entities, entity_bank_accounts,
│   │   │                                       # entity_arca_documents + save_billing_entity,
│   │   │                                       # set_billing_entity_status, register_arca_document,
│   │   │                                       # revoke_arca_document
│   │   └── 20260908120000_clients_module.sql  # countries, fiscal_conditions, tax_categories,
│   │                                           # clients, client_emails + save_client,
│   │                                           # set_client_status, save_country/condition/category
│   └── seed.mjs                    # dev user (mai), 3 entities, 12 clients, catalogs
├── src/
│   ├── app.js                      # express app, middleware + router wiring
│   ├── config.js                   # single place all env vars are read
│   ├── db/pool.js                  # pg Pool, withTransaction, withActor (SET app.user_id)
│   ├── lib/
│   │   ├── jwt.js                  # session sign/verify
│   │   ├── username.js             # normalizeUsername
│   │   ├── pgError.js              # SQLSTATE -> HTTP status
│   │   └── signedLink.js           # HMAC download tokens (ARCA PDFs)
│   ├── middleware/
│   │   ├── authMiddleware.js       # cookie -> req.user
│   │   └── errorHandler.js         # -> { error, message } JSON contract
│   ├── routes/
│   │   ├── auth.js                 # /auth/login, /logout, /session
│   │   ├── entities.js             # /entities CRUD + ARCA doc upload/revoke/link
│   │   ├── clients.js              # /clients CRUD
│   │   ├── catalogs.js             # /countries, /fiscal-conditions, /tax-categories
│   │   └── files.js                # /files/:token — unauthenticated PDF download
│   └── services/
│       ├── entities.js             # nested entity query assembly
│       ├── clients.js              # nested client query assembly
│       └── storage.js              # local-fs PDF put/read/remove
└── test/                           # vitest + supertest, own arca_test database (23 tests)
```

This covers auth and the Administración module (entities, clients, catalogs) only —
no fiscal/emission logic exists yet. `billing_entities` already carries `legal_type`,
`country_code`, `fiscal_id_type`, `default_voucher`, and `point_of_sale`, but nothing
reads or acts on them beyond storing/displaying.

## 2. Business rules confirmed by the client

1. **Issuer is Responsable Inscripto.** Kyra SRL (`billing_entities` id 1) is the
   AR/CUIT/`srl` entity already seeded this way — the issuer side of every WSFE call.

2. **Domestic only, via WSFE, "Factura A" or "Factura B" chosen by the receiver's tax
   status.** This is a per-invoice decision driven by the *client's* fiscal condition
   (Responsable Inscripto → A, everything else domestic → B) — not a fixed value read
   off the entity. That's a different shape than the current
   `billing_entities.default_voucher` field, which is fixed per issuer, not computed
   per invoice.

3. **A specific Punto de Venta for Web Services, from an environment variable.**
   Distinct from the `point_of_sale` values already stored per entity in the DB — the
   env var is the authoritative WSFE POS; it should not be assumed to match whatever's
   on the entity row. Open design question for Phase 2 planning: how the env-var POS
   and the entity's stored `point_of_sale` relate (e.g. does the env var apply only to
   Kyra SRL, or override per-entity values entirely).

4. **No international billing in this system.** Mercury LLC (the `llc`/US/EIN entity)
   stays completely outside WSFE/ARCA logic — Phase 2 only ever touches AR entities.

## Status (2026-09-13)

Implemented and tested (46/46 in `npm test`), pushed to `origin/feat/arca-service`:

- `src/services/afip.js` — `generateInvoice({ clientId, totalAmount, actorId }, { afip })`.
  Picks CbteTipo from the client's fiscal condition (rule 2), rejects non-AR clients
  before that (rule 4), reads `WSFE_PUNTO_VENTA` (rule 3), computes net/VAT assuming
  21%-inclusive `totalAmount`. The `{ afip }` second argument is a test-only DI seam
  (see below).
- `src/routes/billing.js` — `POST /billing/invoice`, `GET /billing/invoices?clientId=`.
- `db/migrations/20260912000000_invoices.sql` — local audit trail for every emitted
  CAE (AFIP stays the source of truth for the CAE itself). Unique constraint on
  `(punto_venta, cbte_tipo, voucher_number)`. Applied to both `arca` and `arca_test`.
- Tests: `test/afip.unit.test.js` (pure CbteTipo/VAT logic, no DB), `test/billing.test.js`
  (route guard clauses up to `AFIP_NOT_CONFIGURED`), `test/invoice-emission.test.js`
  (full happy path incl. persistence, against a **fake** AFIP client injected via
  `generateInvoice(params, { afip: fake })` — see that file for the shape).

**Not done, needs a real AFIP cert:**
- No real WSFE call has ever been made — `CUIT`/`CERT_PATH`/`KEY_PATH` are unset in
  every environment here (no certificate exists on this machine). Everything above
  is verified up to that boundary only. `WSFE_PUNTO_VENTA` is also unset, so today
  every real call from the frontend stops at a clean `AFIP_NOT_CONFIGURED` before
  ever reaching AFIP — see below.

**Fragility fixed (2026-09-13):** `determineCbteTipo()` used to match on
`fiscal_conditions.name` text (`"responsable inscripto"`, case/trim-insensitive) — a
free-text label editable by any authenticated user via `save_fiscal_condition`
(no role check exists on that route) and by the Administración catalog UI
(`CatalogsModal.jsx`, plain "Nombre" input). Renaming that row would have silently
misrouted every Factura A to Factura B, with no error and no test catching it, and
because AFIP has already issued the CAE by the time anything downstream notices,
there's no clean undo — only Notas de Crédito and re-emission.

Fix: `fiscal_conditions` now has a `code` column
(`db/migrations/20260913130000_fiscal_condition_codes.sql`) — a stable identifier
seeded once (`RESPONSABLE_INSCRIPTO`, `MONOTRIBUTO`, `EXENTO`, ...) that
`save_fiscal_condition` deliberately does not accept as a parameter, so it is not
reachable from the catalog CRUD route or admin UI. `determineCbteTipo()` and the
`getClientFiscalInfo` query in `src/services/afip.js` now key off `fc.code`, not
`fc.name`. `.name` stays a purely cosmetic, freely-editable display label — renaming
it can no longer affect invoice routing. `test/afip.unit.test.js` has a regression
test asserting the display-name string (`"Responsable Inscripto"`) does NOT match.

The role-check gap on `/catalogs/*` write routes (any authenticated user can rewrite
any catalog, not just fiscal conditions) is a separate, broader issue — not addressed
here, flagged for follow-up.

Commits: `99ae81d` (emission), `017ad8f` (persistence + testability),
`fiscal_condition_codes` migration (this fix). All on `feat/arca-service`, pushed to
GitHub, not merged to `main`.

## Frontend wired to real emission (2026-09-13, kyra-ipm-v4 side)

`kyra-ipm-v4`'s "Emisión"/"Facturación del mes" pages were previously 100% frontend
simulation (`utils/emisionARCA.js`, a fake `setTimeout` CAE generator) built on a
hardcoded mock client/service roster (`data/clientes.js`, `data/servicios.js`) with
no id relationship to the real `clients` table. `kyra-ipm-v4/src/pages/FacturacionMes.jsx`
and `EmisionPage.jsx` now call the real `POST /billing/invoice` for Factura A/B lines
attached to a real client, through a new `src/services/billingRepository.js` (same
factory-over-injected-`client` pattern as `clientRepository.js`) and
`src/services/emisionService.js` (the one place in the frontend allowed to produce a
real CAE — both pages call it instead of each keeping separate emit logic, closing a
pre-existing divergence where `FacturacionMes.jsx` had its own emit path that never
even simulated a CAE).

Two correctness details worth knowing if touching this again:
- Mock client ids (1-12) and arca-service's seeded client ids (also 1-12, today)
  collide. `kyra-ipm-v4/src/domain/clienteLookup.js` tags a real client's id with a
  `+100000` offset wherever it's stored on a línea, specifically so a pre-existing
  mock línea with tipoFactura A/B never gets misrouted into a real WSFE call against
  whichever real client happens to share its small numeric id.
  `emisionService.esFacturaWsfeElegible()` requires both tipoFactura A/B **and** a
  real (offset-tagged) clienteId before ever calling the backend.
- `generateInvoice` hardcodes ARS (`MonId: 'PES'`) — the frontend blocks real
  emission for a non-ARS línea with a clear error rather than silently billing it in
  pesos.

Known gaps, deliberately left open in this pass: real clients have no `servicio`
catalog (`servicios.js` only references mock client ids), so the "nueva línea" form
skips that step for a real client and takes the amount directly; the real `clients`
schema has no address field, so a real client's generated invoice PDF (`generarPDFafip.js`,
needs `cliente.direccion`) will show it blank until that field exists on the backend.

## Auth: login switched from username to email (2026-09-15, `feat/auth-email-login`)

`POST /auth/login` now takes `{ email, password }` instead of `{ username,
password }`. `username`/`display_name` are unchanged and stay on `public.users` as
display-only fields (still used as a `displayName` fallback, e.g.
`kyra-ipm-v4/src/components/Sidebar.jsx`) — only the auth credential moved.

- `db/migrations/20260915150000_users_email_login.sql` — adds `users.email`
  (unique case-insensitive, format-checked like `clients.primary_email`). Backfills
  any pre-existing row with `<username>@wearekyra.com` before adding the `NOT NULL`
  constraint, so this applies cleanly to an already-seeded database, not just a
  fresh one — verified by running it against this machine's real dev `arca`
  database (not just `arca_test`), which already had the one seeded user.
- `src/lib/username.js` (`normalizeUsername`) is gone, replaced by
  `src/lib/email.js` (`normalizeEmail`) — it was only ever used by `auth.js`.
- `src/lib/jwt.js`/`middleware/authMiddleware.js`: the session JWT and `req.user`
  now carry `email` alongside the existing `username`/`displayName`/`role`.
- `db/seed.mjs`: the dev user's login is now `info@wearekyra.com` / `KyraLocal2026`
  (username `mai` unchanged, still just a display field).
- `kyra-ipm-v4`: `Login.jsx`/`AuthContext.jsx` updated to collect/send `email`
  instead of `username`; `src/domain/authIdentity.js`'s `normalizeUsername` renamed
  to `normalizeEmail` to match (it was already unused outside its own test, so this
  is a clean rename, not a behavior change to anything wired in).
- Verified end-to-end in the browser against the real dev database (not just the
  test suite): logged in with `info@wearekyra.com` / `KyraLocal2026` and landed on
  the real Dashboard.
