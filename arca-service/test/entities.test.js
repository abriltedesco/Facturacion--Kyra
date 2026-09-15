import { beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'

import { app, loginAgent, nextValidCuit } from './helpers.js'

let client

beforeAll(async () => {
  client = await loginAgent()
})

function entityPayload(overrides = {}) {
  return {
    id: null,
    name: 'Test Entity',
    status: 'active',
    legalType: 'srl',
    countryCode: 'AR',
    fiscalIdType: 'CUIT',
    fiscalId: nextValidCuit(),
    fiscalAddress: 'Calle Falsa 123',
    grossIncomeNumber: '',
    billingEmail: '',
    defaultVoucher: 'A',
    allowsBExempt: false,
    pointOfSale: '0099',
    invoicePrefix: '',
    ...overrides,
  }
}

const oneAccount = [{
  id: null,
  bankName: 'Test Bank',
  accountHolder: 'Test Entity',
  currency: 'ARS',
  accountScope: 'local',
  cbu: '0720000100000000000001',
  alias: 'TEST',
  isPrimary: true,
}]

describe('GET /entities', () => {
  it('requires auth', async () => {
    const res = await request(app).get('/entities')
    expect(res.status).toBe(401)
  })

  it('includes the seeded entities with their bank accounts', async () => {
    // Other test files in this shared-DB suite create their own throwaway
    // entities (see arca-documents.test.js), so don't assert an exact total —
    // just that the 3 seeded rows are present and correctly shaped.
    const res = await client.get('/entities')
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(3)
    const kyra = res.body.find(entity => entity.name === 'Kyra SRL')
    expect(kyra.bankAccounts).toHaveLength(2)
    expect(kyra.arcaDocuments).toEqual([])
  })
})

describe('GET /entities/:id', () => {
  it('404s with PGRST116 for a missing entity', async () => {
    const res = await client.get('/entities/999999')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('PGRST116')
  })
})

describe('POST /entities (save_billing_entity)', () => {
  it('rejects an entity with no bank accounts', async () => {
    const res = await client.post('/entities').send({
      entity: entityPayload(),
      accounts: [],
      expectedUpdatedAt: null,
    })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('23514')
    expect(res.body.message).toBe('AT_LEAST_ONE_BANK_ACCOUNT_REQUIRED')
  })

  it('creates an entity with a bank account', async () => {
    const res = await client.post('/entities').send({
      entity: entityPayload(),
      accounts: oneAccount,
      expectedUpdatedAt: null,
    })
    expect(res.status).toBe(201)
    expect(res.body.bankAccounts).toHaveLength(1)
  })

  it('rejects a duplicate fiscal id', async () => {
    const fiscalId = nextValidCuit()
    await client.post('/entities').send({
      entity: entityPayload({ fiscalId }),
      accounts: oneAccount,
      expectedUpdatedAt: null,
    }).expect(201)

    const res = await client.post('/entities').send({
      entity: entityPayload({ fiscalId }),
      accounts: oneAccount,
      expectedUpdatedAt: null,
    })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('23505')
  })
})

describe('PATCH /entities/:id/status (set_billing_entity_status)', () => {
  it('rejects a stale expectedUpdatedAt and accepts the correct one', async () => {
    const created = await client.post('/entities').send({
      entity: entityPayload(),
      accounts: oneAccount,
      expectedUpdatedAt: null,
    }).expect(201)

    const stale = await client.patch(`/entities/${created.body.id}/status`).send({
      status: 'archived',
      expectedUpdatedAt: '2000-01-01T00:00:00Z',
    })
    expect(stale.status).toBe(409)
    expect(stale.body.error).toBe('40001')
    expect(stale.body.message).toBe('ENTITY_VERSION_CONFLICT')

    const ok = await client.patch(`/entities/${created.body.id}/status`).send({
      status: 'archived',
      expectedUpdatedAt: created.body.updated_at,
    })
    expect(ok.status).toBe(200)
    expect(ok.body.status).toBe('archived')
    expect(ok.body.archived_at).not.toBeNull()
  })
})
