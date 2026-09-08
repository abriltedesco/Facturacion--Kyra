function mapClientEmail(row) {
  return { id: row.id, email: row.email }
}

export function mapCountryRow(row) {
  return { id: row.id, code: row.code, name: row.name, active: row.active }
}

export function mapFiscalConditionRow(row) {
  return { id: row.id, countryId: row.country_id, name: row.name, active: row.active }
}

export function mapTaxCategoryRow(row) {
  return { id: row.id, name: row.name, taxRate: Number(row.tax_rate), active: row.active }
}

export function mapClientRow(row) {
  const ccEmails = (row.ccEmails || []).map(mapClientEmail)

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    billingEntityId: row.billing_entity_id,
    countryId: row.country_id,
    fiscalConditionId: row.fiscal_condition_id,
    fiscalId: row.fiscal_id,
    taxCategoryId: row.tax_category_id,
    primaryEmail: row.primary_email,
    ipcAdjustable: row.ipc_adjustable,
    ipcPeriodicity: row.ipc_periodicity,
    driveFolderRef: row.drive_folder_ref || '',
    internalNotes: row.internal_notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    ccEmails: ccEmails.map(item => item.email),
    country: row.country ? mapCountryRow(row.country) : null,
    fiscalCondition: row.fiscalCondition ? mapFiscalConditionRow(row.fiscalCondition) : null,
    taxCategory: row.taxCategory ? mapTaxCategoryRow(row.taxCategory) : null,
    billingEntity: row.billingEntity
      ? { id: row.billingEntity.id, name: row.billingEntity.name, defaultVoucher: row.billingEntity.default_voucher }
      : null,
  }
}

const CLIENT_SELECT = `
  *,
  ccEmails:client_emails(*),
  country:countries(*),
  fiscalCondition:fiscal_conditions!clients_fiscal_condition_country_fkey(*),
  taxCategory:tax_categories(*),
  billingEntity:billing_entities(*)
`

export class ClientRepositoryError extends Error {
  constructor(message, code, cause) {
    super(message, { cause })
    this.name = 'ClientRepositoryError'
    this.code = code || 'CLIENT_REQUEST_FAILED'
  }
}

function repositoryError(error) {
  if (!error) return null
  if (error.message === 'INVALID_FISCAL_ID') {
    return new ClientRepositoryError('La identificación fiscal no es válida para el país seleccionado.', error.code, error)
  }
  const messages = {
    '23505': 'Ya existe un cliente con esa identificación fiscal en el país seleccionado.',
    '23514': 'Los datos no cumplen las reglas del cliente.',
    '23503': 'La condición fiscal no corresponde al país seleccionado, o la entidad emisora no existe.',
    '40001': 'El cliente cambió mientras lo editabas. Recargá los datos e intentá nuevamente.',
    PGRST116: 'No encontramos el cliente solicitado.',
  }
  return new ClientRepositoryError(messages[error.code] || error.message || 'No se pudo completar la operación.', error.code, error)
}

function clientPayload(clientDraft) {
  return {
    id: clientDraft.id || null,
    name: clientDraft.name,
    status: clientDraft.status || 'active',
    billingEntityId: clientDraft.billingEntityId,
    countryId: clientDraft.countryId,
    fiscalConditionId: clientDraft.fiscalConditionId,
    fiscalId: clientDraft.fiscalId,
    taxCategoryId: clientDraft.taxCategoryId || null,
    primaryEmail: clientDraft.primaryEmail,
    ipcAdjustable: Boolean(clientDraft.ipcAdjustable),
    ipcPeriodicity: clientDraft.ipcAdjustable ? clientDraft.ipcPeriodicity : null,
    driveFolderRef: clientDraft.driveFolderRef || '',
    internalNotes: clientDraft.internalNotes || '',
  }
}

function ccEmailsPayload(ccEmails) {
  return (ccEmails || []).filter(email => String(email || '').trim().length > 0)
}

export function createClientRepository(client) {
  if (!client) throw new ClientRepositoryError('Supabase no está configurado.', 'SUPABASE_NOT_CONFIGURED')

  async function getById(id) {
    const { data, error } = await client
      .from('clients')
      .select(CLIENT_SELECT)
      .eq('id', id)
      .single()
    if (error) throw repositoryError(error)
    return mapClientRow(data)
  }

  return {
    async list() {
      const { data, error } = await client
        .from('clients')
        .select(CLIENT_SELECT)
        .order('name', { ascending: true })
      if (error) throw repositoryError(error)
      return (data || []).map(mapClientRow)
    },

    getById,

    async save(clientDraft) {
      const { data, error } = await client.rpc('save_client', {
        p_client: clientPayload(clientDraft),
        p_cc_emails: ccEmailsPayload(clientDraft.ccEmails),
        p_expected_updated_at: clientDraft.id ? clientDraft.updatedAt : null,
      })
      if (error) throw repositoryError(error)
      return getById(data.id)
    },

    async setStatus(clientDraft, status) {
      const { data, error } = await client.rpc('set_client_status', {
        p_client_id: clientDraft.id,
        p_status: status,
        p_expected_updated_at: clientDraft.updatedAt,
      })
      if (error) throw repositoryError(error)
      return getById(data.id)
    },

    async listCountries() {
      const { data, error } = await client.from('countries').select('*').order('name', { ascending: true })
      if (error) throw repositoryError(error)
      return (data || []).map(mapCountryRow)
    },

    async listFiscalConditions() {
      const { data, error } = await client.from('fiscal_conditions').select('*').order('name', { ascending: true })
      if (error) throw repositoryError(error)
      return (data || []).map(mapFiscalConditionRow)
    },

    async listTaxCategories() {
      const { data, error } = await client.from('tax_categories').select('*').order('name', { ascending: true })
      if (error) throw repositoryError(error)
      return (data || []).map(mapTaxCategoryRow)
    },

    async saveCountry(country) {
      const { data, error } = await client.rpc('save_country', {
        p_id: country.id || null,
        p_code: country.code,
        p_name: country.name,
        p_active: country.active ?? true,
      })
      if (error) throw repositoryError(error)
      return mapCountryRow(data)
    },

    async saveFiscalCondition(condition) {
      const { data, error } = await client.rpc('save_fiscal_condition', {
        p_id: condition.id || null,
        p_country_id: condition.countryId,
        p_name: condition.name,
        p_active: condition.active ?? true,
      })
      if (error) throw repositoryError(error)
      return mapFiscalConditionRow(data)
    },

    async saveTaxCategory(category) {
      const { data, error } = await client.rpc('save_tax_category', {
        p_id: category.id || null,
        p_name: category.name,
        p_tax_rate: category.taxRate,
        p_active: category.active ?? true,
      })
      if (error) throw repositoryError(error)
      return mapTaxCategoryRow(data)
    },
  }
}
