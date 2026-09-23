begin;

select plan(9);

select has_table('public', 'ipc_adjustments', 'ipc_adjustments table exists');
select has_function('public', 'generate_ipc_adjustments', 'generate RPC exists');
select has_function('public', 'save_ipc_adjustment', 'save RPC exists');
select has_function('public', 'approve_ipc_adjustment', 'approve RPC exists');
select has_function('public', 'reject_ipc_adjustment', 'reject RPC exists');

set local role anon;
select throws_ok(
  $$select * from public.ipc_adjustments$$,
  '42501',
  null,
  'anonymous users cannot read ipc adjustments'
);
select throws_ok(
  $$select public.generate_ipc_adjustments(8::smallint, 2026::smallint, 10, null)$$,
  '42501',
  null,
  'anonymous users cannot call generate_ipc_adjustments'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set local request.jwt.claim.role = 'authenticated';

select throws_ok(
  $$select public.generate_ipc_adjustments(8::smallint, 2026::smallint, 150, null)$$,
  '22023',
  'INVALID_IPC_PERCENTAGE',
  'rejects an out-of-range ipc percentage'
);

select lives_ok(
  $$select public.generate_ipc_adjustments(8::smallint, 2026::smallint, 10, null)$$,
  'authenticated users can generate a batch of ipc adjustments'
);

select * from finish();
rollback;
