import { useEffect, useState } from 'react'
import Modal from '../Modal'
import { getIpcPeriodicityOptions, validateClientDraft } from '../../domain/clientRules'

function createDraft(client) {
  if (client) {
    return { ...client, ccEmails: [...(client.ccEmails || [])] }
  }
  return {
    name: '',
    status: 'active',
    billingEntityId: '',
    countryId: '',
    fiscalConditionId: '',
    fiscalId: '',
    taxCategoryId: '',
    primaryEmail: '',
    ccEmails: [],
    ipcAdjustable: false,
    ipcPeriodicity: '',
    driveFolderRef: '',
    internalNotes: '',
  }
}

export default function ClienteFormModal({
  isOpen, client, onClose, onSave, onSaved, triggerRef,
  billingEntities, countries, getFiscalConditionsByCountry, taxCategories,
}) {
  const [draft, setDraft] = useState(() => createDraft(client))
  const [errors, setErrors] = useState({})
  const [requestError, setRequestError] = useState('')
  const [saving, setSaving] = useState(false)
  const [ccInput, setCcInput] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setDraft(createDraft(client))
    setErrors({})
    setRequestError('')
    setSaving(false)
    setCcInput('')
  }, [isOpen, client])

  function setField(field, value) {
    setDraft(current => ({ ...current, [field]: value }))
    setErrors(current => ({ ...current, [field]: undefined }))
  }

  function changeCountry(countryId) {
    setDraft(current => ({ ...current, countryId: countryId ? Number(countryId) : '', fiscalConditionId: '' }))
    setErrors(current => ({ ...current, countryId: undefined, fiscalConditionId: undefined }))
  }

  function addCcEmail() {
    const value = ccInput.trim()
    if (value && !draft.ccEmails.includes(value)) {
      setDraft(current => ({ ...current, ccEmails: [...current.ccEmails, value] }))
    }
    setCcInput('')
  }

  function removeCcEmail(email) {
    setDraft(current => ({ ...current, ccEmails: current.ccEmails.filter(item => item !== email) }))
  }

  const selectedCountry = countries.find(country => country.id === Number(draft.countryId)) || null
  const fiscalConditionOptions = draft.countryId ? getFiscalConditionsByCountry(draft.countryId) : []

  async function handleSubmit(event) {
    event.preventDefault()
    const validationErrors = validateClientDraft(draft, { countryCode: selectedCountry?.code })
    setErrors(validationErrors)
    setRequestError('')
    if (Object.keys(validationErrors).length > 0) return

    setSaving(true)
    try {
      const savedClient = await onSave(draft)
      onSaved(savedClient)
    } catch (error) {
      setRequestError(error.message || 'No se pudo guardar el cliente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={saving ? () => {} : onClose}
      title={client ? 'EDITAR CLIENTE' : 'NUEVO CLIENTE'}
      triggerRef={triggerRef}
      className="modal-box-wide"
      footer={(
        <div className="modal-footer-inner">
          <div className="modal-validation" role="status">
            {requestError || (Object.keys(errors).length > 0 ? 'Revisá los campos indicados.' : '')}
          </div>
          <div className="entity-form-actions">
            <button type="button" className="btn-arca-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" form="cliente-form" className="btn-guardar ready" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cliente'}
            </button>
          </div>
        </div>
      )}
    >
      <form id="cliente-form" className="entity-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="cliente-name">Nombre del cliente <span className="label-req">*</span></label>
          <input id="cliente-name" className={`form-input${errors.name ? ' input-error' : ''}`}
            value={draft.name} onChange={event => setField('name', event.target.value)} />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        {client && (
          <div className="form-group">
            <label htmlFor="cliente-status">Estado</label>
            <select id="cliente-status" className="form-select" value={draft.status}
              onChange={event => setField('status', event.target.value)}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
        )}

        <div className="form-group form-group-destacado">
          <label htmlFor="cliente-entidad">Entidad emisora <span className="label-req">*</span></label>
          <select id="cliente-entidad" className={`form-select${errors.billingEntityId ? ' input-error' : ''}`}
            value={draft.billingEntityId}
            onChange={event => setField('billingEntityId', event.target.value ? Number(event.target.value) : '')}>
            <option value=""></option>
            {billingEntities.map(entity => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
          </select>
          {errors.billingEntityId && <span className="field-error">{errors.billingEntityId}</span>}
          <span className="field-hint">Define el tipo de comprobante que se emite a este cliente.</span>
        </div>

        <div className="form-group">
          <label htmlFor="cliente-pais">País <span className="label-req">*</span></label>
          <select id="cliente-pais" className={`form-select${errors.countryId ? ' input-error' : ''}`}
            value={draft.countryId} onChange={event => changeCountry(event.target.value)}>
            <option value=""></option>
            {countries.map(country => <option key={country.id} value={country.id}>{country.name}</option>)}
          </select>
          {errors.countryId && <span className="field-error">{errors.countryId}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="cliente-condicion">Condición fiscal <span className="label-req">*</span></label>
          <select id="cliente-condicion" className={`form-select${errors.fiscalConditionId ? ' input-error' : ''}`}
            value={draft.fiscalConditionId}
            onChange={event => setField('fiscalConditionId', event.target.value ? Number(event.target.value) : '')}
            disabled={!draft.countryId}>
            <option value=""></option>
            {fiscalConditionOptions.map(condition => <option key={condition.id} value={condition.id}>{condition.name}</option>)}
          </select>
          {!draft.countryId && <span className="field-hint">Seleccioná primero el país</span>}
          {errors.fiscalConditionId && <span className="field-error">{errors.fiscalConditionId}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="cliente-fiscal-id">{selectedCountry?.code === 'AR' ? 'CUIT' : 'Identificación fiscal'} <span className="label-req">*</span></label>
          <input id="cliente-fiscal-id" className={`form-input${errors.fiscalId ? ' input-error' : ''}`}
            value={draft.fiscalId} onChange={event => setField('fiscalId', event.target.value)}
            placeholder={selectedCountry?.code === 'AR' ? 'ej: 20-12345678-1' : 'ej: 900.123.456-7'} />
          {errors.fiscalId && <span className="field-error">{errors.fiscalId}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="cliente-tax-category">Categoría de impuesto adicional</label>
          <select id="cliente-tax-category" className="form-select" value={draft.taxCategoryId || ''}
            onChange={event => setField('taxCategoryId', event.target.value ? Number(event.target.value) : '')}>
            <option value="">Sin impuesto adicional (0%)</option>
            {taxCategories.map(category => (
              <option key={category.id} value={category.id}>{category.name} ({category.taxRate}%)</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="cliente-email">Email principal <span className="label-req">*</span></label>
          <input id="cliente-email" className={`form-input${errors.primaryEmail ? ' input-error' : ''}`}
            type="email" value={draft.primaryEmail} onChange={event => setField('primaryEmail', event.target.value)}
            placeholder="contacto@empresa.com" />
          {errors.primaryEmail && <span className="field-error">{errors.primaryEmail}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="cliente-cc">Emails en copia (CC)</label>
          {draft.ccEmails.length > 0 && (
            <div className="cc-chips">
              {draft.ccEmails.map(email => (
                <span key={email} className="cc-chip">
                  {email}
                  <button type="button" className="cc-chip-remove" aria-label={'Quitar ' + email} onClick={() => removeCcEmail(email)}>×</button>
                </span>
              ))}
            </div>
          )}
          <div className="cc-add-row">
            <input id="cliente-cc" className="form-input" type="email" placeholder="email@ejemplo.com"
              value={ccInput} onChange={event => setCcInput(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addCcEmail() } }} />
            <button type="button" className="btn-add-cc-form" onClick={addCcEmail}>+ Agregar email</button>
          </div>
          {errors.ccEmails && <span className="field-error">{errors.ccEmails}</span>}
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 'normal' }}>
            <input type="checkbox" checked={draft.ipcAdjustable}
              onChange={event => setField('ipcAdjustable', event.target.checked)}
              style={{ width: 16, height: 16 }} />
            Actualización automática por IPC
          </label>
        </div>

        {draft.ipcAdjustable && (
          <div className="form-group">
            <label htmlFor="cliente-ipc-periodicidad">Periodicidad de ajuste <span className="label-req">*</span></label>
            <select id="cliente-ipc-periodicidad" className={`form-select${errors.ipcPeriodicity ? ' input-error' : ''}`}
              value={draft.ipcPeriodicity || ''} onChange={event => setField('ipcPeriodicity', event.target.value)}>
              <option value=""></option>
              {getIpcPeriodicityOptions().map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {errors.ipcPeriodicity && <span className="field-error">{errors.ipcPeriodicity}</span>}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="cliente-drive">Carpeta de Google Drive</label>
          <input id="cliente-drive" className="form-input" value={draft.driveFolderRef || ''}
            onChange={event => setField('driveFolderRef', event.target.value)}
            placeholder="ID o URL de la carpeta (placeholder, sin integración real todavía)" />
        </div>

        <div className="form-group">
          <label htmlFor="cliente-notas">Notas internas</label>
          <textarea id="cliente-notas" className="form-textarea" rows={3} value={draft.internalNotes || ''}
            onChange={event => setField('internalNotes', event.target.value)}
            placeholder="Instrucciones especiales, aclaraciones para la factura…" />
        </div>
      </form>
    </Modal>
  )
}
