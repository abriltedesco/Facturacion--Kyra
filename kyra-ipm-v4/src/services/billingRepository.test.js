import { describe, expect, it } from 'vitest'
import { createBillingRepository, mapEmissionResult, mapInvoiceRow } from './billingRepository'

describe('mapEmissionResult', () => {
  it('pasa el resultado de emisión de arca-service tal cual (ya viene en camelCase)', () => {
    const result = mapEmissionResult({
      id: 7,
      cae: '75123456789012',
      caeExpirationDate: '20260101',
      puntoVenta: 3,
      cbteTipo: 1,
      voucherNumber: 42,
      netAmount: 100,
      vatAmount: 21,
      totalAmount: 121,
      persisted: true,
    })

    expect(result).toMatchObject({ cae: '75123456789012', cbteTipo: 1, voucherNumber: 42, totalAmount: 121 })
  })
})

describe('mapInvoiceRow', () => {
  it('mapea una fila cruda de la tabla invoices (snake_case, numeric como string)', () => {
    const invoice = mapInvoiceRow({
      id: 7,
      client_id: 1,
      cbte_tipo: 1,
      punto_venta: 3,
      voucher_number: 42,
      concepto: 2,
      net_amount: '100.00',
      vat_amount: '21.00',
      total_amount: '121.00',
      cae: '75123456789012',
      cae_expiration_date: '2026-01-01',
      issued_at: '2026-09-13T10:00:00Z',
      created_by: 'user-1',
    })

    expect(invoice).toMatchObject({
      id: 7,
      clientId: 1,
      cbteTipo: 1,
      voucherNumber: 42,
      netAmount: 100,
      vatAmount: 21,
      totalAmount: 121,
      cae: '75123456789012',
    })
  })
})

describe('createBillingRepository', () => {
  it('emite una factura invocando POST /billing/invoice con clientId y totalAmount', async () => {
    const apiStub = {
      post: async (path, body) => {
        expect(path).toBe('/billing/invoice')
        expect(body).toEqual({ clientId: 1, totalAmount: 121 })
        return {
          id: 7, cae: '75123456789012', caeExpirationDate: '20260101',
          puntoVenta: 3, cbteTipo: 1, voucherNumber: 42,
          netAmount: 100, vatAmount: 21, totalAmount: 121, persisted: true,
        }
      },
    }

    const repository = createBillingRepository(apiStub)
    const result = await repository.emitInvoice(1, 121)

    expect(result).toMatchObject({ cae: '75123456789012', voucherNumber: 42, persisted: true })
  })

  it('propaga los errores del backend como BillingRepositoryError con el mismo code/message', async () => {
    const apiStub = {
      post: async () => {
        const error = new Error('Faltan variables de entorno de ARCA (CUIT, CERT_PATH, KEY_PATH).')
        error.code = 'AFIP_NOT_CONFIGURED'
        throw error
      },
    }

    const repository = createBillingRepository(apiStub)
    await expect(repository.emitInvoice(1, 121)).rejects.toMatchObject({
      name: 'BillingRepositoryError',
      code: 'AFIP_NOT_CONFIGURED',
      message: 'Faltan variables de entorno de ARCA (CUIT, CERT_PATH, KEY_PATH).',
    })
  })

  it('lista facturas de un cliente invocando GET /billing/invoices?clientId=', async () => {
    const apiStub = {
      get: async path => {
        expect(path).toBe('/billing/invoices?clientId=1')
        return [{
          id: 7, client_id: 1, cbte_tipo: 1, punto_venta: 3, voucher_number: 42, concepto: 2,
          net_amount: '100.00', vat_amount: '21.00', total_amount: '121.00',
          cae: '75123456789012', cae_expiration_date: '2026-01-01',
          issued_at: '2026-09-13T10:00:00Z', created_by: 'user-1',
        }]
      },
    }

    const repository = createBillingRepository(apiStub)
    const rows = await repository.listInvoices(1)

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ id: 7, clientId: 1, netAmount: 100 })
  })
})
