-- Up Migration
-- Local record of invoices that never go through AFIP/WSFE — LLC invoices
-- (Mercury LLC, international) and internal S/F vouchers — so there's no CAE and no
-- external system that's the source of truth the way AFIP is for Factura A/B (see
-- db/migrations/20260912000000_invoices.sql). Today these numbers live only in
-- kyra-ipm-v4's in-memory contadoresFactura.js state, so a reload (or two browser
-- sessions) can silently reuse a number. This table gives them the same
-- "recorded once, queryable, collision-proof" durability. Factura C stays out of
-- this table on purpose — kyra-ipm-v4's emisionARCA.js simulates it with a fake CAE
-- as a placeholder/demo path, and arca-service has no real concept of Factura C at
-- all (see docs/phase-2-billing-logic.md) — recording it here would misrepresent a
-- demo simulation as a durable record.
--
-- Uniqueness mirrors kyra-ipm-v4/src/data/contadoresFactura.js's claveContador()
-- exactly, not a generic (entity, type, number) tuple: LLC numbers are scoped per
-- billing entity (its counter key is `entity_<id>_LLC`), while S/F numbers share
-- ONE global counter across every entity (`sf_interno`, no entity in the key) — so
-- entity must NOT be part of the S/F uniqueness scope.

create table public.manual_invoices (
  id bigint generated always as identity primary key,
  client_id bigint references public.clients(id) on delete restrict,
  billing_entity_id bigint not null references public.billing_entities(id) on delete restrict,
  invoice_type text not null check (invoice_type in ('LLC', 'S', 'F')),
  invoice_number text not null check (length(btrim(invoice_number)) between 1 and 40),
  currency text not null default 'ARS' check (currency in ('ARS', 'USD')),
  net_amount numeric(12, 2) check (net_amount >= 0),
  vat_amount numeric(12, 2) check (vat_amount >= 0),
  total_amount numeric(12, 2) not null check (total_amount > 0),
  issued_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete restrict
);

create unique index manual_invoices_llc_number_unique
  on public.manual_invoices (billing_entity_id, invoice_number)
  where invoice_type = 'LLC';

create unique index manual_invoices_sf_number_unique
  on public.manual_invoices (invoice_number)
  where invoice_type in ('S', 'F');

create index manual_invoices_client_idx on public.manual_invoices (client_id, issued_at desc);

-- Down Migration
drop table if exists public.manual_invoices;
