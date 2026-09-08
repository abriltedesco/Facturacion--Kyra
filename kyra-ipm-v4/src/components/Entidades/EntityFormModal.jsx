import { useEffect, useState } from 'react'
import Modal from '../Modal'
import { getAllowedVoucherTypes, validateEntityDraft } from '../../domain/entityRules'
import BankAccountsFields, { emptyBankAccount } from './BankAccountsFields'

const LEGAL_TYPES = [
  { value: 'srl', label: 'SRL' },
  { value: 'monotributista', label: 'Monotributo personal' },
  { value: 'llc', label: 'LLC' },
]

const VOUCHER_LABELS = {
  A: 'Factura A',
  B_EXEMPT: 'Factura B - Exento en IVA',
  C: 'Factura C',
  LLC: 'Invoice LLC',
}

function createDraft(entity) {
  if (entity) {
    return {
      ...entity,
      bankAccounts: entity.bankAccounts.length ? entity.bankAccounts.map(account => ({ ...account })) : [emptyBankAccount(entity.legalType)],
    }
  }
  return {
    name: '',
    status: 'active',
    legalType: 'srl',
    fiscalId: '',
    fiscalAddress: '',
    grossIncomeNumber: '',
    billingEmail: '',
    defaultVoucher: 'A',
    allowsBExempt: false,
    pointOfSale: '0001',
    invoicePrefix: '',
    bankAccounts: [emptyBankAccount('srl')],
  }
}

