import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProveedores } from '../context/ProveedoresContext'
import ProveedorFormModal from '../components/Proveedores/ProveedorFormModal'
import ProveedorStatusDialog from '../components/Proveedores/ProveedorStatusDialog'

const STATUS_LABEL = { active: 'Activo', inactive: 'Inactivo' }

export default function ProveedorDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getProveedor, saveProveedor, setProveedorStatus, deleteProveedor } = useProveedores()
  const proveedor = getProveedor(id)
  const [editOpen, setEditOpen] = useState(false)
  const [statusAction, setStatusAction] = useState(null)

  useEffect(() => {
    document.title = proveedor ? `${proveedor.nombre} — IPM Kyra` : 'Proveedor — IPM Kyra'
  }, [proveedor])

  if (!proveedor) {
    return (
      <div className="entity-detail-state">
        <h1>Proveedor no encontrado</h1>
        <p>El registro no existe o ya no está disponible.</p>
        <button type="button" className="btn-arca-secondary" onClick={() => navigate('/administracion')}>Volver a Administración</button>
      </div>
    )
  }

  function confirmStatusAction() {
    if (statusAction === 'delete') {
      deleteProveedor(proveedor)
      navigate('/administracion')
      return
    }
    setProveedorStatus(proveedor, statusAction === 'activate' ? 'active' : 'inactive')
    setStatusAction(null)
  }

  return (
    <div className="entity-detail-page">
      <button className="entity-detail-back" type="button" onClick={() => navigate('/administracion')}>
        <span aria-hidden="true">←</span> Proveedores
      </button>

      <header className="entity-detail-header">
        <div>
          <div className="entity-detail-heading-row">
            <h1>{proveedor.nombre}</h1>
            <span className={`badge ${proveedor.status === 'active' ? 'badge-activo' : 'badge-inactivo'}`}>
              {STATUS_LABEL[proveedor.status] || proveedor.status}
            </span>
          </div>
          <p>{proveedor.tipoServicio || 'Sin tipo de servicio'} · {proveedor.mail}</p>
        </div>
        <div className="entity-detail-actions">
          <button type="button" className="btn-arca-secondary" onClick={() => setEditOpen(true)}>Editar datos</button>
          <button type="button" className="btn-arca-secondary" onClick={() => setStatusAction(proveedor.status === 'active' ? 'deactivate' : 'activate')}>
            {proveedor.status === 'active' ? 'Desactivar' : 'Activar'}
          </button>
          <button type="button" className="btn-arca-secondary entity-detail-archive" onClick={() => setStatusAction('delete')}>Eliminar</button>
        </div>
      </header>

      <div className="entity-detail-grid">
        <section className="entity-detail-panel entity-detail-data" aria-labelledby="proveedor-data-title">
          <div className="entity-detail-panel-heading">
            <span>01</span><h2 id="proveedor-data-title">Datos del proveedor</h2>
          </div>
          <dl className="entity-detail-list">
            <div><dt>Email</dt><dd>{proveedor.mail}</dd></div>
            <div><dt>Tipo de servicio</dt><dd>{proveedor.tipoServicio || '—'}</dd></div>
            <div><dt>Método de pago</dt><dd>{proveedor.medioPago || '—'}</dd></div>
            <div><dt>Destino</dt><dd>{proveedor.destino || '—'}</dd></div>
            <div><dt>CUIT</dt><dd>{proveedor.cuit || '—'}</dd></div>
          </dl>
        </section>
      </div>

      <ProveedorFormModal
        isOpen={editOpen}
        proveedor={proveedor}
        onClose={() => setEditOpen(false)}
        onSave={saveProveedor}
        onSaved={() => setEditOpen(false)}
      />

      <ProveedorStatusDialog
        proveedor={statusAction ? proveedor : null}
        action={statusAction}
        onCancel={() => setStatusAction(null)}
        onConfirm={confirmStatusAction}
      />
    </div>
  )
}
