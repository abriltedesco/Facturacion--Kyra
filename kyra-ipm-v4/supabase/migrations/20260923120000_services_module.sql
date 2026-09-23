-- Módulo 3 — Servicios: catálogo global reutilizable + servicios asignados por cliente,
-- cada uno con su propio historial de cambios de precio.

create table public.service_catalog (
  id bigint generated always as identity primary key,
  name text not null check (length(btrim(name)) between 2 and 120),
  type text not null check (type in ('fixed', 'hourly')),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  base_price numeric(14, 2) check (base_price is null or base_price >= 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_catalog_price_by_type_check check (
    (type = 'fixed' and base_price is not null)
    or (type = 'hourly' and base_price is null)
  )
);

create unique index service_catalog_name_unique_idx on public.service_catalog (lower(name));
create index service_catalog_status_idx on public.service_catalog (status);

create table public.service_catalog_price_history (
  id bigint generated always as identity primary key,
  catalog_id bigint not null references public.service_catalog(id) on delete cascade,
  effective_date date not null default current_date,
  previous_price numeric(14, 2),
  new_price numeric(14, 2) not null,
  reason text,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index service_catalog_price_history_catalog_idx
  on public.service_catalog_price_history (catalog_id, effective_date desc);

create table public.client_services (
  id bigint generated always as identity primary key,
  client_id bigint not null references public.clients(id) on delete cascade,
  catalog_id bigint references public.service_catalog(id) on delete set null,
  name text not null check (length(btrim(name)) between 2 and 120),
  description text,
  type text not null check (type in ('fixed', 'hourly')),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  base_amount numeric(14, 2) check (base_amount is null or base_amount >= 0),
  hourly_rate numeric(14, 2) check (hourly_rate is null or hourly_rate >= 0),
  periodicity text not null default 'monthly'
    check (periodicity in ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual')),
  status text not null default 'active' check (status in ('active', 'paused', 'finished')),
  created_by uuid references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_services_amount_by_type_check check (
    (type = 'fixed' and base_amount is not null and hourly_rate is null)
    or (type = 'hourly' and hourly_rate is not null and base_amount is null)
  )
);

create index client_services_client_idx on public.client_services (client_id);
create index client_services_catalog_idx on public.client_services (catalog_id);
create index client_services_status_idx on public.client_services (status);

create table public.client_service_price_history (
  id bigint generated always as identity primary key,
  client_service_id bigint not null references public.client_services(id) on delete cascade,
  effective_date date not null default current_date,
  previous_value numeric(14, 2),
  new_value numeric(14, 2) not null,
  reason text,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index client_service_price_history_service_idx
  on public.client_service_price_history (client_service_id, effective_date desc);

-- Vista con la cantidad de clientes activos que usan cada servicio del catálogo (T13 Administración).
create view public.service_catalog_with_stats as
select
  catalog.*,
  count(service.id) filter (where service.status = 'active') as active_clients_count
from public.service_catalog as catalog
left join public.client_services as service on service.catalog_id = catalog.id
group by catalog.id;

create trigger service_catalog_set_audit
before insert or update on public.service_catalog
for each row execute function private.set_entity_audit();

create trigger client_services_set_audit
before insert or update on public.client_services
for each row execute function private.set_entity_audit();

create or replace function public.save_service_catalog(
  p_catalog jsonb,
  p_reason text default null,
  p_expected_updated_at timestamptz default null
)
returns public.service_catalog
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target_id bigint := nullif(p_catalog ->> 'id', '')::bigint;
  next_base_price numeric(14, 2) := nullif(p_catalog ->> 'basePrice', '')::numeric;
  current_updated_at timestamptz;
  current_base_price numeric(14, 2);
  saved_catalog public.service_catalog;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if jsonb_typeof(p_catalog) <> 'object' then
    raise exception using errcode = '22023', message = 'INVALID_CATALOG_PAYLOAD';
  end if;

  if target_id is null then
    insert into public.service_catalog (
      name, type, currency, base_price, status, created_by, updated_by
    ) values (
      btrim(p_catalog ->> 'name'),
      p_catalog ->> 'type',
      upper(btrim(p_catalog ->> 'currency')),
      next_base_price,
      coalesce(nullif(p_catalog ->> 'status', ''), 'active'),
      actor,
      actor
    ) returning * into saved_catalog;

    if saved_catalog.base_price is not null then
      insert into public.service_catalog_price_history (catalog_id, previous_price, new_price, reason, created_by)
      values (saved_catalog.id, null, saved_catalog.base_price, coalesce(p_reason, 'Alta inicial'), actor);
    end if;
  else
    select catalog.updated_at, catalog.base_price
    into current_updated_at, current_base_price
    from public.service_catalog as catalog
    where catalog.id = target_id
    for update;

    if not found then
      raise exception using errcode = 'P0002', message = 'SERVICE_CATALOG_NOT_FOUND';
    end if;
    if p_expected_updated_at is null or current_updated_at <> p_expected_updated_at then
      raise exception using errcode = '40001', message = 'SERVICE_CATALOG_VERSION_CONFLICT';
    end if;

    update public.service_catalog
    set name = btrim(p_catalog ->> 'name'),
        type = p_catalog ->> 'type',
        currency = upper(btrim(p_catalog ->> 'currency')),
        base_price = next_base_price,
        status = coalesce(nullif(p_catalog ->> 'status', ''), status),
        updated_by = actor
    where id = target_id
    returning * into saved_catalog;

    if saved_catalog.base_price is distinct from current_base_price then
      insert into public.service_catalog_price_history (catalog_id, previous_price, new_price, reason, created_by)
      values (saved_catalog.id, current_base_price, saved_catalog.base_price, coalesce(p_reason, 'Actualización manual'), actor);
    end if;
  end if;

  return saved_catalog;
end;
$$;

create or replace function public.set_service_catalog_status(
  p_catalog_id bigint,
  p_status text,
  p_expected_updated_at timestamptz
)
returns public.service_catalog
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_updated_at timestamptz;
  saved_catalog public.service_catalog;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if p_status not in ('active', 'inactive') then
    raise exception using errcode = '22023', message = 'INVALID_SERVICE_CATALOG_STATUS';
  end if;

  select catalog.updated_at into current_updated_at
  from public.service_catalog as catalog
  where catalog.id = p_catalog_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'SERVICE_CATALOG_NOT_FOUND';
  end if;
  if current_updated_at <> p_expected_updated_at then
    raise exception using errcode = '40001', message = 'SERVICE_CATALOG_VERSION_CONFLICT';
  end if;

  update public.service_catalog
  set status = p_status, updated_by = actor
  where id = p_catalog_id
  returning * into saved_catalog;

  return saved_catalog;
end;
$$;

create or replace function public.save_client_service(
  p_service jsonb,
  p_reason text default null,
  p_expected_updated_at timestamptz default null
)
returns public.client_services
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target_id bigint := nullif(p_service ->> 'id', '')::bigint;
  next_base_amount numeric(14, 2) := nullif(p_service ->> 'baseAmount', '')::numeric;
  next_hourly_rate numeric(14, 2) := nullif(p_service ->> 'hourlyRate', '')::numeric;
  next_value numeric(14, 2);
  current_updated_at timestamptz;
  current_value numeric(14, 2);
  saved_service public.client_services;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if jsonb_typeof(p_service) <> 'object' then
    raise exception using errcode = '22023', message = 'INVALID_CLIENT_SERVICE_PAYLOAD';
  end if;

  next_value := coalesce(next_base_amount, next_hourly_rate);

  if target_id is null then
    insert into public.client_services (
      client_id, catalog_id, name, description, type, currency,
      base_amount, hourly_rate, periodicity, status, created_by, updated_by
    ) values (
      nullif(p_service ->> 'clientId', '')::bigint,
      nullif(p_service ->> 'catalogId', '')::bigint,
      btrim(p_service ->> 'name'),
      nullif(btrim(p_service ->> 'description'), ''),
      p_service ->> 'type',
      upper(btrim(p_service ->> 'currency')),
      next_base_amount,
      next_hourly_rate,
      coalesce(nullif(p_service ->> 'periodicity', ''), 'monthly'),
      coalesce(nullif(p_service ->> 'status', ''), 'active'),
      actor,
      actor
    ) returning * into saved_service;

    insert into public.client_service_price_history (client_service_id, previous_value, new_value, reason, created_by)
    values (saved_service.id, null, next_value, coalesce(p_reason, 'Alta del servicio'), actor);
  else
    select service.updated_at, coalesce(service.base_amount, service.hourly_rate)
    into current_updated_at, current_value
    from public.client_services as service
    where service.id = target_id
    for update;

    if not found then
      raise exception using errcode = 'P0002', message = 'CLIENT_SERVICE_NOT_FOUND';
    end if;
    if p_expected_updated_at is null or current_updated_at <> p_expected_updated_at then
      raise exception using errcode = '40001', message = 'CLIENT_SERVICE_VERSION_CONFLICT';
    end if;

    update public.client_services
    set catalog_id = nullif(p_service ->> 'catalogId', '')::bigint,
        name = btrim(p_service ->> 'name'),
        description = nullif(btrim(p_service ->> 'description'), ''),
        type = p_service ->> 'type',
        currency = upper(btrim(p_service ->> 'currency')),
        base_amount = next_base_amount,
        hourly_rate = next_hourly_rate,
        periodicity = coalesce(nullif(p_service ->> 'periodicity', ''), periodicity),
        status = coalesce(nullif(p_service ->> 'status', ''), status),
        updated_by = actor
    where id = target_id
    returning * into saved_service;

    if next_value is distinct from current_value then
      insert into public.client_service_price_history (client_service_id, previous_value, new_value, reason, created_by)
      values (saved_service.id, current_value, next_value, coalesce(p_reason, 'Actualización manual'), actor);
    end if;
  end if;

  return saved_service;
end;
$$;

create or replace function public.set_client_service_status(
  p_service_id bigint,
  p_status text,
  p_expected_updated_at timestamptz
)
returns public.client_services
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_updated_at timestamptz;
  saved_service public.client_services;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if p_status not in ('active', 'paused', 'finished') then
    raise exception using errcode = '22023', message = 'INVALID_CLIENT_SERVICE_STATUS';
  end if;

  select service.updated_at into current_updated_at
  from public.client_services as service
  where service.id = p_service_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'CLIENT_SERVICE_NOT_FOUND';
  end if;
  if current_updated_at <> p_expected_updated_at then
    raise exception using errcode = '40001', message = 'CLIENT_SERVICE_VERSION_CONFLICT';
  end if;

  update public.client_services
  set status = p_status, updated_by = actor
  where id = p_service_id
  returning * into saved_service;

  return saved_service;
end;
$$;

alter table public.service_catalog enable row level security;
alter table public.service_catalog_price_history enable row level security;
alter table public.client_services enable row level security;
alter table public.client_service_price_history enable row level security;

revoke all on table public.service_catalog from anon, authenticated;
revoke all on table public.service_catalog_price_history from anon, authenticated;
revoke all on table public.client_services from anon, authenticated;
revoke all on table public.client_service_price_history from anon, authenticated;
revoke all on public.service_catalog_with_stats from anon, authenticated;

grant select on table public.service_catalog to authenticated;
grant select on table public.service_catalog_price_history to authenticated;
grant select on table public.client_services to authenticated;
grant select on table public.client_service_price_history to authenticated;
grant select on public.service_catalog_with_stats to authenticated;

create policy "Authenticated users read service catalog"
on public.service_catalog for select to authenticated using (true);

create policy "Authenticated users read service catalog price history"
on public.service_catalog_price_history for select to authenticated using (true);

create policy "Authenticated users read client services"
on public.client_services for select to authenticated using (true);

create policy "Authenticated users read client service price history"
on public.client_service_price_history for select to authenticated using (true);

revoke execute on function public.save_service_catalog(jsonb, text, timestamptz) from public, anon;
revoke execute on function public.set_service_catalog_status(bigint, text, timestamptz) from public, anon;
revoke execute on function public.save_client_service(jsonb, text, timestamptz) from public, anon;
revoke execute on function public.set_client_service_status(bigint, text, timestamptz) from public, anon;

grant execute on function public.save_service_catalog(jsonb, text, timestamptz) to authenticated;
grant execute on function public.set_service_catalog_status(bigint, text, timestamptz) to authenticated;
grant execute on function public.save_client_service(jsonb, text, timestamptz) to authenticated;
grant execute on function public.set_client_service_status(bigint, text, timestamptz) to authenticated;
