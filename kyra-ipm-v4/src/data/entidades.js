// /src/data/entidades.js
// Mock data de las 3 entidades emisoras reales de Kyra.
// No hay backend — este array es la fuente de verdad para el frontend.

export const ENTIDADES_INICIAL = [
  {
    id: 1,
    nombre: 'Kyra SRL',
    estado: 'Activa',
    tipo: 'SRL',                          // Argentina
    identificacion: '30-70901901-1',      // CUIT
    tipoIdentificacion: 'CUIT',
    cuentas: [
      { banco: 'Banco Patagonia', moneda: 'ARS' },
      { banco: 'Banco Galicia',   moneda: 'ARS' },
    ],
    comprobanteDefault: 'Factura A',
    arca: {
      archivoSubido: true,
      vencimiento: '2026-09-10',           // próximo a vencer (< 30 días desde hoy 2026-08-18)
    },
  },
  {
    id: 2,
    nombre: 'Monotributo Personal (Mai)',
    estado: 'Activa',
    tipo: 'Monotributista',               // Argentina
    identificacion: '30-69630509-5',      // CUIT
    tipoIdentificacion: 'CUIT',
    cuentas: [
      { banco: 'Banco Patagonia Personal', moneda: 'ARS' },
      { banco: 'Banco Patagonia USD',      moneda: 'USD' },
    ],
    comprobanteDefault: 'Factura C',
    arca: {
      archivoSubido: true,
      vencimiento: '2027-03-01',           // vigente (> 30 días)
    },
  },
  {
    id: 3,
    nombre: 'Mercury LLC',
    estado: 'Activa',
    tipo: 'LLC',                           // Estados Unidos — ARCA no aplica
    identificacion: '90-0388092-8',        // EIN
    tipoIdentificacion: 'EIN',
    cuentas: [
      { banco: 'Mercury Bank', moneda: 'USD' },
    ],
    comprobanteDefault: 'Invoice LLC',
    arca: null,                            // no aplica para entidades no-argentinas
  },
]