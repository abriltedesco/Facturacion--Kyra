// /src/data/contadoresFactura.js
// Contadores de número de factura por entidad/tipo.
// Se usan con useRef en EmisionPage para evitar stale closures.

export const CONTADORES_INICIAL = {
  kyra_srl_A:    131,  // próximo: 0001-00000132
  kyra_srl_B:    3,    // próximo: 0001-00000004
  kyra_srl_C:    3,    // próximo: 0002-00000004  (monotributo usa punto de venta 2)
  mercury_llc:   41,   // próximo: INV-2026-042
  sf_interno:    7,    // próximo: S/F-0008
}

/**
 * Devuelve la clave del contador para un tipo de factura + entidadId.
 * entidadId: 1 = Kyra SRL, 2 = Monotributo, 3 = Mercury LLC
 */
export function claveContador(tipoFactura, entidadId) {
  if (tipoFactura === 'LLC') return 'mercury_llc'
  if (tipoFactura === 'S' || tipoFactura === 'F') return 'sf_interno'
  if (entidadId === 2) return 'kyra_srl_C'
  if (tipoFactura === 'B') return 'kyra_srl_B'
  return 'kyra_srl_A'
}

/**
 * Formatea número de factura AFIP estilo "0001-00000132"
 * puntoVenta: string de 4 dígitos con ceros
 */
export function formatNroFacturaAFIP(contador, tipoFactura, entidadId) {
  const num = String(contador).padStart(8, '0')
  // Monotributo usa punto de venta 0002
  const pv = entidadId === 2 ? '0002' : '0001'
  return `${pv}-${num}`
}

/**
 * Formatea número de invoice LLC estilo "INV-2026-042"
 */
export function formatNroInvoiceLLC(contador) {
  const num = String(contador).padStart(3, '0')
  return `INV-2026-${num}`
}

/**
 * Formatea número interno S/F estilo "S/F-0008"
 */
export function formatNroSF(contador) {
  const num = String(contador).padStart(4, '0')
  return `S/F-${num}`
}

/**
 * Genera el número de factura completo para una línea.
 * Usa el valor ACTUAL del contador (ya incrementado antes de llamar aquí).
 */
export function generarNroFactura(contador, tipoFactura, entidadId) {
  if (tipoFactura === 'LLC') return formatNroInvoiceLLC(contador)
  if (tipoFactura === 'S' || tipoFactura === 'F') return formatNroSF(contador)
  return formatNroFacturaAFIP(contador, tipoFactura, entidadId)
}
