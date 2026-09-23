begin;

select plan(13);

select has_table('public', 'service_catalog', 'service catalog table exists');
select has_table('public', 'service_catalog_price_history', 'service catalog price history table exists');
select has_table('public', 'client_services', 'client services table exists');
select has_table('public', 'client_service_price_history', 'client service price history table exists');
select has_function('public', 'save_service_catalog', 'save service catalog RPC exists');
select has_function('public', 'save_client_service', 'save client service RPC exists');

set local role anon;
select throws_ok(
  $$select * from public.service_catalog$$,
  '42501',
  null,
  'anonymous users cannot read the service catalog'
);
select throws_ok(
  $$select public.save_service_catalog('{}'::jsonb, null, null)$$,
  '42501',
  null,
  'anonymous users cannot call save_service_catalog'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set local request.jwt.claim.role = 'authenticated';

select lives_ok(
  $$
    select public.save_service_catalog(
      jsonb_build_object('name', 'Social Media', 'type', 'fixed', 'currency', 'ARS', 'basePrice', 85000),
      'Alta inicial',
      null
    )
  $$,
  'authenticated users can create a catalog service'
);

select results_eq(
  $$select count(*)::integer from public.service_catalog_price_history where catalog_id = (select id from public.service_catalog where name = 'Social Media')$$,
  array[1],
  'creating a catalog service records the initial price history entry'
);

select lives_ok(
  $$
    select public.set_service_catalog_status(
      (select id from public.service_catalog where name = 'Social Media'),
      'archived',
      (select updated_at from public.service_catalog where name = 'Social Media')
    )
  $$,
  'authenticated users can archive a catalog service (soft delete)'
);

select is(
  (select status from public.service_catalog where name = 'Social Media'),
  'archived',
  'archiving a service sets its status to archived'
);

select isnt(
  (select archived_at from public.service_catalog where name = 'Social Media'),
  null,
  'archiving a service records archived_at'
);

select * from finish();
rollback;
