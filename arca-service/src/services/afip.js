// WSFE (Web Service de Facturación Electrónica) domestic invoice emission via
// @afipsdk/afip.js. Issuer is always Kyra SRL (Responsable Inscripto, AR/CUIT) —
// international billing (e.g. Mercury LLC) is explicitly out of scope here; see
// docs/phase-2-billing-logic.md for the confirmed business rules.
import fs from 'node:fs'
import Afip from '@afipsdk/afip.js'

import { config } from '../config.js'
import { pool } from '../db/pool.js'
import { AppError } from '../middleware/errorHandler.js'
import { recordInvoice } from './invoices.js'

const CBTE_TIPO_FACTURA_A = 1 // Receiver is Responsable Inscripto
const CBTE_TIPO_FACTURA_B = 6 // Any other domestic fiscal condition
const CONCEPTO_SERVICIOS = 2
const DOC_TIPO_CUIT = 80
const IVA_21_ID = 5 // AFIP aliquot id for 21% (FEParamGetTiposIva)
const IVA_RATE = 0.21
const RESPONSABLE_INSCRIPTO_CODE = 'RESPONSABLE_INSCRIPTO'

// Lazily constructed: a missing/incomplete AFIP config shouldn't prevent the
// rest of the service from booting, only fail when an invoice is requested.
let afipInstance = null

function getAfip() {
  if (afipInstance) return afipInstance

  const { cuit, certPath, keyPath } = config.afip
  if (!cuit || !certPath || !keyPath) {
    throw new AppError(
      'AFIP_NOT_CONFIGURED',
      'Faltan variables de entorno de ARCA (CUIT, CERT_PATH, KEY_PATH).',
      500,
    )
  }

  let cert
  let key
  try {
    cert = fs.readFileSync(certPath, 'utf8')
    key = fs.readFileSync(keyPath, 'utf8')
  } catch (err) {
    throw new AppError(
      'AFIP_NOT_CONFIGURED',
      `No se pudo leer el certificado/clave de ARCA: ${err.message}`,
      500,
    )
  }

  afipInstance = new Afip({
    CUIT: cuit,
    cert,
    key,
    production: config.nodeEnv === 'production',
  })

  return afipInstance
}

function roundCents(value) {
  return Math.round(value * 100) / 100
}

// Rule: Responsable Inscripto receiver -> Factura A, any other domestic fiscal
// condition -> Factura B. Keyed off fiscal_conditions.code (a stable identifier
// set only by migrations/seed, not reachable from save_fiscal_condition or the
// Administración catalog UI) rather than .name, which is a free-text label any
// user can rename — see docs/phase-2-billing-logic.md. Exported (pure, no I/O)
// so this decision is unit-testable without a DB or AFIP credentials.
export function determineCbteTipo(fiscalConditionCode) {
  const isResponsableInscripto = String(fiscalConditionCode || '').trim() === RESPONSABLE_INSCRIPTO_CODE
  return isResponsableInscripto ? CBTE_TIPO_FACTURA_A : CBTE_TIPO_FACTURA_B
}

// `totalAmount` is VAT-inclusive (21%). Rounds netAmount first, then derives
// vatAmount from the rounded net so the two always sum back to totalAmount exactly.
export function calculateNetAndVat(totalAmount) {
  const netAmount = roundCents(totalAmount / (1 + IVA_RATE))
  const vatAmount = roundCents(totalAmount - netAmount)
  return { netAmount, vatAmount }
}

// yyyymmdd as a number, the format WSFE expects for CbteFch/FchServDesde/etc.
function todayAfipDate() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return Number(`${yyyy}${mm}${dd}`)
}

async function getClientFiscalInfo(clientId) {
  const { rows } = await pool.query(
    `select
       c.id,
       c.fiscal_id,
       co.code as country_code,
       fc.code as fiscal_condition_code
     from clients c
     join countries co on co.id = c.country_id
     join fiscal_conditions fc on fc.id = c.fiscal_condition_id
     where c.id = $1`,
    [clientId],
  )
  return rows[0] || null
}

// AFIP-side rejections (AfipWebServiceError: message "(code) msg", has .code) vs.
// AfipSDK-relay/HTTP-level failures (the generic Error built by Afip.js's AdminClient
// interceptor, which carries .status/.statusText/.data). Neither class is exported
// by the SDK, so this distinguishes them by shape rather than a fragile deep import
// of the package's internals.
function mapAfipError(err) {
  if (err && typeof err.status === 'number') {
    return new AppError(
      'AFIP_REQUEST_FAILED',
      err.data?.message || err.message || 'No se pudo conectar con ARCA.',
      502,
    )
  }
  if (err && err.code !== undefined) {
    return new AppError('AFIP_REJECTED', err.message, 502)
  }
  return new AppError('AFIP_REQUEST_FAILED', err?.message || 'No se pudo completar la solicitud a ARCA.', 502)
}

