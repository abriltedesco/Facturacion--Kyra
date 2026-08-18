// /src/data/ajustes.js
// Mock data de ajustes IPC del período actual.
// clienteId → CLIENTES_INICIAL, servicioId → SERVICIOS_INICIAL

export const AJUSTES_INICIAL = [
  // ── Necesitan revisión (status: "revision") ──────────────────────────────
  {
    id: 1,
    clienteId: 5,          // Entelai
    servicioId: 10,        // Social Media
    mes: 'agosto',
    anio: 2026,
    porcentajeIPC: 14.2,
    montoAntes: null,
    montoDespues: null,
    tipoAjuste: 'IPC',
    impactoNivel: 'alto',
    alertaAumentoSignificativo: true,
    motivo: '',
    status: 'revision',
    contexto: {
      ultimoAumentoHaceMeses: 4,
      variacionAcumuladaAnual: 39,
      margenProyectado: 7,
    },
  },
  {
    id: 2,
    clienteId: 5,          // Entelai
    servicioId: 11,        // Social Ads
    mes: 'agosto',
    anio: 2026,
    porcentajeIPC: 14.2,
    montoAntes: null,
    montoDespues: null,
    tipoAjuste: 'IPC',
    impactoNivel: 'alto',
    alertaAumentoSignificativo: true,
    motivo: '',
    status: 'revision',
    contexto: {
      ultimoAumentoHaceMeses: 4,
      variacionAcumuladaAnual: 39,
      margenProyectado: 7,
    },
  },
  {
    id: 3,
    clienteId: 5,          // Entelai
    servicioId: 14,        // Diseño
    mes: 'agosto',
    anio: 2026,
    porcentajeIPC: 14.2,
    montoAntes: null,
    montoDespues: null,
    tipoAjuste: 'IPC',
    impactoNivel: 'bajo',
    alertaAumentoSignificativo: false,
    motivo: '',
    status: 'revision',
    contexto: {
      ultimoAumentoHaceMeses: 4,
      variacionAcumuladaAnual: 39,
      margenProyectado: 7,
    },
  },
  {
    id: 4,
    clienteId: 7,          // Laura Di Cola
    servicioId: 18,        // Mantenimiento UX/UI
    mes: 'agosto',
    anio: 2026,
    porcentajeIPC: 14.2,
    montoAntes: null,
    montoDespues: null,
    tipoAjuste: 'IPC',
    impactoNivel: 'alto',
    alertaAumentoSignificativo: true,
    motivo: '',
    status: 'revision',
    contexto: {
      ultimoAumentoHaceMeses: 2,
      variacionAcumuladaAnual: 28,
      margenProyectado: 12,
    },
  },
  {
    id: 5,
    clienteId: 8,          // THC
    servicioId: 19,        // Mantenimiento UX/UI
    mes: 'agosto',
    anio: 2026,
    porcentajeIPC: 14.2,
    montoAntes: null,
    montoDespues: null,
    tipoAjuste: 'IPC',
    impactoNivel: 'bajo',
    alertaAumentoSignificativo: false,
    motivo: '',
    status: 'revision',
    contexto: {
      ultimoAumentoHaceMeses: 2,
      variacionAcumuladaAnual: 28,
      margenProyectado: 9,
    },
  },

  // ── Listas para aprobar (status: "lista_aprobar") ─────────────────────────
  {
    id: 6,
    clienteId: 5,          // Entelai
    servicioId: 12,        // Google Ads
    mes: 'agosto',
    anio: 2026,
    porcentajeIPC: 14.2,
    montoAntes: 510000,
    montoDespues: 582420,
    tipoAjuste: 'IPC',
    impactoNivel: 'bajo',
    alertaAumentoSignificativo: false,
    motivo: 'Ajuste IPC bimestral — período jun/ago 2026',
    status: 'lista_aprobar',
    contexto: {
      ultimoAumentoHaceMeses: 4,
      variacionAcumuladaAnual: 39,
      margenProyectado: 7,
    },
  },
  {
    id: 7,
    clienteId: 8,          // THC
    servicioId: 19,        // Mantenimiento UX/UI
    mes: 'agosto',
    anio: 2026,
    porcentajeIPC: 11.0,
    montoAntes: 380000,
    montoDespues: 421800,
    tipoAjuste: 'IPC',
    impactoNivel: 'bajo',
    alertaAumentoSignificativo: false,
    motivo: 'Ajuste moderado por acuerdo previo con el cliente',
    status: 'lista_aprobar',
    contexto: {
      ultimoAumentoHaceMeses: 2,
      variacionAcumuladaAnual: 28,
      margenProyectado: 9,
    },
  },

  // ── Aprobadas (status: "aprobada") ────────────────────────────────────────
  {
    id: 8,
    clienteId: 1,          // Ayax
    servicioId: 1,         // Google Ads
    mes: 'julio',
    anio: 2026,
    porcentajeIPC: 12.8,
    montoAntes: 460000,
    montoDespues: 518880,
    tipoAjuste: 'IPC',
    impactoNivel: 'bajo',
    alertaAumentoSignificativo: false,
    motivo: '',
    status: 'aprobada',
    fechaAprobacion: '2026-07-01',
    contexto: {
      ultimoAumentoHaceMeses: 2,
      variacionAcumuladaAnual: 25,
      margenProyectado: 11,
    },
  },
  {
    id: 9,
    clienteId: 4,          // SCS
    servicioId: 9,         // Diseño por hora
    mes: 'junio',
    anio: 2026,
    porcentajeIPC: 14.2,
    montoAntes: 20000,
    montoDespues: 22840,
    tipoAjuste: 'IPC',
    impactoNivel: 'bajo',
    alertaAumentoSignificativo: false,
    motivo: '',
    status: 'aprobada',
    fechaAprobacion: '2026-06-01',
    contexto: {
      ultimoAumentoHaceMeses: 3,
      variacionAcumuladaAnual: 41,
      margenProyectado: 8,
    },
  },
]