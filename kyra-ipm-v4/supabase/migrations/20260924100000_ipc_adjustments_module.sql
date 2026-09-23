-- Módulo 4 — Actualización por IPC: generación de ajustes por período, revisión,
-- aprobación (que impacta el precio vigente del servicio del cliente y su historial)
-- y rechazo. Reutiliza client_service_price_history (Módulo 3) como historial de
-- "monto anterior, monto nuevo, fecha" una vez aprobado el ajuste.

create table public.ipc_adjustments (
  id bigint generated always as identity primary key,
  client_service_id bigint not null references public.client_services(id) on delete cascade,
  period_month smallint not null check (period_month between 1 and 12),
  period_year smallint not null check (period_year between 2000 and 2100),
  adjustment_type text not null default 'ipc' check (adjustment_type in ('ipc', 'manual', 'comercial')),
  ipc_percentage numeric(6, 2) not null check (ipc_percentage >= 0 and ipc_percentage <= 100),
  amount_before numeric(14, 2) check (amount_before is null or amount_before >= 0),
  amount_after numeric(14, 2) check (amount_after is null or amount_after >= 0),
  impact_level text not null default 'bajo' check (impact_level in ('alto', 'bajo')),
  significant_increase boolean not null default false,
  reason text,
  status text not null default 'revision' check (status in ('revision', 'lista_aprobar', 'aprobada', 'rechazada')),
  approved_at timestamptz,
  created_by uuid references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ipc_adjustments_period_service_unique unique (client_service_id, period_month, period_year)
);

create index ipc_adjustments_status_idx on public.ipc_adjustments (status);
create index ipc_adjustments_service_idx on public.ipc_adjustments (client_service_id);
create index ipc_adjustments_period_idx on public.ipc_adjustments (period_year, period_month);

create trigger ipc_adjustments_set_audit
before insert or update on public.ipc_adjustments
for each row execute function private.set_entity_audit();

-- Vista denormalizada para listar ajustes con datos de cliente/servicio/entidad
-- y el último aumento real registrado en el historial de precios del servicio.
create view public.ipc_adjustments_with_context as
select
  ia.*,
  cs.name as service_name,
  cs.type as service_type,
  cs.currency as service_currency,
  cs.periodicity as service_periodicity,
  cs.client_id,
  cl.name as client_name,
  cl.billing_entity_id,
  be.name as billing_entity_name,
  be.default_voucher,
  (
    select max(h.effective_date)
    from public.client_service_price_history as h
    where h.client_service_id = cs.id and h.previous_value is not null
  ) as last_increase_date
from public.ipc_adjustments as ia
join public.client_services as cs on cs.id = ia.client_service_id
join public.clients as cl on cl.id = cs.client_id
left join public.billing_entities as be on be.id = cl.billing_entity_id;

create or replace function public.generate_ipc_adjustments(
  p_period_month smallint,
  p_period_year smallint,
  p_ipc_percentage numeric,
  p_client_service_ids bigint[] default null
)
returns setof public.ipc_adjustments
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  next_impact_level text;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if p_ipc_percentage is null or p_ipc_percentage < 0 or p_ipc_percentage > 100 then
    raise exception using errcode = '22023', message = 'INVALID_IPC_PERCENTAGE';
  end if;

  next_impact_level := case when p_ipc_percentage >= 10 then 'alto' else 'bajo' end;

  return query
  insert into public.ipc_adjustments (
    client_service_id, period_month, period_year, adjustment_type, ipc_percentage,
    amount_before, amount_after, impact_level, significant_increase, status,
    created_by, updated_by
  )
  select
    cs.id,
    p_period_month,
    p_period_year,
    'ipc',
    p_ipc_percentage,
    coalesce(cs.base_amount, cs.hourly_rate),
    case
      when coalesce(cs.base_amount, cs.hourly_rate) is null then null
      else round(coalesce(cs.base_amount, cs.hourly_rate) * (1 + p_ipc_percentage / 100), 2)
    end,
    next_impact_level,
    p_ipc_percentage >= 10,
    'revision',
    actor,
    actor
  from public.client_services as cs
  join public.clients as cl on cl.id = cs.client_id
  where cs.status = 'active'
    and cl.ipc_adjustable = true
    and (p_client_service_ids is null or cs.id = any (p_client_service_ids))
  on conflict (client_service_id, period_month, period_year) do nothing
  returning *;
end;
$$;

create or replace function public.save_ipc_adjustment(
  p_id bigint,
  p_adjustment_type text,
  p_ipc_percentage numeric,
  p_amount_before numeric,
  p_reason text,
  p_expected_updated_at timestamptz
)
returns public.ipc_adjustments
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_updated_at timestamptz;
  current_status text;
  next_amount_after numeric(14, 2);
  saved_adjustment public.ipc_adjustments;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if p_adjustment_type not in ('ipc', 'manual', 'comercial') then
    raise exception using errcode = '22023', message = 'INVALID_ADJUSTMENT_TYPE';
  end if;
  if p_ipc_percentage is null or p_ipc_percentage < 0 or p_ipc_percentage > 100 then
    raise exception using errcode = '22023', message = 'INVALID_IPC_PERCENTAGE';
  end if;
  if p_amount_before is null or p_amount_before <= 0 then
    raise exception using errcode = '22023', message = 'INVALID_AMOUNT_BEFORE';
  end if;

  select updated_at, status into current_updated_at, current_status
  from public.ipc_adjustments
  where id = p_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'IPC_ADJUSTMENT_NOT_FOUND';
  end if;
  if current_status in ('aprobada', 'rechazada') then
    raise exception using errcode = '22023', message = 'IPC_ADJUSTMENT_ALREADY_CLOSED';
  end if;
  if p_expected_updated_at is null or current_updated_at <> p_expected_updated_at then
    raise exception using errcode = '40001', message = 'IPC_ADJUSTMENT_VERSION_CONFLICT';
  end if;

  next_amount_after := round(p_amount_before * (1 + p_ipc_percentage / 100), 2);

  update public.ipc_adjustments
  set adjustment_type = p_adjustment_type,
      ipc_percentage = p_ipc_percentage,
      amount_before = p_amount_before,
      amount_after = next_amount_after,
      reason = nullif(btrim(p_reason), ''),
      status = 'lista_aprobar',
      significant_increase = false,
      updated_by = actor
  where id = p_id
  returning * into saved_adjustment;

  return saved_adjustment;
