import { describe, expect, it, vi } from 'vitest'
import { emitirLineaReal, esFacturaWsfeElegible } from './emisionService'
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
