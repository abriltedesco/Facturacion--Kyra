import { describe, expect, it } from 'vitest'
import { getArcaStatus } from './arca'

describe('getArcaStatus', () => {
  it('deriva el estado por tipo legal, documento actual y vencimiento', () => {
    const today = new Date('2026-09-02T12:00:00-03:00')

    expect(getArcaStatus({ legalType: 'llc' }, today)).toBe('not_applicable')
    expect(getArcaStatus({ legalType: 'srl', currentArcaDocument: null }, today)).toBe('missing')
    expect(getArcaStatus({ legalType: 'srl', currentArcaDocument: { expirationDate: '2026-09-01' } }, today)).toBe('expired')
    expect(getArcaStatus({ legalType: 'srl', currentArcaDocument: { expirationDate: '2026-09-10' } }, today)).toBe('expiring')
    expect(getArcaStatus({ legalType: 'monotributista', currentArcaDocument: { expirationDate: '2026-10-03' } }, today)).toBe('valid')
  })
})