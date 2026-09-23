// Repositorio del Módulo 5 — Facturación mensual.
// Mapea las filas reales (billing_lines_with_context) al shape legacy que ya
// consumen FacturacionMes.jsx / EmisionPage.jsx (clienteId, servicioId, mes, etc.)
// para minimizar el impacto sobre esas pantallas.

const MES_NOMBRES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function mapBillingLineRow(row) {
  const baseAmount = row.base_amount === null || row.base_amount === undefined ? null : Number(row.base_amount)
  const pendingPct = row.pending_ipc_percentage === null || row.pending_ipc_percentage === undefined ? null : Number(row.pending_ipc_percentage)

  return {
    id: row.id,
    clienteId: row.client_id,
    servicioId: row.client_service_id,
    mes: MES_NOMBRES[row.period_month - 1],
    anio: row.period_year,
    tipoFactura: row.voucher_type,
    entidadId: row.billing_entity_id,
    moneda: row.currency,
    cantidadHoras: row.quantity_hours === null || row.quantity_hours === undefined ? null : Number(row.quantity_hours),
    tarifaHora: row.hourly_rate === null || row.hourly_rate === undefined ? null : Number(row.hourly_rate),
    montoBase: baseAmount,
    montoBaseAnterior: row.previous_base_amount === null || row.previous_base_amount === undefined ? null : Number(row.previous_base_amount),
    ajusteIPCPendiente: Boolean(row.ipc_adjustment_id && row.pending_ipc_status && row.pending_ipc_status !== 'aprobada' && row.pending_ipc_status !== 'rechazada'),
    porcentajeIPC: pendingPct,
    montoConIPC: baseAmount !== null && pendingPct !== null ? Math.round(baseAmount * (1 + pendingPct / 100) * 100) / 100 : null,
    importeNeto: row.net_amount === null || row.net_amount === undefined ? null : Number(row.net_amount),
    impuesto: row.tax_amount === null || row.tax_amount === undefined ? null : Number(row.tax_amount),
    importeBruto: row.gross_amount === null || row.gross_amount === undefined ? null : Number(row.gross_amount),
    alertas: row.alerts || [],
    variacionVsMesAnterior: row.variation_vs_previous === null || row.variation_vs_previous === undefined ? null : Number(row.variation_vs_previous),
    status: row.status,
    nroFactura: row.invoice_number || undefined,
    fechaEmision: row.issued_at || undefined,
    fechaVencimiento: row.due_date || undefined,
    fechaEnvio: row.sent_at ? row.sent_at.slice(0, 10) : undefined,
    notas: row.notes || '',
    updatedAt: row.updated_at,
  }
}

export class BillingLineRepositoryError extends Error {
  constructor(message, code, cause) {
    super(message, { cause })
    this.name = 'BillingLineRepositoryError'
    this.code = code || 'BILLING_LINE_REQUEST_FAILED'
  }
}

function repositoryError(error) {
  if (!error) return null
  const messages = {
    '23514': 'Faltan montos para poder completar la operación.',
    '22023': 'La línea no se puede modificar en su estado actual.',
    '40001': 'La línea cambió mientras la editabas. Recargá los datos e intentá nuevamente.',
    PGRST116: 'No encontramos la línea solicitada.',
  }
  return new BillingLineRepositoryError(messages[error.code] || error.message || 'No se pudo completar la operación.', error.code, error)
}

export function createBillingLineRepository(client) {
  if (!client) throw new BillingLineRepositoryError('Supabase no está configurado.', 'SUPABASE_NOT_CONFIGURED')

  return {
    async list() {
      const { data, error } = await client
        .from('billing_lines_with_context')
        .select('*')
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false })
      if (error) throw repositoryError(error)
      return (data || []).map(mapBillingLineRow)
    },

    async generate(periodMonth, periodYear) {
      const { data, error } = await client.rpc('generate_billing_lines', {
        p_period_month: periodMonth,
        p_period_year: periodYear,
      })
      if (error) throw repositoryError(error)
      return (data || []).map(mapBillingLineRow)
    },

    async createManual({ clientServiceId, periodMonth, periodYear, baseAmount, quantityHours, hourlyRate, notes }) {
      const { data, error } = await client.rpc('create_manual_billing_line', {
        p_client_service_id: clientServiceId,
        p_period_month: periodMonth,
        p_period_year: periodYear,
        p_base_amount: baseAmount ?? null,
        p_quantity_hours: quantityHours ?? null,
        p_hourly_rate: hourlyRate ?? null,
        p_notes: notes || null,
      })
      if (error) throw repositoryError(error)
      return mapBillingLineRow(data)
    },

    async edit(line, { baseAmount, quantityHours, hourlyRate, notes }) {
      const { data, error } = await client.rpc('edit_billing_line', {
        p_id: line.id,
        p_base_amount: baseAmount ?? null,
        p_quantity_hours: quantityHours ?? null,
        p_hourly_rate: hourlyRate ?? null,
        p_notes: notes || null,
        p_expected_updated_at: line.updatedAt,
      })
      if (error) throw repositoryError(error)
      return mapBillingLineRow(data)
    },

    async approve(line, { quantityHours, hourlyRate } = {}) {
      const { data, error } = await client.rpc('approve_billing_line', {
        p_id: line.id,
        p_quantity_hours: quantityHours ?? null,
        p_hourly_rate: hourlyRate ?? null,
        p_expected_updated_at: line.updatedAt,
      })
      if (error) throw repositoryError(error)
      return mapBillingLineRow(data)
    },

    async exclude(line) {
      const { data, error } = await client.rpc('exclude_billing_line', {
        p_id: line.id,
        p_expected_updated_at: line.updatedAt,
      })
      if (error) throw repositoryError(error)
      return mapBillingLineRow(data)
    },

    async reject(line) {
      const { data, error } = await client.rpc('reject_billing_line', {
        p_id: line.id,
        p_expected_updated_at: line.updatedAt,
      })
      if (error) throw repositoryError(error)
      return mapBillingLineRow(data)
    },

    async markIssued(line, { invoiceNumber, issuedAt, dueDate }) {
      const { data, error } = await client.rpc('mark_billing_line_issued', {
        p_id: line.id,
        p_invoice_number: invoiceNumber,
        p_issued_at: issuedAt,
        p_due_date: dueDate,
        p_expected_updated_at: line.updatedAt,
      })
      if (error) throw repositoryError(error)
      return mapBillingLineRow(data)
    },

    async markSent(line) {
      const { data, error } = await client.rpc('mark_billing_line_sent', {
        p_id: line.id,
        p_expected_updated_at: line.updatedAt,
      })
      if (error) throw repositoryError(error)
      return mapBillingLineRow(data)
    },
  }
}
