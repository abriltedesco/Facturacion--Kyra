begin;

select plan(15);

select has_table('public', 'billing_entities', 'billing entities table exists');
select has_table('public', 'entity_bank_accounts', 'bank accounts table exists');
select has_table('public', 'entity_arca_documents', 'ARCA documents table exists');
select has_function('public', 'save_billing_entity', 'save RPC exists');

select ok(private.is_valid_cuit('30-70901901-1'), 'valid CUIT passes checksum');
select isnt(private.is_valid_cuit('30-70901901-2'), true, 'invalid CUIT fails checksum');

set local role anon;
select throws_ok(
  $$select * from public.billing_entities$$,
  '42501',
  null,
  'anonymous users cannot read entities'
);
select throws_ok(
  $$select public.save_billing_entity('{}'::jsonb, '[]'::jsonb, null)$$,
  '42501',
  null,
  'anonymous users cannot call save RPC'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set local request.jwt.claim.role = 'authenticated';

select results_eq(
  $$select count(*)::integer from public.billing_entities$$,
  array[3],
  'authenticated users read the three seeded entities'
);

select ok(
  not has_table_privilege('authenticated', 'public.billing_entities', 'DELETE'),
  'authenticated users have no physical delete privilege'
);

select results_eq(
  $$
    select name
    from public.save_billing_entity(
      jsonb_build_object(
        'name', 'Entidad de prueba',
        'status', 'active',
        'legalType', 'srl',
        'countryCode', 'AR',
        'fiscalIdType', 'CUIT',
        'fiscalId', '20-12345678-6',
        'fiscalAddress', 'Calle de prueba 123, CABA',
        'grossIncomeNumber', '',
        'billingEmail', 'prueba@kyra.local',
        'defaultVoucher', 'A',
        'allowsBExempt', false,
        'pointOfSale', '0003',
        'invoicePrefix', ''
      ),
      jsonb_build_array(
        jsonb_build_object(
          'bankName', 'Banco de prueba',
          'accountHolder', 'Entidad de prueba',
          'currency', 'ARS',
          'accountScope', 'local',
          'cbu', '0720000300000000000004',
          'alias', 'ENTIDAD.PRUEBA',
          'accountNumber', '',
          'routingNumber', '',
          'swiftBic', '',
          'iban', '',
          'isPrimary', true
        )
      ),
      null
    )
  $$,
  array['Entidad de prueba'::text],
  'save RPC creates an entity'
);

select results_eq(
  $$
    select count(*)::integer
    from public.entity_bank_accounts
    where entity_id = (select id from public.billing_entities where fiscal_id_normalized = '20123456786')
      and archived_at is null
  $$,
  array[1],
  'save RPC creates its bank account atomically'
);

select throws_ok(
  $$
    select public.save_billing_entity(
      jsonb_build_object(
        'id', (select id from public.billing_entities where fiscal_id_normalized = '20123456786'),
        'name', 'Cambio obsoleto',
        'status', 'active',
        'legalType', 'srl',
        'countryCode', 'AR',
        'fiscalIdType', 'CUIT',
        'fiscalId', '20-12345678-6',
        'fiscalAddress', 'Calle de prueba 123, CABA',
        'defaultVoucher', 'A',
        'allowsBExempt', false,
        'pointOfSale', '0003'
      ),
      jsonb_build_array(jsonb_build_object('bankName', 'Banco de prueba')),
      '2000-01-01T00:00:00Z'::timestamptz
    )
  $$,
  '40001',
  'ENTITY_VERSION_CONFLICT',
  'stale edits are rejected'
);

select results_eq(
  $$
    select status
    from public.set_billing_entity_status(
      (select id from public.billing_entities where fiscal_id_normalized = '20123456786'),
      'archived',
      (select updated_at from public.billing_entities where fiscal_id_normalized = '20123456786')
    )
  $$,
  array['archived'::text],
  'entities are archived instead of deleted'
);

reset role;

select results_eq(
  $$select public from storage.buckets where id = 'arca-documents'$$,
  array[false],
  'ARCA bucket is private'
);

select * from finish();
rollback;