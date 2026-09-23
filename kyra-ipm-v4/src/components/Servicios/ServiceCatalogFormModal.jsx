import { useEffect, useState } from 'react'
import Modal from '../Modal'

function createDraft(service) {
  if (service) {
    return {
      id: service.id,
      updatedAt: service.updatedAt,
      nombre: service.name || '',
      tipoSvc: service.type === 'hourly' ? 'Por hora' : 'Fijo',
      precioBase: service.basePrice ?? '',
      moneda: service.currency || 'ARS',
      estadoInicial: service.status === 'active',
    }
  }
  return { nombre: '', tipoSvc: 'Fijo', precioBase: '', moneda: 'ARS', estadoInicial: true }
}

export default function ServiceCatalogFormModal({ isOpen, service, onClose, onSave, onSaved, triggerRef }) {
  const [draft, setDraft] = useState(() => createDraft(service))
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setDraft(createDraft(service))
    setSubmitted(false)
    setSaving(false)
  }, [isOpen, service])

  const change = e => setDraft(p => ({ ...p, [e.target.name]: e.target.value }))
  const isReady = draft.nombre && draft.tipoSvc

  async function handleSave() {
    setSubmitted(true)
    if (!isReady) return
    setSaving(true)
    try {
      const saved = await onSave({
        id: draft.id || null,
        updatedAt: draft.updatedAt || null,
        name: draft.nombre,
        type: draft.tipoSvc === 'Por hora' ? 'hourly' : 'fixed',
        currency: draft.moneda,
        basePrice: draft.tipoSvc === 'Fijo' ? Number(draft.precioBase) : null,
        status: draft.estadoInicial ? 'active' : 'inactive',
      })
      onSaved(saved)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={service ? 'EDITAR SERVICIO' : 'NUEVO SERVICIO'} triggerRef={triggerRef}
      footer={(
        <div className="modal-footer-inner">
          <div className="modal-validation">
            {submitted && !isReady && (
              <span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                {' '}Completá los campos obligatorios (*)
              </span>
            )}
          </div>
          <button className={'btn-guardar' + (isReady ? ' ready' : '')} onClick={handleSave} disabled={!isReady || saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      )}
    >
      <div className="form-group">
        <label htmlFor="s-nombre">Nombre del servicio <span className="label-req">*</span></label>
        <input id="s-nombre" className="form-input" name="nombre" value={draft.nombre} onChange={change} placeholder="ej: Social Media" />
      </div>
      <div className="form-group">
        <label>Tipo <span className="label-req">*</span></label>
        <div className="svc-tipo-group">
          {['Fijo', 'Por hora'].map(t => (
            <label key={t} className={'svc-tipo-option' + (draft.tipoSvc === t ? ' svc-tipo-active' : '')}>
              <input type="radio" name="tipoSvc" value={t} checked={draft.tipoSvc === t}
                onChange={change} style={{ display: 'none' }} />
              {t === 'Fijo' ? 'Precio fijo' : 'Por hora'}
            </label>
          ))}
        </div>
      </div>
      {draft.tipoSvc === 'Fijo' && (
        <div className="form-group">
          <label htmlFor="s-precio">Precio base</label>
          <input id="s-precio" className="form-input" name="precioBase" value={draft.precioBase} onChange={change} placeholder="0.00" />
        </div>
      )}
      <div className="form-group">
        <label htmlFor="s-moneda">Moneda</label>
        <select id="s-moneda" className="form-select" name="moneda" value={draft.moneda} onChange={change}>
          <option>ARS</option><option>USD</option>
        </select>
      </div>
      <p className="servicios-nota" style={{ marginTop: 8 }}>Los precios específicos por cliente se configuran en el perfil de cada cliente.</p>
    </Modal>
  )
}
