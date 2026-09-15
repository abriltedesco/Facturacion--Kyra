// Integration tests for /billing routes, up through the last checkpoint that
// doesn't require real AFIP credentials (AFIP_NOT_CONFIGURED — CUIT/CERT_PATH/
// KEY_PATH are deliberately unset in the test env, see test/setupEnv.js). No test
// in this file reaches the actual WSFE network call. See test/afip.unit.test.js for
// the pure CbteTipo/VAT logic, and test/invoice-emission.test.js for the full
// generateInvoice() happy path against a fake AFIP client.
import { beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'

import { app, loginAgent } from './helpers.js'
import { recordInvoice } from '../src/services/invoices.js'

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
    // The route never injects a fake AFIP client, so it always hits the real,
    // lazily-built getAfip() — which fails here because no CUIT/CERT_PATH/KEY_PATH
    // is set. This is the furthest the HTTP route can go without real credentials.
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

describe('GET /billing/invoices', () => {
  beforeAll(async () => {
    // Seed directly rather than relying on another test file's emission run (file
    // execution order isn't something to depend on) — client 1 (Ayax) and client 4
    // (SCS), a distinct puntoVenta so this can't collide with any other test's rows.
    await recordInvoice({
      clientId: 1, cbteTipo: 1, puntoVenta: 888, voucherNumber: 1, concepto: 2,
      netAmount: 100, vatAmount: 21, totalAmount: 121, cae: 'route-test-cae-1', caeExpirationDate: '2026-01-01',
    })
    await recordInvoice({
      clientId: 4, cbteTipo: 6, puntoVenta: 888, voucherNumber: 2, concepto: 2,
      netAmount: 200, vatAmount: 42, totalAmount: 242, cae: 'route-test-cae-2', caeExpirationDate: '2026-01-01',
    })
  })

  it('requires auth', async () => {
    const res = await request(app).get('/billing/invoices')
    expect(res.status).toBe(401)
  })

  it('lists every invoice when unfiltered', async () => {
    const res = await client.get('/billing/invoices')
    expect(res.status).toBe(200)
    expect(res.body.map(invoice => invoice.cae)).toEqual(expect.arrayContaining(['route-test-cae-1', 'route-test-cae-2']))
  })

  it('filters by clientId', async () => {
    const res = await client.get('/billing/invoices?clientId=1')
    expect(res.status).toBe(200)
    expect(res.body.every(invoice => invoice.client_id === 1)).toBe(true)
    expect(res.body.map(invoice => invoice.cae)).toContain('route-test-cae-1')
    expect(res.body.map(invoice => invoice.cae)).not.toContain('route-test-cae-2')
  })
})

describe('POST /billing/send-email', () => {
  it('requires auth', async () => {
    const res = await request(app).post('/billing/send-email').send({ to: 'a@b.com', subject: 'x', text: 'x' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('AUTH_REQUIRED')
  })

  it('rejects a missing recipient before ever touching SMTP config', async () => {
    const res = await client.post('/billing/send-email').send({ subject: 'x', text: 'x' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('INVALID_RECIPIENT')
  })

  it('gets a well-formed request all the way to EMAIL_NOT_CONFIGURED', async () => {
    // The route never injects a fake transporter, so it always hits the real,
    // lazily-built getTransporter() — which fails here because no SMTP_HOST/
    // SMTP_USER/SMTP_PASS/SMTP_FROM is set (see test/setupEnv.js). This is the
    // furthest the HTTP route can go without real SMTP credentials.
    const res = await client.post('/billing/send-email').send({ to: 'client@example.com', subject: 'Factura', text: 'Hola' })
    expect(res.status).toBe(500)
    expect(res.body.error).toBe('EMAIL_NOT_CONFIGURED')
  })
})
