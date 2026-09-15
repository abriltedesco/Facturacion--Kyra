import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Modal from '../components/Modal'
import EntityFormModal from '../components/Entidades/EntityFormModal'
import EntityStatusDialog from '../components/Entidades/EntityStatusDialog'
import { useEntities } from '../context/EntitiesContext'
import { getArcaStatus } from '../domain/arca'

const TYPE_LABEL = {
  srl: 'SRL',
  monotributista: 'Monotributo personal',
  llc: 'LLC',
}

const VOUCHER_LABEL = {
  A: 'Factura A',
  B_EXEMPT: 'Factura B - Exento en IVA',
  C: 'Factura C',
  LLC: 'Invoice LLC',
}

const STATUS_LABEL = {
  active: 'Activa',
  inactive: 'Inactiva',
  archived: 'Archivada',
}

const ARCA_COPY = {
  valid: {
    label: 'Vigente',
    title: 'Certificado operativo',
    detail: 'El certificado está disponible para emitir comprobantes.',
  },
  expiring: {
    label: 'Por vencer',
    title: 'Renovación próxima',
    detail: 'El certificado vence dentro de los próximos 30 días.',
  },
  expired: {
    label: 'Vencido',
    title: 'Certificado vencido',
    detail: 'Cargá un certificado nuevo para mantener actualizada la documentación fiscal.',
  },
  missing: {
    label: 'Sin cargar',
    title: 'Sin certificado',
    detail: 'Esta entidad todavía no tiene documentación ARCA vigente.',
  },
  not_applicable: {
    label: 'No aplica',
    title: 'Gestión propia',
    detail: 'Las LLC generan invoices propias y no requieren certificado ARCA.',
  },
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
}

function documentStatus(document, isCurrent) {
  if (document.revokedAt) return { key: 'revoked', label: 'Revocado' }
  if (document.supersededAt) return { key: 'replaced', label: 'Reemplazado' }
  if (document.expirationDate < new Date().toISOString().slice(0, 10)) return { key: 'expired', label: 'Vencido' }
  if (isCurrent) return { key: 'current', label: 'Actual' }
  return { key: 'historical', label: 'Histórico' }
}

