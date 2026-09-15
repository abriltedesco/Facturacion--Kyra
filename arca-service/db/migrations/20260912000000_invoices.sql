-- Up Migration
-- Local audit trail for WSFE-emitted invoices (Phase 2 billing, src/services/afip.js).
-- AFIP/ARCA remains the source of truth for the CAE itself — this table exists so
-- every emission has a queryable local record, and so the unique constraint below
-- makes it structurally impossible to record two local rows for the same
-- real-world voucher (punto_venta + cbte_tipo + voucher_number is how AFIP itself
-- identifies a voucher).

create table public.invoices (
  id bigint generated always as identity primary key,
  client_id bigint not null references public.clients(id) on delete restrict,
  cbte_tipo integer not null check (cbte_tipo in (1, 6)), -- 1 Factura A, 6 Factura B
  punto_venta integer not null,
  voucher_number bigint not null,
  concepto integer not null default 2, -- 2 = Servicios
  net_amount numeric(12, 2) not null check (net_amount >= 0),
  vat_amount numeric(12, 2) not null check (vat_amount >= 0),
  total_amount numeric(12, 2) not null check (total_amount > 0),
  cae text not null,
  cae_expiration_date date not null,
  issued_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete restrict,
  constraint invoices_voucher_unique unique (punto_venta, cbte_tipo, voucher_number)
);

create index invoices_client_idx on public.invoices (client_id, issued_at desc);

-- Down Migration
drop table if exists public.invoices;
