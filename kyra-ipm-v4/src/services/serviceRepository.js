// Repositorio del Módulo 3 — Servicios: catálogo global + servicios asignados por cliente.

export function mapCatalogRow(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    currency: row.currency,
    basePrice: row.base_price === null || row.base_price === undefined ? null : Number(row.base_price),
    status: row.status,
    activeClientsCount: row.active_clients_count === undefined ? undefined : Number(row.active_clients_count),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapCatalogPriceHistoryRow(row) {
  return {
    id: row.id,
    catalogId: row.catalog_id,
    effectiveDate: row.effective_date,
    previousPrice: row.previous_price === null ? null : Number(row.previous_price),
    newPrice: Number(row.new_price),
    reason: row.reason || '',
    createdAt: row.created_at,
  }
}

export function mapClientServiceRow(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    catalogId: row.catalog_id,
    name: row.name,
    description: row.description || '',
    type: row.type,
    currency: row.currency,
    baseAmount: row.base_amount === null || row.base_amount === undefined ? null : Number(row.base_amount),
    hourlyRate: row.hourly_rate === null || row.hourly_rate === undefined ? null : Number(row.hourly_rate),
    periodicity: row.periodicity,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    priceHistory: (row.priceHistory || []).map(mapClientServicePriceHistoryRow),
  }
}

export function mapClientServicePriceHistoryRow(row) {
  return {
    id: row.id,
    clientServiceId: row.client_service_id,
    effectiveDate: row.effective_date,
    previousValue: row.previous_value === null ? null : Number(row.previous_value),
    newValue: Number(row.new_value),
    reason: row.reason || '',
    createdAt: row.created_at,
  }
}

const CLIENT_SERVICE_SELECT = `
  *,
  priceHistory:client_service_price_history(*)
`

export class ServiceRepositoryError extends Error {
  constructor(message, code, cause) {
    super(message, { cause })
    this.name = 'ServiceRepositoryError'
    this.code = code || 'SERVICE_REQUEST_FAILED'
  }
}

function repositoryError(error) {
  if (!error) return null
  const messages = {
    '23505': 'Ya existe un servicio con ese nombre.',
    '23514': 'Los datos no cumplen las reglas del servicio.',
    '23503': 'El cliente o el servicio de catálogo indicado no existe.',
    '40001': 'El servicio cambió mientras lo editabas. Recargá los datos e intentá nuevamente.',
    PGRST116: 'No encontramos el servicio solicitado.',
  }
  return new ServiceRepositoryError(messages[error.code] || error.message || 'No se pudo completar la operación.', error.code, error)
}

function catalogPayload(catalogDraft) {
  return {
    id: catalogDraft.id || null,
    name: catalogDraft.name,
    type: catalogDraft.type,
    currency: catalogDraft.currency,
    basePrice: catalogDraft.type === 'fixed' ? catalogDraft.basePrice : null,
    status: catalogDraft.status || 'active',
  }
}

function clientServicePayload(serviceDraft) {
  return {
    id: serviceDraft.id || null,
    clientId: serviceDraft.clientId,
    catalogId: serviceDraft.catalogId || null,
    name: serviceDraft.name,
    description: serviceDraft.description || '',
    type: serviceDraft.type,
    currency: serviceDraft.currency,
    baseAmount: serviceDraft.type === 'fixed' ? serviceDraft.baseAmount : null,
    hourlyRate: serviceDraft.type === 'hourly' ? serviceDraft.hourlyRate : null,
    periodicity: serviceDraft.periodicity || 'monthly',
    status: serviceDraft.status || 'active',
  }
}

export function createServiceRepository(client) {
  if (!client) throw new ServiceRepositoryError('Supabase no está configurado.', 'SUPABASE_NOT_CONFIGURED')

  async function getClientServiceById(id) {
    const { data, error } = await client
      .from('client_services')
      .select(CLIENT_SERVICE_SELECT)
      .eq('id', id)
      .single()
    if (error) throw repositoryError(error)
    return mapClientServiceRow(data)
  }

  return {
    async listCatalog() {
      const { data, error } = await client
        .from('service_catalog_with_stats')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw repositoryError(error)
      return (data || []).map(mapCatalogRow)
    },

    async listCatalogPriceHistory(catalogId) {
      const { data, error } = await client
        .from('service_catalog_price_history')
        .select('*')
        .eq('catalog_id', catalogId)
        .order('effective_date', { ascending: false })
      if (error) throw repositoryError(error)
      return (data || []).map(mapCatalogPriceHistoryRow)
    },

    async saveCatalog(catalogDraft, reason) {
      const { data, error } = await client.rpc('save_service_catalog', {
        p_catalog: catalogPayload(catalogDraft),
        p_reason: reason || null,
        p_expected_updated_at: catalogDraft.id ? catalogDraft.updatedAt : null,
      })
      if (error) throw repositoryError(error)
      return mapCatalogRow(data)
    },

    async setCatalogStatus(catalogDraft, status) {
      const { data, error } = await client.rpc('set_service_catalog_status', {
        p_catalog_id: catalogDraft.id,
        p_status: status,
        p_expected_updated_at: catalogDraft.updatedAt,
      })
      if (error) throw repositoryError(error)
      return mapCatalogRow(data)
    },

    async listByClient(clientId) {
      const { data, error } = await client
        .from('client_services')
        .select(CLIENT_SERVICE_SELECT)
        .eq('client_id', clientId)
        .order('name', { ascending: true })
      if (error) throw repositoryError(error)
      return (data || []).map(mapClientServiceRow)
    },

    async listAllClientServices() {
      const { data, error } = await client
        .from('client_services')
        .select(CLIENT_SERVICE_SELECT)
        .order('name', { ascending: true })
      if (error) throw repositoryError(error)
      return (data || []).map(mapClientServiceRow)
    },

    getClientServiceById,

    async saveClientService(serviceDraft, reason) {
      const { data, error } = await client.rpc('save_client_service', {
        p_service: clientServicePayload(serviceDraft),
        p_reason: reason || null,
        p_expected_updated_at: serviceDraft.id ? serviceDraft.updatedAt : null,
      })
      if (error) throw repositoryError(error)
      return getClientServiceById(data.id)
    },

    async setClientServiceStatus(serviceDraft, status) {
      const { data, error } = await client.rpc('set_client_service_status', {
        p_service_id: serviceDraft.id,
        p_status: status,
        p_expected_updated_at: serviceDraft.updatedAt,
      })
      if (error) throw repositoryError(error)
      return getClientServiceById(data.id)
    },
  }
}
