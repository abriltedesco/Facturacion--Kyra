// /src/data/servicios.js
// Mock data de servicios por cliente.
// clienteId referencia el id de CLIENTES_INICIAL en /data/clientes.js
// historialPrecios: [{ fecha: 'YYYY-MM-DD', valorAnterior, valorNuevo, motivo }]

export const SERVICIOS_INICIAL = [
  // AYAX — Kyra SRL — ARS — Factura A
  {
    id: 1, clienteId: 1, nombre: 'Google Ads', descripcion: '',
    tipo: 'fijo', montoBase: null, tarifaHora: null,
    moneda: 'ARS', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },
  {
    id: 2, clienteId: 1, nombre: 'Diseño', descripcion: '',
    tipo: 'por_hora', montoBase: null, tarifaHora: null,
    moneda: 'ARS', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },

  // EDDING COL — Mercury LLC — USD — Invoice LLC
  {
    id: 3, clienteId: 2, nombre: 'Social Media', descripcion: '',
    tipo: 'fijo', montoBase: null, tarifaHora: null,
    moneda: 'USD', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },
  {
    id: 4, clienteId: 2, nombre: 'Moderación', descripcion: '',
    tipo: 'fijo', montoBase: 100, tarifaHora: null,
    moneda: 'USD', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },

  // MAPED — Mercury LLC — USD — Invoice LLC
  {
    id: 5, clienteId: 3, nombre: 'Social Media', descripcion: '',
    tipo: 'fijo', montoBase: null, tarifaHora: null,
    moneda: 'USD', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },

  // SCS — Monotributo Personal — ARS — Factura C
  {
    id: 6, clienteId: 4, nombre: 'Social Media', descripcion: '',
    tipo: 'fijo', montoBase: null, tarifaHora: null,
    moneda: 'ARS', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },
  {
    id: 7, clienteId: 4, nombre: 'Social Ads', descripcion: '',
    tipo: 'fijo', montoBase: null, tarifaHora: null,
    moneda: 'ARS', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },
  {
    id: 8, clienteId: 4, nombre: 'Google Ads', descripcion: '',
    tipo: 'fijo', montoBase: null, tarifaHora: null,
    moneda: 'ARS', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },
  {
    id: 9, clienteId: 4, nombre: 'Diseño', descripcion: '',
    tipo: 'por_hora', montoBase: null, tarifaHora: 20000,
    moneda: 'ARS', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [
      { fecha: '2026-05-01', valorAnterior: null, valorNuevo: 20000, motivo: 'Tarifa vigente' },
    ],
  },

  // ENTELAI — Kyra SRL — ARS — Factura A
  {
    id: 10, clienteId: 5, nombre: 'Social Media', descripcion: '',
    tipo: 'fijo', montoBase: null, tarifaHora: null,
    moneda: 'ARS', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },
  {
    id: 11, clienteId: 5, nombre: 'Social Ads', descripcion: '',
    tipo: 'fijo', montoBase: null, tarifaHora: null,
    moneda: 'ARS', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },
  {
    id: 12, clienteId: 5, nombre: 'Google Ads', descripcion: '',
    tipo: 'fijo', montoBase: null, tarifaHora: null,
    moneda: 'ARS', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },
  {
    id: 13, clienteId: 5, nombre: 'SEO', descripcion: 'Mes 2/3',
    tipo: 'fijo', montoBase: null, tarifaHora: null,
    moneda: 'ARS', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },
  {
    id: 14, clienteId: 5, nombre: 'Diseño', descripcion: '',
    tipo: 'por_hora', montoBase: null, tarifaHora: null,
    moneda: 'ARS', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },

  // P4C — Kyra SRL — ARS — Factura A
  {
    id: 15, clienteId: 6, nombre: 'Mantenimiento UX/UI', descripcion: '',
    tipo: 'fijo', montoBase: null, tarifaHora: null,
    moneda: 'ARS', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },
  {
    id: 16, clienteId: 6, nombre: 'Hosting Mensual', descripcion: '',
    tipo: 'fijo', montoBase: null, tarifaHora: null,
    moneda: 'ARS', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },
  {
    id: 17, clienteId: 6, nombre: 'Email MKT', descripcion: 'Pack 10 hs mensuales',
    tipo: 'por_hora', montoBase: null, tarifaHora: null,
    moneda: 'ARS', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },

  // LAURA DI COLA — Monotributo Personal — ARS — Factura C
  {
    id: 18, clienteId: 7, nombre: 'Mantenimiento UX/UI', descripcion: '',
    tipo: 'fijo', montoBase: null, tarifaHora: null,
    moneda: 'ARS', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },

  // THC — Monotributo Personal — ARS — Factura C
  {
    id: 19, clienteId: 8, nombre: 'Mantenimiento UX/UI', descripcion: '',
    tipo: 'fijo', montoBase: null, tarifaHora: null,
    moneda: 'ARS', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },

  // UTALK — Kyra SRL (Galicia) — ARS — Factura A
  {
    id: 20, clienteId: 9, nombre: 'Mantenimiento UX/UI', descripcion: '',
    tipo: 'fijo', montoBase: null, tarifaHora: null,
    moneda: 'ARS', periodicidad: 'mensual',
    estado: 'activo', historialPrecios: [],
  },
]