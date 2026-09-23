import { describe, expect, it } from 'vitest'
import { calcularMontoDespues, getImpactLevel, validateGenerateDraft, validateSaveDraft } from './ipcRules'

describe('calcularMontoDespues', () => {
  it('calcula el monto redondeado a 2 decimales', () => {
    expect(calcularMontoDespues(70000, 14.2)).toBeCloseTo(79940, 2)
  })

  it('retorna null si el monto o el porcentaje no son válidos', () => {
    expect(calcularMontoDespues(null, 10)).toBeNull()
    expect(calcularMontoDespues(0, 10)).toBeNull()
    expect(calcularMontoDespues(1000, -1)).toBeNull()
    expect(calcularMontoDespues(1000, 'abc')).toBeNull()
  })
})

describe('getImpactLevel', () => {
  it('clasifica como alto a partir del 10%', () => {
    expect(getImpactLevel(10)).toBe('alto')
    expect(getImpactLevel(14.2)).toBe('alto')
  })

  it('clasifica como bajo por debajo del 10%', () => {
    expect(getImpactLevel(9.9)).toBe('bajo')
    expect(getImpactLevel(0)).toBe('bajo')
  })
})

describe('validateGenerateDraft', () => {
  const valid = { periodMonth: 8, periodYear: 2026, ipcPercentage: 14.2 }

  it('no reporta errores para un borrador válido', () => {
    expect(validateGenerateDraft(valid)).toEqual({})
  })

  it('exige mes, año y porcentaje válidos', () => {
    const errors = validateGenerateDraft({ periodMonth: 13, periodYear: 1999, ipcPercentage: 150 })
    expect(errors).toHaveProperty('periodMonth')
    expect(errors).toHaveProperty('periodYear')
    expect(errors).toHaveProperty('ipcPercentage')
  })
})

describe('validateSaveDraft', () => {
  it('no reporta errores para un borrador válido', () => {
    expect(validateSaveDraft({ ipcPercentage: 14.2, amountBefore: 70000 })).toEqual({})
  })

  it('exige porcentaje y monto antes válidos', () => {
    const errors = validateSaveDraft({ ipcPercentage: -1, amountBefore: 0 })
    expect(errors).toHaveProperty('ipcPercentage')
    expect(errors).toHaveProperty('amountBefore')
  })
})
