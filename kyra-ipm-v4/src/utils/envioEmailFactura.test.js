import { describe, expect, it, vi } from 'vitest'
import { enviarEmailFactura, construirRegistroHistorial } from './envioEmailFactura'

const plantilla = { id: 1, asunto: 'Factura {{mes}} {{año}} — Kyra', cuerpo: 'Hola {{nombre_contacto}}, adjuntamos tu factura.' }
const cliente = { nombre: 'Ayax', email: 'ayax@example.com', emailConfig: { emailPrincipal: 'ayax@example.com', envioAutomatico: true } }
const lineaBase = {
  id: 1, clienteId: 1, tipoFactura: 'A', moneda: 'ARS',
  nroFactura: '0001-00000042', fechaEmision: '2026-08-31', mes: 'agosto', anio: 2026,
  importeBruto: 121, importeNeto: 100,
}

describe('enviarEmailFactura', () => {
  it('llama a billingRepository.sendEmail con el email renderizado y sin adjunto cuando no hay pdfBlob', async () => {
    const billingRepository = { sendEmail: vi.fn(async () => ({ messageId: 'msg-1' })) }

    const resultado = await enviarEmailFactura({
      lineaFacturacion: lineaBase, cliente, plantilla, billingRepository,
    })

    expect(billingRepository.sendEmail).toHaveBeenCalledTimes(1)
    const payload = billingRepository.sendEmail.mock.calls[0][0]
    expect(payload.to).toBe('ayax@example.com')
    expect(payload.subject).toContain('Factura')
    expect(payload.text).toContain('Hola Ayax')
    expect(payload.attachmentBase64).toBeUndefined()
    expect(payload.attachmentFilename).toBeUndefined()

    expect(resultado).toMatchObject({ success: true, emailDestino: 'ayax@example.com' })
  })

  it('decodifica pdfBlob (data URI) a attachmentBase64 cuando la línea lo trae (caso LLC)', async () => {
    const billingRepository = { sendEmail: vi.fn(async () => ({ messageId: 'msg-2' })) }
    const lineaLlc = { ...lineaBase, tipoFactura: 'LLC', pdfBlob: 'data:application/pdf;base64,SGVsbG8=' }

    await enviarEmailFactura({ lineaFacturacion: lineaLlc, cliente, plantilla, billingRepository })

    const payload = billingRepository.sendEmail.mock.calls[0][0]
    expect(payload.attachmentBase64).toBe('SGVsbG8=')
    expect(payload.attachmentFilename).toMatch(/^Invoice_Ayax_/)
  })

  it('no llama al backend y devuelve error cuando el cliente no tiene email', async () => {
    const billingRepository = { sendEmail: vi.fn() }
    const clienteSinEmail = { nombre: 'Sin Email' }

    const resultado = await enviarEmailFactura({
      lineaFacturacion: lineaBase, cliente: clienteSinEmail, plantilla, billingRepository,
    })

    expect(resultado.success).toBe(false)
    expect(billingRepository.sendEmail).not.toHaveBeenCalled()
  })

  it('no envía facturas S/F', async () => {
    const billingRepository = { sendEmail: vi.fn() }
    const lineaSF = { ...lineaBase, tipoFactura: 'S' }

    const resultado = await enviarEmailFactura({
      lineaFacturacion: lineaSF, cliente, plantilla, billingRepository,
    })

    expect(resultado).toMatchObject({ success: false, esSF: true })
    expect(billingRepository.sendEmail).not.toHaveBeenCalled()
  })

  it('propaga el error del backend como errorMensaje en vez de tirar', async () => {
    const backendError = Object.assign(new Error('Faltan variables de entorno de email (SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM).'), { code: 'EMAIL_NOT_CONFIGURED' })
    const billingRepository = { sendEmail: vi.fn(async () => { throw backendError }) }

    const resultado = await enviarEmailFactura({ lineaFacturacion: lineaBase, cliente, plantilla, billingRepository })

    expect(resultado).toMatchObject({ success: false, errorMensaje: backendError.message })
  })
})

describe('construirRegistroHistorial', () => {
  it('mapea un resultado exitoso a un registro de historial', () => {
    const resultado = { success: true, emailDestino: 'a@b.com', ccs: [], fechaEnvio: '2026-08-31T00:00:00Z', plantillaId: 1, archivoAdjunto: 'Factura_A_0001-00000042_Ayax.pdf' }
    const registro = construirRegistroHistorial(resultado, lineaBase, 1000)
    expect(registro).toMatchObject({ id: 1000, estado: 'enviado', errorMensaje: null, archivoAdjunto: resultado.archivoAdjunto })
  })

  it('mapea un resultado fallido a un registro de historial', () => {
    const resultado = { success: false, errorMensaje: 'No se pudo enviar el email.' }
    const registro = construirRegistroHistorial(resultado, lineaBase, 1001)
    expect(registro).toMatchObject({ estado: 'error', errorMensaje: 'No se pudo enviar el email.' })
  })
})
