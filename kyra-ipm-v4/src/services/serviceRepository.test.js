import { describe, expect, it } from 'vitest'
import { createServiceRepository, mapCatalogRow, mapClientServiceRow } from './serviceRepository'

describe('mapCatalogRow', () => {
  it('mapea un servicio de catálogo con su conteo de clientes activos', () => {
    const catalog = mapCatalogRow({
      id: 1,
      name: 'Social Media',
      type: 'fixed',
      currency: 'ARS',
      base_price: '85000.00',
      status: 'active',
      active_clients_count: '6',
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-02T10:00:00Z',
    })

    expect(catalog).toMatchObject({
      id: 1,
      name: 'Social Media',
      type: 'fixed',
      basePrice: 85000,
      activeClientsCount: 6,
    })
  })
})

describe('mapClientServiceRow', () => {
  it('mapea un servicio de cliente con su historial de precios', () => {
    const service = mapClientServiceRow({
      id: 10,
      client_id: 1,
      catalog_id: 1,
      name: 'Diseño',
      description: '',
      type: 'hourly',
      currency: 'ARS',
      base_amount: null,
      hourly_rate: '20000.00',
      periodicity: 'monthly',
      status: 'active',
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-02T10:00:00Z',
      priceHistory: [
        { id: 1, client_service_id: 10, effective_date: '2026-09-01', previous_value: null, new_value: '20000.00', reason: 'Alta del servicio', created_at: '2026-09-01T10:00:00Z' },
      ],
    })

    expect(service).toMatchObject({
      id: 10,
      clientId: 1,
      hourlyRate: 20000,
      baseAmount: null,
      priceHistory: [{ newValue: 20000, previousValue: null }],
    })
  })
})

describe('createServiceRepository', () => {
  it('guarda un servicio de cliente invocando el RPC y recarga el registro completo', async () => {
    const savedRow = {
      id: 10,
      client_id: 1,
      catalog_id: 1,
      name: 'Diseño',
      description: '',
      type: 'hourly',
      currency: 'ARS',
      base_amount: null,
      hourly_rate: '20000.00',
      periodicity: 'monthly',
      status: 'active',
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-02T10:00:00Z',
      priceHistory: [],
    }

    const supabaseStub = {
      rpc: async (name, args) => {
        expect(name).toBe('save_client_service')
        expect(args.p_service).toMatchObject({ clientId: 1, name: 'Diseño', hourlyRate: 20000, baseAmount: null })
        return { data: { id: 10 }, error: null }
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: savedRow, error: null }),
          }),
        }),
      }),
    }

    const repository = createServiceRepository(supabaseStub)
    const result = await repository.saveClientService({
      clientId: 1,
      name: 'Diseño',
      type: 'hourly',
      currency: 'ARS',
      hourlyRate: 20000,
      periodicity: 'monthly',
    })

    expect(result).toMatchObject({ id: 10, name: 'Diseño', hourlyRate: 20000 })
  })
})
