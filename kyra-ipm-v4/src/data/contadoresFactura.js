// /src/data/contadoresFactura.js
// Contadores de número de factura por entidad/tipo.
// Se usan con useRef en EmisionPage para evitar stale closures.

export const CONTADORES_INICIAL = {
  entity_1_A:   131,
  entity_1_B:   3,
  entity_2_C:   3,
  entity_3_LLC: 41,
  sf_interno:   7,
}

/**
 * Devuelve una clave independiente por entidad y tipo de comprobante.
 */
export function claveContador(tipoFactura, entidad) {
  if (tipoFactura === 'S' || tipoFactura === 'F') return 'sf_interno'
  const entidadId = typeof entidad === 'object' ? entidad?.id : entidad
  if (entidadId == null || entidadId === '') throw new Error('La entidad emisora es obligatoria para numerar.')
  return `entity_${entidadId}_${tipoFactura}`
}

/**
 * Formatea número de factura AFIP estilo "0001-00000132"
 * puntoVenta: string de 4 dígitos con ceros
 */
export function formatNroFacturaAFIP(contador, puntoVenta = '0001') {
  const num = String(contador).padStart(8, '0')
  return `${String(puntoVenta).padStart(4, '0')}-${num}`
}

/**
 * Formatea número de invoice LLC estilo "INV-2026-042"
 */
export function formatNroInvoiceLLC(contador, prefijo = 'INV', anio = new Date().getFullYear()) {
  const num = String(contador).padStart(3, '0')
  return `${prefijo}-${anio}-${num}`
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
export function generarNroFactura(contador, tipoFactura, entidad, anio = new Date().getFullYear()) {
  if (tipoFactura === 'LLC') {
    const prefijo = typeof entidad === 'object' ? entidad?.invoicePrefix : 'INV'
    return formatNroInvoiceLLC(contador, prefijo || 'INV', anio)
  }
  if (tipoFactura === 'S' || tipoFactura === 'F') return formatNroSF(contador)
  const puntoVenta = typeof entidad === 'object'
    ? entidad?.pointOfSale
    : entidad === 2 ? '0002' : '0001'
  return formatNroFacturaAFIP(contador, puntoVenta || '0001')
}
