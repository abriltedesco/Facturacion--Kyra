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
  if (!client) throw new ClientRepositoryError('El servicio de facturación no está configurado.', 'API_NOT_CONFIGURED')

  async function getById(id) {
    try {
      return mapClientRow(await client.get(`/clients/${id}`))
    } catch (error) {
      throw repositoryError(error)
    }
  }

  return {
    async list() {
      try {
        const rows = await client.get('/clients')
        return (rows || []).map(mapClientRow)
      } catch (error) {
        throw repositoryError(error)
      }
    },

    getById,

    async save(clientDraft) {
      try {
        const saved = await client.post('/clients', {
          client: clientPayload(clientDraft),
          ccEmails: ccEmailsPayload(clientDraft.ccEmails),
          expectedUpdatedAt: clientDraft.id ? clientDraft.updatedAt : null,
        })
        return mapClientRow(saved)
      } catch (error) {
        throw repositoryError(error)
      }
    },

    async setStatus(clientDraft, status) {
      try {
        const saved = await client.patch(`/clients/${clientDraft.id}/status`, {
          status,
          expectedUpdatedAt: clientDraft.updatedAt,
        })
        return mapClientRow(saved)
      } catch (error) {
        throw repositoryError(error)
      }
    },

    async listCountries() {
      try {
        const rows = await client.get('/countries')
        return (rows || []).map(mapCountryRow)
      } catch (error) {
        throw repositoryError(error)
      }
    },

    async listFiscalConditions() {
      try {
        const rows = await client.get('/fiscal-conditions')
        return (rows || []).map(mapFiscalConditionRow)
      } catch (error) {
        throw repositoryError(error)
      }
    },

    async listTaxCategories() {
      try {
        const rows = await client.get('/tax-categories')
        return (rows || []).map(mapTaxCategoryRow)
      } catch (error) {
        throw repositoryError(error)
      }
    },

    async saveCountry(country) {
      try {
        const saved = await client.post('/countries', {
          id: country.id || null,
          code: country.code,
          name: country.name,
          active: country.active ?? true,
        })
        return mapCountryRow(saved)
      } catch (error) {
        throw repositoryError(error)
      }
    },

    async saveFiscalCondition(condition) {
      try {
        const saved = await client.post('/fiscal-conditions', {
          id: condition.id || null,
          countryId: condition.countryId,
          name: condition.name,
          active: condition.active ?? true,
        })
        return mapFiscalConditionRow(saved)
      } catch (error) {
        throw repositoryError(error)
      }
    },

    async saveTaxCategory(category) {
      try {
        const saved = await client.post('/tax-categories', {
          id: category.id || null,
          name: category.name,
          taxRate: category.taxRate,
          active: category.active ?? true,
        })
        return mapTaxCategoryRow(saved)
      } catch (error) {
        throw repositoryError(error)
      }
    },
  }
}
