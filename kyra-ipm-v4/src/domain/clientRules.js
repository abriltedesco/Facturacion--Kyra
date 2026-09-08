import { isValidCuit } from './fiscalId'

export const IPC_PERIODICITY_OPTIONS = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
]

export function getIpcPeriodicityOptions() {
  return IPC_PERIODICITY_OPTIONS
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

export function validateClientDraft(client, { countryCode } = {}) {
  const errors = {}

  if (String(client?.name || '').trim().length < 2) errors.name = 'Ingresá el nombre del cliente.'
  if (!client?.billingEntityId) errors.billingEntityId = 'Seleccioná la entidad emisora.'
  if (!client?.countryId) errors.countryId = 'Seleccioná el país.'
  if (!client?.fiscalConditionId) errors.fiscalConditionId = 'Seleccioná la condición fiscal.'

  if (countryCode === 'AR') {
    if (!isValidCuit(client?.fiscalId)) errors.fiscalId = 'Ingresá un CUIT válido.'
  } else if (String(client?.fiscalId || '').trim().length < 3) {
    errors.fiscalId = 'Ingresá la identificación fiscal.'
  }

  if (!isValidEmail(client?.primaryEmail)) errors.primaryEmail = 'Ingresá un email principal válido.'

  const ccEmails = Array.isArray(client?.ccEmails) ? client.ccEmails : []
  if (ccEmails.some(email => !isValidEmail(email))) {
    errors.ccEmails = 'Revisá los emails en copia, alguno no es válido.'
  }

  if (client?.ipcAdjustable && !IPC_PERIODICITY_OPTIONS.some(option => option.value === client?.ipcPeriodicity)) {
    errors.ipcPeriodicity = 'Seleccioná la periodicidad de ajuste por IPC.'
  }
  if (!client?.ipcAdjustable && client?.ipcPeriodicity) {
    errors.ipcPeriodicity = 'La periodicidad solo aplica si el ajuste por IPC está activo.'
  }

  return errors
}
