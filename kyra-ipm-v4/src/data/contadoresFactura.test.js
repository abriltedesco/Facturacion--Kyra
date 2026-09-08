import { describe, expect, it } from 'vitest'
import {
  claveContador,
  formatNroFacturaAFIP,
  formatNroInvoiceLLC,
  generarNroFactura,
} from './contadoresFactura'

const srl = { id: 9, legalType: 'srl', pointOfSale: '0042' }
const llc = { id: 12, legalType: 'llc', invoicePrefix: 'KYRA' }

describe('numeración por entidad emisora', () => {
  it('aísla el contador por entidad y comprobante', () => {
    expect(claveContador('A', srl)).toBe('entity_9_A')
    expect(claveContador('B', srl)).toBe('entity_9_B')
    expect(claveContador('LLC', llc)).toBe('entity_12_LLC')
  })

  it('usa el punto de venta configurado por la entidad', () => {
    expect(formatNroFacturaAFIP(132, srl.pointOfSale)).toBe('0042-00000132')
    expect(generarNroFactura(132, 'A', srl, 2026)).toBe('0042-00000132')
  })

  it('usa el prefijo y año configurables para una LLC', () => {
    expect(formatNroInvoiceLLC(42, llc.invoicePrefix, 2027)).toBe('KYRA-2027-042')
    expect(generarNroFactura(42, 'LLC', llc, 2027)).toBe('KYRA-2027-042')
  })
})