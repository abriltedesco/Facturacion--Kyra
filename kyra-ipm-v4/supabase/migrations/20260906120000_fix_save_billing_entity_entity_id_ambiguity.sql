create or replace function public.save_billing_entity(
  p_entity jsonb,
  p_accounts jsonb default '[]'::jsonb,
  p_expected_updated_at timestamptz default null
)
returns public.billing_entities
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target_entity_id bigint := nullif(p_entity ->> 'id', '')::bigint;
  account jsonb;
  target_account_id bigint;
  current_updated_at timestamptz;
  saved_entity public.billing_entities;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if jsonb_typeof(p_entity) <> 'object' then
    raise exception using errcode = '22023', message = 'INVALID_ENTITY_PAYLOAD';
  end if;
  if jsonb_typeof(p_accounts) <> 'array' or jsonb_array_length(p_accounts) = 0 then
    raise exception using errcode = '23514', message = 'AT_LEAST_ONE_BANK_ACCOUNT_REQUIRED';
  end if;

  if target_entity_id is null then
    insert into public.billing_entities (
      name, status, legal_type, country_code, fiscal_id_type, fiscal_id,
      fiscal_address, gross_income_number, billing_email, default_voucher,
      allows_b_exempt, point_of_sale, invoice_prefix, created_by, updated_by
    ) values (
      btrim(p_entity ->> 'name'),
      coalesce(nullif(p_entity ->> 'status', ''), 'active'),
      p_entity ->> 'legalType',
      p_entity ->> 'countryCode',
      p_entity ->> 'fiscalIdType',
      btrim(p_entity ->> 'fiscalId'),
      btrim(p_entity ->> 'fiscalAddress'),
      nullif(btrim(p_entity ->> 'grossIncomeNumber'), ''),
      nullif(btrim(p_entity ->> 'billingEmail'), ''),
      p_entity ->> 'defaultVoucher',
      coalesce((p_entity ->> 'allowsBExempt')::boolean, false),
      nullif(btrim(p_entity ->> 'pointOfSale'), ''),
      nullif(upper(btrim(p_entity ->> 'invoicePrefix')), ''),
      actor,
      actor
    ) returning * into saved_entity;
  else
    select billing_entity.updated_at into current_updated_at
    from public.billing_entities as billing_entity
    where billing_entity.id = target_entity_id
    for update;

    if not found then
      raise exception using errcode = 'P0002', message = 'ENTITY_NOT_FOUND';
    end if;
    if p_expected_updated_at is null or current_updated_at <> p_expected_updated_at then
      raise exception using errcode = '40001', message = 'ENTITY_VERSION_CONFLICT';
    end if;

    update public.billing_entities as billing_entity
    set name = btrim(p_entity ->> 'name'),
        status = coalesce(nullif(p_entity ->> 'status', ''), billing_entity.status),
        legal_type = p_entity ->> 'legalType',
        country_code = p_entity ->> 'countryCode',
        fiscal_id_type = p_entity ->> 'fiscalIdType',
        fiscal_id = btrim(p_entity ->> 'fiscalId'),
        fiscal_address = btrim(p_entity ->> 'fiscalAddress'),
        gross_income_number = nullif(btrim(p_entity ->> 'grossIncomeNumber'), ''),
        billing_email = nullif(btrim(p_entity ->> 'billingEmail'), ''),
        default_voucher = p_entity ->> 'defaultVoucher',
        allows_b_exempt = coalesce((p_entity ->> 'allowsBExempt')::boolean, false),
        point_of_sale = nullif(btrim(p_entity ->> 'pointOfSale'), ''),
        invoice_prefix = nullif(upper(btrim(p_entity ->> 'invoicePrefix')), ''),
        archived_at = case when coalesce(nullif(p_entity ->> 'status', ''), billing_entity.status) = 'archived' then now() else null end,
        archived_by = case when coalesce(nullif(p_entity ->> 'status', ''), billing_entity.status) = 'archived' then actor else null end,
        updated_by = actor
    where billing_entity.id = target_entity_id
    returning * into saved_entity;
  end if;

  update public.entity_bank_accounts as bank_account
  set is_primary = false,
      updated_by = actor
  where bank_account.entity_id = saved_entity.id
    and bank_account.archived_at is null;

  update public.entity_bank_accounts as existing
  set archived_at = now(),
      is_primary = false,
      updated_by = actor
  where existing.entity_id = saved_entity.id
    and existing.archived_at is null
    and not exists (
      select 1
      from jsonb_array_elements(p_accounts) supplied
      where nullif(supplied ->> 'id', '')::bigint = existing.id
    );

  for account in select value from jsonb_array_elements(p_accounts) loop
    target_account_id := nullif(account ->> 'id', '')::bigint;
    if target_account_id is null then
      insert into public.entity_bank_accounts (
        entity_id, bank_name, account_holder, currency, account_scope,
        cbu, alias, account_number, routing_number, swift_bic, iban,
        is_primary, created_by, updated_by
      ) values (
        saved_entity.id,
        btrim(account ->> 'bankName'),
        btrim(account ->> 'accountHolder'),
        upper(account ->> 'currency'),
        account ->> 'accountScope',
        nullif(regexp_replace(coalesce(account ->> 'cbu', ''), '[^0-9]', '', 'g'), ''),
        nullif(btrim(account ->> 'alias'), ''),
        nullif(btrim(account ->> 'accountNumber'), ''),
        nullif(btrim(account ->> 'routingNumber'), ''),
        nullif(upper(btrim(account ->> 'swiftBic')), ''),
        nullif(upper(btrim(account ->> 'iban')), ''),
        coalesce((account ->> 'isPrimary')::boolean, false),
        actor,
        actor
      );
    else
      update public.entity_bank_accounts as bank_account
      set bank_name = btrim(account ->> 'bankName'),
          account_holder = btrim(account ->> 'accountHolder'),
          currency = upper(account ->> 'currency'),
          account_scope = account ->> 'accountScope',
          cbu = nullif(regexp_replace(coalesce(account ->> 'cbu', ''), '[^0-9]', '', 'g'), ''),
          alias = nullif(btrim(account ->> 'alias'), ''),
          account_number = nullif(btrim(account ->> 'accountNumber'), ''),
          routing_number = nullif(btrim(account ->> 'routingNumber'), ''),
          swift_bic = nullif(upper(btrim(account ->> 'swiftBic')), ''),
          iban = nullif(upper(btrim(account ->> 'iban')), ''),
          is_primary = coalesce((account ->> 'isPrimary')::boolean, false),
          archived_at = null,
          updated_by = actor
      where bank_account.id = target_account_id
        and bank_account.entity_id = saved_entity.id;

      if not found then
        raise exception using errcode = '22023', message = 'BANK_ACCOUNT_NOT_FOUND';
      end if;
    end if;
  end loop;

  return saved_entity;
end;
$$;