import { describe, expect, it } from 'vitest'
import { getIpcPeriodicityOptions, validateClientDraft } from './clientRules'

const validClient = {
  name: 'Ayax',
  billingEntityId: 1,
  countryId: 1,
  fiscalConditionId: 1,
  fiscalId: '30-70901901-1',
  primaryEmail: 'contacto@ayax.com.ar',
  ccEmails: ['contabilidad@ayax.com.ar'],
  ipcAdjustable: false,
  ipcPeriodicity: null,
}

describe('getIpcPeriodicityOptions', () => {
  it('expone las cuatro periodicidades soportadas', () => {
    expect(getIpcPeriodicityOptions().map(option => option.value)).toEqual([
      'monthly', 'quarterly', 'semiannual', 'annual',
    ])
  })
})

describe('validateClientDraft', () => {
  it('no reporta errores para un cliente argentino válido', () => {
    expect(validateClientDraft(validClient, { countryCode: 'AR' })).toEqual({})
  })

  it('exige CUIT válido solo cuando el país es Argentina', () => {
    expect(validateClientDraft({ ...validClient, fiscalId: '30-70901901-2' }, { countryCode: 'AR' }))
      .toHaveProperty('fiscalId')
    expect(validateClientDraft({ ...validClient, fiscalId: 'NIT-900111222-3' }, { countryCode: 'CO' }))
      .toEqual({})
  })

  it('exige entidad emisora, país y condición fiscal', () => {
    const errors = validateClientDraft({ ...validClient, billingEntityId: null, countryId: null, fiscalConditionId: null }, { countryCode: 'AR' })
    expect(errors).toHaveProperty('billingEntityId')
    expect(errors).toHaveProperty('countryId')
    expect(errors).toHaveProperty('fiscalConditionId')
  })

  it('valida el formato del email principal y de los emails en copia', () => {
    expect(validateClientDraft({ ...validClient, primaryEmail: 'invalido' }, { countryCode: 'AR' }))
      .toHaveProperty('primaryEmail')
    expect(validateClientDraft({ ...validClient, ccEmails: ['invalido'] }, { countryCode: 'AR' }))
      .toHaveProperty('ccEmails')
  })

  it('exige periodicidad de IPC solo cuando el ajuste está activo', () => {
    expect(validateClientDraft({ ...validClient, ipcAdjustable: true, ipcPeriodicity: null }, { countryCode: 'AR' }))
      .toHaveProperty('ipcPeriodicity')
    expect(validateClientDraft({ ...validClient, ipcAdjustable: true, ipcPeriodicity: 'quarterly' }, { countryCode: 'AR' }))
      .toEqual({})
    expect(validateClientDraft({ ...validClient, ipcAdjustable: false, ipcPeriodicity: 'quarterly' }, { countryCode: 'AR' }))
      .toHaveProperty('ipcPeriodicity')
  })
})
