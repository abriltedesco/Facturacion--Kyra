import { beforeAll, describe, expect, it } from 'vitest'

import { loginAgent, nextValidCuit } from './helpers.js'

let client
let entityId
let llcEntityId

beforeAll(async () => {
  client = await loginAgent()

  const srl = await client.post('/entities').send({
    entity: {
      id: null, name: 'ARCA Test Entity', status: 'active', legalType: 'srl', countryCode: 'AR',
      fiscalIdType: 'CUIT', fiscalId: nextValidCuit(), fiscalAddress: 'Calle Falsa 123',
      defaultVoucher: 'A', allowsBExempt: false, pointOfSale: '0091', invoicePrefix: '',
    },
    accounts: [{
      id: null, bankName: 'Bank', accountHolder: 'Holder', currency: 'ARS', accountScope: 'local',
      cbu: '0720000100000000000002', isPrimary: true,
    }],
    expectedUpdatedAt: null,
  })
  entityId = srl.body.id

  const llc = await client.post('/entities').send({
    entity: {
      id: null, name: 'ARCA Test LLC', status: 'active', legalType: 'llc', countryCode: 'US',
      fiscalIdType: 'EIN', fiscalId: '12-3456789', fiscalAddress: '1 Main St',
      defaultVoucher: 'LLC', allowsBExempt: false, invoicePrefix: 'TST',
    },
    accounts: [{
      id: null, bankName: 'Bank', accountHolder: 'Holder', currency: 'USD', accountScope: 'international',
      accountNumber: '123456789', routingNumber: '021000021', isPrimary: true,
    }],
    expectedUpdatedAt: null,
  })
  llcEntityId = llc.body.id
})

describe('POST /entities/:id/arca-document', () => {
  it('rejects a file without a valid PDF signature', async () => {
    const res = await client
      .post(`/entities/${entityId}/arca-document`)
      .field('expirationDate', '2027-01-01')
      .attach('file', Buffer.from('not a real pdf'), { filename: 'fake.pdf', contentType: 'application/pdf' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('INVALID_PDF_SIGNATURE')
  })

  it('rejects ARCA documents for an llc entity', async () => {
    const res = await client
      .post(`/entities/${llcEntityId}/arca-document`)
      .field('expirationDate', '2027-01-01')
      .attach('file', Buffer.from('%PDF-1.4\n%test\n%%EOF'), { filename: 'a.pdf', contentType: 'application/pdf' })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('ARCA_NOT_APPLICABLE')
  })

  it('accepts a real PDF, and a re-upload supersedes the previous one', async () => {
    const pdf = Buffer.from('%PDF-1.4\n%test\n%%EOF')

    const first = await client
      .post(`/entities/${entityId}/arca-document`)
      .field('expirationDate', '2027-01-01')
      .attach('file', pdf, { filename: 'a.pdf', contentType: 'application/pdf' })
    expect(first.status).toBe(201)
    expect(first.body.document.superseded_at).toBeNull()

    const second = await client
      .post(`/entities/${entityId}/arca-document`)
      .field('expirationDate', '2028-01-01')
      .attach('file', pdf, { filename: 'b.pdf', contentType: 'application/pdf' })
    expect(second.status).toBe(201)

    const entity = await client.get(`/entities/${entityId}`)
    expect(entity.body.arcaDocuments).toHaveLength(2)
    const supersededDoc = entity.body.arcaDocuments.find(doc => doc.id === first.body.document.id)
    expect(supersededDoc.superseded_at).not.toBeNull()

    // link + download round trip
    const link = await client.get(`/entities/${entityId}/arca-document/${second.body.document.id}/link`)
    expect(link.status).toBe(200)
    expect(link.body.url).toMatch(/^\/files\//)
    const download = await client.get(link.body.url)
    expect(download.status).toBe(200)
    expect(download.headers['content-type']).toBe('application/pdf')

    // revoke
    const revoke = await client.post(`/entities/${entityId}/arca-document/${second.body.document.id}/revoke`)
    expect(revoke.status).toBe(200)
    const revokedDoc = revoke.body.arcaDocuments.find(doc => doc.id === second.body.document.id)
    expect(revokedDoc.revoked_at).not.toBeNull()

    // double revoke -> 404
    const doubleRevoke = await client.post(`/entities/${entityId}/arca-document/${second.body.document.id}/revoke`)
    expect(doubleRevoke.status).toBe(404)
    expect(doubleRevoke.body.message).toBe('CURRENT_DOCUMENT_NOT_FOUND')
  })
})
