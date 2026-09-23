import { useEffect, useState } from 'react'
import Modal from '../Modal'

const TIPOS_SERVICIO = ['Cloud', 'SaaS', 'Diseño', 'Comunicación', 'Productividad', 'Dev', 'Gestión']
const METODOS_PAGO = ['Transferencia', 'Débito automático', 'Tarjeta']

function createDraft(proveedor) {
  if (proveedor) return { ...proveedor }
  return { nombre: '', mail: '', tipoServicio: '', medioPago: '', destino: '', cuit: '' }
}

export default function ProveedorFormModal({ isOpen, proveedor, onClose, onSave, onSaved, triggerRef }) {
  const [draft, setDraft] = useState(() => createDraft(proveedor))
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setDraft(createDraft(proveedor))
    setSubmitted(false)
  }, [isOpen, proveedor])

  const change = e => setDraft(p => ({ ...p, [e.target.name]: e.target.value }))
  const isReady = draft.nombre && draft.mail && draft.destino

  function handleSave() {
    setSubmitted(true)
    if (!isReady) return
    const saved = onSave(draft)
    onSaved(saved)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={proveedor ? 'EDITAR PROVEEDOR' : 'NUEVO PROVEEDOR'} triggerRef={triggerRef}
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
          <button className={'btn-guardar' + (isReady ? ' ready' : '')} onClick={handleSave} disabled={!isReady}>Guardar</button>
        </div>
      )}
    >
      <div className="form-group">
        <label htmlFor="p-nombre">Nombre del Proveedor <span className="label-req">*</span></label>
        <input id="p-nombre" className="form-input" name="nombre" value={draft.nombre} onChange={change} />
      </div>
      <div className="form-group">
        <label htmlFor="p-email">Email <span className="label-req">*</span></label>
        <input id="p-email" className="form-input" name="mail" type="email" value={draft.mail} onChange={change} />
      </div>
      <div className="form-group">
        <label htmlFor="p-tipo">Tipo de Servicio</label>
        <select id="p-tipo" className="form-select" name="tipoServicio" value={draft.tipoServicio} onChange={change}>
          <option value=""></option>
          {TIPOS_SERVICIO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="p-pago">Método de Pago</label>
        <select id="p-pago" className="form-select" name="medioPago" value={draft.medioPago} onChange={change}>
          <option value=""></option>
          {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="p-destino">Destino <span className="label-req">*</span></label>
        <input id="p-destino" className="form-input" name="destino" value={draft.destino} onChange={change} />
      </div>
      <div className="form-group">
        <label htmlFor="p-cuit">CUIT</label>
        <input id="p-cuit" className="form-input" name="cuit" value={draft.cuit} onChange={change} />
      </div>
    </Modal>
  )
}
