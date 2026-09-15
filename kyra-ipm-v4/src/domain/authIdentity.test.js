import { describe, expect, it } from 'vitest'
import { usernameToTechnicalEmail } from './authIdentity'

describe('usernameToTechnicalEmail', () => {
  it('normaliza el usuario y rechaza identificadores fuera del dominio interno', () => {
    expect(usernameToTechnicalEmail('  Mai.Brandao  ', 'kyra.internal')).toBe('mai.brandao@kyra.internal')
    expect(usernameToTechnicalEmail('mai@externo.com', 'kyra.internal')).toBe(null)
  })
})