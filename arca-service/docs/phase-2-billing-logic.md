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

## Open items raised by Fran (2026-09-15)

### Factura C — future, not started
Confirmed roadmap idea, not scheduled: add a third voucher type, "Factura C", proper
for the "persona a persona" activity. Not implemented and no design exists yet.
Flagged complication (Fran's read, not yet confirmed with the Kyra supervisor): this
activity's billing is small enough that the supervisor currently invoices it from her
own personal account rather than through Kyra SRL, which may mean this case doesn't
fit the current `billing_entities` = issuer model at all. Needs a decision from the
supervisor before any design work starts — don't build against this until that's
resolved.

### LLC (Mercury LLC) invoice — suggestion, partially already built
Today Kyra fills Mercury LLC's invoice template manually. Fran's suggestion: a small
system that fills in the known fields and lets the admin download the finished PDF —
explicitly marked as a suggestion, not a committed task.

Worth knowing before building this: it's already mostly there on the frontend.
[`generarPDFllc.js`](../../kyra-ipm-v4/src/utils/generarPDFllc.js) generates the
Mercury LLC invoice PDF entirely client-side with jsPDF, pulling real entity data
(name, fiscal address, bank accounts) from the real `entities`/`billing_entities`
backend via `useEntities()` — not mock data. What's actually missing vs. Fran's
suggestion:
- No backend involvement at all — the PDF is built and downloaded in the browser,
  with no server-side record of it (unlike WSFE invoices, which now persist to the
  `invoices` table for an audit trail). An LLC invoice today leaves no trace once the
  browser tab closes.
- No invoice numbering/audit trail equivalent to the WSFE `(punto_venta, cbte_tipo,
  voucher_number)` uniqueness guarantee — nothing stops two people generating the
  same invoice number, or losing track of what's already been issued.

If this gets picked up, the natural shape is: keep field-filling as-is (or move it to
the backend), but persist an LLC invoice record the same way `invoices` does for WSFE,
so there's one audit trail for both entities instead of one real and one PDF-only.

### Real AFIP calls — what's needed from the Kyra supervisor
Nothing here has changed since the [Status](#status-2026-09-13) section above — still
zero real WSFE calls made, because these are unset in every environment on this
machine. To test the real path, ask the supervisor for:
- **CUIT** of Kyra SRL (the AFIP tax id of the issuer entity — an 11-digit number,
  distinct from a CUIL, which is the personal id AFIP issues to individuals).
- **WSFE certificate + private key** (`.crt` / `.key` files) issued by AFIP for that
  CUIT, authorized for the "Facturación Electrónica" / WSFE web service specifically.
  These go on disk (never committed — see `arca-service/.gitignore`) and are pointed
  to by the `CERT_PATH` / `KEY_PATH` env vars.
- **The WSFE Punto de Venta number** — see the next section for what this actually is,
  why it's a separate question from the certificate, and why it may not exist yet.

The homologación-vs-producción question (AFIP's sandbox vs. the real, no-undo
environment) is NOT something to ask the supervisor — it's an engineering default,
not a business decision: test in homologación first, regardless, before producción is
even considered.

None of the three above exist in this environment yet. Until they do, `POST
/billing/invoice` will keep stopping cleanly at `AFIP_NOT_CONFIGURED` — which is
correct, expected behavior, not a bug.

No separate "AFIP access token" needs to be requested from anyone: AFIP's own login
step (WSAA, a short-lived ~12h ticket) is obtained automatically by the code from the
cert + key above — that's the whole purpose of the certificate. CUIT + cert/key + a
confirmed Punto de Venta is the complete list of what real WSFE calls need.

### `@afipsdk/afip.js` proxies through a third party — worth knowing before testing with real credentials
Found 2026-09-15 reading the library this code depends on
([`src/services/afip.js`](../src/services/afip.js), package `@afipsdk/afip.js`): it
does not talk to AFIP directly. Every call — including the WSAA login step — is sent
to AfipSDK's own server (`https://app.afipsdk.com/api/`, a third-party company, not
AFIP) via `Afip.prototype.GetServiceTA` (`node_modules/@afipsdk/afip.js/src/Afip.js`).
Concretely, that means **Kyra's certificate and private key get transmitted to
AfipSDK's servers on every invoice emission**, not just used locally. That's a real
trust decision baked into the current dependency choice, not just implementation
detail — worth surfacing before real credentials ever get loaded onto this machine,
since someone should consciously accept (or reject) that before it happens.

Separately, the library accepts an optional `access_token` option
(`this.options['access_token']`, sent as a Bearer header) — this authenticates to
**AfipSDK's own API** (their rate limits / free vs. paid tier), unrelated to AFIP.
It is NOT currently wired into this codebase — no env var, no config field, nothing
in `src/config.js` passes it through. Open, unconfirmed question: does AfipSDK's
proxy work in homologación without one, or is it required past some usage limit?
Not established from anything in this repo or the vendored package — check
`docs.afipsdk.com` (possibly means signing up for a free AfipSDK account) before
assuming credential-only testing will work end-to-end.

### "Punto de Venta" — explained, and status unknown
An AFIP "Punto de Venta" (POV) is a numbered sales point that a company registers
with AFIP before it's allowed to emit invoices through it. It's not something the
software invents — it's a number that exists in AFIP's own records for Kyra SRL's
CUIT, and every invoice number AFIP hands out is scoped to one specific POV (POV 1's
invoice #1, #2, #3... is a completely separate sequence from POV 2's invoice #1, #2...).

The reason it matters here: in AFIP, each POV is registered under exactly one
"modalidad" (RECE / Comprobantes en línea, Facturador Plus, a physical
controlador fiscal, etc.) and can't mix modalities. WSFE — the web-service API this
system uses — requires a POV registered specifically as "Comprobantes en línea".
A POV Kyra already uses for something else (manual invoicing, a different system)
is not automatically valid for WSFE, even though it's a real, active POV for AFIP.

**As of 2026-09-15, it's genuinely unknown whether Kyra SRL has a POV registered
under "Comprobantes en línea" at all** — Fran doesn't have that information, and it
hasn't been asked yet. This is the actual open question, not just "what's the
number": whether one exists has to be checked before a number can even be provided.

The open problem flagged in this repo: `billing_entities` already stores a
`point_of_sale` value per entity (used elsewhere, e.g. shown in the Administración
UI), and separately there's a `WSFE_PUNTO_VENTA` env var that `arca-service` actually
uses when calling AFIP. The code deliberately does NOT assume these are the same
number (see `src/config.js`) — for exactly the modalidad reason above: the POV
already on the entity row was very possibly registered for a different modalidad, so
treating it as the WSFE POV without checking could get every real call rejected by
AFIP, or worse, accepted under the wrong POV with no easy fix.

**What this means in practice:** the supervisor needs to check AFIP's own site
(within "Administrador de Relaciones" → "Puntos de Venta y Domicilios", under the
Facturación Electrónica service) for a POV listed with modalidad "Comprobantes en
línea" for Kyra SRL's CUIT. If one exists, its number is what goes into
`WSFE_PUNTO_VENTA`. If none exists, a new POV has to be registered there with that
modalidad before WSFE testing can start at all — that's a prerequisite step, not
something this codebase can work around.

### Security — single admin user (reaffirmed)
Fran confirmed the target shape directly: the system will have exactly one user, and
that user is an admin who can do everything. This is consistent with, and firms up,
the earlier open question — see the linked memory for the full history and current
status of supervisor sign-off.

### Frontend — known problems, and a process note
Consolidated list of what's known-incomplete on the `kyra-ipm-v4` billing/emisión
pages as of this date (numbered gaps above repeated here for one place to check):
1. Real clients have no `servicio` catalog — the "nueva línea" form skips that step
   for them and takes the amount directly (`servicios.js` only has mock client ids).
2. The real `clients` schema has no address field yet, so a real client's WSFE
   invoice PDF (`generarPDFafip.js`) renders with a blank address.
3. Mock client ids (1-12) and real seeded client ids collide; `clienteLookup.js`'s
   `+100000` offset tag is the only thing preventing a mock línea from being
   misrouted into a real WSFE call — fragile by construction, worth a cleaner fix
   once mock data is retired.
4. `generateInvoice` hardcodes ARS; a non-ARS línea is blocked from real emission
   with an error rather than silently billed wrong, but there's no real multi-currency
   support.
5. LLC (Mercury LLC) invoices have no backend/audit trail — see the LLC section above.
6. Large parts of the rest of the app (`Ingresos.jsx`, `Egresos.jsx`, `Emails.jsx`,
   `Dashboard.jsx`, `Administracion.jsx`, email sending) are still on mock data /
   simulated behavior, unrelated to this billing work but worth knowing they're not
   real yet if anyone assumes otherwise.

**Process note:** Fran is doing backend work on this project; a teammate is expected
to be the one making frontend changes. Before making or proposing a frontend change,
call out what's being touched and why, so whoever is driving the frontend work is
acting with full context rather than being surprised by a change — flag it in chat
before editing, don't just make the change silently.
