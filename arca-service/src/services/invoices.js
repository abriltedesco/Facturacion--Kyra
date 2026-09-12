// Local audit trail for invoices emitted through src/services/afip.js. AFIP
// remains the source of truth for the CAE itself — see db/migrations/20260912000000_invoices.sql.
import { pool } from '../db/pool.js'

export async function recordInvoice({
  clientId,
  cbteTipo,
  puntoVenta,
  voucherNumber,
  concepto,
  netAmount,
  vatAmount,
  totalAmount,
  cae,
  caeExpirationDate,
  actorId,
}) {
  const { rows } = await pool.query(
    `insert into invoices (
       client_id, cbte_tipo, punto_venta, voucher_number, concepto,
       net_amount, vat_amount, total_amount, cae, cae_expiration_date, created_by
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     returning *`,
    [clientId, cbteTipo, puntoVenta, voucherNumber, concepto, netAmount, vatAmount, totalAmount, cae, caeExpirationDate, actorId ?? null],
  )
  return rows[0]
}

export async function listInvoices({ clientId } = {}) {
  if (clientId) {
    const { rows } = await pool.query('select * from invoices where client_id = $1 order by issued_at desc', [clientId])
    return rows
  }
  const { rows } = await pool.query('select * from invoices order by issued_at desc')
  return rows
}
