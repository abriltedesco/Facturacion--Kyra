// Integration tests for POST /billing/invoice, up through the last checkpoint that
// doesn't require real AFIP credentials (AFIP_NOT_CONFIGURED). No test in this file
// reaches the actual WSFE network call — that needs a real cert/key/CUIT, which this
// environment intentionally does not have. See test/afip.unit.test.js for coverage
// of the CbteTipo/VAT logic that runs just before that call.
import { beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'

import { app, loginAgent } from './helpers.js'

let client

beforeAll(async () => {
  client = await loginAgent()
})

describe('POST /billing/invoice', () => {
  it('requires auth', async () => {
    const res = await request(app).post('/billing/invoice').send({ clientId: 1, totalAmount: 121 })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('AUTH_REQUIRED')
  })

  it('rejects a missing/invalid clientId', async () => {
    const res = await client.post('/billing/invoice').send({ totalAmount: 121 })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('INVALID_CLIENT_ID')
  })

  it('rejects a missing/invalid totalAmount', async () => {
    const res = await client.post('/billing/invoice').send({ clientId: 1, totalAmount: 0 })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('INVALID_TOTAL_AMOUNT')
  })

  it('404s for a nonexistent client', async () => {
    const res = await client.post('/billing/invoice').send({ clientId: 999999, totalAmount: 121 })
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('CLIENT_NOT_FOUND')
  })

  it('rejects a non-domestic client (Colombia) before ever picking a CbteTipo', async () => {
    // client 2 "Edding COL" is seeded with country CO.
    const res = await client.post('/billing/invoice').send({ clientId: 2, totalAmount: 121 })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('INTERNATIONAL_BILLING_NOT_SUPPORTED')
  })

  it('gets a domestic Responsable Inscripto client all the way to AFIP_NOT_CONFIGURED', async () => {
    // client 1 "Ayax" is seeded as AR / Responsable Inscripto (-> would be Factura A).
    // No CUIT/CERT_PATH/KEY_PATH/WSFE_PUNTO_VENTA are set in the test env, so this is
    // the furthest this suite can exercise the route without real AFIP credentials.
    const res = await client.post('/billing/invoice').send({ clientId: 1, totalAmount: 121 })
    expect(res.status).toBe(500)
    expect(res.body.error).toBe('AFIP_NOT_CONFIGURED')
  })

  it('gets a domestic non-Responsable-Inscripto client to the same checkpoint', async () => {
    // client 4 "SCS" is seeded as AR / Monotributista (-> would be Factura B).
    const res = await client.post('/billing/invoice').send({ clientId: 4, totalAmount: 121 })
    expect(res.status).toBe(500)
    expect(res.body.error).toBe('AFIP_NOT_CONFIGURED')
  })
})
