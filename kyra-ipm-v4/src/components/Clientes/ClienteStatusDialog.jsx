import { useRef } from 'react'
import Modal from '../Modal'

const ACTIONS = {
  activate: {
    title: 'ACTIVAR CLIENTE',
    confirmLabel: 'Activar',
    pendingLabel: 'Activando…',
    targetStatus: 'active',
    detail: 'volverá a estar disponible para nueva facturación.',
  },
  deactivate: {
    title: 'DESACTIVAR CLIENTE',
    confirmLabel: 'Desactivar',
    pendingLabel: 'Desactivando…',
    targetStatus: 'inactive',
    detail: 'dejará de estar disponible para nueva facturación.',
  },
  archive: {
    title: 'ARCHIVAR CLIENTE',
    confirmLabel: 'Archivar',
    pendingLabel: 'Archivando…',
    targetStatus: 'archived',
    detail: 'quedará fuera de la operación diaria hasta que lo restaures.',
  },
  restore: {
    title: 'RESTAURAR CLIENTE',
    confirmLabel: 'Restaurar',
    pendingLabel: 'Restaurando…',
    targetStatus: 'inactive',
    detail: 'volverá al listado como inactivo. Podrás revisarlo antes de activarlo.',
  },
}

export default function ClienteStatusDialog({ client, action, busy = false, onCancel, onConfirm }) {
  const cancelRef = useRef(null)
  const config = ACTIONS[action]

  return (
    <Modal
      isOpen={Boolean(client && config)}
      onClose={busy ? () => {} : onCancel}
      title={config?.title || ''}
      dialogRole="alertdialog"
      descriptionId="cliente-status-description"
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
        <p id="cliente-status-description" className="entity-confirm-copy">
          <strong>{client.name}</strong> {config.detail} Su historial y datos fiscales se conservarán.
        </p>
      )}
    </Modal>
  )
}
