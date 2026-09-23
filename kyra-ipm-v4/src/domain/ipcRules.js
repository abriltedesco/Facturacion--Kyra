// Reglas de dominio del Módulo 4 — Actualización por IPC.

export const ADJUSTMENT_TYPE_OPTIONS = [
  { value: 'ipc', label: 'IPC' },
  { value: 'manual', label: 'Manual' },
  { value: 'comercial', label: 'Comercial' },
]

export const SIGNIFICANT_INCREASE_THRESHOLD = 10

export function calcularMontoDespues(montoAntes, porcentaje) {
  const m = parseFloat(montoAntes)
  const p = parseFloat(porcentaje)
  if (isNaN(m) || m <= 0 || isNaN(p) || p < 0) return null
  return Math.round(m * (1 + p / 100) * 100) / 100
}

export function getImpactLevel(porcentaje) {
  const p = parseFloat(porcentaje)
  if (isNaN(p)) return 'bajo'
  return p >= SIGNIFICANT_INCREASE_THRESHOLD ? 'alto' : 'bajo'
}

export function validateGenerateDraft(draft) {
  const errors = {}
  const month = Number(draft?.periodMonth)
  const year = Number(draft?.periodYear)
  const percentage = Number(draft?.ipcPercentage)

  if (!Number.isInteger(month) || month < 1 || month > 12) errors.periodMonth = 'Seleccioná un mes válido.'
  if (!Number.isInteger(year) || year < 2000 || year > 2100) errors.periodYear = 'Seleccioná un año válido.'
  if (isNaN(percentage) || percentage < 0 || percentage > 100) errors.ipcPercentage = 'Ingresá un porcentaje entre 0 y 100.'

  return errors
}

export function validateSaveDraft(draft) {
  const errors = {}
  const percentage = Number(draft?.ipcPercentage)
  const amountBefore = Number(draft?.amountBefore)

  if (isNaN(percentage) || percentage < 0 || percentage > 100) errors.ipcPercentage = 'Ingresá un porcentaje entre 0 y 100.'
  if (isNaN(amountBefore) || amountBefore <= 0) errors.amountBefore = 'Ingresá el monto vigente antes de aprobar.'

  return errors
}
