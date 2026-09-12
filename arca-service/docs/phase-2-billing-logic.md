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

## Status

Brief confirmed, no Phase 2 code written yet.
