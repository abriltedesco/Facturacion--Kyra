-- Módulo 5 — Facturación mensual: líneas de pre-liquidación generadas a partir de los
-- servicios activos de cada cliente (Módulo 3), con impuesto real según la categoría
-- fiscal del cliente (Módulo 2) y detección de ajustes IPC todavía no resueltos (Módulo 4).

create table public.billing_lines (
  id bigint generated always as identity primary key,
  client_id bigint not null references public.clients(id) on delete cascade,
  client_service_id bigint not null references public.client_services(id) on delete cascade,
  period_month smallint not null check (period_month between 1 and 12),
  period_year smallint not null check (period_year between 2000 and 2100),
  voucher_type text not null check (voucher_type in ('A', 'B_EXEMPT', 'C', 'LLC')),
  billing_entity_id bigint references public.billing_entities(id) on delete restrict,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  quantity_hours numeric(8, 2) check (quantity_hours is null or quantity_hours >= 0),
  hourly_rate numeric(14, 2) check (hourly_rate is null or hourly_rate >= 0),
  base_amount numeric(14, 2) check (base_amount is null or base_amount >= 0),
  previous_base_amount numeric(14, 2),
  variation_vs_previous numeric(14, 2),
  ipc_adjustment_id bigint references public.ipc_adjustments(id) on delete set null,
  tax_rate numeric(5, 2) not null default 0 check (tax_rate >= 0 and tax_rate <= 100),
  net_amount numeric(14, 2),
  tax_amount numeric(14, 2),
  gross_amount numeric(14, 2),
  alerts text[] not null default '{}',
  status text not null default 'revision' check (status in ('revision', 'aprobada', 'excluida', 'emitida', 'enviada')),
  invoice_number text,
  issued_at date,
  due_date date,
  sent_at timestamptz,
  notes text,
  created_by uuid references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_lines_period_service_unique unique (client_service_id, period_month, period_year)
);

create index billing_lines_status_idx on public.billing_lines (status);
create index billing_lines_client_idx on public.billing_lines (client_id);
create index billing_lines_service_idx on public.billing_lines (client_service_id);
create index billing_lines_period_idx on public.billing_lines (period_year, period_month);

create trigger billing_lines_set_audit
before insert or update on public.billing_lines
for each row execute function private.set_entity_audit();

create view public.billing_lines_with_context as
select
  bl.*,
  cs.name as service_name,
  cs.type as service_type,
  cl.name as client_name,
  cl.primary_email as client_primary_email,
  be.name as billing_entity_name,
  ia.ipc_percentage as pending_ipc_percentage,
  ia.status as pending_ipc_status
from public.billing_lines as bl
join public.client_services as cs on cs.id = bl.client_service_id
join public.clients as cl on cl.id = bl.client_id
left join public.billing_entities as be on be.id = bl.billing_entity_id
left join public.ipc_adjustments as ia on ia.id = bl.ipc_adjustment_id;

-- Calcula neto/impuesto/bruto y alertas a partir de los montos vigentes de un servicio.
create or replace function private.compute_billing_amounts(
  p_service_type text,
  p_base_amount numeric,
  p_quantity_hours numeric,
  p_hourly_rate numeric,
  p_tax_rate numeric
)
returns table (net_amount numeric, tax_amount numeric, gross_amount numeric)
language sql
immutable
set search_path = ''
as $$
  select
    net,
    case when net is null then null else round(net * p_tax_rate / 100, 2) end,
    case when net is null then null else net + round(net * p_tax_rate / 100, 2) end
  from (
    select case
      when p_service_type = 'hourly' then
        case when p_quantity_hours is not null and p_hourly_rate is not null
          then round(p_quantity_hours * p_hourly_rate, 2)
          else null
        end
      else p_base_amount
    end as net
  ) as computed;
$$;

