import { useRef } from 'react'
import Modal from '../Modal'

export default function EmissionWarningDialog({
  isOpen,
  entries,
  onCancel,
  onContinue,
  onOpenEntity,
}) {
  const cancelRef = useRef(null)
  const affectedLines = entries.length

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="REVISAR ANTES DE EMITIR"
      dialogRole="alertdialog"
      descriptionId="emission-warning-description"
      initialFocusRef={cancelRef}
      className="emission-warning-dialog"
      footer={(
        <div className="entity-confirm-actions">
          <button ref={cancelRef} type="button" className="btn-arca-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="btn-guardar ready" onClick={onContinue}>
            Continuar igualmente
          </button>
        </div>
      )}
    >
      <p id="emission-warning-description" className="emission-warning-intro">
        {affectedLines === 1
          ? 'Este comprobante tiene observaciones que conviene revisar.'
          : `${affectedLines} comprobantes tienen observaciones que conviene revisar.`}
        {' '}Las advertencias son informativas y no bloquean la emisión.
      </p>

      <div className="emission-warning-list">
        {entries.map(entry => (
          <section className="emission-warning-item" key={entry.lineId}>
            <div className="emission-warning-item-heading">
              <div>
                <strong>{entry.entityName}</strong>
                <span>Comprobante {entry.voucherType}</span>
              </div>
              {entry.entityId && onOpenEntity && (
                <button type="button" onClick={() => onOpenEntity(entry.entityId)}>
                  Ver entidad
                </button>
              )}
            </div>
            <ul>
              {entry.warnings.map(item => <li key={item.code}>{item.message}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  )
}