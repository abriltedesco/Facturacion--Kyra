# Facturación Kyra — project notes for Claude

This repo has two live projects:

- **`kyra-ipm-v4/`** — the React/Vite frontend.
- **`arca-service/`** — the Express + PostgreSQL backend. Replaces Supabase entirely
  (auth, entities, clients) and is where AFIP/ARCA (WSFE) invoice emission lives.

## Before doing any work on `arca-service` or WSFE/billing

Read these first, in this order — they are the source of truth, kept up to date on
every commit, not this file:

1. [`arca-service/docs/phase-2-billing-logic.md`](arca-service/docs/phase-2-billing-logic.md)
   — current state of the billing/WSFE work: what's built, what's tested, what's
   explicitly NOT verified yet (no real AFIP call has ever been made — there's no
   certificate on this machine), and a known fragility in how invoice type is chosen.
2. [`arca-service/README.md`](arca-service/README.md) — how to run the service, its
   layout, and what changed vs. Supabase and why.
3. [`arca-service/docs/phase-2-handoff.md`](arca-service/docs/phase-2-handoff.md) —
   the original Supabase→arca-service migration decision (now done).

Current branch: `feat/arca-service` (pushed to GitHub, not merged to `main`). Recent
commit messages on that branch are also detailed and worth `git log`-ing through
before assuming something isn't done.

## Ground rules

- Never claim a real AFIP/WSFE call has been exercised — it hasn't, anywhere, because
  no real CUIT/cert/key exists in this environment. Everything is tested up to
  `AFIP_NOT_CONFIGURED` or via a fake AFIP client injected into `generateInvoice`.
- Don't touch `kyra-ipm-v4/supabase/` expectations — that folder is gone on purpose;
  Supabase is fully removed.
