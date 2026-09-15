// Thin client for arca-service's real WSFE emission endpoint (POST /billing/invoice).
// Same factory-over-injected-`client` shape as clientRepository.js/entityRepository.js.

export function mapEmissionResult(row) {
  return {
    id: row.id,
    cae: row.cae,
    caeExpirationDate: row.caeExpirationDate,
    puntoVenta: row.puntoVenta,
    cbteTipo: row.cbteTipo,
    voucherNumber: row.voucherNumber,
    netAmount: row.netAmount,
    vatAmount: row.vatAmount,
    totalAmount: row.totalAmount,
    persisted: row.persisted,
  }
}

export function mapInvoiceRow(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    cbteTipo: row.cbte_tipo,
    puntoVenta: row.punto_venta,
    voucherNumber: row.voucher_number,
    concepto: row.concepto,
    netAmount: Number(row.net_amount),
    vatAmount: Number(row.vat_amount),
    totalAmount: Number(row.total_amount),
    cae: row.cae,
    caeExpirationDate: row.cae_expiration_date,
    issuedAt: row.issued_at,
    createdBy: row.created_by,
  }
}

export class BillingRepositoryError extends Error {
  constructor(message, code, cause) {
    super(message, { cause })
    this.name = 'BillingRepositoryError'
    this.code = code || 'BILLING_REQUEST_FAILED'
  }
}

// arca-service's AppError messages for this route are already good user-facing
// Spanish text (see arca-service/src/services/afip.js), so no bespoke SQLSTATE
// lookup table is needed here, unlike clientRepository.js's repositoryError().
function repositoryError(error) {
  if (!error) return null
  return new BillingRepositoryError(error.message || 'No se pudo completar la operación de facturación.', error.code, error)
}

export function createBillingRepository(client) {
  if (!client) throw new BillingRepositoryError('El servicio de facturación no está configurado.', 'API_NOT_CONFIGURED')

  return {
    async emitInvoice(clientId, totalAmount) {
      try {
        const saved = await client.post('/billing/invoice', { clientId, totalAmount })
        return mapEmissionResult(saved)
      } catch (error) {
        throw repositoryError(error)
      }
    },

    async listInvoices(clientId) {
      try {
        const query = clientId ? `?clientId=${clientId}` : ''
        const rows = await client.get(`/billing/invoices${query}`)
        return (rows || []).map(mapInvoiceRow)
      } catch (error) {
        throw repositoryError(error)
      }
    },
  }
}
