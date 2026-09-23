import { describe, expect, it } from 'vitest'
import { createIpcAdjustmentRepository, mapIpcAdjustmentRow } from './ipcAdjustmentRepository'

describe('mapIpcAdjustmentRow', () => {
  it('mapea un ajuste con su contexto de cliente/servicio/entidad', () => {
    const adjustment = mapIpcAdjustmentRow({
      id: 1,
      client_service_id: 10,
      period_month: 8,
      period_year: 2026,
      adjustment_type: 'ipc',
      ipc_percentage: '14.20',
      amount_before: '70000.00',
      amount_after: '79940.00',
      impact_level: 'alto',
      significant_increase: true,
      reason: '',
      status: 'revision',
      approved_at: null,
      created_at: '2026-08-01T10:00:00Z',
      updated_at: '2026-08-01T10:00:00Z',
      service_name: 'Social Media',
      service_type: 'fixed',
      service_currency: 'ARS',
      service_periodicity: 'monthly',
      client_id: 5,
      client_name: 'Entelai',
      billing_entity_id: 1,
      billing_entity_name: 'Kyra SRL',
      default_voucher: 'A',
      last_increase_date: '2026-04-01',
    })

    expect(adjustment).toMatchObject({
      id: 1,
      clientServiceId: 10,
      ipcPercentage: 14.2,
      amountBefore: 70000,
      amountAfter: 79940,
      impactLevel: 'alto',
      clientName: 'Entelai',
      billingEntityName: 'Kyra SRL',
    })
  })
})

describe('createIpcAdjustmentRepository', () => {
  it('genera ajustes para un período invocando el RPC', async () => {
    const generatedRow = {
      id: 1, client_service_id: 10, period_month: 8, period_year: 2026,
      adjustment_type: 'ipc', ipc_percentage: '14.20', amount_before: '70000.00', amount_after: '79940.00',
      impact_level: 'alto', significant_increase: true, reason: null, status: 'revision', approved_at: null,
      created_at: '2026-08-01T10:00:00Z', updated_at: '2026-08-01T10:00:00Z',
      service_name: 'Social Media', service_type: 'fixed', service_currency: 'ARS', service_periodicity: 'monthly',
      client_id: 5, client_name: 'Entelai', billing_entity_id: 1, billing_entity_name: 'Kyra SRL',
      default_voucher: 'A', last_increase_date: null,
    }

    const supabaseStub = {
      rpc: async (name, args) => {
        expect(name).toBe('generate_ipc_adjustments')
        expect(args).toMatchObject({ p_period_month: 8, p_period_year: 2026, p_ipc_percentage: 14.2 })
        return { data: [generatedRow], error: null }
      },
    }

    const repository = createIpcAdjustmentRepository(supabaseStub)
    const result = await repository.generate({ periodMonth: 8, periodYear: 2026, ipcPercentage: 14.2 })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 1, clientName: 'Entelai', ipcPercentage: 14.2 })
  })

  it('aprueba un ajuste invocando el RPC con el id y la versión esperada', async () => {
    const approvedRow = {
      id: 1, client_service_id: 10, period_month: 8, period_year: 2026,
      adjustment_type: 'ipc', ipc_percentage: '14.20', amount_before: '70000.00', amount_after: '79940.00',
      impact_level: 'alto', significant_increase: false, reason: 'Ajuste IPC', status: 'aprobada',
      approved_at: '2026-08-02T10:00:00Z', created_at: '2026-08-01T10:00:00Z', updated_at: '2026-08-02T10:00:00Z',
      service_name: 'Social Media', service_type: 'fixed', service_currency: 'ARS', service_periodicity: 'monthly',
      client_id: 5, client_name: 'Entelai', billing_entity_id: 1, billing_entity_name: 'Kyra SRL',
      default_voucher: 'A', last_increase_date: '2026-08-02',
    }

    const supabaseStub = {
      rpc: async (name, args) => {
        expect(name).toBe('approve_ipc_adjustment')
        expect(args).toMatchObject({ p_id: 1, p_expected_updated_at: '2026-08-01T10:00:00Z' })
        return { data: approvedRow, error: null }
      },
    }

    const repository = createIpcAdjustmentRepository(supabaseStub)
    const result = await repository.approve({ id: 1, updatedAt: '2026-08-01T10:00:00Z' })

    expect(result).toMatchObject({ id: 1, status: 'aprobada' })
  })
})
