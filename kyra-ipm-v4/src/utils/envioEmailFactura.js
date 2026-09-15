// /src/utils/envioEmailFactura.js
// Envío real de email con factura adjunta, vía arca-service
// (POST /billing/send-email — src/services/mailer.js). Reemplaza el mock anterior
// (envioEmailMock.js, que era 100% setTimeout + lógica fake) manteniendo el mismo
// contrato de entrada/salida que ya esperan EmisionPage.jsx/FacturacionMes.jsx.
//
// El PDF adjunto sólo está disponible hoy para líneas LLC (generarPDFllc.js lo deja
// en lineaFacturacion.pdfBlob como data URI en el momento de la emisión). Las líneas
// A/B/C todavía no generan su PDF automáticamente al emitir — sólo bajo demanda
// desde DrawerFacturaDetalle.jsx — así que esas se envían sin adjunto por ahora.

import { renderizarTemplate, construirVariables } from './renderizarTemplate'

/**
 * Envía un email de factura/invoice vía arca-service.
 *
 * @param {Object} opts
 * @param {Object} opts.lineaFacturacion  — línea con status "emitida"
 * @param {Object} opts.cliente           — objeto cliente (con emailConfig)
 * @param {Object} opts.servicio          — objeto servicio (para variables)
 * @param {Object} opts.plantilla         — plantilla seleccionada
 * @param {Object} opts.config            — configEnvioEmail global
 * @param {string} [opts.emailOverride]   — email destino manual (reenvío)
 * @param {string[]} [opts.ccsOverride]   — CCs manuales (reenvío)
 * @param {Object} opts.billingRepository — createBillingRepository(api), ver EmisionPage.jsx
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
  billingRepository,
}) {
  // ── 1. Determinar destinatarios ─────────────────────────────────────────
  const emailPrincipal = emailOverride
    || cliente?.emailConfig?.emailPrincipal
    || cliente?.email
    || ''

  const ccs = ccsOverride !== undefined
    ? ccsOverride
    : (cliente?.emailConfig?.ccs || cliente?.emailsCopia || [])

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

  // data URI (ej. "data:application/pdf;base64,JVBERi0...") -> sólo la parte base64.
  const pdfDataUri = lineaFacturacion.pdfBlob
  const attachmentBase64 = pdfDataUri ? pdfDataUri.split(',')[1] : undefined

  // ── 4. Enviar vía arca-service ───────────────────────────────────────────
  if (!billingRepository) {
    return {
      success: false,
      errorMensaje: 'El servicio de envío de emails no está configurado.',
    }
  }

  try {
    await billingRepository.sendEmail({
      to: emailPrincipal,
      cc: ccs,
      subject: asuntoRenderizado,
      text: cuerpoRenderizado,
      attachmentBase64,
      attachmentFilename: attachmentBase64 ? archivoAdjunto : undefined,
    })
  } catch (err) {
    return {
      success: false,
      errorMensaje: err?.message || 'No se pudo enviar el email.',
    }
  }

  // ── 5. Resultado ────────────────────────────────────────────────────────
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
