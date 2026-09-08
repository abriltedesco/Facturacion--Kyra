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

insert into public.countries (id, code, name, active) values
  (1, 'AR', 'Argentina', true),
  (2, 'CO', 'Colombia', true),
  (3, 'CR', 'Costa Rica', true)
on conflict (id) do nothing;

select setval(
  pg_get_serial_sequence('public.countries', 'id'),
  greatest((select max(id) from public.countries), 1),
  true
);

insert into public.fiscal_conditions (id, country_id, name, active) values
  (1, 1, 'Responsable Inscripto', true),
  (2, 1, 'Monotributista', true),
  (3, 1, 'Exento', true),
  (4, 2, 'Régimen Común', true),
  (5, 2, 'Régimen Simplificado', true),
  (6, 3, 'Régimen Tradicional', true)
on conflict (id) do nothing;

select setval(
  pg_get_serial_sequence('public.fiscal_conditions', 'id'),
  greatest((select max(id) from public.fiscal_conditions), 1),
  true
);

insert into public.tax_categories (id, name, tax_rate, active) values
  (1, 'Colombia 12.5%', 12.50, true),
  (2, 'Costa Rica 0%', 0.00, true)
on conflict (id) do nothing;

select setval(
  pg_get_serial_sequence('public.tax_categories', 'id'),
  greatest((select max(id) from public.tax_categories), 1),
  true
);

insert into public.clients (
  id, name, status, billing_entity_id, country_id, fiscal_condition_id, fiscal_id,
  tax_category_id, primary_email, ipc_adjustable, ipc_periodicity, internal_notes,
  created_by, updated_by
) values
  (
    1, 'Ayax', 'active', 1, 1, 1, '30-70901901-1',
    null, 'contacto@ayax.com.ar', false, null, null,
    '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  ),
  (
    2, 'Edding COL', 'active', 3, 2, 4, 'NIT-900111222-3',
    1, 'finance@edding.com.co', false, null,
    'Pagar a Valen y Floppy // Controlar en TC Visa Mai // Cobrar a cliente',
    '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  ),
  (
    3, 'Maped', 'active', 3, 2, 4, 'NIT-900333444-5',
    1, 'admin@maped.com', false, null,
    'Pagar a Valen y Floppy // Controlar en TC Visa Mai // Cobrar a cliente',
    '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  ),
  (
    4, 'SCS', 'active', 2, 1, 2, '30-69630509-5',
    null, 'facturacion@scs.com.ar', true, 'quarterly', null,
    '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  ),
  (
    5, 'Entelai', 'active', 1, 1, 1, '30-71580232-1',
    null, 'administracion@entelai.com', true, 'quarterly', null,
    '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  ),
  (
    6, 'P4C', 'active', 1, 1, 1, '30-71825771-5',
    null, 'sin-envio+p4c@kyra.internal', false, null, 'Pack de las 10 hs mensuales',
    '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  ),
  (
    7, 'Laura Di Cola', 'active', 2, 1, 2, '27-20283685-8',
    null, 'lauradico@gmail.com', true, 'quarterly', null,
    '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  ),
  (
    8, 'THC', 'active', 2, 1, 2, '30-71643480-6',
    null, 'admin@thc.com.ar', true, 'quarterly', null,
    '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  ),
  (
    9, 'UTALK', 'active', 1, 1, 1, '30-71547070-1',
    null, 'admin@utalk.io', false, null, null,
    '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  ),
  (
    10, 'Clínica Raña', 'active', 1, 1, 1, '30-65475263-6',
    null, 'administracion@clinicarana.com.ar', false, null, null,
    '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  ),
  (
    11, 'Fundación Holters', 'active', 2, 1, 3, '30-54208481-9',
    null, 'tesoreria@holters.org.ar', false, null, null,
    '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  ),
  (
    12, 'Dra. Rojas', 'active', 2, 1, 2, '20-32577039-3',
    null, 'dra.rojas@gmail.com', false, null, null,
    '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'
  )
on conflict (id) do nothing;

select setval(
  pg_get_serial_sequence('public.clients', 'id'),
  greatest((select max(id) from public.clients), 1),
  true
);

insert into public.client_emails (client_id, email) values
  (3, 'contabilidad@maped.com'),
  (5, 'contabilidad@entelai.com')
on conflict do nothing;

commit;