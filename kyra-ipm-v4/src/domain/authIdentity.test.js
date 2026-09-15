import { describe, expect, it } from 'vitest'
import { normalizeUsername } from './authIdentity'

describe('normalizeUsername', () => {
  it('recorta espacios y pasa a minúsculas los identificadores válidos', () => {
    expect(normalizeUsername('  Mai.Brandao  ')).toBe('mai.brandao')
  })

  it('rechaza identificadores demasiado cortos o con caracteres inválidos', () => {
    expect(normalizeUsername('ma')).toBe(null)
    expect(normalizeUsername('mai@externo.com')).toBe(null)
  })
})