create or replace function public.generate_billing_lines(
  p_period_month smallint,
  p_period_year smallint
)
returns setof public.billing_lines
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  service_row record;
  prev_line public.billing_lines;
  pending_ipc public.ipc_adjustments;
  computed record;
  next_alerts text[];
  next_variation numeric(14, 2);
  new_line public.billing_lines;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  for service_row in
    select cs.*, cl.billing_entity_id, cl.tax_category_id, be.default_voucher
    from public.client_services as cs
    join public.clients as cl on cl.id = cs.client_id
    left join public.billing_entities as be on be.id = cl.billing_entity_id
    where cs.status = 'active' and cl.status = 'active'
      and not exists (
        select 1 from public.billing_lines as existing
        where existing.client_service_id = cs.id
          and existing.period_month = p_period_month
          and existing.period_year = p_period_year
      )
  loop
    select * into prev_line
    from public.billing_lines as bl
    where bl.client_service_id = service_row.id
      and (bl.period_year, bl.period_month) < (p_period_year, p_period_month)
    order by bl.period_year desc, bl.period_month desc
    limit 1;

    select ia.* into pending_ipc
    from public.ipc_adjustments as ia
    where ia.client_service_id = service_row.id
      and ia.status in ('revision', 'lista_aprobar')
    order by ia.period_year desc, ia.period_month desc
    limit 1;

    select * into computed from private.compute_billing_amounts(
      service_row.type,
      service_row.base_amount,
      null::numeric,
      service_row.hourly_rate,
      coalesce((select tax_rate from public.tax_categories where id = service_row.tax_category_id), 0)
    );

    next_alerts := '{}';
    if service_row.type = 'hourly' then
      next_alerts := array_append(next_alerts, 'horas_no_ingresadas');
    end if;
    if pending_ipc.id is not null then
      next_alerts := array_append(next_alerts, 'ipc_pendiente');
    end if;

    next_variation := null;
    if prev_line.net_amount is not null and computed.net_amount is not null then
      next_variation := computed.net_amount - prev_line.net_amount;
      if prev_line.net_amount <> 0 and abs(next_variation) / abs(prev_line.net_amount) > 0.15 then
        next_alerts := array_append(next_alerts, 'variacion_umbral');
      end if;
    end if;

    insert into public.billing_lines (
      client_id, client_service_id, period_month, period_year, voucher_type, billing_entity_id,
      currency, quantity_hours, hourly_rate, base_amount, previous_base_amount, variation_vs_previous,
      ipc_adjustment_id, tax_rate, net_amount, tax_amount, gross_amount, alerts, status,
      created_by, updated_by
    ) values (
      service_row.client_id, service_row.id, p_period_month, p_period_year,
      coalesce(service_row.default_voucher, 'C'), service_row.billing_entity_id,
      service_row.currency, null, case when service_row.type = 'hourly' then service_row.hourly_rate else null end,
      case when service_row.type = 'fixed' then service_row.base_amount else null end,
      prev_line.net_amount, next_variation,
      pending_ipc.id, coalesce((select tax_rate from public.tax_categories where id = service_row.tax_category_id), 0),
      computed.net_amount, computed.tax_amount, computed.gross_amount, next_alerts, 'revision',
      actor, actor
    )
    returning * into new_line;

    return next new_line;
  end loop;
end;
$$;

create or replace function public.create_manual_billing_line(
  p_client_service_id bigint,
  p_period_month smallint,
  p_period_year smallint,
  p_base_amount numeric default null,
  p_quantity_hours numeric default null,
  p_hourly_rate numeric default null,
  p_notes text default null
)
returns public.billing_lines
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  service_row record;
  computed record;
  new_line public.billing_lines;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select cs.*, cl.billing_entity_id, cl.tax_category_id, be.default_voucher
  into service_row
  from public.client_services as cs
  join public.clients as cl on cl.id = cs.client_id
  left join public.billing_entities as be on be.id = cl.billing_entity_id
  where cs.id = p_client_service_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'CLIENT_SERVICE_NOT_FOUND';
  end if;

  select * into computed from private.compute_billing_amounts(
    service_row.type, p_base_amount, p_quantity_hours, p_hourly_rate,
    coalesce((select tax_rate from public.tax_categories where id = service_row.tax_category_id), 0)
  );

  insert into public.billing_lines (
    client_id, client_service_id, period_month, period_year, voucher_type, billing_entity_id,
    currency, quantity_hours, hourly_rate, base_amount, tax_rate, net_amount, tax_amount, gross_amount,
    alerts, status, notes, created_by, updated_by
  ) values (
    service_row.client_id, service_row.id, p_period_month, p_period_year,
    coalesce(service_row.default_voucher, 'C'), service_row.billing_entity_id, service_row.currency,
    p_quantity_hours, p_hourly_rate, p_base_amount,
    coalesce((select tax_rate from public.tax_categories where id = service_row.tax_category_id), 0),
    computed.net_amount, computed.tax_amount, computed.gross_amount,
    '{}', 'revision', nullif(btrim(p_notes), ''), actor, actor
  )
  returning * into new_line;

  return new_line;
end;
$$;

