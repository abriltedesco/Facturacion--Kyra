import { useState } from 'react'
import Modal from '../components/Modal'
import { clientes as initialClientes, formatMonto } from '../data/mockData'

const TIPOS_FACTURA = ['A', 'B', 'C', 'LLC']
const MONEDAS = ['ARS', 'USD']
const CONDICIONES_IVA = [
  'Responsable Inscripto',
  'Monotributista',
  'Exento',
  'Consumidor Final',
  'Exterior',
]
const ESTADOS = ['activo', 'inactivo']

const EMPTY_FORM = {
  nombre: '',
  razonSocial: '',
  cuit: '',
  email: '',
  tipoFactura: 'A',
  moneda: 'ARS',
  montoBase: '',
  condicionIVA: 'Responsable Inscripto',
  estado: 'activo',
  notas: '',
}

function Badge({ estado }) {
  const map = {
    activo: 'badge-active',
    inactivo: 'badge-inactive',
  }
  return <span className={`badge ${map[estado] || 'badge-pending'}`}>{estado}</span>
}

export default function Administracion() {
  const [clientes, setClientes] = useState(initialClientes)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)

  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpen = (cliente = null) => {
    if (cliente) {
      setForm({ ...cliente })
      setEditingId(cliente.id)
    } else {
      setForm(EMPTY_FORM)
      setEditingId(null)
    }
    setModalOpen(true)
  }

  const handleClose = () => {
    setModalOpen(false)
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    if (!form.nombre || !form.cuit || !form.email || !form.montoBase) return
    if (editingId) {
      setClientes(prev => prev.map(c => c.id === editingId ? { ...form, id: editingId } : c))
    } else {
      const newId = Math.max(...clientes.map(c => c.id)) + 1
      setClientes(prev => [...prev, { ...form, id: newId, montoBase: Number(form.montoBase) }])
    }
    handleClose()
  }

  const handleToggleEstado = (id) => {
    setClientes(prev =>
      prev.map(c => c.id === id ? { ...c, estado: c.estado === 'activo' ? 'inactivo' : 'activo' } : c)
    )
  }

  const activos = clientes.filter(c => c.estado === 'activo').length

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Administración</h1>
          <p className="page-subtitle">{activos} cliente{activos !== 1 ? 's' : ''} activo{activos !== 1 ? 's' : ''} · {clientes.length} en total</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpen()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo cliente
        </button>
      </div>

      {/* Summary cards */}
      <div className="summary-row">
        <div className="summary-card">
          <div className="summary-label">Clientes activos</div>
          <div className="summary-value">{activos}</div>
          <div className="summary-note">de {clientes.length} totales</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Facturación base (ARS)</div>
          <div className="summary-value">
            {formatMonto(
              clientes.filter(c => c.estado === 'activo' && c.moneda === 'ARS')
                .reduce((sum, c) => sum + c.montoBase, 0),
              'ARS'
            )}
          </div>
          <div className="summary-note">mensual estimado</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Facturación base (USD)</div>
          <div className="summary-value">
            {formatMonto(
              clientes.filter(c => c.estado === 'activo' && c.moneda === 'USD')
                .reduce((sum, c) => sum + c.montoBase, 0),
              'USD'
            )}
          </div>
          <div className="summary-note">mensual estimado</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
          <input
            className="search-input"
            placeholder="Buscar cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>CUIT / CUIL</th>
              <th>Email</th>
              <th>Tipo</th>
              <th>Monto base</th>
              <th>Condición IVA</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-icon">◻</div>
                    <div className="empty-title">Sin resultados</div>
                    <div className="empty-desc">No hay clientes que coincidan con la búsqueda.</div>
                  </div>
                </td>
              </tr>
            ) : filtered.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{c.nombre}</div>
                  <div className="td-secondary">{c.razonSocial}</div>
                </td>
                <td className="td-secondary td-mono">{c.cuit}</td>
                <td className="td-secondary">{c.email}</td>
                <td>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    background: 'rgba(212,201,168,0.08)',
                    color: '#D4C9A8',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>
                    Fact. {c.tipoFactura}
                  </span>
                </td>
                <td className="td-mono">{formatMonto(c.montoBase, c.moneda)}</td>
                <td className="td-secondary" style={{ fontSize: '12px' }}>{c.condicionIVA}</td>
                <td><Badge estado={c.estado} /></td>
                <td>
                  <div className="row-actions">
                    <button className="action-btn" onClick={() => handleOpen(c)}>Editar</button>
                    <button className="action-btn" onClick={() => handleToggleEstado(c.id)}>
                      {c.estado === 'activo' ? 'Pausar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title={editingId ? 'Editar cliente' : 'Nuevo cliente'}
        footer={
          <>
            <button className="btn-ghost" onClick={handleClose}>Cancelar</button>
            <button className="btn-primary" onClick={handleSubmit}>
              {editingId ? 'Guardar cambios' : 'Agregar cliente'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Nombre del cliente *</label>
            <input className="form-input" name="nombre" value={form.nombre} onChange={handleChange} placeholder="TechCorp Argentina" />
          </div>
          <div className="form-group">
            <label className="form-label">Razón social</label>
            <input className="form-input" name="razonSocial" value={form.razonSocial} onChange={handleChange} placeholder="TechCorp S.A." />
          </div>

          <div className="form-group">
            <label className="form-label">CUIT / CUIL *</label>
            <input className="form-input" name="cuit" value={form.cuit} onChange={handleChange} placeholder="30-71234567-8" />
          </div>
          <div className="form-group">
            <label className="form-label">Email de contacto *</label>
            <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="admin@empresa.com" />
          </div>

          <div className="form-divider full" style={{ gridColumn: '1 / -1' }} />

          <div className="form-group">
            <label className="form-label">Tipo de factura</label>
            <select className="form-select" name="tipoFactura" value={form.tipoFactura} onChange={handleChange}>
              {TIPOS_FACTURA.map(t => <option key={t} value={t}>Factura {t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Condición IVA</label>
            <select className="form-select" name="condicionIVA" value={form.condicionIVA} onChange={handleChange}>
              {CONDICIONES_IVA.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Moneda</label>
            <select className="form-select" name="moneda" value={form.moneda} onChange={handleChange}>
              {MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Monto mensual base *</label>
            <input className="form-input" name="montoBase" type="number" value={form.montoBase} onChange={handleChange} placeholder="500000" />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Estado</label>
            <select className="form-select" name="estado" value={form.estado} onChange={handleChange}>
              {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Notas internas</label>
            <textarea className="form-textarea" name="notas" value={form.notas} onChange={handleChange} placeholder="Observaciones sobre este cliente..." />
          </div>
        </div>
      </Modal>
    </>
  )
}
