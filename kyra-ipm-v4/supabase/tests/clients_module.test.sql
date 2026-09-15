begin;

select plan(16);

select has_table('public', 'clients', 'clients table exists');
select has_table('public', 'client_emails', 'client emails table exists');
select has_table('public', 'countries', 'countries table exists');
select has_table('public', 'fiscal_conditions', 'fiscal conditions table exists');
select has_table('public', 'tax_categories', 'tax categories table exists');
select has_function('public', 'save_client', 'save RPC exists');

set local role anon;
select throws_ok(
  $$select * from public.clients$$,
  '42501',
  null,
  'anonymous users cannot read clients'
);
select throws_ok(
  $$select public.save_client('{}'::jsonb, '[]'::jsonb, null)$$,
  '42501',
  null,
  'anonymous users cannot call save RPC'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set local request.jwt.claim.role = 'authenticated';

select results_eq(
  $$select count(*)::integer from public.clients$$,
  array[12],
  'authenticated users read the twelve seeded clients'
);

select ok(
  not has_table_privilege('authenticated', 'public.clients', 'DELETE'),
  'authenticated users have no physical delete privilege'
);

select throws_ok(
  $$
    select public.save_client(
      jsonb_build_object(
        'name', 'Cliente CUIT inválido',
        'billingEntityId', 1,
        'countryId', 1,
        'fiscalConditionId', 1,
        'fiscalId', '20-12345678-9',
        'primaryEmail', 'prueba@kyra.local'
      ),
      '[]'::jsonb,
      null
    )
  $$,
  '23514',
  'INVALID_FISCAL_ID',
  'invalid CUIT is rejected for Argentine clients'
);

select throws_ok(
  $$
    select public.save_client(
      jsonb_build_object(
        'name', 'Cliente condición cruzada',
        'billingEntityId', 1,
        'countryId', 1,
        'fiscalConditionId', 4,
        'fiscalId', '20-12345678-6',
        'primaryEmail', 'prueba@kyra.local'
      ),
      '[]'::jsonb,
      null
    )
  $$,
  '23503',
  'fiscal condition must belong to the selected country'
);

select results_eq(
  $$
    select name
    from public.save_client(
      jsonb_build_object(
        'name', 'Cliente de prueba',
        'status', 'active',
        'billingEntityId', 1,
        'countryId', 1,
        'fiscalConditionId', 1,
        'fiscalId', '20-12345678-6',
        'primaryEmail', 'prueba@kyra.local',
        'ipcAdjustable', false
      ),
      jsonb_build_array('cc1@kyra.local', 'cc2@kyra.local'),
      null
    )
  $$,
  array['Cliente de prueba'::text],
  'save RPC creates a client'
);

select results_eq(
  $$
    select count(*)::integer
    from public.client_emails
    where client_id = (select id from public.clients where fiscal_id = '20-12345678-6')
  $$,
  array[2],
  'save RPC creates its cc emails atomically'
);

select throws_ok(
  $$
    select public.save_client(
      jsonb_build_object(
        'id', (select id from public.clients where fiscal_id = '20-12345678-6'),
        'name', 'Cambio obsoleto',
        'billingEntityId', 1,
        'countryId', 1,
        'fiscalConditionId', 1,
        'fiscalId', '20-12345678-6',
        'primaryEmail', 'prueba@kyra.local'
      ),
      '[]'::jsonb,
      '2000-01-01T00:00:00Z'::timestamptz
    )
  $$,
  '40001',
  'CLIENT_VERSION_CONFLICT',
  'stale edits are rejected'
);

select results_eq(
  $$
    select status
    from public.set_client_status(
      (select id from public.clients where fiscal_id = '20-12345678-6'),
      'archived',
      (select updated_at from public.clients where fiscal_id = '20-12345678-6')
    )
  $$,
  array['archived'::text],
  'clients are archived instead of deleted'
);

reset role;

select * from finish();
rollback;
