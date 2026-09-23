import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Modal from '../components/Modal'
import { useClients } from '../context/ClientsContext'
import { useEntities } from '../context/EntitiesContext'
import { useServices } from '../context/ServicesContext'
import { SERVICE_PERIODICITY_OPTIONS } from '../domain/serviceRules'
import ClienteFormModal from '../components/Clientes/ClienteFormModal'
import ClienteStatusDialog from '../components/Clientes/ClienteStatusDialog'

const CLIENT_STATUS_LABEL = { active: 'Activo', inactive: 'Inactivo', archived: 'Archivado' }
const CLIENT_STATUS_BADGE = { active: 'badge-activo', inactive: 'badge-inactivo', archived: 'badge-archivado' }
const VOUCHER_LABEL = { A: 'Factura A', B_EXEMPT: 'Factura B - Exento en IVA', C: 'Factura C', LLC: 'Invoice LLC' }
const IPC_PERIODICITY_LABEL = { monthly: 'Mensual', quarterly: 'Trimestral', semiannual: 'Semestral', annual: 'Anual' }
const SERVICE_STATUS_LABEL = { active: 'Activo', paused: 'Pausado', finished: 'Finalizado' }
const SERVICE_STATUS_BADGE = { active: 'badge-activo', paused: 'badge-emitida', finished: 'badge-inactivo' }
const SERVICE_PERIODICITY_LABEL = Object.fromEntries(SERVICE_PERIODICITY_OPTIONS.map(o => [o.value, o.label]))
const TABS_PERFIL = ['Datos generales', 'Servicios', 'Historial de facturas', 'Documentos']

function formatTarifa(service) {
  const amount = service.type === 'fixed' ? service.baseAmount : service.hourlyRate
  if (amount === null || amount === undefined) return '—'
  const formatted = Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return service.type === 'hourly' ? `$${formatted}/h` : `$${formatted}`
}

function formatMonto(value) {
  return value === null || value === undefined ? '—' : `$${Number(value).toLocaleString('es-AR')}`
}

