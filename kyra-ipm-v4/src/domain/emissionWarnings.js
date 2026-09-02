import { getAllowedVoucherTypes } from './entityRules'
import { getArcaStatus } from './arca'

function warning(code, message) {
  return { code, message, blocking: false }
}

export function getEmissionWarnings({ entity, voucherType, currency }, now = new Date()) {
  if (!entity) {
    return [warning('entity_missing', 'No se encontró la entidad emisora.')]
  }

  const warnings = []
  const isInternalVoucher = voucherType === 'S' || voucherType === 'F'
  const normalizedVoucher = voucherType === 'B' ? 'B_EXEMPT' : voucherType

  if (entity.status !== 'active') {
    warnings.push(warning('entity_inactive', 'La entidad emisora está inactiva.'))
  }

  if (!isInternalVoucher && !getAllowedVoucherTypes(entity).includes(normalizedVoucher)) {
    warnings.push(warning('voucher_incompatible', 'El comprobante no corresponde al tipo de entidad.'))
  }

  if (!entity.bankAccounts?.some(account => account.currency === currency)) {
    warnings.push(warning('bank_account_missing', `No hay una cuenta bancaria configurada en ${currency}.`))
  }

  if (entity.legalType !== 'llc' && !isInternalVoucher) {
    const arcaStatus = getArcaStatus(entity, now)
    const arcaWarnings = {
      missing: ['arca_missing', 'La entidad no tiene certificado ARCA cargado.'],
      expiring: ['arca_expiring', 'El certificado ARCA vence dentro de los próximos 30 días.'],
      expired: ['arca_expired', 'El certificado ARCA está vencido.'],
    }
    if (arcaWarnings[arcaStatus]) {
      warnings.push(warning(...arcaWarnings[arcaStatus]))
    }
  }

  return warnings
}