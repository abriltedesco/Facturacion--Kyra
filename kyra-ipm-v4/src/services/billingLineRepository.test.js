import { describe, expect, it } from 'vitest'
import { createBillingLineRepository, mapBillingLineRow } from './billingLineRepository'

describe('mapBillingLineRow', () => {
  it('mapea una línea fija sin ajuste IPC pendiente', () => {
    const line = mapBillingLineRow({
      id: 1, client_id: 5, client_service_id: 10, period_month: 8, period_year: 2026,
      voucher_type: 'A', billing_entity_id: 1, currency: 'ARS',
      quantity_hours: null, hourly_rate: null, base_amount: '510000.00', previous_base_amount: '450000.00',
      variation_vs_previous: '60000.00', ipc_adjustment_id: null, tax_rate: '21.00',
      net_amount: '510000.00', tax_amount: '107100.00', gross_amount: '617100.00',
      alerts: [], status: 'revision', invoice_number: null, issued_at: null, due_date: null, sent_at: null,
      notes: null, updated_at: '2026-08-01T10:00:00Z',
      pending_ipc_percentage: null, pending_ipc_status: null,
    })

    expect(line).toMatchObject({
      id: 1, clienteId: 5, servicioId: 10, mes: 'agosto', anio: 2026,
      tipoFactura: 'A', montoBase: 510000, importeNeto: 510000, impuesto: 107100, importeBruto: 617100,
      ajusteIPCPendiente: false, status: 'revision',
    })
  })

  it('marca ajusteIPCPendiente cuando hay un ipc_adjustment sin aprobar y calcula el preview', () => {
    const line = mapBillingLineRow({
      id: 2, client_id: 2, client_service_id: 4, period_month: 8, period_year: 2026,
      voucher_type: 'LLC', billing_entity_id: 3, currency: 'USD',
      quantity_hours: null, hourly_rate: null, base_amount: '450.00', previous_base_amount: '376.00',
      variation_vs_previous: '74.00', ipc_adjustment_id: 7, tax_rate: '12.50',
      net_amount: '450.00', tax_amount: '56.25', gross_amount: '506.25',
      alerts: ['ipc_pendiente'], status: 'revision', invoice_number: null, issued_at: null, due_date: null, sent_at: null,
      notes: null, updated_at: '2026-08-01T10:00:00Z',
      pending_ipc_percentage: '14.20', pending_ipc_status: 'revision',
    })

    expect(line.ajusteIPCPendiente).toBe(true)
    expect(line.porcentajeIPC).toBeCloseTo(14.2)
    expect(line.montoConIPC).toBeCloseTo(513.9, 1)
  })

  it('no marca ajusteIPCPendiente si el ipc_adjustment ya fue aprobado', () => {
    const line = mapBillingLineRow({
      id: 3, client_id: 2, client_service_id: 4, period_month: 9, period_year: 2026,
      voucher_type: 'LLC', billing_entity_id: 3, currency: 'USD',
      quantity_hours: null, hourly_rate: null, base_amount: '513.90', previous_base_amount: '450.00',
      variation_vs_previous: '63.90', ipc_adjustment_id: 7, tax_rate: '12.50',
      net_amount: '513.90', tax_amount: '64.24', gross_amount: '578.14',
      alerts: [], status: 'revision', invoice_number: null, issued_at: null, due_date: null, sent_at: null,
      notes: null, updated_at: '2026-09-01T10:00:00Z',
      pending_ipc_percentage: '14.20', pending_ipc_status: 'aprobada',
    })

    expect(line.ajusteIPCPendiente).toBe(false)
  })
})

describe('createBillingLineRepository', () => {
  it('genera líneas para un período invocando el RPC', async () => {
    const generatedRow = {
      id: 1, client_id: 5, client_service_id: 10, period_month: 8, period_year: 2026,
      voucher_type: 'A', billing_entity_id: 1, currency: 'ARS', quantity_hours: null, hourly_rate: null,
      base_amount: '510000.00', previous_base_amount: null, variation_vs_previous: null, ipc_adjustment_id: null,
      tax_rate: '21.00', net_amount: '510000.00', tax_amount: '107100.00', gross_amount: '617100.00',
      alerts: [], status: 'revision', invoice_number: null, issued_at: null, due_date: null, sent_at: null,
      notes: null, updated_at: '2026-08-01T10:00:00Z', pending_ipc_percentage: null, pending_ipc_status: null,
    }

    const supabaseStub = {
      rpc: async (name, args) => {
        expect(name).toBe('generate_billing_lines')
        expect(args).toEqual({ p_period_month: 8, p_period_year: 2026 })
        return { data: [generatedRow], error: null }
      },
    }

    const repository = createBillingLineRepository(supabaseStub)
    const result = await repository.generate(8, 2026)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 1, clienteId: 5, mes: 'agosto' })
  })

  it('aprueba una línea con el id y la versión esperada', async () => {
    const approvedRow = {
      id: 1, client_id: 5, client_service_id: 10, period_month: 8, period_year: 2026,
      voucher_type: 'A', billing_entity_id: 1, currency: 'ARS', quantity_hours: null, hourly_rate: null,
      base_amount: '510000.00', previous_base_amount: null, variation_vs_previous: null, ipc_adjustment_id: null,
      tax_rate: '21.00', net_amount: '510000.00', tax_amount: '107100.00', gross_amount: '617100.00',
      alerts: [], status: 'aprobada', invoice_number: null, issued_at: null, due_date: null, sent_at: null,
      notes: null, updated_at: '2026-08-02T10:00:00Z', pending_ipc_percentage: null, pending_ipc_status: null,
    }

    const supabaseStub = {
      rpc: async (name, args) => {
        expect(name).toBe('approve_billing_line')
        expect(args).toMatchObject({ p_id: 1, p_expected_updated_at: '2026-08-01T10:00:00Z' })
        return { data: approvedRow, error: null }
      },
    }

    const repository = createBillingLineRepository(supabaseStub)
    const result = await repository.approve({ id: 1, updatedAt: '2026-08-01T10:00:00Z' })

    expect(result).toMatchObject({ id: 1, status: 'aprobada' })
  })
})
