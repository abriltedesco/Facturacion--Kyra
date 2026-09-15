// Integration + persistence tests for /billing/manual-invoice(s) — the record-only
// durability layer for LLC and internal S/F invoices (see
// db/migrations/20260915120000_manual_invoices.sql and src/services/manualInvoices.js
// for why these have a different uniqueness scope than Factura A/B's `invoices` table).
import { beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'

import { app, loginAgent } from './helpers.js'
import { recordManualInvoice } from '../src/services/manualInvoices.js'

let client

beforeAll(async () => {
  client = await loginAgent()
})

describe('POST /billing/manual-invoice', () => {
  it('requires auth', async () => {
    const res = await request(app).post('/billing/manual-invoice')
      .send({ billingEntityId: 3, invoiceType: 'LLC', invoiceNumber: 'INV-2026-001', totalAmount: 100 })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('AUTH_REQUIRED')
  })

  it('rejects an invalid invoiceType (e.g. Factura C, which stays out of this table on purpose)', async () => {
    const res = await client.post('/billing/manual-invoice')
      .send({ billingEntityId: 1, invoiceType: 'C', invoiceNumber: '0001-00000001', totalAmount: 100 })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('INVALID_INVOICE_TYPE')
  })

  it('rejects a missing/invalid billingEntityId', async () => {
    const res = await client.post('/billing/manual-invoice')
      .send({ invoiceType: 'LLC', invoiceNumber: 'INV-2026-002', totalAmount: 100 })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('INVALID_BILLING_ENTITY_ID')
  })

  it('rejects a missing invoiceNumber', async () => {
    const res = await client.post('/billing/manual-invoice')
      .send({ billingEntityId: 3, invoiceType: 'LLC', totalAmount: 100 })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('INVALID_INVOICE_NUMBER')
  })

  it('rejects a missing/invalid totalAmount', async () => {
    const res = await client.post('/billing/manual-invoice')
      .send({ billingEntityId: 3, invoiceType: 'LLC', invoiceNumber: 'INV-2026-003' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('INVALID_TOTAL_AMOUNT')
  })

  it('records an LLC invoice (Mercury LLC, entity 3) without a clientId', async () => {
    const res = await client.post('/billing/manual-invoice')
      .send({ billingEntityId: 3, invoiceType: 'LLC', invoiceNumber: 'INV-2026-ROUTE-1', currency: 'USD', totalAmount: 500 })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ invoice_type: 'LLC', invoice_number: 'INV-2026-ROUTE-1', currency: 'USD' })
    expect(Number(res.body.total_amount)).toBe(500)
  })

  it('records an S/F invoice tied to a real client', async () => {
    const res = await client.post('/billing/manual-invoice')
      .send({ clientId: 1, billingEntityId: 1, invoiceType: 'S', invoiceNumber: 'S/F-ROUTE-1', totalAmount: 1 })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ client_id: 1, invoice_type: 'S', invoice_number: 'S/F-ROUTE-1' })
  })

  it('rejects a duplicate LLC number for the same entity as a unique_violation', async () => {
    await recordManualInvoice({ billingEntityId: 3, invoiceType: 'LLC', invoiceNumber: 'INV-2026-DUP', totalAmount: 100 })
    await expect(recordManualInvoice({ billingEntityId: 3, invoiceType: 'LLC', invoiceNumber: 'INV-2026-DUP', totalAmount: 100 }))
      .rejects.toMatchObject({ code: '23505' })
  })

  it('allows the same LLC number across two different entities (numbering is per-entity)', async () => {
    const first = await recordManualInvoice({ billingEntityId: 1, invoiceType: 'LLC', invoiceNumber: 'INV-2026-SHARED', totalAmount: 100 })
    const second = await recordManualInvoice({ billingEntityId: 2, invoiceType: 'LLC', invoiceNumber: 'INV-2026-SHARED', totalAmount: 100 })
    expect(first.id).not.toBe(second.id)
  })

  it('rejects a duplicate S/F number even across two different entities (one global counter)', async () => {
    await recordManualInvoice({ billingEntityId: 1, invoiceType: 'S', invoiceNumber: 'S/F-DUP', totalAmount: 1 })
    await expect(recordManualInvoice({ billingEntityId: 2, invoiceType: 'F', invoiceNumber: 'S/F-DUP', totalAmount: 1 }))
      .rejects.toMatchObject({ code: '23505' })
  })
})

describe('GET /billing/manual-invoices', () => {
  beforeAll(async () => {
    await recordManualInvoice({ clientId: 1, billingEntityId: 3, invoiceType: 'LLC', invoiceNumber: 'INV-2026-LIST-1', totalAmount: 100 })
    await recordManualInvoice({ clientId: 4, billingEntityId: 1, invoiceType: 'S', invoiceNumber: 'S/F-LIST-1', totalAmount: 1 })
  })

  it('requires auth', async () => {
    const res = await request(app).get('/billing/manual-invoices')
    expect(res.status).toBe(401)
  })

  it('lists every manual invoice when unfiltered', async () => {
    const res = await client.get('/billing/manual-invoices')
    expect(res.status).toBe(200)
    expect(res.body.map(row => row.invoice_number)).toEqual(
      expect.arrayContaining(['INV-2026-LIST-1', 'S/F-LIST-1']),
    )
  })

  it('filters by clientId', async () => {
    const res = await client.get('/billing/manual-invoices?clientId=1')
    expect(res.status).toBe(200)
    expect(res.body.every(row => row.client_id === 1)).toBe(true)
    expect(res.body.map(row => row.invoice_number)).toContain('INV-2026-LIST-1')
    expect(res.body.map(row => row.invoice_number)).not.toContain('S/F-LIST-1')
  })
})
