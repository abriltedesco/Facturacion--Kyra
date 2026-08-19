// /src/data/historialEnvios.js
// Registro de cada intento de envío de email con factura adjunta.
// estado: "enviado" | "error" | "pendiente"
// Se agrega un nuevo registro por cada intento (incluyendo reenvíos).
// lineaFacturacionId → referencia a LINEAS_INICIAL en lineasFacturacion.js

export const HISTORIAL_INICIAL = [
  // ── Facturas ya emitidas (ids 10, 11, 12 en LINEAS_INICIAL) ──────────────

  // Laura Di Cola — Mantenimiento UX/UI — enviado OK
  {
    id: 1,
    lineaFacturacionId: 10,
    clienteId: 7,
    nroFactura: '0002-00000385',
    emailDestino: 'lauradico@gmail.com',
    ccs: [],
    plantillaId: 1,
    asuntoEnviado: 'Factura Agosto 2026 — Kyra',
    fechaEnvio: '2026-08-01T09:03:22',
    estado: 'enviado',
    errorMensaje: null,
    intentos: 1,
    archivoAdjunto: 'Factura_C_0002-00000385_Laura_Di_Cola.pdf',
  },

  // Entelai — Social Media — enviado OK
  {
    id: 2,
    lineaFacturacionId: 11,
    clienteId: 5,
    nroFactura: '0001-00000131',
    emailDestino: 'administracion@entelai.com',
    ccs: ['contabilidad@entelai.com'],
    plantillaId: 1,
    asuntoEnviado: 'Factura Agosto 2026 — Kyra',
    fechaEnvio: '2026-08-01T09:04:11',
    estado: 'enviado',
    errorMensaje: null,
    intentos: 1,
    archivoAdjunto: 'Factura_A_0001-00000131_Entelai.pdf',
  },

  // UTALK — Mantenimiento UX/UI — primer intento fallido, segundo OK
  {
    id: 3,
    lineaFacturacionId: 12,
    clienteId: 9,
    nroFactura: '0001-00000042',
    emailDestino: 'admin@utalk.io',
    ccs: [],
    plantillaId: 1,
    asuntoEnviado: 'Factura Agosto 2026 — Kyra',
    fechaEnvio: '2026-08-01T09:05:00',
    estado: 'error',
    errorMensaje: 'Error de conexión con el servidor SMTP. El servidor no respondió.',
    intentos: 1,
    archivoAdjunto: 'Factura_A_0001-00000042_UTALK.pdf',
  },
  {
    id: 4,
    lineaFacturacionId: 12,
    clienteId: 9,
    nroFactura: '0001-00000042',
    emailDestino: 'admin@utalk.io',
    ccs: [],
    plantillaId: 1,
    asuntoEnviado: 'Factura Agosto 2026 — Kyra',
    fechaEnvio: '2026-08-01T09:17:44',
    estado: 'enviado',
    errorMensaje: null,
    intentos: 2,
    archivoAdjunto: 'Factura_A_0001-00000042_UTALK.pdf',
  },
]