create or replace function public.edit_billing_line(
  p_id bigint,
  p_base_amount numeric,
  p_quantity_hours numeric,
  p_hourly_rate numeric,
  p_notes text,
  p_expected_updated_at timestamptz
)
returns public.billing_lines
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_line public.billing_lines;
  service_type text;
  computed record;
  next_alerts text[];
  saved_line public.billing_lines;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select * into current_line from public.billing_lines where id = p_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'BILLING_LINE_NOT_FOUND';
  end if;
  if current_line.status not in ('revision', 'aprobada') then
    raise exception using errcode = '22023', message = 'BILLING_LINE_NOT_EDITABLE';
  end if;
  if p_expected_updated_at is null or current_line.updated_at <> p_expected_updated_at then
    raise exception using errcode = '40001', message = 'BILLING_LINE_VERSION_CONFLICT';
  end if;

  select type into service_type from public.client_services where id = current_line.client_service_id;

  select * into computed from private.compute_billing_amounts(
    service_type, p_base_amount, p_quantity_hours, p_hourly_rate, current_line.tax_rate
  );

  next_alerts := current_line.alerts;
  if computed.net_amount is not null then
    next_alerts := array_remove(next_alerts, 'horas_no_ingresadas');
  end if;

  update public.billing_lines
  set base_amount = p_base_amount,
      quantity_hours = p_quantity_hours,
      hourly_rate = p_hourly_rate,
      net_amount = computed.net_amount,
      tax_amount = computed.tax_amount,
      gross_amount = computed.gross_amount,
      alerts = next_alerts,
      notes = coalesce(nullif(btrim(p_notes), ''), notes),
      updated_by = actor
  where id = p_id
  returning * into saved_line;

  return saved_line;
end;
$$;

create or replace function public.approve_billing_line(
  p_id bigint,
  p_quantity_hours numeric,
  p_hourly_rate numeric,
  p_expected_updated_at timestamptz
)
returns public.billing_lines
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_line public.billing_lines;
  service_type text;
  computed record;
  next_alerts text[];
  saved_line public.billing_lines;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select * into current_line from public.billing_lines where id = p_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'BILLING_LINE_NOT_FOUND';
  end if;
  if current_line.status <> 'revision' then
    raise exception using errcode = '22023', message = 'BILLING_LINE_NOT_IN_REVIEW';
  end if;
  if p_expected_updated_at is null or current_line.updated_at <> p_expected_updated_at then
    raise exception using errcode = '40001', message = 'BILLING_LINE_VERSION_CONFLICT';
  end if;

  select type into service_type from public.client_services where id = current_line.client_service_id;

  if p_quantity_hours is not null or p_hourly_rate is not null then
    select * into computed from private.compute_billing_amounts(
      service_type, current_line.base_amount, p_quantity_hours, p_hourly_rate, current_line.tax_rate
    );
  else
    computed.net_amount := current_line.net_amount;
    computed.tax_amount := current_line.tax_amount;
    computed.gross_amount := current_line.gross_amount;
  end if;

  if computed.net_amount is null then
    raise exception using errcode = '23514', message = 'MISSING_AMOUNT_TO_APPROVE';
  end if;

  next_alerts := array_remove(current_line.alerts, 'horas_no_ingresadas');

  update public.billing_lines
  set quantity_hours = coalesce(p_quantity_hours, quantity_hours),
      hourly_rate = coalesce(p_hourly_rate, hourly_rate),
      net_amount = computed.net_amount,
      tax_amount = computed.tax_amount,
      gross_amount = computed.gross_amount,
      alerts = next_alerts,
      status = 'aprobada',
      updated_by = actor
  where id = p_id
  returning * into saved_line;

  return saved_line;
end;
$$;

create or replace function public.exclude_billing_line(
  p_id bigint,
  p_expected_updated_at timestamptz
)
returns public.billing_lines
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_line public.billing_lines;
  saved_line public.billing_lines;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select * into current_line from public.billing_lines where id = p_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'BILLING_LINE_NOT_FOUND';
  end if;
  if current_line.status <> 'revision' then
    raise exception using errcode = '22023', message = 'BILLING_LINE_NOT_IN_REVIEW';
  end if;
  if p_expected_updated_at is null or current_line.updated_at <> p_expected_updated_at then
    raise exception using errcode = '40001', message = 'BILLING_LINE_VERSION_CONFLICT';
  end if;

  update public.billing_lines
  set status = 'excluida', updated_by = actor
  where id = p_id
  returning * into saved_line;

  return saved_line;
end;
$$;

