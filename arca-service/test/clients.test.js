import { beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'

import { app, loginAgent, nextValidCuit } from './helpers.js'

let client

beforeAll(async () => {
  client = await loginAgent()
})

describe('GET /clients', () => {
  it('requires auth', async () => {
    const res = await request(app).get('/clients')
    expect(res.status).toBe(401)
  })

  it('lists the seeded clients with nested catalogs and cc emails', async () => {
    const res = await client.get('/clients')
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(12)

    const entelai = res.body.find(item => item.name === 'Entelai')
    expect(entelai.country).toMatchObject({ code: 'AR', name: 'Argentina' })
    expect(entelai.billingEntity).toMatchObject({ name: 'Kyra SRL', default_voucher: 'A' })
    expect(entelai.ccEmails.map(email => email.email)).toContain('contabilidad@entelai.com')
  })
})

describe('GET /clients/:id', () => {
  it('404s with PGRST116 for a missing client', async () => {
    const res = await client.get('/clients/999999')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('PGRST116')
  })
})

describe('POST /clients (save_client)', () => {
  it('rejects an invalid AR CUIT', async () => {
    const res = await client.post('/clients').send({
      client: {
        id: null, name: 'Bad CUIT Client', billingEntityId: 1, countryId: 1, fiscalConditionId: 1,
        fiscalId: '20-00000000-0', primaryEmail: 'bad-cuit@test.com',
      },
      ccEmails: [],
      expectedUpdatedAt: null,
    })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('23514')
    expect(res.body.message).toBe('INVALID_FISCAL_ID')
  })

  it('rejects a fiscal condition that belongs to a different country', async () => {
    const res = await client.post('/clients').send({
      client: {
        // countryId 2 (Colombia) with fiscalConditionId 1 (Argentina's) — mismatched pair
        id: null, name: 'Cross Country Client', billingEntityId: 1, countryId: 2, fiscalConditionId: 1,
        fiscalId: 'NIT-1', primaryEmail: 'cross-country@test.com',
      },
      ccEmails: [],
      expectedUpdatedAt: null,
    })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('23503')
  })

  it('creates a client with cc emails and archives it', async () => {
    const fiscalId = nextValidCuit()
    const created = await client.post('/clients').send({
      client: {
        id: null, name: 'Test Client', billingEntityId: 1, countryId: 1, fiscalConditionId: 1,
        fiscalId, primaryEmail: 'test-client@test.com',
      },
      ccEmails: ['cc1@test.com', 'cc2@test.com'],
      expectedUpdatedAt: null,
    })
    expect(created.status).toBe(201)
    expect(created.body.ccEmails.map(email => email.email).sort()).toEqual(['cc1@test.com', 'cc2@test.com'])

    const archived = await client.patch(`/clients/${created.body.id}/status`).send({
      status: 'archived',
      expectedUpdatedAt: created.body.updated_at,
    })
    expect(archived.status).toBe(200)
    expect(archived.body.status).toBe('archived')
  })
})

describe('catalogs', () => {
  it('lists countries, fiscal conditions and tax categories', async () => {
    const countries = await client.get('/countries')
    expect(countries.body.map(country => country.code).sort()).toEqual(['AR', 'CO', 'CR'])

    const fiscalConditions = await client.get('/fiscal-conditions')
    expect(fiscalConditions.body.length).toBeGreaterThanOrEqual(6)

    const taxCategories = await client.get('/tax-categories')
    expect(taxCategories.body.length).toBeGreaterThanOrEqual(2)
  })

  it('creates a tax category', async () => {
    const res = await client.post('/tax-categories').send({ id: null, name: 'Vitest Category', taxRate: 9.5, active: true })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ name: 'Vitest Category', active: true })
  })
})
