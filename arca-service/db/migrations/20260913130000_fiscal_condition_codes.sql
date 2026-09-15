-- Up Migration
-- Fixes the fragility flagged in docs/phase-2-billing-logic.md: WSFE invoice-type
-- selection (src/services/afip.js determineCbteTipo) used to match on
-- fiscal_conditions.name, a free-text label editable by any user via
-- save_fiscal_condition/the Administración catalog UI. Renaming that label would
-- have silently misrouted every Factura A to Factura B.
--
-- `code` is the stable identifier fiscal logic keys off going forward; `name`
-- stays purely a display label. `save_fiscal_condition` deliberately does not
-- accept a p_code argument, so this column is not reachable from the catalog
-- CRUD route/UI — only migrations/seed set it.

alter table public.fiscal_conditions add column code text;

alter table public.fiscal_conditions
  add constraint fiscal_conditions_code_format_check
  check (code is null or code ~ '^[A-Z][A-Z0-9_]{1,39}$');

create unique index fiscal_conditions_country_code_unique_idx
  on public.fiscal_conditions (country_id, code)
  where code is not null;

-- Backfill for databases that already ran 20260908120000_clients_module.sql
-- before this migration existed (db/seed.mjs sets code directly on fresh seeds).
update public.fiscal_conditions
set code = 'RESPONSABLE_INSCRIPTO'
where lower(btrim(name)) = 'responsable inscripto' and code is null;

-- Down Migration
drop index if exists public.fiscal_conditions_country_code_unique_idx;
alter table public.fiscal_conditions drop constraint if exists fiscal_conditions_code_format_check;
alter table public.fiscal_conditions drop column if exists code;