create or replace function public.reject_billing_line(
  p_id bigint,
  p_expected_updated_at timestamptz
)
returns public.billing_lines
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_line public.billing_lines;
  saved_line public.billing_lines;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select * into current_line from public.billing_lines where id = p_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'BILLING_LINE_NOT_FOUND';
  end if;
  if current_line.status <> 'aprobada' then
    raise exception using errcode = '22023', message = 'BILLING_LINE_NOT_APPROVED';
  end if;
  if p_expected_updated_at is null or current_line.updated_at <> p_expected_updated_at then
    raise exception using errcode = '40001', message = 'BILLING_LINE_VERSION_CONFLICT';
  end if;

  update public.billing_lines
  set status = 'revision', invoice_number = null, issued_at = null, due_date = null,
      updated_by = actor
  where id = p_id
  returning * into saved_line;

  return saved_line;
end;
$$;

create or replace function public.mark_billing_line_issued(
  p_id bigint,
  p_invoice_number text,
  p_issued_at date,
  p_due_date date,
  p_expected_updated_at timestamptz
)
returns public.billing_lines
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_line public.billing_lines;
  saved_line public.billing_lines;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select * into current_line from public.billing_lines where id = p_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'BILLING_LINE_NOT_FOUND';
  end if;
  if current_line.status <> 'aprobada' then
    raise exception using errcode = '22023', message = 'BILLING_LINE_NOT_APPROVED';
  end if;
  if p_expected_updated_at is null or current_line.updated_at <> p_expected_updated_at then
    raise exception using errcode = '40001', message = 'BILLING_LINE_VERSION_CONFLICT';
  end if;

  update public.billing_lines
  set status = 'emitida', invoice_number = p_invoice_number, issued_at = p_issued_at, due_date = p_due_date,
      updated_by = actor
  where id = p_id
  returning * into saved_line;

  return saved_line;
end;
$$;

create or replace function public.mark_billing_line_sent(
  p_id bigint,
  p_expected_updated_at timestamptz
)
returns public.billing_lines
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_line public.billing_lines;
  saved_line public.billing_lines;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select * into current_line from public.billing_lines where id = p_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'BILLING_LINE_NOT_FOUND';
  end if;
  if current_line.status <> 'emitida' then
    raise exception using errcode = '22023', message = 'BILLING_LINE_NOT_ISSUED';
  end if;
  if p_expected_updated_at is null or current_line.updated_at <> p_expected_updated_at then
    raise exception using errcode = '40001', message = 'BILLING_LINE_VERSION_CONFLICT';
  end if;

  update public.billing_lines
  set status = 'enviada', sent_at = now(), updated_by = actor
  where id = p_id
  returning * into saved_line;

  return saved_line;
end;
$$;

alter table public.billing_lines enable row level security;

revoke all on table public.billing_lines from anon, authenticated;
revoke all on public.billing_lines_with_context from anon, authenticated;

grant select on table public.billing_lines to authenticated;
grant select on public.billing_lines_with_context to authenticated;

create policy "Authenticated users read billing lines"
on public.billing_lines for select to authenticated using (true);

revoke execute on function public.generate_billing_lines(smallint, smallint) from public, anon;
revoke execute on function public.create_manual_billing_line(bigint, smallint, smallint, numeric, numeric, numeric, text) from public, anon;
revoke execute on function public.edit_billing_line(bigint, numeric, numeric, numeric, text, timestamptz) from public, anon;
revoke execute on function public.approve_billing_line(bigint, numeric, numeric, timestamptz) from public, anon;
revoke execute on function public.exclude_billing_line(bigint, timestamptz) from public, anon;
revoke execute on function public.reject_billing_line(bigint, timestamptz) from public, anon;
revoke execute on function public.mark_billing_line_issued(bigint, text, date, date, timestamptz) from public, anon;
revoke execute on function public.mark_billing_line_sent(bigint, timestamptz) from public, anon;

grant execute on function public.generate_billing_lines(smallint, smallint) to authenticated;
grant execute on function public.create_manual_billing_line(bigint, smallint, smallint, numeric, numeric, numeric, text) to authenticated;
grant execute on function public.edit_billing_line(bigint, numeric, numeric, numeric, text, timestamptz) to authenticated;
grant execute on function public.approve_billing_line(bigint, numeric, numeric, timestamptz) to authenticated;
grant execute on function public.exclude_billing_line(bigint, timestamptz) to authenticated;
grant execute on function public.reject_billing_line(bigint, timestamptz) to authenticated;
grant execute on function public.mark_billing_line_issued(bigint, text, date, date, timestamptz) to authenticated;
grant execute on function public.mark_billing_line_sent(bigint, timestamptz) to authenticated;
