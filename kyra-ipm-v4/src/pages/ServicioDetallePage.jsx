import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useServices } from '../context/ServicesContext'
import ServiceCatalogFormModal from '../components/Servicios/ServiceCatalogFormModal'
import ServiceCatalogStatusDialog from '../components/Servicios/ServiceCatalogStatusDialog'

const STATUS_LABEL = { active: 'Activo', inactive: 'Inactivo', archived: 'Archivado' }
const STATUS_BADGE = { active: 'badge-activo', inactive: 'badge-inactivo', archived: 'badge-archivado' }

function fmtPrecio(p, mon) {
  if (p === null || p === undefined) return '—'
  return mon === 'USD'
    ? 'US$ ' + Number(p).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '$ ' + Number(p).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtFecha(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${iso.slice(0, 10)}T00:00:00Z`))
}

export default function ServicioDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { catalog, error: catalogError, saveCatalog, setCatalogStatus, listCatalogPriceHistory } = useServices()
  const service = catalog.find(s => s.id === Number(id)) || null
  const [editOpen, setEditOpen] = useState(false)
  const [statusAction, setStatusAction] = useState(null)
  const [changingStatus, setChangingStatus] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    document.title = service ? `${service.name} — IPM Kyra` : 'Servicio — IPM Kyra'
  }, [service])

  useEffect(() => {
    if (!service) return
    listCatalogPriceHistory(service.id).then(setHistory).catch(() => setHistory([]))
  }, [service, listCatalogPriceHistory])

  if (!service) {
    return (
      <div className="entity-detail-state">
        <h1>Servicio no encontrado</h1>
        <p>{catalogError || 'El registro no existe o ya no está disponible.'}</p>
        <button type="button" className="btn-arca-secondary" onClick={() => navigate('/administracion')}>Volver a Administración</button>
      </div>
    )
  }

  async function confirmStatus(nextStatus) {
    setChangingStatus(true)
    try {
      await setCatalogStatus(service, nextStatus)
      setStatusAction(null)
    } finally {
      setChangingStatus(false)
    }
  }

  return (
    <div className="entity-detail-page">
      <button className="entity-detail-back" type="button" onClick={() => navigate('/administracion')}>
        <span aria-hidden="true">←</span> Servicios
      </button>

      <header className="entity-detail-header">
        <div>
          <div className="entity-detail-heading-row">
            <h1>{service.name}</h1>
            <span className={`badge ${STATUS_BADGE[service.status] || 'badge-inactivo'}`}>
              {STATUS_LABEL[service.status] || service.status}
            </span>
          </div>
          <p>{service.type === 'hourly' ? 'Por hora' : 'Fijo'} · {service.currency} · {service.activeClientsCount ?? 0} clientes activos</p>
        </div>
        <div className="entity-detail-actions">
          {service.status !== 'archived' && (
            <button type="button" className="btn-arca-secondary" onClick={() => setEditOpen(true)}>Editar datos</button>
          )}
          {service.status === 'archived' ? (
            <button type="button" className="btn-arca-secondary" onClick={() => setStatusAction('restore')}>Restaurar</button>
          ) : (
            <>
              <button type="button" className="btn-arca-secondary" onClick={() => setStatusAction(service.status === 'active' ? 'deactivate' : 'activate')}>
                {service.status === 'active' ? 'Desactivar' : 'Activar'}
              </button>
              <button type="button" className="btn-arca-secondary entity-detail-archive" onClick={() => setStatusAction('archive')}>Eliminar</button>
            </>
          )}
        </div>
      </header>

      {catalogError && <div className="admin-data-error" role="alert">{catalogError}</div>}

      <div className="entity-detail-grid">
        <section className="entity-detail-panel entity-detail-data" aria-labelledby="servicio-data-title">
          <div className="entity-detail-panel-heading">
            <span>01</span><h2 id="servicio-data-title">Datos del servicio</h2>
          </div>
          <dl className="entity-detail-list">
            <div><dt>Tipo</dt><dd>{service.type === 'hourly' ? 'Por hora' : 'Fijo'}</dd></div>
            <div><dt>Precio base</dt><dd>{fmtPrecio(service.basePrice, service.currency)}</dd></div>
            <div><dt>Moneda</dt><dd>{service.currency}</dd></div>
            <div><dt>Clientes activos</dt><dd>{service.activeClientsCount ?? 0}</dd></div>
          </dl>
        </section>
      </div>

      <section className="entity-detail-section" aria-labelledby="servicio-history-title">
        <div className="entity-detail-section-title">
          <h2 id="servicio-history-title">Historial de precios</h2>
          <span>{history.length}</span>
        </div>
        {history.length === 0 ? (
          <div className="entity-history-empty">No hay cambios de precio registrados.</div>
        ) : (
          <div className="table-container entity-history-table">
            <table>
              <thead><tr><th>FECHA</th><th>ANTERIOR</th><th>NUEVO</th><th>MOTIVO</th></tr></thead>
              <tbody>
                {history.map(item => (
                  <tr key={item.id}>
                    <td>{fmtFecha(item.effectiveDate)}</td>
                    <td>{fmtPrecio(item.previousPrice, service.currency)}</td>
                    <td>{fmtPrecio(item.newPrice, service.currency)}</td>
                    <td className="td-muted">{item.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ServiceCatalogFormModal
        isOpen={editOpen}
        service={service}
        onClose={() => setEditOpen(false)}
        onSave={saveCatalog}
        onSaved={() => setEditOpen(false)}
      />

      <ServiceCatalogStatusDialog
        service={statusAction ? service : null}
        action={statusAction}
        busy={changingStatus}
        onCancel={() => setStatusAction(null)}
        onConfirm={confirmStatus}
      />
    </div>
  )
}
