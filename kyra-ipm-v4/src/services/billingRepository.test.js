import { describe, expect, it } from 'vitest'
import { createBillingRepository, mapEmissionResult, mapInvoiceRow, mapManualInvoiceRow } from './billingRepository'

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

describe('mapManualInvoiceRow', () => {
  it('mapea una fila cruda de manual_invoices, tolerando net/vat en null (S/F)', () => {
    const row = mapManualInvoiceRow({
      id: 9, client_id: null, billing_entity_id: 3, invoice_type: 'LLC', invoice_number: 'INV-2026-042',
      currency: 'USD', net_amount: '450.00', vat_amount: '50.00', total_amount: '500.00',
      issued_at: '2026-09-15T10:00:00Z', created_by: 'user-1',
    })

    expect(row).toMatchObject({
      id: 9, clientId: null, billingEntityId: 3, invoiceType: 'LLC', invoiceNumber: 'INV-2026-042',
      currency: 'USD', netAmount: 450, vatAmount: 50, totalAmount: 500,
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

  it('registra un comprobante manual invocando POST /billing/manual-invoice', async () => {
    const apiStub = {
      post: async (path, body) => {
        expect(path).toBe('/billing/manual-invoice')
        expect(body).toEqual({
          clientId: 1, billingEntityId: 3, invoiceType: 'LLC', invoiceNumber: 'INV-2026-042',
          currency: 'USD', netAmount: 450, vatAmount: 50, totalAmount: 500,
        })
        return {
          id: 9, client_id: 1, billing_entity_id: 3, invoice_type: 'LLC', invoice_number: 'INV-2026-042',
          currency: 'USD', net_amount: '450.00', vat_amount: '50.00', total_amount: '500.00',
          issued_at: '2026-09-15T10:00:00Z', created_by: 'user-1',
        }
      },
    }

    const repository = createBillingRepository(apiStub)
    const result = await repository.recordManualInvoice({
      clientId: 1, billingEntityId: 3, invoiceType: 'LLC', invoiceNumber: 'INV-2026-042',
      currency: 'USD', netAmount: 450, vatAmount: 50, totalAmount: 500,
    })

    expect(result).toMatchObject({ id: 9, invoiceType: 'LLC', invoiceNumber: 'INV-2026-042', totalAmount: 500 })
  })

  it('propaga los errores de registro manual como BillingRepositoryError', async () => {
    const apiStub = {
      post: async () => {
        const error = new Error('invoiceNumber es requerido.')
        error.code = 'INVALID_INVOICE_NUMBER'
        throw error
      },
    }

    const repository = createBillingRepository(apiStub)
    await expect(repository.recordManualInvoice({ billingEntityId: 3, invoiceType: 'LLC', totalAmount: 500 }))
      .rejects.toMatchObject({ name: 'BillingRepositoryError', code: 'INVALID_INVOICE_NUMBER' })
  })

  it('lista comprobantes manuales de un cliente invocando GET /billing/manual-invoices?clientId=', async () => {
    const apiStub = {
      get: async path => {
        expect(path).toBe('/billing/manual-invoices?clientId=1')
        return [{
          id: 9, client_id: 1, billing_entity_id: 3, invoice_type: 'LLC', invoice_number: 'INV-2026-042',
          currency: 'USD', net_amount: '450.00', vat_amount: '50.00', total_amount: '500.00',
          issued_at: '2026-09-15T10:00:00Z', created_by: 'user-1',
        }]
      },
    }

    const repository = createBillingRepository(apiStub)
    const rows = await repository.listManualInvoices(1)

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ id: 9, clientId: 1, invoiceNumber: 'INV-2026-042' })
  })
})
