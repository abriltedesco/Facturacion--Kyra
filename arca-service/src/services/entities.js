import { pool } from '../db/pool.js'

function groupBy(rows, key) {
  return rows.reduce((acc, row) => {
    ;(acc[row[key]] ||= []).push(row)
    return acc
  }, {})
}

// Attaches bankAccounts / arcaDocuments to each entity row, matching the shape of
// Supabase's ENTITY_SELECT nested embed (see kyra-ipm-v4/src/services/entityRepository.js)
// so mapEntityRow keeps working unchanged.
async function attachChildren(entities) {
  if (entities.length === 0) return []
  const ids = entities.map(entity => entity.id)

  const [{ rows: bankAccounts }, { rows: arcaDocuments }] = await Promise.all([
    pool.query('select * from entity_bank_accounts where entity_id = any($1) order by id asc', [ids]),
    pool.query(
      `select d.*, u.username as uploaded_by_username, u.display_name as uploaded_by_display_name
       from entity_arca_documents d
       left join users u on u.id = d.uploaded_by
       where d.entity_id = any($1)
       order by d.uploaded_at desc`,
      [ids],
    ),
  ])

  const bankByEntity = groupBy(bankAccounts, 'entity_id')
  const docsByEntity = groupBy(arcaDocuments, 'entity_id')

  return entities.map(entity => ({
    ...entity,
    bankAccounts: bankByEntity[entity.id] || [],
    arcaDocuments: (docsByEntity[entity.id] || []).map(doc => ({
      ...doc,
      uploadedByProfile: doc.uploaded_by_username
        ? { username: doc.uploaded_by_username, display_name: doc.uploaded_by_display_name }
        : null,
    })),
  }))
}

export async function listEntities() {
  const { rows } = await pool.query('select * from billing_entities order by name asc')
  return attachChildren(rows)
}

export async function getEntity(id) {
  const { rows } = await pool.query('select * from billing_entities where id = $1', [id])
  if (!rows[0]) return null
  const [withChildren] = await attachChildren(rows)
  return withChildren
}
