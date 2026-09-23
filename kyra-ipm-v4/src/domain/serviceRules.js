// Reglas de dominio del Módulo 3 — Servicios (catálogo y servicios asignados por cliente).

export const SERVICE_TYPE_OPTIONS = [
  { value: 'fixed', label: 'Fijo' },
  { value: 'hourly', label: 'Por hora' },
]

export const SERVICE_PERIODICITY_OPTIONS = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
]

function isValidCurrency(value) {
  return /^[A-Z]{3}$/.test(String(value || '').trim())
}

export function validateCatalogDraft(catalog) {
  const errors = {}

  if (String(catalog?.name || '').trim().length < 2) errors.name = 'Ingresá el nombre del servicio.'
  if (!SERVICE_TYPE_OPTIONS.some(option => option.value === catalog?.type)) errors.type = 'Seleccioná el tipo de servicio.'
  if (!isValidCurrency(catalog?.currency)) errors.currency = 'Ingresá una moneda válida (ej: ARS, USD).'

  if (catalog?.type === 'fixed' && !(Number(catalog?.basePrice) > 0)) {
    errors.basePrice = 'Ingresá un precio base mayor a 0.'
  }

  return errors
}

export function validateClientServiceDraft(service) {
  const errors = {}

  if (!service?.clientId) errors.clientId = 'Seleccioná el cliente.'
  if (String(service?.name || '').trim().length < 2) errors.name = 'Ingresá el nombre del servicio.'
  if (!SERVICE_TYPE_OPTIONS.some(option => option.value === service?.type)) errors.type = 'Seleccioná el tipo de servicio.'
  if (!isValidCurrency(service?.currency)) errors.currency = 'Ingresá una moneda válida (ej: ARS, USD).'
  if (!SERVICE_PERIODICITY_OPTIONS.some(option => option.value === service?.periodicity)) {
    errors.periodicity = 'Seleccioná la periodicidad de facturación.'
  }

  if (service?.type === 'fixed' && !(Number(service?.baseAmount) > 0)) {
    errors.baseAmount = 'Ingresá un monto base mayor a 0.'
  }
  if (service?.type === 'hourly' && !(Number(service?.hourlyRate) > 0)) {
    errors.hourlyRate = 'Ingresá una tarifa por hora mayor a 0.'
  }

  return errors
}
