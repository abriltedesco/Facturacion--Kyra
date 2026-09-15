import { describe, expect, it } from 'vitest'
import { normalizeEmail } from './authIdentity'

describe('normalizeEmail', () => {
  it('recorta espacios y pasa a minúsculas emails válidos', () => {
    expect(normalizeEmail('  Info@WeAreKyra.com  ')).toBe('info@wearekyra.com')
  })

  it('rechaza valores sin arroba o sin dominio', () => {
    expect(normalizeEmail('mai.brandao')).toBe(null)
    expect(normalizeEmail('mai@')).toBe(null)
    expect(normalizeEmail('')).toBe(null)
  })
})
