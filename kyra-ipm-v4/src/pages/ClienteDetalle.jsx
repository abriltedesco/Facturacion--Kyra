import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useClients } from '../context/ClientsContext'
import { useServices } from '../context/ServicesContext'
import { SERVICE_PERIODICITY_OPTIONS } from '../domain/serviceRules'

const CLIENT_STATUS_LABEL = { active: 'ACTIVO', inactive: 'INACTIVO', archived: 'ARCHIVADO' }
const VOUCHER_LABEL = { A: 'A', B_EXEMPT: 'B (Exento IVA)', C: 'C', LLC: 'Invoice LLC' }
const IPC_PERIODICITY_LABEL = { monthly: 'Mensual', quarterly: 'Trimestral', semiannual: 'Semestral', annual: 'Anual' }
const SERVICE_STATUS_LABEL = { active: 'ACTIVO', paused: 'PAUSADO', finished: 'FINALIZADO' }
const SERVICE_PERIODICITY_LABEL = Object.fromEntries(SERVICE_PERIODICITY_OPTIONS.map(o => [o.value, o.label]))

function formatTarifa(service) {
  const amount = service.type === 'fixed' ? service.baseAmount : service.hourlyRate
  if (amount === null || amount === undefined) return '—'
  const formatted = Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return service.type === 'hourly' ? `$${formatted}/h` : `$${formatted}`
}

const TABS_PERFIL = ['Datos generales', 'Servicios', 'Historial de facturas', 'Documentos']

const BADGE_MAP = {
  ACTIVO:    'badge badge-activo',
  PAUSADO:   'badge badge-emitida',
  FINALIZADO:'badge badge-inactivo',
}

