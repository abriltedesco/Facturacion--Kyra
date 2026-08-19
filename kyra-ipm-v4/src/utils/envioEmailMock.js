// /src/utils/envioEmailMock.js
// Simula el envío de email con factura adjunta vía SMTP.
// CERO backend. CERO API calls reales. Solo setTimeout + lógica mock.
//
// Cambiar SIMULAR_ERROR_EMAIL a true para testear el flujo de error
// sin tocar datos reales.

import { renderizarTemplate, construirVariables } from './renderizarTemplate'

const SIMULAR_ERROR_EMAIL = false

// Delay realista de "servidor SMTP respondiendo" (1500–2000ms)
const delay = () => new Promise(r => setTimeout(r, 1500 + Math.random() * 500))

/**
 * Simula el envío de un email con factura adjunta.
 *
 * @param {Object} opts
 * @param {Object} opts.lineaFacturacion  — línea con status "emitida"
 * @param {Object} opts.cliente           — objeto cliente (con emailConfig)
 * @param {Object} opts.servicio          — objeto servicio (para variables)
 * @param {Object} opts.plantilla         — plantilla seleccionada
 * @param {Object} opts.config            — configEnvioEmail global
 * @param {string} [opts.emailOverride]   — email destino manual (reenvío)
 * @param {string[]} [opts.ccsOverride]   — CCs manuales (reenvío)
 *
 * @returns {Promise<Object>}
 *   { success: true, asuntoEnviado, cuerpoEnviado, fechaEnvio, emailDestino, ccs, archivoAdjunto }
 *   { success: false, errorMensaje }
 */
export async function enviarEmailFactura({
  lineaFacturacion,
  cliente,
  servicio,
  plantilla,
  config,
  emailOverride,
  ccsOverride,
}) {
  // ── 1. Determinar destinatarios ─────────────────────────────────────────
  const emailPrincipal = emailOverride
    || cliente?.emailConfig?.emailPrincipal
    || cliente?.email
    || ''

  const ccs = ccsOverride !== undefined
    ? ccsOverride
    : (cliente?.emailConfig?.ccs || cliente?.emailsCopia || [])

  // Sin email → error inmediato (sin delay)
  if (!emailPrincipal) {
    return {
      success: false,
      errorMensaje: 'El cliente no tiene email configurado. Configuralo en EMAILS → Envío automático.',
    }
  }

  // S/F → no se envía
  if (lineaFacturacion.tipoFactura === 'S' || lineaFacturacion.tipoFactura === 'F') {
    return {
      success: false,
      errorMensaje: 'Las facturas S/F no generan envío de email.',
      esSF: true,
    }
  }

  // ── 2. Renderizar template con variables ────────────────────────────────
  const variables = construirVariables(lineaFacturacion, cliente, servicio)

  const asuntoRenderizado  = renderizarTemplate(plantilla.asunto, variables)
  const cuerpoRenderizado  = renderizarTemplate(plantilla.cuerpo, variables)

  // ── 3. Determinar nombre del archivo adjunto ────────────────────────────
  const nombreCliente = (cliente?.nombre || 'Cliente').replace(/\s+/g, '_')
  const mes = variables.mes?.slice(0, 3) || 'Mes'
  const anio = variables.anio || variables.año || ''
  const tipo = lineaFacturacion.tipoFactura

  let archivoAdjunto
  if (tipo === 'LLC') {
    archivoAdjunto = `Invoice_${nombreCliente}_${mes}_${anio}.pdf`
  } else {
    const nroSafe = (lineaFacturacion.nroFactura || '').replace('/', '-')
    archivoAdjunto = `Factura_${tipo}_${nroSafe}_${nombreCliente}.pdf`
  }

  // ── 4. Simular delay SMTP ───────────────────────────────────────────────
  await delay()

  // ── 5. Resultado ────────────────────────────────────────────────────────
  if (SIMULAR_ERROR_EMAIL) {
    return {
      success: false,
      errorMensaje: 'Error de conexión con el servidor SMTP. Reintentá en unos minutos.',
    }
  }

  // Error aleatorio 2% para hacer demos más realistas
  if (Math.random() < 0.02) {
    return {
      success: false,
      errorMensaje: 'Timeout de conexión SMTP (simulado). El servidor no respondió a tiempo.',
    }
  }

  return {
    success:          true,
    asuntoEnviado:    asuntoRenderizado,
    cuerpoEnviado:    cuerpoRenderizado,
    fechaEnvio:       new Date().toISOString(),
    emailDestino:     emailPrincipal,
    ccs,
    archivoAdjunto,
    plantillaId:      plantilla.id,
    variables,        // útil para el registro en historial
  }
}

/**
 * Construye un registro listo para agregar al historial de envíos.
 * Se llama después de que enviarEmailFactura resuelve.
 *
 * @param {Object} resultado — lo que devolvió enviarEmailFactura
 * @param {Object} linea     — la línea de facturación
 * @param {number} nextId    — siguiente id del historial
 * @returns {Object}
 */
export function construirRegistroHistorial(resultado, linea, nextId) {
  return {
    id:                  nextId,
    lineaFacturacionId:  linea.id,
    clienteId:           linea.clienteId,
    nroFactura:          linea.nroFactura,
    emailDestino:        resultado.emailDestino || '',
    ccs:                 resultado.ccs || [],
    plantillaId:         resultado.plantillaId || null,
    asuntoEnviado:       resultado.asuntoEnviado || '',
    cuerpoEnviado:       resultado.cuerpoEnviado || null,
    fechaEnvio:          resultado.fechaEnvio || new Date().toISOString(),
    estado:              resultado.success ? 'enviado' : 'error',
    errorMensaje:        resultado.success ? null : resultado.errorMensaje,
    intentos:            1,
    archivoAdjunto:      resultado.archivoAdjunto || null,
  }
}
