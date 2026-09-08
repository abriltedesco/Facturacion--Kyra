import { describe, expect, it } from 'vitest'
import { createEntityRepository, mapEntityRow } from './entityRepository'

describe('mapEntityRow', () => {
  it('mapea relaciones activas y determina el documento ARCA actual', () => {
    const entity = mapEntityRow({
      id: 1,
      name: 'Kyra SRL',
      status: 'active',
      legal_type: 'srl',
      country_code: 'AR',
      fiscal_id_type: 'CUIT',
      fiscal_id: '30-70901901-1',
      fiscal_address: 'Av. Corrientes 1234, CABA',
      gross_income_number: '123-456789-0',
      billing_email: 'facturacion@kyra.com',
      default_voucher: 'A',
      allows_b_exempt: true,
      point_of_sale: '0001',
      invoice_prefix: null,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-02T10:00:00Z',
      archived_at: null,
      bankAccounts: [
        { id: 10, bank_name: 'Patagonia', account_holder: 'Kyra SRL', currency: 'ARS', account_scope: 'local', cbu: '0720000100000000000001', is_primary: true, archived_at: null },
        { id: 11, bank_name: 'Anterior', account_holder: 'Kyra SRL', currency: 'ARS', account_scope: 'local', cbu: '0720000100000000000002', is_primary: false, archived_at: '2026-09-01T00:00:00Z' },
      ],
      arcaDocuments: [
        { id: 20, original_file_name: 'anterior.pdf', storage_path: '1/anterior.pdf', expiration_date: '2025-09-01', uploaded_at: '2024-09-01T10:00:00Z', superseded_at: '2026-08-01T10:00:00Z', revoked_at: null, uploadedByProfile: { username: 'mai', display_name: 'Mai Brandao' } },
        { id: 21, original_file_name: 'actual.pdf', storage_path: '1/actual.pdf', expiration_date: '2027-09-01', uploaded_at: '2026-08-01T10:00:00Z', superseded_at: null, revoked_at: null, uploadedByProfile: { username: 'mai', display_name: 'Mai Brandao' } },
      ],
    })

    expect(entity).toMatchObject({
      id: 1,
      name: 'Kyra SRL',
      legalType: 'srl',
      fiscalId: '30-70901901-1',
      bankAccounts: [{ id: 10, bankName: 'Patagonia', isPrimary: true }],
      currentArcaDocument: { id: 21, originalFileName: 'actual.pdf', uploadedBy: { displayName: 'Mai Brandao' } },
    })
    expect(entity.arcaDocuments.map(document => document.id)).toEqual([21, 20])
  })
})

describe('createEntityRepository', () => {
  it('crea una URL firmada breve y fuerza el nombre al descargar', async () => {
    const createSignedUrl = async (path, expiresIn, options) => {
      expect(path).toBe('1/certificado.pdf')
      expect(expiresIn).toBe(60)
      expect(options).toEqual({ download: 'constancia-arca.pdf' })
      return { data: { signedUrl: 'https://storage.test/signed' }, error: null }
    }
    const repository = createEntityRepository({
      storage: { from: bucket => {
        expect(bucket).toBe('arca-documents')
        return { createSignedUrl }
      } },
    })

    await expect(repository.createDocumentUrl('1/certificado.pdf', 60, 'constancia-arca.pdf'))
      .resolves.toBe('https://storage.test/signed')
  })
})