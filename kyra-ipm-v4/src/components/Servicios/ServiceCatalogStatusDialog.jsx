import { useRef } from 'react'
import Modal from '../Modal'

const ACTIONS = {
  activate: {
    title: 'ACTIVAR SERVICIO',
    confirmLabel: 'Activar',
    pendingLabel: 'Activando…',
    targetStatus: 'active',
    detail: 'volverá a estar disponible para asignar a clientes.',
  },
  deactivate: {
    title: 'DESACTIVAR SERVICIO',
    confirmLabel: 'Desactivar',
    pendingLabel: 'Desactivando…',
    targetStatus: 'inactive',
    detail: 'dejará de estar disponible para asignar a clientes nuevos.',
  },
  archive: {
    title: 'ELIMINAR SERVICIO',
    confirmLabel: 'Eliminar',
    pendingLabel: 'Eliminando…',
    targetStatus: 'archived',
    detail: 'se eliminará del catálogo activo. Los servicios ya asignados a clientes y su historial de precios se conservarán.',
  },
  restore: {
    title: 'RESTAURAR SERVICIO',
    confirmLabel: 'Restaurar',
    pendingLabel: 'Restaurando…',
    targetStatus: 'inactive',
    detail: 'volverá al catálogo como inactivo. Podrás revisarlo antes de activarlo.',
  },
}

export default function ServiceCatalogStatusDialog({ service, action, busy = false, onCancel, onConfirm }) {
  const cancelRef = useRef(null)
  const config = ACTIONS[action]

  return (
    <Modal
      isOpen={Boolean(service && config)}
      onClose={busy ? () => {} : onCancel}
      title={config?.title || ''}
      dialogRole="alertdialog"
      descriptionId="service-catalog-status-description"
      initialFocusRef={cancelRef}
      footer={config && (
        <div className="entity-confirm-actions">
          <button ref={cancelRef} type="button" className="btn-arca-secondary" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className={`btn-guardar ready${action === 'archive' ? ' entity-danger-button' : ''}`}
            onClick={() => onConfirm(config.targetStatus)}
            disabled={busy}
          >
            {busy ? config.pendingLabel : config.confirmLabel}
          </button>
        </div>
      )}
    >
      {config && (
        <p id="service-catalog-status-description" className="entity-confirm-copy">
          <strong>{service.name}</strong> {config.detail}
        </p>
      )}
    </Modal>
  )
}
