import { describe, expect, it } from 'vitest'
import { createClientRepository, mapClientRow } from './clientRepository'

describe('mapClientRow', () => {
  it('mapea catálogos anidados y los emails en copia', () => {
    const client = mapClientRow({
      id: 1,
      name: 'Ayax',
      status: 'active',
      billing_entity_id: 1,
      country_id: 1,
      fiscal_condition_id: 1,
      fiscal_id: '30-70901901-1',
      tax_category_id: null,
      primary_email: 'contacto@ayax.com.ar',
      ipc_adjustable: false,
      ipc_periodicity: null,
      drive_folder_ref: null,
      internal_notes: null,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-02T10:00:00Z',
      archived_at: null,
      ccEmails: [
        { id: 5, email: 'contabilidad@ayax.com.ar' },
      ],
      country: { id: 1, code: 'AR', name: 'Argentina', active: true },
      fiscalCondition: { id: 1, country_id: 1, name: 'Responsable Inscripto', active: true },
      taxCategory: null,
      billingEntity: { id: 1, name: 'Kyra SRL', default_voucher: 'A' },
    })

    expect(client).toMatchObject({
      id: 1,
      name: 'Ayax',
      fiscalId: '30-70901901-1',
      ccEmails: ['contabilidad@ayax.com.ar'],
      country: { code: 'AR', name: 'Argentina' },
      fiscalCondition: { name: 'Responsable Inscripto' },
      taxCategory: null,
      billingEntity: { name: 'Kyra SRL', defaultVoucher: 'A' },
    })
  })
})

describe('createClientRepository', () => {
  it('guarda un cliente invocando el RPC y recarga el registro completo', async () => {
    const savedRow = {
      id: 1,
      name: 'Ayax',
      status: 'active',
      billing_entity_id: 1,
      country_id: 1,
      fiscal_condition_id: 1,
      fiscal_id: '30-70901901-1',
      tax_category_id: null,
      primary_email: 'contacto@ayax.com.ar',
      ipc_adjustable: false,
      ipc_periodicity: null,
      drive_folder_ref: null,
      internal_notes: null,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-02T10:00:00Z',
      archived_at: null,
      ccEmails: [],
      country: null,
      fiscalCondition: null,
      taxCategory: null,
      billingEntity: null,
    }

    const supabaseStub = {
      rpc: async (name, args) => {
        expect(name).toBe('save_client')
        expect(args.p_client).toMatchObject({ name: 'Ayax', billingEntityId: 1 })
        expect(args.p_cc_emails).toEqual([])
        return { data: { id: 1 }, error: null }
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: savedRow, error: null }),
          }),
        }),
      }),
    }

    const repository = createClientRepository(supabaseStub)
    const result = await repository.save({
      name: 'Ayax',
      billingEntityId: 1,
      countryId: 1,
      fiscalConditionId: 1,
      fiscalId: '30-70901901-1',
      primaryEmail: 'contacto@ayax.com.ar',
      ccEmails: [],
    })

    expect(result).toMatchObject({ id: 1, name: 'Ayax' })
  })
})
