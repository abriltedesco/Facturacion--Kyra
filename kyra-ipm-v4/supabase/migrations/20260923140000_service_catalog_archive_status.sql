-- Módulo 3 — agrega estado "archived" al catálogo de servicios (equivalente al soft-delete
-- ya usado por entidades y clientes) para separar "eliminar" de "desactivar" en la UI.

alter table public.service_catalog
  drop constraint service_catalog_status_check;

alter table public.service_catalog
  add constraint service_catalog_status_check check (status in ('active', 'inactive', 'archived'));

alter table public.service_catalog
  add column archived_at timestamptz,
  add column archived_by uuid references auth.users(id) on delete restrict;

alter table public.service_catalog
  add constraint service_catalog_archive_check check (
    (status = 'archived' and archived_at is not null and archived_by is not null)
    or (status <> 'archived' and archived_at is null and archived_by is null)
  );

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
  if p_status not in ('active', 'inactive', 'archived') then
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
  set status = p_status,
      archived_at = case when p_status = 'archived' then now() else null end,
      archived_by = case when p_status = 'archived' then actor else null end,
      updated_by = actor
  where id = p_catalog_id
  returning * into saved_catalog;

  return saved_catalog;
end;
$$;