/**
 * Emits a domestic WSFE invoice (Factura A or B) for an existing client.
 *
 * @param {{ clientId: number, totalAmount: number, actorId?: string }} params
 *   `totalAmount` is VAT-inclusive (21%). `actorId` (a users.id) is recorded as
 *   invoices.created_by when set.
 * @param {{ afip?: object }} [deps] Test-only seam: pass a fake with an
 *   `ElectronicBilling.{getLastVoucher,createVoucher}` shape to exercise this
 *   function without real AFIP credentials or a network call. Defaults to the
 *   real, lazily-constructed Afip instance.
 */
export async function generateInvoice({ clientId, totalAmount, actorId } = {}, deps = {}) {
  const parsedClientId = Number(clientId)
  if (!Number.isInteger(parsedClientId) || parsedClientId <= 0) {
    throw new AppError('INVALID_CLIENT_ID', 'clientId es requerido y debe ser un entero positivo.', 400)
  }

  const amount = Number(totalAmount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('INVALID_TOTAL_AMOUNT', 'totalAmount es requerido y debe ser un número mayor a 0.', 400)
  }

  const client = await getClientFiscalInfo(parsedClientId)
  if (!client) {
    throw new AppError('CLIENT_NOT_FOUND', 'No encontramos el cliente solicitado.', 404)
  }
  if (client.country_code !== 'AR') {
    // Rule: this system only ever handles domestic (WSFE) billing.
    throw new AppError(
      'INTERNATIONAL_BILLING_NOT_SUPPORTED',
      'La emisión vía ARCA/WSFE solo admite clientes de Argentina.',
      422,
    )
  }

  const puntoVenta = config.afip.puntoVenta
  if (!puntoVenta) {
    throw new AppError('AFIP_NOT_CONFIGURED', 'Falta configurar WSFE_PUNTO_VENTA.', 500)
  }

  const cbteTipo = determineCbteTipo(client.fiscal_condition_code)
  const { netAmount, vatAmount } = calculateNetAndVat(amount)
  const docNro = Number(client.fiscal_id.replace(/\D/g, ''))
  const today = todayAfipDate()

  const afip = deps.afip || getAfip()

  let voucherNumber
  let result
  try {
    const lastVoucher = await afip.ElectronicBilling.getLastVoucher(puntoVenta, cbteTipo)
    voucherNumber = lastVoucher + 1

    result = await afip.ElectronicBilling.createVoucher({
      CantReg: 1,
      PtoVta: puntoVenta,
      CbteTipo: cbteTipo,
      Concepto: CONCEPTO_SERVICIOS,
      DocTipo: DOC_TIPO_CUIT,
      DocNro: docNro,
      CbteDesde: voucherNumber,
      CbteHasta: voucherNumber,
      CbteFch: today,
      ImpTotal: amount,
      ImpTotConc: 0,
      ImpNeto: netAmount,
      ImpOpEx: 0,
      ImpIVA: vatAmount,
      ImpTrib: 0,
      FchServDesde: today,
      FchServHasta: today,
      FchVtoPago: today,
      MonId: 'PES',
      MonCotiz: 1,
      Iva: [{ Id: IVA_21_ID, BaseImp: netAmount, Importe: vatAmount }],
    })
  } catch (err) {
    if (err instanceof AppError) throw err
    throw mapAfipError(err)
  }

  // AFIP has now issued this CAE — it exists whether or not we manage to record
  // it locally. So persistence failure is logged loudly but never turned into an
  // error response (that would make the caller think emission failed and retry,
  // creating a second, real, billable voucher for the same request).
  let invoiceId = null
  let persisted = true
  try {
    const saved = await recordInvoice({
      clientId: parsedClientId,
      cbteTipo,
      puntoVenta,
      voucherNumber,
      concepto: CONCEPTO_SERVICIOS,
      netAmount,
      vatAmount,
      totalAmount: amount,
      cae: result.CAE,
      caeExpirationDate: result.CAEFchVto,
      actorId,
    })
    invoiceId = saved.id
  } catch (err) {
    persisted = false
    console.error(
      'ARCA issued a CAE but arca-service failed to record it locally — reconcile manually:',
      { clientId: parsedClientId, puntoVenta, cbteTipo, voucherNumber, cae: result.CAE, error: err.message },
    )
  }

  return {
    id: invoiceId,
    cae: result.CAE,
    caeExpirationDate: result.CAEFchVto,
    puntoVenta,
    cbteTipo,
    voucherNumber,
    netAmount,
    vatAmount,
    totalAmount: amount,
    persisted,
  }
}
