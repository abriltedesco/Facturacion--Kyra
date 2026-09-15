import { describe, expect, it } from 'vitest'
import {
  REAL_CLIENT_ID_OFFSET,
  esClienteIdReal,
  idClienteReal,
  idParaLinea,
  mapClienteRealALegacy,
} from './clienteLookup'

describe('offset de id de cliente real', () => {
  it('idParaLinea aplica el offset y esClienteIdReal/idClienteReal lo detectan y revierten', () => {
    const clienteReal = { id: 1 }
    const idEnLinea = idParaLinea(clienteReal)

    expect(idEnLinea).toBe(REAL_CLIENT_ID_OFFSET + 1)
    expect(esClienteIdReal(idEnLinea)).toBe(true)
    expect(idClienteReal(idEnLinea)).toBe(1)
  })

  it('un id mock chico (1-12) nunca se confunde con uno real', () => {
    expect(esClienteIdReal(1)).toBe(false)
    expect(esClienteIdReal(12)).toBe(false)
  })
})

describe('mapClienteRealALegacy', () => {
  it('mapea los campos que usan email/PDF y deja direccion vacío (no existe en el schema real)', () => {
    const legacy = mapClienteRealALegacy({
      id: 1, name: 'Ayax', status: 'active', primaryEmail: 'contacto@ayax.com.ar', fiscalId: '30-70901901-1',
    })

    expect(legacy).toMatchObject({
      id: REAL_CLIENT_ID_OFFSET + 1,
      nombre: 'Ayax',
      estado: 'activo',
      email: 'contacto@ayax.com.ar',
      cuit: '30-70901901-1',
      direccion: '',
      emailConfig: { emailPrincipal: 'contacto@ayax.com.ar' },
    })
  })

  it('devuelve null si no hay cliente real', () => {
    expect(mapClienteRealALegacy(null)).toBeNull()
  })
})
