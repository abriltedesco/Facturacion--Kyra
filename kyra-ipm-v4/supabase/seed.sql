-- Development-only data. Never use these fiscal or banking values in production.
begin;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'mai@kyra.internal',
  extensions.crypt('KyraLocal2026', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"mai","display_name":"Mai Brandao"}'::jsonb,
  now(),
  now()
) on conflict (id) do update
set encrypted_password = excluded.encrypted_password,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"mai@kyra.internal"}'::jsonb,
  'email',
  now(),
  now(),
  now()
) on conflict (provider_id, provider) do nothing;

insert into public.billing_entities (
  id, name, status, legal_type, country_code, fiscal_id_type, fiscal_id,
  fiscal_address, gross_income_number, billing_email, default_voucher,
  allows_b_exempt, point_of_sale, invoice_prefix, created_by, updated_by
) values
  (
    1, 'Kyra SRL', 'active', 'srl', 'AR', 'CUIT', '30-70901901-1',
    'Av. Corrientes 1234, CABA', '123-456789-0', 'facturacion@kyra.local',
    'A', true, '0001', null,
    '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  ),
  (
    2, 'Monotributo Personal (Mai)', 'active', 'monotributista', 'AR', 'CUIT', '30-69630509-5',
    'Av. Corrientes 1234, CABA', null, 'mai@kyra.local',
    'C', false, '0002', null,
    '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  ),
  (
    3, 'Mercury LLC', 'active', 'llc', 'US', 'EIN', '90-0388092',
    '1234 Brickell Ave, Suite 500, Miami, FL 33131', null, 'billing@kyra.local',
    'LLC', false, null, 'INV',
    '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  )
on conflict (id) do nothing;

select setval(
  pg_get_serial_sequence('public.billing_entities', 'id'),
  greatest((select max(id) from public.billing_entities), 1),
  true
);

insert into public.entity_bank_accounts (
  entity_id, bank_name, account_holder, currency, account_scope,
  cbu, alias, account_number, routing_number, swift_bic, iban,
  is_primary, created_by, updated_by
) values
  (
    1, 'Banco Patagonia', 'Kyra SRL', 'ARS', 'local',
    '0720000100000000000001', 'KYRA.PATAGONIA', null, null, null, null,
    true, '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  ),
  (
    1, 'Banco Galicia', 'Kyra SRL', 'USD', 'local',
    '0070000100000000000002', 'KYRA.GALICIA.USD', null, null, null, null,
    true, '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  ),
  (
    2, 'Banco Patagonia Personal', 'Mai Brandao', 'ARS', 'local',
    '0720000200000000000003', 'MAI.PATAGONIA', null, null, null, null,
    true, '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  ),
  (
    3, 'Mercury Bank', 'Mercury LLC', 'USD', 'international',
    null, null, '123456789', '021000021', 'CHASUS33', null,
    true, '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  )
on conflict do nothing;

commit;