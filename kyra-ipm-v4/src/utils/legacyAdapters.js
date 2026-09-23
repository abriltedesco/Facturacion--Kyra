// Adaptadores: convierten los datos reales de Clientes (Módulo 2) y Servicios (Módulo 3)
// al shape legacy ({ id, nombre, ... }) que todavía consumen las pantallas de
// Facturación mensual (Módulo 5) y Emisión (Módulo 6, aún simulado).

export function adaptClientsToLegacy(clients) {
  return (clients || []).map(c => ({
    id: c.id,
    nombre: c.name,
    email: c.primaryEmail,
    emailConfig: { emailPrincipal: c.primaryEmail, envioAutomatico: true, plantillaId: null },
    tipoFactura: c.billingEntity?.defaultVoucher,
    entidadEmisoraId: c.billingEntityId,
  }))
}

export function adaptClientServicesToLegacy(clientServices) {
  return (clientServices || []).map(s => ({
    id: s.id,
    clienteId: s.clientId,
    nombre: s.name,
    descripcion: s.description,
    tipo: s.type === 'hourly' ? 'por_hora' : 'fijo',
    moneda: s.currency,
    montoBase: s.baseAmount,
    tarifaHora: s.hourlyRate,
  }))
}