export default function ClienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    getClient, loading, error: clientsError, saveClient, setClientStatus,
    activeCountries, getFiscalConditionsByCountry, activeTaxCategories,
  } = useClients()
  const { entities } = useEntities()
  const { activeCatalog, getClientServices, loadClientServices, saveClientService, error: servicesError } = useServices()
  const client = getClient(id)

  const [tabPerfil, setTabPerfil] = useState(0)
  const [histService, setHistService] = useState(null)
  const [addModal, setAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newSvc, setNewSvc] = useState({ catalogId: '', tarifa: '', periodicidad: 'monthly' })
  const [editOpen, setEditOpen] = useState(false)
  const [statusAction, setStatusAction] = useState(null)
  const [changingStatus, setChangingStatus] = useState(false)

  const servicios = client ? getClientServices(client.id) : []

  useEffect(() => {
    if (client) loadClientServices(client.id).catch(() => {})
  }, [client, loadClientServices])

  useEffect(() => {
    document.title = client ? `${client.name} — IPM Kyra` : 'Cliente — IPM Kyra'
  }, [client])

  async function confirmStatus(nextStatus) {
    setChangingStatus(true)
    try {
      await setClientStatus(client, nextStatus)
      setStatusAction(null)
    } finally {
      setChangingStatus(false)
    }
  }

  const changeNewSvc = e => setNewSvc(p => ({ ...p, [e.target.name]: e.target.value }))
  const selectedCatalog = activeCatalog.find(c => String(c.id) === String(newSvc.catalogId))

  async function guardarSvc() {
    if (!selectedCatalog || !newSvc.tarifa || !client) return
    setSaving(true)
    try {
      await saveClientService({
        clientId: client.id,
        catalogId: selectedCatalog.id,
        name: selectedCatalog.name,
        type: selectedCatalog.type,
        currency: selectedCatalog.currency,
        baseAmount: selectedCatalog.type === 'fixed' ? Number(newSvc.tarifa) : null,
        hourlyRate: selectedCatalog.type === 'hourly' ? Number(newSvc.tarifa) : null,
        periodicity: newSvc.periodicidad,
        status: 'active',
      })
      setAddModal(false)
      setNewSvc({ catalogId: '', tarifa: '', periodicidad: 'monthly' })
    } finally {
      setSaving(false)
    }
  }

  if (!client) {
    return (
      <div className="entity-detail-state">
        <h1>{loading ? 'Cargando…' : 'Cliente no encontrado'}</h1>
        <p>{clientsError || 'El registro no existe o ya no está disponible.'}</p>
        <button type="button" className="btn-arca-secondary" onClick={() => navigate('/administracion')}>Volver a Administración</button>
      </div>
    )
  }

  return (
    <div className="entity-detail-page">
      <button className="entity-detail-back" type="button" onClick={() => navigate('/administracion')}>
        <span aria-hidden="true">←</span> Clientes
      </button>

      <header className="entity-detail-header">
        <div>
          <div className="entity-detail-heading-row">
            <h1>{client.name}</h1>
            <span className={`badge ${CLIENT_STATUS_BADGE[client.status] || 'badge-inactivo'}`}>
              {CLIENT_STATUS_LABEL[client.status] || client.status}
            </span>
          </div>
          <p>{client.country?.name || 'Sin país'} · {client.billingEntity?.name || 'Sin entidad emisora'}</p>
        </div>
        <div className="entity-detail-actions">
          {client.status !== 'archived' && (
            <button type="button" className="btn-arca-secondary" onClick={() => setEditOpen(true)}>Editar datos</button>
          )}
          {client.status === 'archived' ? (
            <button type="button" className="btn-arca-secondary" onClick={() => setStatusAction('restore')}>Restaurar</button>
          ) : (
            <>
              <button type="button" className="btn-arca-secondary" onClick={() => setStatusAction(client.status === 'active' ? 'deactivate' : 'activate')}>
                {client.status === 'active' ? 'Desactivar' : 'Activar'}
              </button>
              <button type="button" className="btn-arca-secondary entity-detail-archive" onClick={() => setStatusAction('archive')}>Archivar</button>
            </>
          )}
        </div>
      </header>

      {clientsError && <div className="admin-data-error" role="alert">{clientsError}</div>}

      <div role="tablist" className="subtabs">
        {TABS_PERFIL.map((t, i) => (
          <button key={t} role="tab" aria-selected={tabPerfil === i}
            className={'subtab' + (tabPerfil === i ? ' active' : '')}
            onClick={() => setTabPerfil(i)}>{t}</button>
        ))}
      </div>

      {/* TAB: Datos generales */}
      {tabPerfil === 0 && (
        <div className="entity-detail-grid" style={{ marginTop: 24 }}>
          <section className="entity-detail-panel entity-detail-data" aria-labelledby="cliente-data-title">
            <div className="entity-detail-panel-heading">
              <span>01</span><h2 id="cliente-data-title">Datos generales</h2>
            </div>
            <dl className="entity-detail-list">
              <div><dt>Entidad emisora</dt><dd>{client.billingEntity?.name || '—'}</dd></div>
              <div><dt>Tipo de factura</dt><dd>{VOUCHER_LABEL[client.billingEntity?.defaultVoucher] || '—'}</dd></div>
              <div><dt>País</dt><dd>{client.country?.name || '—'}</dd></div>
              <div><dt>Condición fiscal</dt><dd>{client.fiscalCondition?.name || '—'}</dd></div>
              <div><dt>Identificación fiscal</dt><dd>{client.fiscalId || '—'}</dd></div>
              <div><dt>Impuesto adicional</dt><dd>{client.taxCategory ? `${client.taxCategory.name} (${client.taxCategory.taxRate}%)` : 'Sin impuesto adicional'}</dd></div>
              <div><dt>Email principal</dt><dd>{client.primaryEmail || '—'}</dd></div>
              <div><dt>Emails en copia</dt><dd>{client.ccEmails?.length ? client.ccEmails.join(', ') : '—'}</dd></div>
              <div><dt>Actualización por IPC</dt><dd>{client.ipcAdjustable ? `Sí — ${IPC_PERIODICITY_LABEL[client.ipcPeriodicity] || client.ipcPeriodicity}` : 'No'}</dd></div>
              <div><dt>Carpeta de Drive</dt><dd>{client.driveFolderRef || '—'}</dd></div>
              <div><dt>Notas internas</dt><dd>{client.internalNotes || '—'}</dd></div>
            </dl>
          </section>
        </div>
      )}

      {/* TAB: Servicios */}
      {tabPerfil === 1 && (
        <section className="entity-detail-section" aria-labelledby="cliente-services-title">
          <div className="entity-detail-section-title">
            <h2 id="cliente-services-title">Servicios</h2>
            <span>{servicios.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '14px 0' }}>
            <button type="button" className="btn-arca-secondary" onClick={() => setAddModal(true)}>+ Agregar servicio</button>
          </div>
          {servicesError && <div className="admin-data-error" role="alert">{servicesError}</div>}
          {servicios.length === 0 ? (
            <div className="entity-history-empty">Sin servicios cargados.</div>
          ) : (
            <div className="table-container entity-history-table">
              <table>
                <thead><tr>
                  <th>SERVICIO</th><th>TIPO</th><th>TARIFA</th><th>MONEDA</th>
                  <th>PERIODICIDAD</th><th>ESTADO</th><th><span className="sr-only">Historial</span></th>
                </tr></thead>
                <tbody>
                  {servicios.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td className="td-muted">{s.type === 'fixed' ? 'Fijo' : 'Por hora'}</td>
                      <td>{formatTarifa(s)}</td>
                      <td><span className="moneda-badge">{s.currency}</span></td>
                      <td className="td-muted">{SERVICE_PERIODICITY_LABEL[s.periodicity] || s.periodicity}</td>
                      <td><span className={`badge ${SERVICE_STATUS_BADGE[s.status] || 'badge-inactivo'}`}>{SERVICE_STATUS_LABEL[s.status] || s.status}</span></td>
                      <td><button className="link-nro" onClick={() => setHistService(s)}>Ver historial →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="servicios-nota">Los precios y condiciones por cliente se configuran aquí. El catálogo base se gestiona en Administración.</p>
        </section>
      )}

      {/* TAB: Historial de facturas */}
      {tabPerfil === 2 && (
        <section className="entity-detail-section" aria-labelledby="cliente-invoices-title">
          <div className="entity-detail-section-title">
            <h2 id="cliente-invoices-title">Historial de facturas</h2>
          </div>
          <div className="entity-history-empty">El historial de facturas de {client.name} se mostrará aquí.</div>
        </section>
      )}

      {/* TAB: Documentos */}
      {tabPerfil === 3 && (
        <section className="entity-detail-section" aria-labelledby="cliente-docs-title">
          <div className="entity-detail-section-title">
            <h2 id="cliente-docs-title">Documentos</h2>
          </div>
          <div className="entity-history-empty">Los documentos adjuntos de {client.name} se mostrarán aquí.</div>
        </section>
      )}

      <ClienteFormModal
        isOpen={editOpen}
        client={client}
        onClose={() => setEditOpen(false)}
        onSave={saveClient}
        onSaved={() => setEditOpen(false)}
        billingEntities={entities.filter(e => e.status === 'active')}
        countries={activeCountries}
        getFiscalConditionsByCountry={getFiscalConditionsByCountry}
        taxCategories={activeTaxCategories}
      />

      <ClienteStatusDialog
        client={statusAction ? client : null}
        action={statusAction}
        busy={changingStatus}
        onCancel={() => setStatusAction(null)}
        onConfirm={confirmStatus}
      />

      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="AGREGAR SERVICIO"
        footer={(
          <div className="modal-footer-inner">
            <div className="modal-validation">{servicesError}</div>
            <button className={'btn-guardar' + (selectedCatalog && newSvc.tarifa ? ' ready' : '')} onClick={guardarSvc}
              disabled={!selectedCatalog || !newSvc.tarifa || saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        )}
      >
        <div className="form-group">
          <label htmlFor="svc-catalogo">Servicio del catálogo <span className="label-req">*</span></label>
          <select id="svc-catalogo" className="form-select" name="catalogId" value={newSvc.catalogId} onChange={changeNewSvc}>
            <option value="">Seleccionar servicio</option>
            {activeCatalog.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="svc-tarifa">Tarifa propia <span className="label-req">*</span></label>
          <input id="svc-tarifa" className="form-input" name="tarifa" value={newSvc.tarifa} onChange={changeNewSvc} placeholder="0.00" type="number" min="0" step="0.01" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="svc-moneda">Moneda</label>
            <input id="svc-moneda" className="form-input" value={selectedCatalog?.currency || '—'} disabled />
          </div>
          <div className="form-group">
            <label htmlFor="svc-periodicidad">Periodicidad</label>
            <select id="svc-periodicidad" className="form-select" name="periodicidad" value={newSvc.periodicidad} onChange={changeNewSvc}>
              {SERVICE_PERIODICITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(histService)}
        onClose={() => setHistService(null)}
        title="HISTORIAL DE PRECIOS"
        footer={<button className="btn-arca-secondary" onClick={() => setHistService(null)}>Cerrar</button>}
      >
        <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: -8, marginBottom: 16 }}>{histService?.name} · {client.name}</p>
        {!(histService?.priceHistory?.length) ? (
          <div className="entity-history-empty">Sin historial de cambios.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>FECHA</th><th>ANTERIOR</th><th>NUEVO</th><th>MOTIVO</th></tr></thead>
              <tbody>
                {histService.priceHistory.map(item => (
                  <tr key={item.id}>
                    <td>{item.effectiveDate}</td>
                    <td>{formatMonto(item.previousValue)}</td>
                    <td>{formatMonto(item.newValue)}</td>
                    <td className="td-muted">{item.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  )
}

