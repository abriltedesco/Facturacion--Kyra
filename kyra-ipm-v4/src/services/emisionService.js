// The single frontend function allowed to produce a real AFIP CAE. EmisionPage.jsx
// and FacturacionMes.jsx both call this instead of each keeping their own "emit an
// A/B línea" logic — see arca-service/docs/phase-2-billing-logic.md for the
// confirmed business rules this defers to (only domestic Factura A/B goes through
// WSFE; C/LLC/S/F have no real backend equivalent and keep their existing
// local-only/simulated paths).
import { formatNroFacturaAFIP } from '../data/contadoresFactura'
import { BillingRepositoryError } from './billingRepository'
import { esClienteIdReal, idClienteReal } from '../domain/clienteLookup'

// Requires BOTH tipoFactura A/B AND a genuinely real (offset-tagged) clienteId —
// see domain/clienteLookup.js. Without the second check, a pre-existing mock línea
// with tipoFactura A/B and a small clienteId (1-12, same range arca-service's
// seeded clients happen to use) would trigger a real emission against whichever
// real client currently has that id, instead of falling back to the local
// simulator like it always has.
export function esFacturaWsfeElegible(linea) {
  return (linea?.tipoFactura === 'A' || linea?.tipoFactura === 'B') && esClienteIdReal(linea?.clienteId)
}

// generateInvoice (arca-service) hardcodes MonId: 'PES' — there is no currency
// parameter at all. A "successful" emission call for a non-ARS A/B línea would
// silently bill in pesos regardless of what was selected, so this blocks before
// ever reaching the backend rather than letting that happen quietly.
export async function emitirLineaReal(linea, { billingRepository }) {
  if (linea.moneda !== 'ARS') {
    throw new BillingRepositoryError(
      'ARCA/WSFE solo admite comprobantes en pesos (ARS). Revisá la moneda de esta línea.',
      'WSFE_CURRENCY_UNSUPPORTED',
    )
  }

  const resultado = await billingRepository.emitInvoice(idClienteReal(linea.clienteId), linea.importeBruto)

  const hoy = new Date()
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)

  return {
    ...linea,
    status: 'emitida',
    nroFactura: formatNroFacturaAFIP(resultado.voucherNumber, resultado.puntoVenta),
    cae: resultado.cae,
    fechaVencimientoCAE: resultado.caeExpirationDate,
    // Overwrite with AFIP/backend-authoritative amounts — these are what the CAE
    // is actually tied to, not the frontend's pre-emission estimate.
    importeNeto: resultado.netAmount,
    impuesto: resultado.vatAmount,
    importeBruto: resultado.totalAmount,
    fechaEmision: hoy.toISOString().split('T')[0],
    fechaVencimiento: ultimoDia.toISOString().split('T')[0],
    errorCodigo: null,
    errorMensaje: null,
  }
}