export default function ClienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getClient, loading } = useClients()
  const { activeCatalog, getClientServices, loadClientServices, saveClientService, error: servicesError } = useServices()
  const client = getClient(id)
  const cliente = client
    ? {
        nombre: client.name,
        estado: CLIENT_STATUS_LABEL[client.status] || client.status,
        subtitulo: `Cliente ${(CLIENT_STATUS_LABEL[client.status] || client.status).toLowerCase()} · ${client.country?.name || 'sin país'} · ${client.billingEntity?.name || 'sin entidad emisora'}`,
      }
    : { nombre: loading ? 'Cargando…' : 'Cliente no encontrado', estado: '—', subtitulo: '' }
  const [tabPerfil, setTabPerfil]   = useState(1)  /* default: Servicios */
  const [histPanel, setHistPanel]   = useState(null)
  const [addModal, setAddModal]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [newSvc, setNewSvc]         = useState({ catalogId: '', tarifa: '', periodicidad: 'monthly' })

  const servicios = client ? getClientServices(client.id) : []

  useEffect(() => {
    if (client) loadClientServices(client.id).catch(() => {})
  }, [client, loadClientServices])

  const changeNewSvc = e => setNewSvc(p => ({ ...p, [e.target.name]: e.target.value }))
  const selectedCatalog = activeCatalog.find(c => String(c.id) === String(newSvc.catalogId))
  const guardarSvc = async () => {
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

  return (
    <div className="entidad-page">
      {/* Overlay historial */}
      {histPanel !== null && (
        <div className="modal-overlay" onClick={() => setHistPanel(null)}>
          <aside className="error-panel hist-panel" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="error-panel-header">
              <div>
                <h2 className="error-panel-title">Historial de precios</h2>
                <p className="error-panel-sub">{servicios[histPanel]?.name} · {cliente.nombre}</p>
              </div>
              <button className="error-panel-close" onClick={() => setHistPanel(null)}>✕</button>
            </div>
            <div className="error-panel-divider" />
            <div className="hist-list">
              {(servicios[histPanel]?.priceHistory || []).map(item => (
                <div key={item.id} className="hist-item">
                  <div className="hist-fecha">{item.effectiveDate}</div>
                  <div className="hist-cambio">
                    <span className="hist-anterior">{item.previousValue === null ? '—' : `$${item.previousValue.toLocaleString('es-AR')}`}</span>
                    <span className="hist-arrow"> → </span>
                    <span className="hist-nuevo">{`$${item.newValue.toLocaleString('es-AR')}`}</span>
                  </div>
                  <div className="hist-motivo">{item.reason}</div>
                </div>
              ))}
              {!(servicios[histPanel]?.priceHistory?.length) && (
                <p className="entidad-empty">Sin historial de cambios.</p>
              )}
            </div>
            <button className="btn-secondary-full" style={{ margin: '16px 24px' }} onClick={() => setHistPanel(null)}>Cerrar</button>
          </aside>
        </div>
      )}

      {/* Modal agregar servicio */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="pago-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="pago-modal-header">
              <h2 className="pago-modal-title">Agregar servicio</h2>
              <button className="error-panel-close" onClick={() => setAddModal(false)}>✕</button>
            </div>
            <div className="error-panel-divider" />
            <div className="pago-modal-body">
              <div className="form-group">
                <label className="form-label">Servicio del catálogo <span className="label-req">*</span></label>
                <select className="form-select" name="catalogId" value={newSvc.catalogId} onChange={changeNewSvc}>
                  <option value="">Seleccionar servicio</option>
                  {activeCatalog.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tarifa propia <span className="label-req">*</span></label>
                <input className="form-input" name="tarifa" value={newSvc.tarifa} onChange={changeNewSvc} placeholder="0.00" type="number" min="0" step="0.01" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Moneda</label>
                  <input className="form-input" value={selectedCatalog?.currency || '—'} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Periodicidad</label>
                  <select className="form-select" name="periodicidad" value={newSvc.periodicidad} onChange={changeNewSvc}>
                    {SERVICE_PERIODICITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              {servicesError && <p className="form-error">{servicesError}</p>}
            </div>
            <div className="error-panel-divider" />
            <div className="pago-modal-footer">
              <button className="btn-cta" style={{ width: '100%' }} onClick={guardarSvc}
                disabled={!selectedCatalog || !newSvc.tarifa || saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
              <button className="btn-secondary-full" onClick={() => setAddModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="entidad-breadcrumb">
        <button className="entidad-back" onClick={() => navigate('/administracion')}>← Clientes</button>
      </div>

      {/* Encabezado */}
      <div className="entidad-heading">
        <div className="entidad-heading-row">
          <h1 className="entidad-nombre">{cliente.nombre}</h1>
          <span className="badge badge-activo" style={{ marginLeft: 16 }}>{cliente.estado}</span>
        </div>
        <p className="entidad-subtitulo">{cliente.subtitulo}</p>
      </div>
      <div className="entidad-divider" />

      {/* Tabs perfil */}
      <div role="tablist" className="subtabs" style={{ marginTop: 24 }}>
        {TABS_PERFIL.map((t, i) => (
          <button key={t} role="tab" aria-selected={tabPerfil === i}
            className={'subtab' + (tabPerfil === i ? ' active' : '')}
            onClick={() => setTabPerfil(i)}>{t}</button>
        ))}
      </div>

      {/* TAB: Servicios */}
      {tabPerfil === 1 && (
        <div style={{ marginTop: 24 }}>
          <div className="servicios-section-header">
            <h2 className="entidad-section-title" style={{ margin: 0 }}>Servicios de {cliente.nombre}</h2>
            <button className="btn-cta" style={{ fontSize: 13 }} onClick={() => setAddModal(true)}>
              + Agregar servicio
            </button>
          </div>

          <div className="table-container" style={{ marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>SERVICIO</th>
                  <th>TIPO</th>
                  <th>TARIFA</th>
                  <th>MONEDA</th>
                  <th>PERIODICIDAD</th>
                  <th>ESTADO</th>
                  <th>HISTORIAL</th>
                  <th><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((s, i) => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td className="td-muted">{s.type === 'fixed' ? 'Fijo' : 'Por hora'}</td>
                    <td>{formatTarifa(s)}</td>
                    <td><span className="moneda-badge">{s.currency}</span></td>
                    <td className="td-muted">{SERVICE_PERIODICITY_LABEL[s.periodicity] || s.periodicity}</td>
                    <td><span className={BADGE_MAP[SERVICE_STATUS_LABEL[s.status]] || 'badge'}>{SERVICE_STATUS_LABEL[s.status] || s.status}</span></td>
                    <td>
                      <button className="link-nro" style={{ fontWeight: 500, fontSize: 13 }}
                        onClick={() => setHistPanel(i)}>Ver →</button>
                    </td>
                    <td><button className="dots-btn">⋮</button></td>
                  </tr>
                ))}
                {servicios.length === 0 && (
                  <tr><td colSpan={8} className="td-empty">Sin servicios cargados</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="servicios-nota">Los precios y condiciones por cliente se configuran aquí. El catálogo base se gestiona en Administración.</p>
        </div>
      )}

      {/* TAB: Datos generales */}
      {tabPerfil === 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="entidad-card entidad-card-datos" style={{ maxWidth: 560 }}>
            <h2 className="entidad-card-title">Datos generales</h2>
            {client ? [
              ['Entidad emisora', client.billingEntity?.name || '—'],
              ['Tipo de factura', VOUCHER_LABEL[client.billingEntity?.defaultVoucher] || '—'],
              ['País', client.country?.name || '—'],
              ['Condición fiscal', client.fiscalCondition?.name || '—'],
              ['Identificación fiscal', client.fiscalId || '—'],
              ['Categoría de impuesto adicional', client.taxCategory ? `${client.taxCategory.name} (${client.taxCategory.taxRate}%)` : 'Sin impuesto adicional'],
              ['Email principal', client.primaryEmail || '—'],
              ['Emails en copia', client.ccEmails?.length ? client.ccEmails.join(', ') : '—'],
              ['Actualización por IPC', client.ipcAdjustable ? `Sí — ${IPC_PERIODICITY_LABEL[client.ipcPeriodicity] || client.ipcPeriodicity}` : 'No'],
              ['Carpeta de Drive', client.driveFolderRef || '—'],
              ['Notas internas', client.internalNotes || '—'],
            ].map(([label, val]) => (
              <div key={label} className="entidad-dato-row"><span className="entidad-dato-label">{label}</span><span className="entidad-dato-val">{val}</span></div>
            )) : (
              <p className="entidad-empty">{loading ? 'Cargando datos del cliente…' : 'No encontramos este cliente.'}</p>
            )}
          </div>
        </div>
      )}

      {/* TABs: Historial y Documentos — placeholders */}
      {tabPerfil === 2 && (
        <div style={{ marginTop: 24 }}>
          <p className="entidad-empty">El historial de facturas de {cliente.nombre} se mostrará aquí.</p>
        </div>
      )}
      {tabPerfil === 3 && (
        <div style={{ marginTop: 24 }}>
          <p className="entidad-empty">Los documentos adjuntos de {cliente.nombre} se mostrarán aquí.</p>
        </div>
      )}
    </div>
  )
}
