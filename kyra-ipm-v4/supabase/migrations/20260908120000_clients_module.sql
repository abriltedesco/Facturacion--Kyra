-- Módulo 2 — Clientes: catálogos (países, condiciones fiscales, categorías de impuesto)
-- y tabla principal de clientes con emails en copia.

create table public.countries (
  id bigint generated always as identity primary key,
  code text not null check (code ~ '^[A-Z]{2}$'),
  name text not null check (length(btrim(name)) between 2 and 80),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index countries_code_unique_idx on public.countries (code);
create unique index countries_name_unique_idx on public.countries (lower(name));

create table public.fiscal_conditions (
  id bigint generated always as identity primary key,
  country_id bigint not null references public.countries(id) on delete restrict,
  name text not null check (length(btrim(name)) between 2 and 120),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- unique(id, country_id) habilita la FK compuesta desde clients (condición ↔ país)
  constraint fiscal_conditions_id_country_unique unique (id, country_id),
  constraint fiscal_conditions_country_name_unique unique (country_id, name)
);

create index fiscal_conditions_country_idx on public.fiscal_conditions (country_id);

create table public.tax_categories (
  id bigint generated always as identity primary key,
  name text not null check (length(btrim(name)) between 2 and 120),
  tax_rate numeric(5, 2) not null check (tax_rate >= 0 and tax_rate <= 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index tax_categories_name_unique_idx on public.tax_categories (lower(name));

create table public.clients (
  id bigint generated always as identity primary key,
  name text not null check (length(btrim(name)) between 2 and 160),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  -- la entidad emisora define qué tipo de comprobante se emite (billing_entities.default_voucher)
  billing_entity_id bigint not null references public.billing_entities(id) on delete restrict,
  country_id bigint not null references public.countries(id) on delete restrict,
  fiscal_condition_id bigint not null,
  fiscal_id text not null check (length(btrim(fiscal_id)) between 3 and 40),
  tax_category_id bigint references public.tax_categories(id) on delete set null,
  primary_email text not null check (primary_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  ipc_adjustable boolean not null default false,
  ipc_periodicity text check (ipc_periodicity in ('monthly', 'quarterly', 'semiannual', 'annual')),
  -- placeholder sin integración real con Google Drive API (ver docs/modulo-clientes.md)
  drive_folder_ref text,
  internal_notes text,
  created_by uuid references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references auth.users(id) on delete restrict,
  constraint clients_fiscal_condition_country_fkey
    foreign key (fiscal_condition_id, country_id)
    references public.fiscal_conditions (id, country_id)
    on delete restrict,
  constraint clients_ipc_periodicity_pair_check check (
    (ipc_adjustable and ipc_periodicity is not null)
    or (not ipc_adjustable and ipc_periodicity is null)
  ),
  constraint clients_archive_check check (
    (status = 'archived' and archived_at is not null and archived_by is not null)
    or (status <> 'archived' and archived_at is null and archived_by is null)
  )
);

create unique index clients_active_fiscal_id_unique_idx
  on public.clients (country_id, fiscal_id)
  where status <> 'archived';
create index clients_status_idx on public.clients (status);
create index clients_billing_entity_idx on public.clients (billing_entity_id);
create index clients_country_idx on public.clients (country_id);

create table public.client_emails (
  id bigint generated always as identity primary key,
  client_id bigint not null references public.clients(id) on delete cascade,
  email text not null check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  created_at timestamptz not null default now()
);

create index client_emails_client_idx on public.client_emails (client_id);
create unique index client_emails_client_email_unique_idx
  on public.client_emails (client_id, lower(email));

create trigger countries_set_updated_at
before update on public.countries
for each row execute function private.set_updated_at();

create trigger fiscal_conditions_set_updated_at
before update on public.fiscal_conditions
for each row execute function private.set_updated_at();

create trigger tax_categories_set_updated_at
before update on public.tax_categories
for each row execute function private.set_updated_at();

create trigger clients_set_audit
before insert or update on public.clients
for each row execute function private.set_entity_audit();

create or replace function public.save_client(
  p_client jsonb,
  p_cc_emails jsonb default '[]'::jsonb,
  p_expected_updated_at timestamptz default null
)
returns public.clients
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target_client_id bigint := nullif(p_client ->> 'id', '')::bigint;
  target_country_id bigint := nullif(p_client ->> 'countryId', '')::bigint;
  target_country_code text;
  next_status text;
  cc_email text;
  current_updated_at timestamptz;
  saved_client public.clients;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if jsonb_typeof(p_client) <> 'object' then
    raise exception using errcode = '22023', message = 'INVALID_CLIENT_PAYLOAD';
  end if;
  if jsonb_typeof(p_cc_emails) <> 'array' then
    raise exception using errcode = '22023', message = 'INVALID_CC_EMAILS_PAYLOAD';
  end if;

  select country.code into target_country_code
  from public.countries as country
  where country.id = target_country_id;

  if not found then
    raise exception using errcode = '23503', message = 'COUNTRY_NOT_FOUND';
  end if;
  if target_country_code = 'AR' and not private.is_valid_cuit(p_client ->> 'fiscalId') then
    raise exception using errcode = '23514', message = 'INVALID_FISCAL_ID';
  end if;

  if target_client_id is null then
    next_status := coalesce(nullif(p_client ->> 'status', ''), 'active');

    insert into public.clients (
      name, status, billing_entity_id, country_id, fiscal_condition_id, fiscal_id,
      tax_category_id, primary_email, ipc_adjustable, ipc_periodicity,
      drive_folder_ref, internal_notes, created_by, updated_by
    ) values (
      btrim(p_client ->> 'name'),
      next_status,
      nullif(p_client ->> 'billingEntityId', '')::bigint,
      target_country_id,
      nullif(p_client ->> 'fiscalConditionId', '')::bigint,
      btrim(p_client ->> 'fiscalId'),
      nullif(p_client ->> 'taxCategoryId', '')::bigint,
      lower(btrim(p_client ->> 'primaryEmail')),
      coalesce((p_client ->> 'ipcAdjustable')::boolean, false),
      nullif(p_client ->> 'ipcPeriodicity', ''),
      nullif(btrim(p_client ->> 'driveFolderRef'), ''),
      nullif(btrim(p_client ->> 'internalNotes'), ''),
      actor,
      actor
    ) returning * into saved_client;
  else
    select client.updated_at into current_updated_at
    from public.clients as client
    where client.id = target_client_id
    for update;

    if not found then
      raise exception using errcode = 'P0002', message = 'CLIENT_NOT_FOUND';
    end if;
    if p_expected_updated_at is null or current_updated_at <> p_expected_updated_at then
      raise exception using errcode = '40001', message = 'CLIENT_VERSION_CONFLICT';
    end if;

    select coalesce(nullif(p_client ->> 'status', ''), client.status) into next_status
    from public.clients as client
    where client.id = target_client_id;

    update public.clients
    set name = btrim(p_client ->> 'name'),
        status = next_status,
        billing_entity_id = nullif(p_client ->> 'billingEntityId', '')::bigint,
        country_id = target_country_id,
        fiscal_condition_id = nullif(p_client ->> 'fiscalConditionId', '')::bigint,
        fiscal_id = btrim(p_client ->> 'fiscalId'),
        tax_category_id = nullif(p_client ->> 'taxCategoryId', '')::bigint,
        primary_email = lower(btrim(p_client ->> 'primaryEmail')),
        ipc_adjustable = coalesce((p_client ->> 'ipcAdjustable')::boolean, false),
        ipc_periodicity = nullif(p_client ->> 'ipcPeriodicity', ''),
        drive_folder_ref = nullif(btrim(p_client ->> 'driveFolderRef'), ''),
        internal_notes = nullif(btrim(p_client ->> 'internalNotes'), ''),
        archived_at = case when next_status = 'archived' then now() else null end,
        archived_by = case when next_status = 'archived' then actor else null end,
        updated_by = actor
    where id = target_client_id
    returning * into saved_client;
  end if;

  delete from public.client_emails where client_id = saved_client.id;

  for cc_email in select value from jsonb_array_elements_text(p_cc_emails) loop
    if length(btrim(cc_email)) = 0 then
      continue;
    end if;
    insert into public.client_emails (client_id, email)
    values (saved_client.id, lower(btrim(cc_email)))
    on conflict (client_id, lower(email)) do nothing;
  end loop;

  return saved_client;
end;
$$;

create or replace function public.set_client_status(
  p_client_id bigint,
  p_status text,
  p_expected_updated_at timestamptz
)
returns public.clients
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_updated_at timestamptz;
  saved_client public.clients;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if p_status not in ('active', 'inactive', 'archived') then
    raise exception using errcode = '22023', message = 'INVALID_CLIENT_STATUS';
  end if;

  select client.updated_at into current_updated_at
  from public.clients as client
  where client.id = p_client_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'CLIENT_NOT_FOUND';
  end if;
  if current_updated_at <> p_expected_updated_at then
    raise exception using errcode = '40001', message = 'CLIENT_VERSION_CONFLICT';
  end if;

  update public.clients
  set status = p_status,
      archived_at = case when p_status = 'archived' then now() else null end,
      archived_by = case when p_status = 'archived' then actor else null end,
      updated_by = actor
  where id = p_client_id
  returning * into saved_client;

  return saved_client;
end;
$$;

create or replace function public.save_country(
  p_id bigint,
  p_code text,
  p_name text,
  p_active boolean default true
)
returns public.countries
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  saved_country public.countries;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  if p_id is null then
    insert into public.countries (code, name, active)
    values (upper(btrim(p_code)), btrim(p_name), coalesce(p_active, true))
    returning * into saved_country;
  else
    update public.countries
    set code = upper(btrim(p_code)),
        name = btrim(p_name),
        active = coalesce(p_active, active)
    where id = p_id
    returning * into saved_country;

    if not found then
      raise exception using errcode = 'P0002', message = 'COUNTRY_NOT_FOUND';
    end if;
  end if;

  return saved_country;
end;
$$;

create or replace function public.save_fiscal_condition(
  p_id bigint,
  p_country_id bigint,
  p_name text,
  p_active boolean default true
)
returns public.fiscal_conditions
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  saved_condition public.fiscal_conditions;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  if p_id is null then
    insert into public.fiscal_conditions (country_id, name, active)
    values (p_country_id, btrim(p_name), coalesce(p_active, true))
    returning * into saved_condition;
  else
    update public.fiscal_conditions
    set country_id = p_country_id,
        name = btrim(p_name),
        active = coalesce(p_active, active)
    where id = p_id
    returning * into saved_condition;

    if not found then
      raise exception using errcode = 'P0002', message = 'FISCAL_CONDITION_NOT_FOUND';
    end if;
  end if;

  return saved_condition;
end;
$$;

create or replace function public.save_tax_category(
  p_id bigint,
  p_name text,
  p_tax_rate numeric,
  p_active boolean default true
)
returns public.tax_categories
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  saved_category public.tax_categories;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  if p_id is null then
    insert into public.tax_categories (name, tax_rate, active)
    values (btrim(p_name), p_tax_rate, coalesce(p_active, true))
    returning * into saved_category;
  else
    update public.tax_categories
    set name = btrim(p_name),
        tax_rate = p_tax_rate,
        active = coalesce(p_active, active)
    where id = p_id
    returning * into saved_category;

    if not found then
      raise exception using errcode = 'P0002', message = 'TAX_CATEGORY_NOT_FOUND';
    end if;
  end if;

  return saved_category;
end;
$$;

alter table public.countries enable row level security;
alter table public.fiscal_conditions enable row level security;
alter table public.tax_categories enable row level security;
alter table public.clients enable row level security;
alter table public.client_emails enable row level security;

revoke all on table public.countries from anon, authenticated;
revoke all on table public.fiscal_conditions from anon, authenticated;
revoke all on table public.tax_categories from anon, authenticated;
revoke all on table public.clients from anon, authenticated;
revoke all on table public.client_emails from anon, authenticated;

grant select on table public.countries to authenticated;
grant select on table public.fiscal_conditions to authenticated;
grant select on table public.tax_categories to authenticated;
grant select on table public.clients to authenticated;
grant select on table public.client_emails to authenticated;

create policy "Authenticated users read countries"
on public.countries for select to authenticated using (true);

create policy "Authenticated users read fiscal conditions"
on public.fiscal_conditions for select to authenticated using (true);

create policy "Authenticated users read tax categories"
on public.tax_categories for select to authenticated using (true);

create policy "Authenticated users read clients"
on public.clients for select to authenticated using (true);

create policy "Authenticated users read client emails"
on public.client_emails for select to authenticated using (true);

revoke execute on function public.save_client(jsonb, jsonb, timestamptz) from public, anon;
revoke execute on function public.set_client_status(bigint, text, timestamptz) from public, anon;
revoke execute on function public.save_country(bigint, text, text, boolean) from public, anon;
revoke execute on function public.save_fiscal_condition(bigint, bigint, text, boolean) from public, anon;
revoke execute on function public.save_tax_category(bigint, text, numeric, boolean) from public, anon;

grant execute on function public.save_client(jsonb, jsonb, timestamptz) to authenticated;
grant execute on function public.set_client_status(bigint, text, timestamptz) to authenticated;
grant execute on function public.save_country(bigint, text, text, boolean) to authenticated;
grant execute on function public.save_fiscal_condition(bigint, bigint, text, boolean) to authenticated;
grant execute on function public.save_tax_category(bigint, text, numeric, boolean) to authenticated;
