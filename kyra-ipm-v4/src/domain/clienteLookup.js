// Los clientes reales (arca-service, vía ClientsContext) y el roster mock
// (CLIENTES_INICIAL) usan el mismo rango de ids chicos (1-12) sin ninguna relación
// entre sí — hoy mismo coinciden por casualidad. Sin distinguirlos, una línea vieja
// del mock con tipoFactura A/B y clienteId=1 dispararía una emisión real contra
// "cualquier cliente real que hoy tenga id=1", que es exactamente el tipo de bug
// silencioso que esta fase busca evitar (ver fiscal_conditions.name en
// arca-service). Por eso el id de un cliente real, cuando se guarda en
// linea.clienteId, lleva este offset sumado — nunca se usa así para llamar al
// backend (eso ocurre en src/services/emisionService.js, que lo resta), sólo para
// que TablaEmision/ModalEditarLinea/etc. puedan seguir haciendo
// `.find(c => c.id === linea.clienteId)` sin cambios y sin ambigüedad con el mock.
export const REAL_CLIENT_ID_OFFSET = 100000

export function esClienteIdReal(clienteId) {
  return Number(clienteId) >= REAL_CLIENT_ID_OFFSET
}

export function idClienteReal(clienteId) {
  return Number(clienteId) - REAL_CLIENT_ID_OFFSET
}

export function idParaLinea(clienteReal) {
  return REAL_CLIENT_ID_OFFSET + clienteReal.id
}

// Traduce un cliente real al shape legacy que ya esperan los lookups de
// email/PDF/tabla en EmisionPage.jsx y FacturacionMes.jsx (CLIENTES_INICIAL).
//
// El modelo real de `clients` no tiene domicilio — ver
// arca-service/db/migrations/20260908120000_clients_module.sql — así que
// `direccion` queda vacío hasta que ese campo exista en el backend; generarPDFafip.js
// debe tolerar eso.
export function mapClienteRealALegacy(clienteReal) {
  if (!clienteReal) return null
  return {
    id: idParaLinea(clienteReal),
    nombre: clienteReal.name,
    estado: clienteReal.status === 'active' ? 'activo' : 'inactivo',
    email: clienteReal.primaryEmail,
    cuit: clienteReal.fiscalId,
    direccion: '',
    emailConfig: {
      emailPrincipal: clienteReal.primaryEmail,
      envioAutomatico: true,
      plantillaId: null,
    },
  }
}
