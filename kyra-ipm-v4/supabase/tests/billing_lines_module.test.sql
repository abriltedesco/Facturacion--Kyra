begin;

select plan(11);

select has_table('public', 'billing_lines', 'billing_lines table exists');
select has_function('public', 'generate_billing_lines', 'generate RPC exists');
select has_function('public', 'create_manual_billing_line', 'manual create RPC exists');
select has_function('public', 'edit_billing_line', 'edit RPC exists');
select has_function('public', 'approve_billing_line', 'approve RPC exists');
select has_function('public', 'exclude_billing_line', 'exclude RPC exists');
select has_function('public', 'reject_billing_line', 'reject RPC exists');
select has_function('public', 'mark_billing_line_issued', 'mark issued RPC exists');
select has_function('public', 'mark_billing_line_sent', 'mark sent RPC exists');

set local role anon;
select throws_ok(
  $$select * from public.billing_lines$$,
  '42501',
  null,
  'anonymous users cannot read billing lines'
);
select throws_ok(
  $$select public.generate_billing_lines(8::smallint, 2026::smallint)$$,
  '42501',
  null,
  'anonymous users cannot call generate_billing_lines'
);

select * from finish();
rollback;
