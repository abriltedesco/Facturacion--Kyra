import { isValidCuit } from './fiscalId'

export { isValidCuit }

export function getAllowedVoucherTypes({ legalType, allowsBExempt = false }) {
  if (legalType === 'srl') return allowsBExempt ? ['A', 'B_EXEMPT'] : ['A']
  if (legalType === 'monotributista') return ['C']
  if (legalType === 'llc') return ['LLC']
  return []
}

export function isValidEin(value) {
  return /^\d{2}-?\d{7}$/.test(String(value || '').trim())
}

export function validateBankAccount(account) {
  const errors = {}
  if (String(account?.bankName || '').trim().length < 2) errors.bankName = 'Ingresá el banco.'
  if (String(account?.accountHolder || '').trim().length < 2) errors.accountHolder = 'Ingresá el titular.'
  if (!/^[A-Z]{3}$/.test(String(account?.currency || ''))) errors.currency = 'Seleccioná una moneda válida.'

  if (account?.accountScope === 'local') {
    const cbu = String(account?.cbu || '').replace(/\D/g, '')
    if (!/^\d{22}$/.test(cbu)) errors.cbu = 'El CBU debe tener 22 dígitos.'
  } else if (account?.accountScope === 'international') {
    if (String(account?.accountNumber || '').trim().length < 4) {
      errors.accountNumber = 'Ingresá el número de cuenta.'
    }
    const routingNumber = String(account?.routingNumber || '').trim()
    const swiftBic = String(account?.swiftBic || '').trim().toUpperCase()
    const iban = String(account?.iban || '').trim()
    if (routingNumber.length < 4 && !/^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(swiftBic) && iban.length < 10) {
      errors.internationalCode = 'Ingresá routing, SWIFT/BIC o IBAN.'
    }
  } else {
    errors.accountScope = 'Seleccioná el tipo de cuenta.'
  }

  return errors
}

export function validateEntityDraft(entity) {
  const errors = {}
  const legalType = entity?.legalType

  if (String(entity?.name || '').trim().length < 2) errors.name = 'Ingresá el nombre de la entidad.'
  if (!['srl', 'monotributista', 'llc'].includes(legalType)) errors.legalType = 'Seleccioná el tipo de entidad.'

  if (legalType === 'llc') {
    if (!isValidEin(entity?.fiscalId)) errors.fiscalId = 'Ingresá un EIN válido.'
    if (!/^[A-Z0-9][A-Z0-9-]{1,11}$/.test(String(entity?.invoicePrefix || '').trim().toUpperCase())) {
      errors.invoicePrefix = 'Ingresá un prefijo de 2 a 12 caracteres.'
    }
  } else if (legalType) {
    if (!isValidCuit(entity?.fiscalId)) errors.fiscalId = 'Ingresá un CUIT válido.'
    if (!/^\d{4}$/.test(String(entity?.pointOfSale || '').trim())) {
      errors.pointOfSale = 'El punto de venta debe tener 4 dígitos.'
    }
  }

  if (String(entity?.fiscalAddress || '').trim().length < 5) {
    errors.fiscalAddress = 'Ingresá el domicilio fiscal.'
  }
  if (entity?.billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entity.billingEmail)) {
    errors.billingEmail = 'Ingresá un email válido.'
  }

  const allowedVouchers = getAllowedVoucherTypes(entity || {})
  if (!allowedVouchers.includes(entity?.defaultVoucher)) {
    errors.defaultVoucher = 'El comprobante no es compatible con la entidad.'
  }

  if (!Array.isArray(entity?.bankAccounts) || entity.bankAccounts.length === 0) {
    errors.bankAccounts = 'Agregá al menos una cuenta bancaria.'
  } else {
    const accountErrors = entity.bankAccounts.map(validateBankAccount)
    if (accountErrors.some(accountError => Object.keys(accountError).length > 0)) {
      errors.bankAccounts = accountErrors
    }
  }

  return errors
}