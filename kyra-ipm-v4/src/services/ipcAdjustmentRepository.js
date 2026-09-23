// Repositorio del Módulo 4 — Actualización por IPC.

export function mapIpcAdjustmentRow(row) {
  return {
    id: row.id,
    clientServiceId: row.client_service_id,
    periodMonth: row.period_month,
    periodYear: row.period_year,
    adjustmentType: row.adjustment_type,
    ipcPercentage: Number(row.ipc_percentage),
    amountBefore: row.amount_before === null || row.amount_before === undefined ? null : Number(row.amount_before),
    amountAfter: row.amount_after === null || row.amount_after === undefined ? null : Number(row.amount_after),
    impactLevel: row.impact_level,
    significantIncrease: row.significant_increase,
    reason: row.reason || '',
    status: row.status,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    serviceName: row.service_name,
    serviceType: row.service_type,
    serviceCurrency: row.service_currency,
    servicePeriodicity: row.service_periodicity,
    clientId: row.client_id,
    clientName: row.client_name,
    billingEntityId: row.billing_entity_id,
    billingEntityName: row.billing_entity_name,
    defaultVoucher: row.default_voucher,
    lastIncreaseDate: row.last_increase_date,
  }
}

export class IpcAdjustmentRepositoryError extends Error {
  constructor(message, code, cause) {
    super(message, { cause })
    this.name = 'IpcAdjustmentRepositoryError'
    this.code = code || 'IPC_ADJUSTMENT_REQUEST_FAILED'
  }
}

function repositoryError(error) {
  if (!error) return null
  const messages = {
    '23514': 'Faltan montos para poder aprobar el ajuste.',
    '22023': 'Los datos del ajuste no son válidos.',
    '40001': 'El ajuste cambió mientras lo editabas. Recargá los datos e intentá nuevamente.',
    PGRST116: 'No encontramos el ajuste solicitado.',
    IPC_ADJUSTMENT_ALREADY_CLOSED: 'Este ajuste ya fue aprobado o rechazado.',
  }
  return new IpcAdjustmentRepositoryError(messages[error.code] || error.message || 'No se pudo completar la operación.', error.code, error)
}

export function createIpcAdjustmentRepository(client) {
  if (!client) throw new IpcAdjustmentRepositoryError('Supabase no está configurado.', 'SUPABASE_NOT_CONFIGURED')

  return {
    async list() {
      const { data, error } = await client
        .from('ipc_adjustments_with_context')
        .select('*')
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false })
      if (error) throw repositoryError(error)
      return (data || []).map(mapIpcAdjustmentRow)
    },

    async generate({ periodMonth, periodYear, ipcPercentage, clientServiceIds }) {
      const { data, error } = await client.rpc('generate_ipc_adjustments', {
        p_period_month: periodMonth,
        p_period_year: periodYear,
        p_ipc_percentage: ipcPercentage,
        p_client_service_ids: clientServiceIds || null,
      })
      if (error) throw repositoryError(error)
      return (data || []).map(mapIpcAdjustmentRow)
    },

    async save(adjustmentDraft) {
      const { data, error } = await client.rpc('save_ipc_adjustment', {
        p_id: adjustmentDraft.id,
        p_adjustment_type: adjustmentDraft.adjustmentType,
        p_ipc_percentage: adjustmentDraft.ipcPercentage,
        p_amount_before: adjustmentDraft.amountBefore,
        p_reason: adjustmentDraft.reason || null,
        p_expected_updated_at: adjustmentDraft.updatedAt,
      })
      if (error) throw repositoryError(error)
      return mapIpcAdjustmentRow(data)
    },

    async approve(adjustmentDraft, reason) {
      const { data, error } = await client.rpc('approve_ipc_adjustment', {
        p_id: adjustmentDraft.id,
        p_expected_updated_at: adjustmentDraft.updatedAt,
        p_reason: reason || null,
      })
      if (error) throw repositoryError(error)
      return mapIpcAdjustmentRow(data)
    },

    async reject(adjustmentDraft) {
      const { data, error } = await client.rpc('reject_ipc_adjustment', {
        p_id: adjustmentDraft.id,
        p_expected_updated_at: adjustmentDraft.updatedAt,
      })
      if (error) throw repositoryError(error)
      return mapIpcAdjustmentRow(data)
    },
  }
}