export default function EntityFormModal({ isOpen, entity, onClose, onSave, onSaved, triggerRef }) {
  const [draft, setDraft] = useState(() => createDraft(entity))
  const [errors, setErrors] = useState({})
  const [requestError, setRequestError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setDraft(createDraft(entity))
    setErrors({})
    setRequestError('')
    setSaving(false)
  }, [isOpen, entity])

  function setField(field, value) {
    setDraft(current => ({ ...current, [field]: value }))
    setErrors(current => ({ ...current, [field]: undefined }))
  }

  function changeLegalType(legalType) {
    setDraft(current => ({
      ...current,
      legalType,
      fiscalId: '',
      defaultVoucher: legalType === 'monotributista' ? 'C' : legalType === 'llc' ? 'LLC' : 'A',
      allowsBExempt: false,
      pointOfSale: legalType === 'llc' ? '' : current.pointOfSale || '0001',
      invoicePrefix: legalType === 'llc' ? current.invoicePrefix || 'INV' : '',
      bankAccounts: current.bankAccounts.map(account => ({
        ...account,
        currency: legalType === 'llc' && account.currency === 'ARS' ? 'USD' : account.currency,
        accountScope: legalType === 'llc' ? 'international' : account.accountScope,
      })),
    }))
    setErrors({})
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationErrors = validateEntityDraft(draft)
    setErrors(validationErrors)
    setRequestError('')
    if (Object.keys(validationErrors).length > 0) return

    setSaving(true)
    try {
      const savedEntity = await onSave(draft)
      onSaved(savedEntity)
    } catch (error) {
      setRequestError(error.message || 'No se pudo guardar la entidad.')
    } finally {
      setSaving(false)
    }
  }

  const allowedVouchers = getAllowedVoucherTypes(draft)

  return (
    <Modal
      isOpen={isOpen}
      onClose={saving ? () => {} : onClose}
      title={entity ? 'EDITAR ENTIDAD' : 'NUEVA ENTIDAD'}
      triggerRef={triggerRef}
      className="modal-box-wide"
      footer={(
        <div className="modal-footer-inner">
          <div className="modal-validation" role="status">
            {requestError || (Object.keys(errors).length > 0 ? 'Revisá los campos indicados.' : '')}
          </div>
          <div className="entity-form-actions">
            <button type="button" className="btn-arca-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" form="entity-form" className="btn-guardar ready" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar entidad'}
            </button>
          </div>
        </div>
      )}
    >
      <form id="entity-form" className="entity-form" onSubmit={handleSubmit} noValidate>
        <section className="entity-form-section">
          <div className="entity-form-section-heading">
            <span>01</span><h3>Identidad</h3>
          </div>
          <div className="entity-form-grid entity-form-grid-2">
            <div className="form-group">
              <label htmlFor="entity-name">Nombre <span className="label-req">*</span></label>
              <input id="entity-name" className={`form-input${errors.name ? ' input-error' : ''}`}
                value={draft.name} onChange={event => setField('name', event.target.value)} />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="entity-type">Tipo <span className="label-req">*</span></label>
              <select id="entity-type" className="form-select" value={draft.legalType}
                onChange={event => changeLegalType(event.target.value)}>
                {LEGAL_TYPES.map(type => <option value={type.value} key={type.value}>{type.label}</option>)}
              </select>
            </div>
            {entity && (
              <div className="form-group">
                <label htmlFor="entity-status">Estado</label>
                <select id="entity-status" className="form-select" value={draft.status}
                  onChange={event => setField('status', event.target.value)}>
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                </select>
              </div>
            )}
          </div>
        </section>

        <section className="entity-form-section">
          <div className="entity-form-section-heading">
            <span>02</span><h3>Datos fiscales</h3>
          </div>
          <div className="entity-form-grid entity-form-grid-2">
            <div className="form-group">
              <label htmlFor="entity-fiscal-id">{draft.legalType === 'llc' ? 'EIN' : 'CUIT'} <span className="label-req">*</span></label>
              <input id="entity-fiscal-id" className={`form-input${errors.fiscalId ? ' input-error' : ''}`}
                value={draft.fiscalId} onChange={event => setField('fiscalId', event.target.value)}
                placeholder={draft.legalType === 'llc' ? '12-3456789' : '30-70901901-1'} />
              {errors.fiscalId && <span className="field-error">{errors.fiscalId}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="entity-email">Email de facturación</label>
              <input id="entity-email" type="email" className={`form-input${errors.billingEmail ? ' input-error' : ''}`}
                value={draft.billingEmail} onChange={event => setField('billingEmail', event.target.value)} />
              {errors.billingEmail && <span className="field-error">{errors.billingEmail}</span>}
            </div>
            <div className="form-group entity-form-span-2">
              <label htmlFor="entity-address">Domicilio fiscal <span className="label-req">*</span></label>
              <input id="entity-address" className={`form-input${errors.fiscalAddress ? ' input-error' : ''}`}
                value={draft.fiscalAddress} onChange={event => setField('fiscalAddress', event.target.value)} />
              {errors.fiscalAddress && <span className="field-error">{errors.fiscalAddress}</span>}
            </div>
            {draft.legalType !== 'llc' && (
              <div className="form-group">
                <label htmlFor="entity-iibb">Ingresos Brutos</label>
                <input id="entity-iibb" className="form-input" value={draft.grossIncomeNumber}
                  onChange={event => setField('grossIncomeNumber', event.target.value)} />
              </div>
            )}
          </div>
        </section>

        <section className="entity-form-section">
          <div className="entity-form-section-heading">
            <span>03</span><h3>Facturación</h3>
          </div>
          <div className="entity-form-grid entity-form-grid-2">
            <div className="form-group">
              <label htmlFor="entity-voucher">Comprobante por defecto <span className="label-req">*</span></label>
              <select id="entity-voucher" className={`form-select${errors.defaultVoucher ? ' input-error' : ''}`}
                value={draft.defaultVoucher} onChange={event => setField('defaultVoucher', event.target.value)}>
                {allowedVouchers.map(voucher => <option value={voucher} key={voucher}>{VOUCHER_LABELS[voucher]}</option>)}
              </select>
              {errors.defaultVoucher && <span className="field-error">{errors.defaultVoucher}</span>}
            </div>
            {draft.legalType === 'llc' ? (
              <div className="form-group">
                <label htmlFor="entity-prefix">Prefijo de invoice <span className="label-req">*</span></label>
                <input id="entity-prefix" className={`form-input${errors.invoicePrefix ? ' input-error' : ''}`}
                  value={draft.invoicePrefix} onChange={event => setField('invoicePrefix', event.target.value.toUpperCase())} />
                {errors.invoicePrefix && <span className="field-error">{errors.invoicePrefix}</span>}
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="entity-pos">Punto de venta <span className="label-req">*</span></label>
                <input id="entity-pos" inputMode="numeric" maxLength={4}
                  className={`form-input${errors.pointOfSale ? ' input-error' : ''}`}
                  value={draft.pointOfSale} onChange={event => setField('pointOfSale', event.target.value)} />
                {errors.pointOfSale && <span className="field-error">{errors.pointOfSale}</span>}
              </div>
            )}
          </div>
          {draft.legalType === 'srl' && (
            <label className="entity-check entity-b-exempt">
              <input type="checkbox" checked={draft.allowsBExempt} onChange={event => {
                const enabled = event.target.checked
                setDraft(current => ({
                  ...current,
                  allowsBExempt: enabled,
                  defaultVoucher: !enabled && current.defaultVoucher === 'B_EXEMPT' ? 'A' : current.defaultVoucher,
                }))
              }} />
              Habilitar Factura B - Exento en IVA
            </label>
          )}
        </section>

        <section className="entity-form-section">
          <div className="entity-form-section-heading">
            <span>04</span><h3>Cuentas bancarias</h3>
          </div>
          <BankAccountsFields accounts={draft.bankAccounts} errors={errors.bankAccounts}
            onChange={bankAccounts => setField('bankAccounts', bankAccounts)} />
        </section>
      </form>
    </Modal>
  )
}