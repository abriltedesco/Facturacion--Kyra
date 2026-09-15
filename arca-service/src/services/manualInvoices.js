// Local record for invoices that never go through AFIP/WSFE — LLC invoices and
// internal S/F vouchers. No CAE, no external source of truth: this table itself is
// authoritative. See db/migrations/20260915120000_manual_invoices.sql for why
// Factura C is deliberately excluded, and why LLC/S/F have different uniqueness
// scopes (LLC per billing entity, S/F one global counter).
import { pool } from '../db/pool.js'
import { AppError } from '../middleware/errorHandler.js'

const VALID_TYPES = ['LLC', 'S', 'F']

export async function recordManualInvoice({
  clientId,
  billingEntityId,
  invoiceType,
  invoiceNumber,
  currency,
  netAmount,
  vatAmount,
  totalAmount,
  actorId,
} = {}) {
  if (!VALID_TYPES.includes(invoiceType)) {
    throw new AppError('INVALID_INVOICE_TYPE', `invoiceType debe ser uno de: ${VALID_TYPES.join(', ')}.`, 400)
  }

  const parsedEntityId = Number(billingEntityId)
  if (!Number.isInteger(parsedEntityId) || parsedEntityId <= 0) {
    throw new AppError('INVALID_BILLING_ENTITY_ID', 'billingEntityId es requerido y debe ser un entero positivo.', 400)
  }

  const trimmedNumber = String(invoiceNumber || '').trim()
  if (!trimmedNumber) {
    throw new AppError('INVALID_INVOICE_NUMBER', 'invoiceNumber es requerido.', 400)
  }

  const amount = Number(totalAmount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('INVALID_TOTAL_AMOUNT', 'totalAmount es requerido y debe ser un número mayor a 0.', 400)
  }

  let parsedClientId = null
  if (clientId != null) {
    parsedClientId = Number(clientId)
    if (!Number.isInteger(parsedClientId) || parsedClientId <= 0) {
      throw new AppError('INVALID_CLIENT_ID', 'clientId debe ser un entero positivo cuando se especifica.', 400)
    }
  }

  const { rows } = await pool.query(
    `insert into manual_invoices (
       client_id, billing_entity_id, invoice_type, invoice_number, currency,
       net_amount, vat_amount, total_amount, created_by
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning *`,
    [
      parsedClientId, parsedEntityId, invoiceType, trimmedNumber, currency || 'ARS',
      netAmount ?? null, vatAmount ?? null, amount, actorId ?? null,
    ],
  )
  return rows[0]
}

export async function listManualInvoices({ clientId } = {}) {
  if (clientId) {
    const { rows } = await pool.query('select * from manual_invoices where client_id = $1 order by issued_at desc', [clientId])
    return rows
  }
  const { rows } = await pool.query('select * from manual_invoices order by issued_at desc')
  return rows
}
