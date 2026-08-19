// /src/utils/renderizarTemplate.js
// Funciones puras para renderizar templates de email con variables dinámicas.
// Sin side effects — 100% testeable, usable tanto en preview como en envío real.

// ── Meses en español ─────────────────────────────────────────────────────────

const MESES_ES = {
  0: 'Enero', 1: 'Febrero', 2: 'Marzo', 3: 'Abril',
  4: 'Mayo', 5: 'Junio', 6: 'Julio', 7: 'Agosto',
  8: 'Septiembre', 9: 'Octubre', 10: 'Noviembre', 11: 'Diciembre',
}

const MESES_NOMBRE = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
}

// ── Helpers de formato ────────────────────────────────────────────────────────

function formatearMoneda(n, moneda) {
  if (n == null) return '—'
  if (moneda === 'USD') {
    return `USD ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  }
  return `$ ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
}

/**
 * Convierte "2026-08-31" → "31 de agosto de 2026"
 * Acepta también el nombre del mes + año si no hay fecha ISO.
 */
function formatearFechaLarga(isoFecha, mesNombre, anio) {
  if (isoFecha) {
    const [y, m, d] = isoFecha.split('-').map(Number)
    const nombreMes = MESES_ES[m - 1] || ''
    return `${d} de ${nombreMes.toLowerCase()} de ${y}`
  }
  if (mesNombre && anio) {
    const idx = MESES_NOMBRE[mesNombre?.toLowerCase()]
    if (idx !== undefined) {
      // Último día del mes
      const ultimoDia = new Date(anio, idx + 1, 0).getDate()
      return `${ultimoDia} de ${mesNombre.toLowerCase()} de ${anio}`
    }
  }
  return '—'
}

function obtenerTipoLabel(tipoFactura) {
  const labels = {
    A: 'Factura A', B: 'Factura B', C: 'Factura C',
    LLC: 'Invoice', S: 'Comprobante S/F', F: 'Comprobante S/F',
  }
  return labels[tipoFactura] || tipoFactura
}

/**
 * Obtiene el nombre del mes desde la fecha de emisión ISO o desde linea.mes.
 * Prioriza la fecha ISO (más precisa); fallback al campo mes.
 */
function obtenerNombreMes(fechaEmision, mesLinea) {
  if (fechaEmision) {
    const m = parseInt(fechaEmision.split('-')[1], 10) - 1
    return MESES_ES[m] || mesLinea || ''
  }
  if (mesLinea) {
    const idx = MESES_NOMBRE[mesLinea?.toLowerCase()]
    return idx !== undefined ? MESES_ES[idx] : mesLinea
  }
  return ''
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Reemplaza {{variable}} en un texto con los valores del objeto `variables`.
 * Si la variable no existe en el objeto: la deja sin reemplazar (no rompe).
 * Función pura — no muta nada.
 *
 * @param {string} texto
 * @param {Object} variables — { nombre_cliente: "Ayax", mes: "Agosto", ... }
 * @returns {string}
 */
export function renderizarTemplate(texto, variables) {
  if (!texto) return ''
  return texto.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const val = variables[key]
    return val !== undefined && val !== null ? String(val) : match
  })
}

/**
 * Construye el objeto de variables a partir de una línea de facturación,
 * el cliente y el servicio. Listo para pasarle a renderizarTemplate().
 *
 * @param {Object} lineaFacturacion — de LINEAS_INICIAL (con status emitida)
 * @param {Object} cliente          — de CLIENTES_INICIAL
 * @param {Object} servicio         — de SERVICIOS_INICIAL (opcional)
 * @returns {Object} variables      — todas las variables soportadas
 */
export function construirVariables(lineaFacturacion, cliente, servicio) {
  const mes  = obtenerNombreMes(lineaFacturacion.fechaEmision, lineaFacturacion.mes)
  const anio = lineaFacturacion.fechaEmision
    ? lineaFacturacion.fechaEmision.split('-')[0]
    : String(lineaFacturacion.anio || '')

  return {
    nombre_cliente:   cliente?.nombre || '',
    nombre_contacto:  cliente?.contacto || cliente?.nombre || '',
    mes,
    año:              anio,
    anio,             // alias para compatibilidad (algunos templates usan {{anio}})
    nro_factura:      lineaFacturacion.nroFactura || '',
    importe_bruto:    formatearMoneda(lineaFacturacion.importeBruto, lineaFacturacion.moneda),
    importe_neto:     formatearMoneda(lineaFacturacion.importeNeto, lineaFacturacion.moneda),
    fecha_vencimiento: formatearFechaLarga(
      lineaFacturacion.fechaVencimiento,
      lineaFacturacion.mes,
      lineaFacturacion.anio,
    ),
    tipo_factura:     obtenerTipoLabel(lineaFacturacion.tipoFactura),
    servicio:         servicio?.nombre || '',
  }
}

/**
 * Detecta qué variables de un texto NO están en el objeto `variables`.
 * Útil para el preview — marcar en rojo las variables sin resolver.
 *
 * @returns {string[]} — lista de claves sin resolver, ej: ["nro_factura", "mes"]
 */
export function detectarVariablesSinResolver(texto, variables) {
  const matches = [...(texto || '').matchAll(/\{\{(\w+)\}\}/g)]
  return [...new Set(matches.map(m => m[1]).filter(k => !(k in variables)))]
}

/**
 * Lista completa de variables disponibles para mostrar en el panel del editor.
 */
export const VARIABLES_DISPONIBLES = [
  { key: 'nombre_cliente',   label: 'Nombre del cliente',    ejemplo: 'Ayax' },
  { key: 'nombre_contacto',  label: 'Nombre del contacto',   ejemplo: 'Administración Ayax' },
  { key: 'mes',              label: 'Mes',                   ejemplo: 'Agosto' },
  { key: 'año',              label: 'Año',                   ejemplo: '2026' },
  { key: 'nro_factura',      label: 'Nro. factura',          ejemplo: '0001-00000132' },
  { key: 'importe_bruto',    label: 'Importe total',         ejemplo: '$ 627.844' },
  { key: 'importe_neto',     label: 'Importe neto',          ejemplo: '$ 518.880' },
  { key: 'fecha_vencimiento',label: 'Fecha de vencimiento',  ejemplo: '31 de agosto de 2026' },
  { key: 'tipo_factura',     label: 'Tipo de comprobante',   ejemplo: 'Factura A' },
  { key: 'servicio',         label: 'Servicio',              ejemplo: 'Google Ads' },
]
