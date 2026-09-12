// Exercises the full generateInvoice() happy path — including local persistence —
// against a fake AFIP client, since no real AFIP cert/key/CUIT exists in this
// environment. See test/billing.test.js for the route-level guard clauses, and
// test/afip.unit.test.js for the pure CbteTipo/VAT-math logic in isolation.
import { describe, expect, it } from 'vitest'

import { generateInvoice } from '../src/services/afip.js'
import { listInvoices, recordInvoice } from '../src/services/invoices.js'

class FakeAfipWebServiceError extends Error {
  constructor(message, code) {
    super(message)
    this.code = code
  }
}

function fakeAfip({ lastVoucher = 0, cae = '75123456789012', caeExpirationDate = '20260101', onCreateVoucher } = {}) {
  return {
    ElectronicBilling: {
      async getLastVoucher() {
        return lastVoucher
      },
      async createVoucher(data) {
        if (onCreateVoucher) return onCreateVoucher(data)
        return { CAE: cae, CAEFchVto: caeExpirationDate }
      },
    },
  }
}

describe('generateInvoice (fake AFIP client, real DB)', () => {
  it('emits Factura A for a Responsable Inscripto client and persists it', async () => {
    // client 1 "Ayax" is seeded as AR / Responsable Inscripto.
    const afip = fakeAfip({ lastVoucher: 41 })
    const invoice = await generateInvoice({ clientId: 1, totalAmount: 121 }, { afip })

    expect(invoice.cbteTipo).toBe(1)
    expect(invoice.voucherNumber).toBe(42)
    expect(invoice.netAmount).toBe(100)
    expect(invoice.vatAmount).toBe(21)
    expect(invoice.cae).toBe('75123456789012')
    expect(invoice.persisted).toBe(true)
    expect(invoice.id).not.toBeNull()

    const rows = await listInvoices({ clientId: 1 })
    const saved = rows.find(row => row.id === invoice.id)
    expect(saved).toBeTruthy()
    expect(saved.cbte_tipo).toBe(1)
    expect(saved.voucher_number).toBe(42)
    expect(saved.cae).toBe('75123456789012')
    expect(Number(saved.net_amount)).toBe(100)
    expect(Number(saved.vat_amount)).toBe(21)
  })

  it('emits Factura B for a non-Responsable-Inscripto client', async () => {
    // client 4 "SCS" is seeded as AR / Monotributista.
    const afip = fakeAfip({ lastVoucher: 5 })
    const invoice = await generateInvoice({ clientId: 4, totalAmount: 242 }, { afip })

    expect(invoice.cbteTipo).toBe(6)
    expect(invoice.voucherNumber).toBe(6)
    expect(invoice.persisted).toBe(true)
  })

  it('records the acting user on invoices.created_by when actorId is given', async () => {
    const actorId = '11111111-1111-4111-8111-111111111111' // seeded dev user "mai"
    const afip = fakeAfip({ lastVoucher: 100 })
    const invoice = await generateInvoice({ clientId: 1, totalAmount: 121, actorId }, { afip })

    const [saved] = (await listInvoices({ clientId: 1 })).filter(row => row.id === invoice.id)
    expect(saved.created_by).toBe(actorId)
  })

  it('maps an AFIP-side rejection to a 502 AFIP_REJECTED AppError, without persisting anything', async () => {
    const afip = fakeAfip({
      onCreateVoucher: () => {
        throw new FakeAfipWebServiceError('(10016) CUIT del receptor no autorizado', 10016)
      },
    })

    await expect(generateInvoice({ clientId: 1, totalAmount: 121 }, { afip }))
      .rejects.toMatchObject({ code: 'AFIP_REJECTED', status: 502, message: '(10016) CUIT del receptor no autorizado' })
  })

  it('maps a relay/HTTP-level failure to a 502 AFIP_REQUEST_FAILED AppError', async () => {
    const afip = fakeAfip({
      onCreateVoucher: () => {
        const err = new Error('Service unavailable')
        err.status = 503
        err.data = { message: 'Service unavailable' }
        throw err
      },
    })

    await expect(generateInvoice({ clientId: 1, totalAmount: 121 }, { afip }))
      .rejects.toMatchObject({ code: 'AFIP_REQUEST_FAILED', status: 502 })
  })
})

describe('invoices persistence', () => {
  it('rejects a duplicate (puntoVenta, cbteTipo, voucherNumber) as a unique_violation', async () => {
    const base = {
      clientId: 1, cbteTipo: 1, puntoVenta: 999, voucherNumber: 777, concepto: 2,
      netAmount: 100, vatAmount: 21, totalAmount: 121,
      cae: 'dup-test-cae', caeExpirationDate: '2026-01-01',
    }
    await recordInvoice(base)
    await expect(recordInvoice(base)).rejects.toMatchObject({ code: '23505' })
  })
})
