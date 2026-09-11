// Development-only data. Never use these fiscal or banking values in production.
// Ported from kyra-ipm-v4/supabase/seed.sql. Run with: npm run seed
import 'dotenv/config'

import bcrypt from 'bcryptjs'

import { pool, withTransaction, closePool } from '../src/db/pool.js'

const DEV_USER_ID = '11111111-1111-4111-8111-111111111111'
const DEV_USER_PASSWORD = 'KyraLocal2026'

async function seed() {
  const passwordHash = await bcrypt.hash(DEV_USER_PASSWORD, 12)

  await withTransaction(async client => {
    await client.query(
      `insert into public.users (id, username, display_name, password_hash, role)
       values ($1, 'mai', 'Mai Brandao', $2, 'admin')
       on conflict (id) do update
         set password_hash = excluded.password_hash,
             display_name = excluded.display_name,
             role = excluded.role`,
      [DEV_USER_ID, passwordHash],
    )

    await client.query(`
      insert into public.billing_entities (
        id, name, status, legal_type, country_code, fiscal_id_type, fiscal_id,
        fiscal_address, gross_income_number, billing_email, default_voucher,
        allows_b_exempt, point_of_sale, invoice_prefix, created_by, updated_by
      ) values
        (1, 'Kyra SRL', 'active', 'srl', 'AR', 'CUIT', '30-70901901-1',
         'Av. Corrientes 1234, CABA', '123-456789-0', 'facturacion@kyra.local',
         'A', true, '0001', null, '${DEV_USER_ID}', '${DEV_USER_ID}'),
        (2, 'Monotributo Personal (Mai)', 'active', 'monotributista', 'AR', 'CUIT', '30-69630509-5',
         'Av. Corrientes 1234, CABA', null, 'mai@kyra.local',
         'C', false, '0002', null, '${DEV_USER_ID}', '${DEV_USER_ID}'),
        (3, 'Mercury LLC', 'active', 'llc', 'US', 'EIN', '90-0388092',
         '1234 Brickell Ave, Suite 500, Miami, FL 33131', null, 'billing@kyra.local',
         'LLC', false, null, 'INV', '${DEV_USER_ID}', '${DEV_USER_ID}')
      on conflict (id) do nothing
    `)
    await client.query(`
      select setval(pg_get_serial_sequence('public.billing_entities', 'id'),
        greatest((select max(id) from public.billing_entities), 1), true)
    `)

    await client.query(`
      insert into public.entity_bank_accounts (
        entity_id, bank_name, account_holder, currency, account_scope,
        cbu, alias, account_number, routing_number, swift_bic, iban,
        is_primary, created_by, updated_by
      ) values
        (1, 'Banco Patagonia', 'Kyra SRL', 'ARS', 'local',
         '0720000100000000000001', 'KYRA.PATAGONIA', null, null, null, null,
         true, '${DEV_USER_ID}', '${DEV_USER_ID}'),
        (1, 'Banco Galicia', 'Kyra SRL', 'USD', 'local',
         '0070000100000000000002', 'KYRA.GALICIA.USD', null, null, null, null,
         true, '${DEV_USER_ID}', '${DEV_USER_ID}'),
        (2, 'Banco Patagonia Personal', 'Mai Brandao', 'ARS', 'local',
         '0720000200000000000003', 'MAI.PATAGONIA', null, null, null, null,
         true, '${DEV_USER_ID}', '${DEV_USER_ID}'),
        (3, 'Mercury Bank', 'Mercury LLC', 'USD', 'international',
         null, null, '123456789', '021000021', 'CHASUS33', null,
         true, '${DEV_USER_ID}', '${DEV_USER_ID}')
      on conflict do nothing
    `)

    await client.query(`
      insert into public.countries (id, code, name, active) overriding system value values
        (1, 'AR', 'Argentina', true),
        (2, 'CO', 'Colombia', true),
        (3, 'CR', 'Costa Rica', true)
      on conflict (id) do nothing
    `)
    await client.query(`
      select setval(pg_get_serial_sequence('public.countries', 'id'),
        greatest((select max(id) from public.countries), 1), true)
    `)

    await client.query(`
      insert into public.fiscal_conditions (id, country_id, name, active) overriding system value values
        (1, 1, 'Responsable Inscripto', true),
        (2, 1, 'Monotributista', true),
        (3, 1, 'Exento', true),
        (4, 2, 'Régimen Común', true),
        (5, 2, 'Régimen Simplificado', true),
        (6, 3, 'Régimen Tradicional', true)
      on conflict (id) do nothing
    `)
    await client.query(`
      select setval(pg_get_serial_sequence('public.fiscal_conditions', 'id'),
        greatest((select max(id) from public.fiscal_conditions), 1), true)
    `)

    await client.query(`
      insert into public.tax_categories (id, name, tax_rate, active) overriding system value values
        (1, 'Colombia 12.5%', 12.50, true),
        (2, 'Costa Rica 0%', 0.00, true)
      on conflict (id) do nothing
    `)
    await client.query(`
      select setval(pg_get_serial_sequence('public.tax_categories', 'id'),
        greatest((select max(id) from public.tax_categories), 1), true)
    `)

    await client.query(`
      insert into public.clients (
        id, name, status, billing_entity_id, country_id, fiscal_condition_id, fiscal_id,
        tax_category_id, primary_email, ipc_adjustable, ipc_periodicity, internal_notes,
        created_by, updated_by
      ) overriding system value values
        (1, 'Ayax', 'active', 1, 1, 1, '30-70901901-1',
         null, 'contacto@ayax.com.ar', false, null, null, '${DEV_USER_ID}', '${DEV_USER_ID}'),
        (2, 'Edding COL', 'active', 3, 2, 4, 'NIT-900111222-3',
         1, 'finance@edding.com.co', false, null,
         'Pagar a Valen y Floppy // Controlar en TC Visa Mai // Cobrar a cliente',
         '${DEV_USER_ID}', '${DEV_USER_ID}'),
        (3, 'Maped', 'active', 3, 2, 4, 'NIT-900333444-5',
         1, 'admin@maped.com', false, null,
         'Pagar a Valen y Floppy // Controlar en TC Visa Mai // Cobrar a cliente',
         '${DEV_USER_ID}', '${DEV_USER_ID}'),
        (4, 'SCS', 'active', 2, 1, 2, '30-69630509-5',
         null, 'facturacion@scs.com.ar', true, 'quarterly', null, '${DEV_USER_ID}', '${DEV_USER_ID}'),
        (5, 'Entelai', 'active', 1, 1, 1, '30-71580232-1',
         null, 'administracion@entelai.com', true, 'quarterly', null, '${DEV_USER_ID}', '${DEV_USER_ID}'),
        (6, 'P4C', 'active', 1, 1, 1, '30-71825771-5',
         null, 'sin-envio+p4c@kyra.internal', false, null, 'Pack de las 10 hs mensuales',
         '${DEV_USER_ID}', '${DEV_USER_ID}'),
        (7, 'Laura Di Cola', 'active', 2, 1, 2, '27-20283685-8',
         null, 'lauradico@gmail.com', true, 'quarterly', null, '${DEV_USER_ID}', '${DEV_USER_ID}'),
        (8, 'THC', 'active', 2, 1, 2, '30-71643480-6',
         null, 'admin@thc.com.ar', true, 'quarterly', null, '${DEV_USER_ID}', '${DEV_USER_ID}'),
        (9, 'UTALK', 'active', 1, 1, 1, '30-71547070-1',
         null, 'admin@utalk.io', false, null, null, '${DEV_USER_ID}', '${DEV_USER_ID}'),
        (10, 'Clínica Raña', 'active', 1, 1, 1, '30-65475263-6',
         null, 'administracion@clinicarana.com.ar', false, null, null, '${DEV_USER_ID}', '${DEV_USER_ID}'),
        (11, 'Fundación Holters', 'active', 2, 1, 3, '30-54208481-9',
         null, 'tesoreria@holters.org.ar', false, null, null, '${DEV_USER_ID}', '${DEV_USER_ID}'),
        (12, 'Dra. Rojas', 'active', 2, 1, 2, '20-32577039-3',
         null, 'dra.rojas@gmail.com', false, null, null, '${DEV_USER_ID}', '${DEV_USER_ID}')
      on conflict (id) do nothing
    `)
    await client.query(`
      select setval(pg_get_serial_sequence('public.clients', 'id'),
        greatest((select max(id) from public.clients), 1), true)
    `)

    await client.query(`
      insert into public.client_emails (client_id, email) values
        (3, 'contabilidad@maped.com'),
        (5, 'contabilidad@entelai.com')
      on conflict do nothing
    `)
  })

  const { rows } = await pool.query('select count(*)::int as clients from public.clients')
  console.log(`Seed complete. users: mai / ${DEV_USER_PASSWORD}  |  clients: ${rows[0].clients}`)
}

seed()
  .then(closePool)
  .catch(async err => {
    console.error('Seed failed:', err)
    await closePool()
    process.exit(1)
  })
