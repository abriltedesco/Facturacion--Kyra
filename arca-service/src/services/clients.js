import { pool } from '../db/pool.js'

function groupBy(rows, key) {
  return rows.reduce((acc, row) => {
    ;(acc[row[key]] ||= []).push(row)
    return acc
  }, {})
}

// Matches Supabase's CLIENT_SELECT nested embed (see
// kyra-ipm-v4/src/services/clientRepository.js) so mapClientRow keeps working
// unchanged: country / fiscalCondition / taxCategory / billingEntity as nested
// objects (snake_case keys), ccEmails attached separately below.
const CLIENT_QUERY = `
  select
    c.*,
    json_build_object('id', co.id, 'code', co.code, 'name', co.name, 'active', co.active) as country,
    json_build_object('id', fc.id, 'country_id', fc.country_id, 'name', fc.name, 'active', fc.active) as "fiscalCondition",
    case when tc.id is null then null
      else json_build_object('id', tc.id, 'name', tc.name, 'tax_rate', tc.tax_rate, 'active', tc.active)
    end as "taxCategory",
    json_build_object('id', be.id, 'name', be.name, 'default_voucher', be.default_voucher) as "billingEntity"
  from clients c
  join countries co on co.id = c.country_id
  join fiscal_conditions fc on fc.id = c.fiscal_condition_id
  left join tax_categories tc on tc.id = c.tax_category_id
  join billing_entities be on be.id = c.billing_entity_id
`

async function attachCcEmails(clients) {
  if (clients.length === 0) return []
  const ids = clients.map(client => client.id)
  const { rows: emails } = await pool.query(
    'select * from client_emails where client_id = any($1) order by id asc',
    [ids],
  )
  const byClient = groupBy(emails, 'client_id')
  return clients.map(client => ({ ...client, ccEmails: byClient[client.id] || [] }))
}

export async function listClients() {
  const { rows } = await pool.query(`${CLIENT_QUERY} order by c.name asc`)
  return attachCcEmails(rows)
}

export async function getClient(id) {
  const { rows } = await pool.query(`${CLIENT_QUERY} where c.id = $1`, [id])
  if (!rows[0]) return null
  const [withEmails] = await attachCcEmails(rows)
  return withEmails
}