end;
$$;

create or replace function public.approve_ipc_adjustment(
  p_id bigint,
  p_expected_updated_at timestamptz,
  p_reason text default null
)
returns public.ipc_adjustments
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_updated_at timestamptz;
  current_status text;
  target_service public.client_services;
  approved_adjustment public.ipc_adjustments;
  history_reason text;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select updated_at, status into current_updated_at, current_status
  from public.ipc_adjustments
  where id = p_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'IPC_ADJUSTMENT_NOT_FOUND';
  end if;
  if current_status in ('aprobada', 'rechazada') then
    raise exception using errcode = '22023', message = 'IPC_ADJUSTMENT_ALREADY_CLOSED';
  end if;
  if p_expected_updated_at is null or current_updated_at <> p_expected_updated_at then
    raise exception using errcode = '40001', message = 'IPC_ADJUSTMENT_VERSION_CONFLICT';
  end if;

  update public.ipc_adjustments
  set status = 'aprobada',
      approved_at = now(),
      reason = coalesce(nullif(btrim(p_reason), ''), reason),
      updated_by = actor
  where id = p_id
  returning * into approved_adjustment;

  if approved_adjustment.amount_before is null or approved_adjustment.amount_after is null then
    raise exception using errcode = '23514', message = 'MISSING_AMOUNTS_TO_APPROVE';
  end if;

  select * into target_service from public.client_services where id = approved_adjustment.client_service_id for update;

  history_reason := coalesce(
    nullif(btrim(approved_adjustment.reason), ''),
    format('Ajuste IPC %s%% — período %s/%s', approved_adjustment.ipc_percentage, approved_adjustment.period_month, approved_adjustment.period_year)
  );

  update public.client_services
  set base_amount = case when type = 'fixed' then approved_adjustment.amount_after else base_amount end,
      hourly_rate = case when type = 'hourly' then approved_adjustment.amount_after else hourly_rate end,
      updated_by = actor
  where id = target_service.id;

  insert into public.client_service_price_history (client_service_id, previous_value, new_value, reason, created_by)
  values (target_service.id, approved_adjustment.amount_before, approved_adjustment.amount_after, history_reason, actor);

  return approved_adjustment;
end;
$$;

create or replace function public.reject_ipc_adjustment(
  p_id bigint,
  p_expected_updated_at timestamptz
)
returns public.ipc_adjustments
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_updated_at timestamptz;
  current_status text;
  rejected_adjustment public.ipc_adjustments;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select updated_at, status into current_updated_at, current_status
  from public.ipc_adjustments
  where id = p_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'IPC_ADJUSTMENT_NOT_FOUND';
  end if;
  if current_status in ('aprobada', 'rechazada') then
    raise exception using errcode = '22023', message = 'IPC_ADJUSTMENT_ALREADY_CLOSED';
  end if;
  if p_expected_updated_at is null or current_updated_at <> p_expected_updated_at then
    raise exception using errcode = '40001', message = 'IPC_ADJUSTMENT_VERSION_CONFLICT';
  end if;

  update public.ipc_adjustments
  set status = 'rechazada',
      approved_at = now(),
      updated_by = actor
  where id = p_id
  returning * into rejected_adjustment;

  return rejected_adjustment;
end;
$$;

alter table public.ipc_adjustments enable row level security;

revoke all on table public.ipc_adjustments from anon, authenticated;
revoke all on public.ipc_adjustments_with_context from anon, authenticated;

grant select on table public.ipc_adjustments to authenticated;
grant select on public.ipc_adjustments_with_context to authenticated;

create policy "Authenticated users read ipc adjustments"
on public.ipc_adjustments for select to authenticated using (true);

revoke execute on function public.generate_ipc_adjustments(smallint, smallint, numeric, bigint[]) from public, anon;
revoke execute on function public.save_ipc_adjustment(bigint, text, numeric, numeric, text, timestamptz) from public, anon;
revoke execute on function public.approve_ipc_adjustment(bigint, timestamptz, text) from public, anon;
revoke execute on function public.reject_ipc_adjustment(bigint, timestamptz) from public, anon;

grant execute on function public.generate_ipc_adjustments(smallint, smallint, numeric, bigint[]) to authenticated;
grant execute on function public.save_ipc_adjustment(bigint, text, numeric, numeric, text, timestamptz) to authenticated;
grant execute on function public.approve_ipc_adjustment(bigint, timestamptz, text) to authenticated;
grant execute on function public.reject_ipc_adjustment(bigint, timestamptz) to authenticated;
