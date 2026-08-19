// /src/utils/emisionARCA.js
// Simulación async del servicio ARCA/WSFE para facturas A, B y C.
// Solo frontend. Cero backend, cero fetch, cero API real.

const SIMULAR_ERROR_ARCA = false  // cambiar a true para testear el flujo de error

/**
 * Simula la emisión de una factura ante ARCA.
 * Retorna una promesa que resuelve en ~2 segundos con:
 *   { success: true, nroFactura, fechaEmision, fechaVencimiento }
 *   { success: false, codigo, mensaje }
 */
export function emitirEnARCA(linea, nroFactura) {
  return new Promise((resolve) => {
    const delay = 2000 + Math.random() * 500

    setTimeout(() => {
      // Simular error controlado
      if (SIMULAR_ERROR_ARCA) {
        resolve({
          success:  false,
          codigo:   'WSFE-10016',
          mensaje:  'Error de validación: el comprobante no pudo ser autorizado por ARCA.',
        })
        return
      }

      // Error aleatorio muy bajo (1%) para que ocasionalmente falle en demo
      if (Math.random() < 0.01) {
        resolve({
          success:  false,
          codigo:   'WSFE-10999',
          mensaje:  'Timeout de conexión con ARCA. Reintentá en unos minutos.',
        })
        return
      }

      const hoy = new Date()
      const fechaEmision = hoy.toISOString().split('T')[0]

      // Vencimiento: último día del mes en curso
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
      const fechaVencimiento = ultimoDia.toISOString().split('T')[0]

      resolve({
        success:          true,
        nroFactura,
        fechaEmision,
        fechaVencimiento,
        cae:              _generarCAE(),
        fechaVencimientoCAE: _fechaVencimientoCAE(hoy),
      })
    }, delay)
  })
}

// ── helpers privados ──────────────────────────────────────────────────────────

function _generarCAE() {
  // CAE ficticio de 14 dígitos (formato AFIP)
  const base = Math.floor(Math.random() * 1e10).toString().padStart(10, '9')
  return `74${base}12`
}

function _fechaVencimientoCAE(desde) {
  const d = new Date(desde)
  d.setDate(d.getDate() + 10)
  return d.toISOString().split('T')[0]
}
