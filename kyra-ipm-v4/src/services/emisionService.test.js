import { describe, expect, it, vi } from 'vitest'
import { emitirLineaReal, esFacturaWsfeElegible, registrarInvoiceManual } from './emisionService'
import { REAL_CLIENT_ID_OFFSET } from '../domain/clienteLookup'

const REAL_CLIENTE_ID = 1 // id real en arca-service
const lineaBase = {
  id: 1, clienteId: REAL_CLIENT_ID_OFFSET + REAL_CLIENTE_ID, tipoFactura: 'A', moneda: 'ARS',
  importeBruto: 121, importeNeto: 100, impuesto: 21, status: 'aprobada',
}

describe('esFacturaWsfeElegible', () => {
  it('es true solo para tipoFactura A/B con un clienteId real (offset-tagged)', () => {
    expect(esFacturaWsfeElegible({ tipoFactura: 'A', clienteId: REAL_CLIENT_ID_OFFSET + 1 })).toBe(true)
    expect(esFacturaWsfeElegible({ tipoFactura: 'B', clienteId: REAL_CLIENT_ID_OFFSET + 1 })).toBe(true)
  })

  it('es false para A/B con un clienteId mock (línea vieja, sin cliente real asignado)', () => {
    // Regresión: sin este chequeo, una línea mock vieja con clienteId=1 dispararía
    // una emisión real contra "el cliente real que hoy tenga id=1" por coincidencia
    // numérica — ver domain/clienteLookup.js.
    expect(esFacturaWsfeElegible({ tipoFactura: 'A', clienteId: 1 })).toBe(false)
    expect(esFacturaWsfeElegible({ tipoFactura: 'B', clienteId: 1 })).toBe(false)
  })

  it('es false para tipos no elegibles aunque el cliente sea real', () => {
    expect(esFacturaWsfeElegible({ tipoFactura: 'C', clienteId: REAL_CLIENT_ID_OFFSET + 1 })).toBe(false)
    expect(esFacturaWsfeElegible({ tipoFactura: 'LLC', clienteId: REAL_CLIENT_ID_OFFSET + 1 })).toBe(false)
    expect(esFacturaWsfeElegible({ tipoFactura: 'S', clienteId: REAL_CLIENT_ID_OFFSET + 1 })).toBe(false)
    expect(esFacturaWsfeElegible({ tipoFactura: 'F', clienteId: REAL_CLIENT_ID_OFFSET + 1 })).toBe(false)
    expect(esFacturaWsfeElegible({})).toBe(false)
  })
})

describe('emitirLineaReal', () => {
  it('llama a billingRepository.emitInvoice con el id real (sin el offset) y aplica el resultado sobre la línea', async () => {
    const billingRepository = {
      emitInvoice: vi.fn(async (clienteId, totalAmount) => {
        expect(clienteId).toBe(REAL_CLIENTE_ID)
        expect(totalAmount).toBe(121)
        return {
          id: 7, cae: '75123456789012', caeExpirationDate: '20260101',
          puntoVenta: 3, cbteTipo: 1, voucherNumber: 42,
          netAmount: 100, vatAmount: 21, totalAmount: 121, persisted: true,
        }
      }),
    }

    const resultado = await emitirLineaReal(lineaBase, { billingRepository })

    expect(billingRepository.emitInvoice).toHaveBeenCalledTimes(1)
    expect(resultado).toMatchObject({
      status: 'emitida',
      nroFactura: '0003-00000042',
      cae: '75123456789012',
      fechaVencimientoCAE: '20260101',
      importeNeto: 100,
      impuesto: 21,
      importeBruto: 121,
      errorCodigo: null,
      errorMensaje: null,
    })
  })

  it('bloquea la emisión real si la línea no está en ARS, sin llamar al backend', async () => {
    const billingRepository = { emitInvoice: vi.fn() }
    const lineaUsd = { ...lineaBase, moneda: 'USD' }

    await expect(emitirLineaReal(lineaUsd, { billingRepository })).rejects.toMatchObject({
      name: 'BillingRepositoryError',
      code: 'WSFE_CURRENCY_UNSUPPORTED',
    })
    expect(billingRepository.emitInvoice).not.toHaveBeenCalled()
  })

  it('propaga el error del backend tal cual, sin encubrirlo', async () => {
    const backendError = Object.assign(new Error('No encontramos el cliente solicitado.'), { code: 'CLIENT_NOT_FOUND' })
    const billingRepository = { emitInvoice: vi.fn(async () => { throw backendError }) }

    await expect(emitirLineaReal(lineaBase, { billingRepository })).rejects.toBe(backendError)
  })
})

describe('registrarInvoiceManual', () => {
  const lineaLlc = {
    id: 2, clienteId: REAL_CLIENT_ID_OFFSET + 1, entidadId: 3, tipoFactura: 'LLC', moneda: 'USD',
    nroFactura: 'INV-2026-042', importeBruto: 500, importeNeto: 450, impuesto: 50,
  }

  it('llama a billingRepository.recordManualInvoice con el id de cliente real (sin offset) para LLC', async () => {
    const billingRepository = { recordManualInvoice: vi.fn(async () => ({})) }

    await registrarInvoiceManual(lineaLlc, { billingRepository })

    expect(billingRepository.recordManualInvoice).toHaveBeenCalledWith({
      clientId: 1, billingEntityId: 3, invoiceType: 'LLC', invoiceNumber: 'INV-2026-042',
      currency: 'USD', netAmount: 450, vatAmount: 50, totalAmount: 500,
    })
  })

  it('omite clientId cuando la línea tiene un cliente mock (no offset-tagged)', async () => {
    const billingRepository = { recordManualInvoice: vi.fn(async () => ({})) }
    const lineaMock = { ...lineaLlc, clienteId: 1 }

    await registrarInvoiceManual(lineaMock, { billingRepository })

    expect(billingRepository.recordManualInvoice.mock.calls[0][0].clientId).toBeUndefined()
  })

  it('no llama al backend para tipos sin equivalente durable (C, A, B)', async () => {
    const billingRepository = { recordManualInvoice: vi.fn() }

    await registrarInvoiceManual({ ...lineaLlc, tipoFactura: 'C' }, { billingRepository })
    await registrarInvoiceManual({ ...lineaLlc, tipoFactura: 'A' }, { billingRepository })

    expect(billingRepository.recordManualInvoice).not.toHaveBeenCalled()
  })

  it('no lanza cuando el backend falla — la loguea y sigue (el número ya está en uso)', async () => {
    const billingRepository = { recordManualInvoice: vi.fn(async () => { throw new Error('boom') }) }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(registrarInvoiceManual(lineaLlc, { billingRepository })).resolves.toBeUndefined()
    expect(spy).toHaveBeenCalled()

    spy.mockRestore()
  })

  it('no hace nada si no se inyecta billingRepository', async () => {
    await expect(registrarInvoiceManual(lineaLlc, {})).resolves.toBeUndefined()
  })
})
