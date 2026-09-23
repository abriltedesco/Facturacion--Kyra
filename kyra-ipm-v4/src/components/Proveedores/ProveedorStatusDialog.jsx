import { useRef } from 'react'
import Modal from '../Modal'

const ACTIONS = {
  activate: {
    title: 'ACTIVAR PROVEEDOR',
    confirmLabel: 'Activar',
    detail: 'volverá a estar disponible para nuevas compras.',
  },
  deactivate: {
    title: 'DESACTIVAR PROVEEDOR',
    confirmLabel: 'Desactivar',
    detail: 'dejará de estar disponible para nuevas compras.',
  },
  delete: {
    title: 'ELIMINAR PROVEEDOR',
    confirmLabel: 'Eliminar',
    detail: 'se eliminará de forma permanente. Esta acción no se puede deshacer.',
  },
}

export default function ProveedorStatusDialog({ proveedor, action, onCancel, onConfirm }) {
  const cancelRef = useRef(null)
  const config = ACTIONS[action]

  return (
    <Modal
      isOpen={Boolean(proveedor && config)}
      onClose={onCancel}
      title={config?.title || ''}
      dialogRole="alertdialog"
      descriptionId="proveedor-status-description"
      initialFocusRef={cancelRef}
      footer={config && (
        <div className="entity-confirm-actions">
          <button ref={cancelRef} type="button" className="btn-arca-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className={`btn-guardar ready${action === 'delete' ? ' entity-danger-button' : ''}`}
            onClick={onConfirm}
          >
            {config.confirmLabel}
          </button>
        </div>
      )}
    >
      {config && (
        <p id="proveedor-status-description" className="entity-confirm-copy">
          <strong>{proveedor.nombre}</strong> {config.detail}
        </p>
      )}
    </Modal>
  )
}
