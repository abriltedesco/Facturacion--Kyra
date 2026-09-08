import { describe, expect, it } from 'vitest'
import {
  getAllowedVoucherTypes,
  isValidCuit,
  isValidEin,
  validateBankAccount,
  validateEntityDraft,
} from './entityRules'

describe('getAllowedVoucherTypes', () => {
  it('excluye Factura B exenta de una SRL sin habilitacion', () => {
    expect(getAllowedVoucherTypes({ legalType: 'srl', allowsBExempt: false })).toEqual(['A'])
  })

  it('incluye Factura B exenta cuando la SRL tiene la habilitacion', () => {
    expect(getAllowedVoucherTypes({ legalType: 'srl', allowsBExempt: true })).toEqual(['A', 'B_EXEMPT'])
  })

  it('permite solo Factura C para Monotributo', () => {
    expect(getAllowedVoucherTypes({ legalType: 'monotributista' })).toEqual(['C'])
  })

  it('permite solo Invoice LLC para una LLC', () => {
    expect(getAllowedVoucherTypes({ legalType: 'llc' })).toEqual(['LLC'])
  })
})

describe('isValidCuit', () => {
  it('valida el digito verificador y acepta separadores', () => {
    expect(isValidCuit('30-70901901-1')).toBe(true)
    expect(isValidCuit('30-70901901-2')).toBe(false)
  })
})

describe('isValidEin', () => {
  it('acepta dos mas siete digitos y rechaza identificaciones mas largas', () => {
    expect(isValidEin('12-3456789')).toBe(true)
    expect(isValidEin('90-0388092-8')).toBe(false)
  })
})

describe('validateBankAccount', () => {
  it('exige identificadores distintos para cuentas locales e internacionales', () => {
    const common = { bankName: 'Banco', accountHolder: 'Kyra SRL', currency: 'ARS', isPrimary: true }

    expect(validateBankAccount({ ...common, accountScope: 'local', cbu: '0720000100000000000001' })).toEqual({})
    expect(validateBankAccount({ ...common, accountScope: 'local', cbu: '123' })).toHaveProperty('cbu')
    expect(validateBankAccount({
      ...common,
      currency: 'USD',
      accountScope: 'international',
      accountNumber: '123456789',
      routingNumber: '021000021',
    })).toEqual({})
  })
})

describe('validateEntityDraft', () => {
  it('valida en conjunto los datos fiscales, comprobante, numeracion y cuentas', () => {
    const validEntity = {
      name: 'Kyra SRL',
      legalType: 'srl',
      fiscalId: '30-70901901-1',
      fiscalAddress: 'Av. Corrientes 1234, CABA',
      billingEmail: 'facturacion@kyra.com',
      defaultVoucher: 'A',
      allowsBExempt: false,
      pointOfSale: '0001',
      bankAccounts: [{
        bankName: 'Banco Patagonia',
        accountHolder: 'Kyra SRL',
        currency: 'ARS',
        accountScope: 'local',
        cbu: '0720000100000000000001',
        isPrimary: true,
      }],
    }

    expect(validateEntityDraft(validEntity)).toEqual({})
    expect(validateEntityDraft({ ...validEntity, defaultVoucher: 'B_EXEMPT', pointOfSale: '1' })).toMatchObject({
      defaultVoucher: expect.any(String),
      pointOfSale: expect.any(String),
    })
  })
})