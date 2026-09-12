// Pure-function tests for the fiscally-sensitive logic in src/services/afip.js —
// no DB, no network, no AFIP credentials required.
import { describe, expect, it } from 'vitest'

import { calculateNetAndVat, determineCbteTipo } from '../src/services/afip.js'

describe('determineCbteTipo', () => {
  it('picks Factura A (1) for Responsable Inscripto', () => {
    expect(determineCbteTipo('Responsable Inscripto')).toBe(1)
  })

  it('is case- and whitespace-insensitive', () => {
    expect(determineCbteTipo('  responsable INSCRIPTO  ')).toBe(1)
  })

  it('picks Factura B (6) for every other domestic fiscal condition', () => {
    expect(determineCbteTipo('Monotributista')).toBe(6)
    expect(determineCbteTipo('Exento')).toBe(6)
  })

  it('picks Factura B (6) for empty/unexpected input rather than throwing', () => {
    expect(determineCbteTipo('')).toBe(6)
    expect(determineCbteTipo(null)).toBe(6)
    expect(determineCbteTipo(undefined)).toBe(6)
  })
})

describe('calculateNetAndVat', () => {
  it('splits a VAT-inclusive amount into net + 21% VAT that sum back exactly', () => {
    const { netAmount, vatAmount } = calculateNetAndVat(121)
    expect(netAmount).toBe(100)
    expect(vatAmount).toBe(21)
    expect(Math.round((netAmount + vatAmount) * 100) / 100).toBe(121)
  })

  it('rounds to 2 decimals and still sums back to the original total', () => {
    const total = 184.05
    const { netAmount, vatAmount } = calculateNetAndVat(total)
    expect(netAmount).toBeCloseTo(152.11, 2)
    expect(vatAmount).toBeCloseTo(31.94, 2)
    expect(Math.round((netAmount + vatAmount) * 100) / 100).toBe(total)
  })

  it('never lets net+vat drift from the total by more than a cent across many amounts', () => {
    for (let cents = 1; cents <= 500000; cents += 137) {
      const total = cents / 100
      const { netAmount, vatAmount } = calculateNetAndVat(total)
      expect(Math.round((netAmount + vatAmount) * 100) / 100).toBe(total)
    }
  })
})