export default function EntidadDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    getEntity,
    loading,
    error: catalogError,
    saveEntity,
    setEntityStatus,
    uploadArcaDocument,
    revokeArcaDocument,
    createDocumentUrl,
  } = useEntities()
  const entity = getEntity(id)
  const [editOpen, setEditOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [expirationDate, setExpirationDate] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [documentActionId, setDocumentActionId] = useState(null)
  const [revokeTarget, setRevokeTarget] = useState(null)
  const [revoking, setRevoking] = useState(false)
  const [statusAction, setStatusAction] = useState(null)
  const [changingStatus, setChangingStatus] = useState(false)
  const editTriggerRef = useRef(null)
  const uploadTriggerRef = useRef(null)
  const fileInputRef = useRef(null)
  const fileButtonRef = useRef(null)

  useEffect(() => {
    document.title = entity ? `${entity.name} — IPM Kyra` : 'Entidad — IPM Kyra'
  }, [entity])

  function closeUpload() {
    if (uploading) return
    setUploadOpen(false)
    setUploadFile(null)
    setExpirationDate('')
    setUploadError('')
  }

  function selectFile(file) {
    setUploadError('')
    if (!file) return
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadFile(null)
      setUploadError('Seleccioná un archivo PDF.')
      return
    }
    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      setUploadFile(null)
      setUploadError('El PDF debe pesar entre 1 byte y 10 MB.')
      return
    }
    setUploadFile(file)
  }

  async function submitUpload(event) {
    event.preventDefault()
    if (!uploadFile || !expirationDate) {
      setUploadError('Seleccioná el PDF e indicá su vencimiento.')
      return
    }
    if (expirationDate < new Date().toISOString().slice(0, 10)) {
      setUploadError('El vencimiento no puede estar en el pasado.')
      return
    }

    setUploading(true)
    setUploadError('')
    try {
      await uploadArcaDocument(entity.id, uploadFile, expirationDate)
      setUploadOpen(false)
      setUploadFile(null)
      setExpirationDate('')
    } catch (requestError) {
      setUploadError(requestError.message || 'No se pudo cargar el certificado.')
    } finally {
      setUploading(false)
    }
  }

  async function accessDocument(document, download = false) {
    setDocumentActionId(document.id)
    try {
      const url = await createDocumentUrl(document.storagePath, 60, download ? document.originalFileName : '')
      if (download) {
        const link = window.document.createElement('a')
        link.href = url
        link.download = document.originalFileName
        link.click()
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } finally {
      setDocumentActionId(null)
    }
  }

  async function confirmRevoke() {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      await revokeArcaDocument(entity.id, revokeTarget.id)
      setRevokeTarget(null)
    } finally {
      setRevoking(false)
    }
  }

  async function confirmStatus(nextStatus) {
    setChangingStatus(true)
    try {
      await setEntityStatus(entity, nextStatus)
      setStatusAction(null)
    } finally {
      setChangingStatus(false)
    }
  }

  if (loading) {
    return <div className="entity-detail-state" role="status">Cargando entidad…</div>
  }

  if (!entity) {
    return (
      <div className="entity-detail-state">
        <h1>Entidad no encontrada</h1>
        <p>{catalogError || 'El registro no existe o ya no está disponible.'}</p>
        <button type="button" className="btn-arca-secondary" onClick={() => navigate('/administracion')}>Volver a Administración</button>
      </div>
    )
  }

  const arcaStatus = getArcaStatus(entity)
  const arcaCopy = ARCA_COPY[arcaStatus]
  const currentDocument = entity.currentArcaDocument

  return (
    <div className="entity-detail-page">
      <button className="entity-detail-back" type="button" onClick={() => navigate('/administracion')}>
        <span aria-hidden="true">←</span> Entidades
      </button>

      <header className="entity-detail-header">
        <div>
          <div className="entity-detail-heading-row">
            <h1>{entity.name}</h1>
            <span className={`badge ${entity.status === 'active' ? 'badge-activo' : entity.status === 'archived' ? 'badge-archivado' : 'badge-inactivo'}`}>
              {STATUS_LABEL[entity.status] || entity.status}
            </span>
          </div>
          <p>{TYPE_LABEL[entity.legalType]} · {entity.fiscalIdType} {entity.fiscalId}</p>
        </div>
        <div className="entity-detail-actions">
          {entity.status !== 'archived' && (
            <button ref={editTriggerRef} type="button" className="btn-arca-secondary" onClick={() => setEditOpen(true)}>Editar datos</button>
          )}
          {entity.status === 'archived' ? (
            <button type="button" className="btn-arca-secondary" onClick={() => setStatusAction('restore')}>Restaurar</button>
          ) : (
            <>
              <button type="button" className="btn-arca-secondary" onClick={() => setStatusAction(entity.status === 'active' ? 'deactivate' : 'activate')}>
                {entity.status === 'active' ? 'Desactivar' : 'Activar'}
              </button>
              <button type="button" className="btn-arca-secondary entity-detail-archive" onClick={() => setStatusAction('archive')}>Archivar</button>
            </>
          )}
        </div>
      </header>

      {catalogError && <div className="admin-data-error" role="alert">{catalogError}</div>}

      <div className="entity-detail-grid">
        <section className="entity-detail-panel entity-detail-data" aria-labelledby="entity-data-title">
          <div className="entity-detail-panel-heading">
            <span>01</span><h2 id="entity-data-title">Datos fiscales</h2>
          </div>
          <dl className="entity-detail-list">
            <div><dt>Tipo</dt><dd>{TYPE_LABEL[entity.legalType]}</dd></div>
            <div><dt>{entity.fiscalIdType}</dt><dd>{entity.fiscalId}</dd></div>
            <div><dt>Domicilio fiscal</dt><dd>{entity.fiscalAddress}</dd></div>
            <div><dt>Ingresos Brutos</dt><dd>{entity.grossIncomeNumber || '—'}</dd></div>
            <div><dt>Email de facturación</dt><dd>{entity.billingEmail || '—'}</dd></div>
            <div><dt>Comprobante</dt><dd>{VOUCHER_LABEL[entity.defaultVoucher]}</dd></div>
            <div><dt>{entity.legalType === 'llc' ? 'Prefijo' : 'Punto de venta'}</dt><dd>{entity.invoicePrefix || entity.pointOfSale || '—'}</dd></div>
          </dl>
        </section>

        <section className={`entity-detail-panel entity-detail-arca entity-detail-arca-${arcaStatus}`} aria-labelledby="entity-arca-title">
          <div className="entity-detail-panel-heading">
            <span>02</span><h2 id="entity-arca-title">Certificado ARCA</h2>
          </div>
          <div className="entity-arca-status-row">
            <span className={`entity-arca-badge entity-arca-${arcaStatus}`}>{arcaCopy.label}</span>
            {currentDocument && <span>Vence {formatDate(currentDocument.expirationDate)}</span>}
          </div>
          <div className="entity-arca-message">
            <strong>{arcaCopy.title}</strong>
            <p>{arcaCopy.detail}</p>
          </div>
          {arcaStatus !== 'not_applicable' && entity.status !== 'archived' && (
            <button ref={uploadTriggerRef} type="button" className="btn-arca-primary" onClick={() => setUploadOpen(true)}>
              {currentDocument ? 'Renovar certificado' : 'Cargar certificado'}
            </button>
          )}
        </section>
      </div>

      <section className="entity-detail-section" aria-labelledby="entity-accounts-title">
        <div className="entity-detail-section-title">
          <h2 id="entity-accounts-title">Cuentas bancarias</h2>
          <span>{entity.bankAccounts.length}</span>
        </div>
        <div className="entity-account-list">
          {entity.bankAccounts.map(account => (
            <article className="entity-account-row" key={account.id}>
              <div className="entity-account-bank">
                <strong>{account.bankName}</strong>
                <span>{account.accountHolder}</span>
              </div>
              <div><span>Moneda</span><strong>{account.currency}</strong></div>
              <div><span>{account.accountScope === 'local' ? 'CBU' : 'Cuenta'}</span><strong>{account.cbu || account.accountNumber}</strong></div>
              <div className="entity-account-tags">
                <span>{account.accountScope === 'local' ? 'Argentina' : 'Internacional'}</span>
                {account.isPrimary && <span>Principal</span>}
              </div>
            </article>
          ))}
        </div>
      </section>

      {entity.legalType !== 'llc' && (
        <section className="entity-detail-section" aria-labelledby="entity-history-title">
          <div className="entity-detail-section-title">
            <h2 id="entity-history-title">Historial de certificados</h2>
            <span>{entity.arcaDocuments.length}</span>
          </div>
          {entity.arcaDocuments.length === 0 ? (
            <div className="entity-history-empty">No hay certificados cargados.</div>
          ) : (
            <div className="table-container entity-history-table">
              <table>
                <thead><tr><th>ARCHIVO</th><th>CARGADO</th><th>VENCIMIENTO</th><th>USUARIO</th><th>ESTADO</th><th><span className="sr-only">Acciones</span></th></tr></thead>
                <tbody>
                  {entity.arcaDocuments.map(document => {
                    const status = documentStatus(document, currentDocument?.id === document.id)
                    return (
                      <tr key={document.id}>
                        <td className="entity-document-name">{document.originalFileName}</td>
                        <td>{formatDate(document.uploadedAt)}</td>
                        <td>{formatDate(document.expirationDate)}</td>
                        <td>{document.uploadedBy?.displayName || document.uploadedBy?.username || '—'}</td>
                        <td><span className={`entity-document-status entity-document-${status.key}`}>{status.label}</span></td>
                        <td>
                          <div className="entity-document-actions">
                            <button type="button" title="Abrir PDF" onClick={() => accessDocument(document).catch(() => {})}
                              disabled={documentActionId === document.id}>Abrir</button>
                            <button type="button" title="Descargar PDF" onClick={() => accessDocument(document, true).catch(() => {})}
                              disabled={documentActionId === document.id}>Descargar</button>
                            {!document.revokedAt && !document.supersededAt && (
                              <button type="button" className="entity-document-revoke" onClick={() => setRevokeTarget(document)}>Revocar</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <EntityFormModal isOpen={editOpen} entity={entity} onClose={() => setEditOpen(false)}
        onSave={saveEntity} onSaved={() => setEditOpen(false)} triggerRef={editTriggerRef} />

      <EntityStatusDialog
        entity={statusAction ? entity : null}
        action={statusAction}
        busy={changingStatus}
        onCancel={() => setStatusAction(null)}
        onConfirm={nextStatus => confirmStatus(nextStatus).catch(() => {})}
      />

      <Modal isOpen={uploadOpen} onClose={closeUpload} title={currentDocument ? 'RENOVAR CERTIFICADO' : 'CARGAR CERTIFICADO'}
        triggerRef={uploadTriggerRef} initialFocusRef={fileButtonRef}
        footer={(
          <div className="modal-footer-inner">
            <div className="modal-validation">{uploadError}</div>
            <div className="entity-form-actions">
              <button type="button" className="btn-arca-secondary" onClick={closeUpload} disabled={uploading}>Cancelar</button>
              <button type="submit" form="arca-upload-form" className="btn-guardar ready" disabled={uploading}>
                {uploading ? 'Cargando…' : 'Cargar PDF'}
              </button>
            </div>
          </div>
        )}>
        <form id="arca-upload-form" className="entity-upload-form" onSubmit={submitUpload} noValidate>
          <div className={`entity-upload-drop${dragOver ? ' is-dragging' : ''}`}
            onDragOver={event => { event.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={event => { event.preventDefault(); setDragOver(false); selectFile(event.dataTransfer.files?.[0]) }}>
            <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="sr-only"
              onChange={event => selectFile(event.target.files?.[0])} />
            <span className="entity-upload-file-icon" aria-hidden="true">PDF</span>
            <strong>{uploadFile ? uploadFile.name : 'Seleccioná o arrastrá el certificado'}</strong>
            <span>{uploadFile ? `${(uploadFile.size / 1024 / 1024).toFixed(2)} MB` : 'PDF · máximo 10 MB'}</span>
            <button ref={fileButtonRef} type="button" className="btn-arca-secondary" onClick={() => fileInputRef.current?.click()}>
              {uploadFile ? 'Cambiar archivo' : 'Seleccionar archivo'}
            </button>
          </div>
          <div className="form-group">
            <label htmlFor="arca-expiration">Vencimiento <span className="label-req">*</span></label>
            <input id="arca-expiration" type="date" className="form-input" min={new Date().toISOString().slice(0, 10)}
              value={expirationDate} onChange={event => { setExpirationDate(event.target.value); setUploadError('') }} />
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(revokeTarget)} onClose={revoking ? () => {} : () => setRevokeTarget(null)}
        title="REVOCAR CERTIFICADO" dialogRole="alertdialog" descriptionId="revoke-document-description"
        footer={(
          <div className="entity-confirm-actions">
            <button type="button" className="btn-arca-secondary" disabled={revoking} onClick={() => setRevokeTarget(null)}>Cancelar</button>
            <button type="button" className="btn-guardar ready" disabled={revoking} onClick={() => confirmRevoke().catch(() => {})}>
              {revoking ? 'Revocando…' : 'Revocar'}
            </button>
          </div>
        )}>
        <p id="revoke-document-description" className="entity-confirm-copy">
          El certificado <strong>{revokeTarget?.originalFileName}</strong> quedará en el historial, marcado como revocado.
        </p>
      </Modal>
    </div>
  )
}