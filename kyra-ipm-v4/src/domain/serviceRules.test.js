import { describe, expect, it } from 'vitest'
import { validateCatalogDraft, validateClientServiceDraft } from './serviceRules'

describe('validateCatalogDraft', () => {
  it('no reporta errores para un servicio fijo válido', () => {
    expect(validateCatalogDraft({ name: 'Social Media', type: 'fixed', currency: 'ARS', basePrice: 85000 })).toEqual({})
  })

  it('no reporta errores para un servicio por hora válido sin precio base', () => {
    expect(validateCatalogDraft({ name: 'Consultoría', type: 'hourly', currency: 'ARS' })).toEqual({})
  })

  it('exige precio base positivo cuando el tipo es fijo', () => {
    expect(validateCatalogDraft({ name: 'Social Media', type: 'fixed', currency: 'ARS', basePrice: 0 }))
      .toHaveProperty('basePrice')
  })

  it('exige nombre, tipo y moneda válidos', () => {
    const errors = validateCatalogDraft({ name: 'A', type: 'invalid', currency: 'pesos' })
    expect(errors).toHaveProperty('name')
    expect(errors).toHaveProperty('type')
    expect(errors).toHaveProperty('currency')
  })
})

describe('validateClientServiceDraft', () => {
  const base = { clientId: 1, name: 'Diseño', currency: 'ARS', periodicity: 'monthly' }

  it('no reporta errores para un servicio por hora válido', () => {
    expect(validateClientServiceDraft({ ...base, type: 'hourly', hourlyRate: 20000 })).toEqual({})
  })

  it('no reporta errores para un servicio fijo válido', () => {
    expect(validateClientServiceDraft({ ...base, type: 'fixed', baseAmount: 85000 })).toEqual({})
  })

  it('exige tarifa hora positiva cuando el tipo es por hora', () => {
    expect(validateClientServiceDraft({ ...base, type: 'hourly', hourlyRate: 0 })).toHaveProperty('hourlyRate')
  })

  it('exige monto base positivo cuando el tipo es fijo', () => {
    expect(validateClientServiceDraft({ ...base, type: 'fixed', baseAmount: null })).toHaveProperty('baseAmount')
  })

  it('exige cliente y periodicidad', () => {
    const errors = validateClientServiceDraft({ name: 'Diseño', type: 'hourly', currency: 'ARS', hourlyRate: 20000, periodicity: 'invalid' })
    expect(errors).toHaveProperty('clientId')
    expect(errors).toHaveProperty('periodicity')
  })
})
