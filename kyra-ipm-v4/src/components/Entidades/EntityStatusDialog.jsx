import { useRef } from 'react'
import Modal from '../Modal'

const ACTIONS = {
  activate: {
    title: 'ACTIVAR ENTIDAD',
    confirmLabel: 'Activar',
    pendingLabel: 'Activando…',
    targetStatus: 'active',
    detail: 'volverá a estar disponible para nuevas facturas.',
  },
  deactivate: {
    title: 'DESACTIVAR ENTIDAD',
    confirmLabel: 'Desactivar',
    pendingLabel: 'Desactivando…',
    targetStatus: 'inactive',
    detail: 'dejará de estar disponible para nuevas facturas.',
  },
  archive: {
    title: 'ARCHIVAR ENTIDAD',
    confirmLabel: 'Archivar',
    pendingLabel: 'Archivando…',
    targetStatus: 'archived',
    detail: 'quedará fuera de la operación diaria hasta que la restaures.',
  },
  restore: {
    title: 'RESTAURAR ENTIDAD',
    confirmLabel: 'Restaurar',
    pendingLabel: 'Restaurando…',
    targetStatus: 'inactive',
    detail: 'volverá al catálogo como inactiva. Podrás revisarla antes de activarla.',
  },
}

export default function EntityStatusDialog({ entity, action, busy = false, onCancel, onConfirm }) {
  const cancelRef = useRef(null)
  const config = ACTIONS[action]

  return (
    <Modal
      isOpen={Boolean(entity && config)}
      onClose={busy ? () => {} : onCancel}
      title={config?.title || ''}
      dialogRole="alertdialog"
      descriptionId="entity-status-description"
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
        <p id="entity-status-description" className="entity-confirm-copy">
          <strong>{entity.name}</strong> {config.detail} Su historial fiscal, bancario y documental se conservará.
        </p>
      )}
    </Modal>
  )
}