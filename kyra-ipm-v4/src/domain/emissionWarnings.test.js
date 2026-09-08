import { describe, expect, it } from 'vitest'
import { getEmissionWarningEntries, getEmissionWarnings } from './emissionWarnings'

const now = new Date('2026-08-18T12:00:00Z')

function entity(overrides = {}) {
  return {
    id: 1,
    status: 'active',
    legalType: 'srl',
    allowsBExempt: false,
    bankAccounts: [{ currency: 'ARS' }],
    currentArcaDocument: { expirationDate: '2027-03-01' },
    ...overrides,
  }
}

describe('advertencias de emisión', () => {
  it('no advierte cuando entidad, comprobante, cuenta y ARCA son válidos', () => {
    expect(getEmissionWarnings({ entity: entity(), voucherType: 'A', currency: 'ARS' }, now)).toEqual([])
  })

  it('informa cada inconsistencia sin convertirla en bloqueo', () => {
    const warnings = getEmissionWarnings({
      entity: entity({
        status: 'inactive',
        currentArcaDocument: { expirationDate: '2026-08-01' },
      }),
      voucherType: 'B',
      currency: 'USD',
    }, now)

    expect(warnings.map(warning => warning.code)).toEqual([
      'entity_inactive',
      'voucher_incompatible',
      'bank_account_missing',
      'arca_expired',
    ])
    expect(warnings.every(warning => warning.blocking === false)).toBe(true)
  })

  it('no exige certificado ARCA a una LLC', () => {
    const warnings = getEmissionWarnings({
      entity: entity({ legalType: 'llc', bankAccounts: [{ currency: 'USD' }], currentArcaDocument: null }),
      voucherType: 'LLC',
      currency: 'USD',
    }, now)

    expect(warnings).toEqual([])
  })

  it('advierte cuando no puede resolver la entidad', () => {
    expect(getEmissionWarnings({ entity: null, voucherType: 'A', currency: 'ARS' }, now))
      .toEqual([{ code: 'entity_missing', message: 'No se encontró la entidad emisora.', blocking: false }])
  })

  it('resume sólo las líneas observadas para una confirmación individual o en lote', () => {
    const validEntity = entity({ id: 1, name: 'Kyra SRL' })
    const expiredEntity = entity({
      id: 2,
      name: 'Mai',
      legalType: 'monotributista',
      currentArcaDocument: { expirationDate: '2026-08-01' },
    })

    expect(getEmissionWarningEntries({
      lines: [
        { id: 10, entidadId: 1, tipoFactura: 'A', moneda: 'ARS' },
        { id: 11, entidadId: 2, tipoFactura: 'C', moneda: 'ARS' },
      ],
      entities: [validEntity, expiredEntity],
      now,
    })).toEqual([
      {
        lineId: 11,
        entityId: 2,
        entityName: 'Mai',
        voucherType: 'C',
        warnings: [{ code: 'arca_expired', message: 'El certificado ARCA está vencido.', blocking: false }],
      },
    ])
  })

  it('mantiene el certificado por vencer como aviso visible sin pedir confirmación', () => {
    const expiringEntity = entity({
      id: 3,
      name: 'Kyra SRL',
      currentArcaDocument: { expirationDate: '2026-09-10' },
    })

    expect(getEmissionWarningEntries({
      lines: [{ id: 12, entidadId: 3, tipoFactura: 'A', moneda: 'ARS' }],
      entities: [expiringEntity],
      now,
    })).toEqual([])
  })
})