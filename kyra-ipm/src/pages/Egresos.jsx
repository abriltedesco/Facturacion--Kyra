import { useState } from 'react'
import Modal from '../components/Modal'
import { egresos as initialEgresos, formatMonto, formatFecha } from '../data/mockData'

const CATEGORIAS = ['Software', 'Marketing', 'Personal', 'Impuestos', 'Servicios', 'Otro']
const MONEDAS = ['ARS', 'USD']
const ESTADOS = ['pendiente', 'pagado']

const EMPTY_FORM = {
  proveedor: '',
  concepto: '',
  monto: '',
  moneda: 'ARS',
  categoria: 'Software',
  fecha: new Date().toISOString().split('T')[0],
  estado: 'pendiente',
  comprobante: '',
  notas: '',
}

function Badge({ estado }) {
  const map = {
    pagado: 'badge-active',
    pendiente: 'badge-pending',
  }
  const label = { pagado: 'Pagado', pendiente: 'Pendiente' }
  return <span className={`badge ${map[estado] || 'badge-pending'}`}>{label[estado] || estado}</span>
}

function CategoryTag({ categoria }) {
  return (
    <span style={{
      fontSize: '11px',
      color: '#AFAFAF',
      background: '#1e1e1e',
      border: '1px solid #2A2A2A',
      padding: '2px 8px',
      borderRadius: '4px',
    }}>
      {categoria}
    </span>
  )
}

export default function Egresos() {
  const [egresos, setEgresos] = useState(initialEgresos)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)

  const filtered = egresos.filter(e =>
    e.proveedor.toLowerCase().includes(search.toLowerCase()) ||
    e.concepto.toLowerCase().includes(search.toLowerCase()) ||
    e.categoria.toLowerCase().includes(search.toLowerCase())
  )

  const totalARS = egresos.filter(e => e.moneda === 'ARS').reduce((s, e) => s + e.monto, 0)
  const totalUSD = egresos.filter(e => e.moneda === 'USD').reduce((s, e) => s + e.monto, 0)
  const pendienteARS = egresos.filter(e => e.moneda === 'ARS' && e.estado === 'pendiente').reduce((s, e) => s + e.monto, 0)

  const handleOpen = (egreso = null) => {
    if (egreso) { setForm({ ...egreso }); setEditingId(egreso.id) }
    else { setForm(EMPTY_FORM); setEditingId(null) }
    setModalOpen(true)
  }

  const handleClose = () => { setModalOpen(false); setForm(EMPTY_FORM); setEditingId(null) }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    if (!form.proveedor || !form.concepto || !form.monto || !form.fecha) return
    if (editingId) {
      setEgresos(prev => prev.map(e => e.id === editingId ? { ...form, id: editingId, monto: Number(form.monto) } : e))
    } else {
      const newId = Math.max(...egresos.map(e => e.id)) + 1
      setEgresos(prev => [...prev, { ...form, id: newId, monto: Number(form.monto) }])
    }
    handleClose()
  }

  const handleToggleEstado = (id) => {
    setEgresos(prev =>
      prev.map(e => e.id === id ? { ...e, estado: e.estado === 'pagado' ? 'pendiente' : 'pagado' } : e)
    )
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Egresos</h1>
          <p className="page-subtitle">{egresos.length} egreso{egresos.length !== 1 ? 's' : ''} registrado{egresos.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpen()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo egreso
        </button>
      </div>

      {/* Summary cards */}
      <div className="summary-row">
        <div className="summary-card">
          <div className="summary-label">Total egresos ARS</div>
          <div className="summary-value">{formatMonto(totalARS, 'ARS')}</div>
          <div className="summary-note">en el período</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total egresos USD</div>
          <div className="summary-value">{formatMonto(totalUSD, 'USD')}</div>
          <div className="summary-note">en el período</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Pendiente de pago</div>
          <div className="summary-value" style={{ color: '#D4C9A8' }}>{formatMonto(pendienteARS, 'ARS')}</div>
          <div className="summary-note">{egresos.filter(e => e.estado === 'pendiente').length} ítem{egresos.filter(e => e.estado === 'pendiente').length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
          <input
            className="search-input"
            placeholder="Buscar proveedor o categoría..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Concepto</th>
              <th>Categoría</th>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Comprobante</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8}>
                <div className="empty-state">
                  <div className="empty-icon">◻</div>
                  <div className="empty-title">Sin egresos registrados</div>
                  <div className="empty-desc">Agregá el primer egreso con el botón "Nuevo egreso".</div>
                </div>
              </td></tr>
            ) : filtered.map(e => (
              <tr key={e.id}>
                <td style={{ fontWeight: 500 }}>{e.proveedor}</td>
                <td className="td-secondary" style={{ maxWidth: '220px' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.concepto}
                  </div>
                </td>
                <td><CategoryTag categoria={e.categoria} /></td>
                <td className="td-secondary td-mono">{formatFecha(e.fecha)}</td>
                <td className="td-mono" style={{ fontWeight: 500 }}>{formatMonto(e.monto, e.moneda)}</td>
                <td className="td-secondary" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                  {e.comprobante || <span style={{ color: '#444' }}>—</span>}
                </td>
                <td><Badge estado={e.estado} /></td>
                <td>
                  <div className="row-actions">
                    <button className="action-btn" onClick={() => handleOpen(e)}>Editar</button>
                    <button className="action-btn" onClick={() => handleToggleEstado(e.id)}>
                      {e.estado === 'pagado' ? 'Revertir' : 'Marcar pagado'}
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
        title={editingId ? 'Editar egreso' : 'Nuevo egreso'}
        footer={
          <>
            <button className="btn-ghost" onClick={handleClose}>Cancelar</button>
            <button className="btn-primary" onClick={handleSubmit}>
              {editingId ? 'Guardar cambios' : 'Registrar egreso'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Proveedor *</label>
            <input className="form-input" name="proveedor" value={form.proveedor} onChange={handleChange} placeholder="Google Workspace" />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Concepto *</label>
            <input className="form-input" name="concepto" value={form.concepto} onChange={handleChange} placeholder="Suscripción mensual · Business Starter" />
          </div>

          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select className="form-select" name="categoria" value={form.categoria} onChange={handleChange}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fecha *</label>
            <input className="form-input" name="fecha" type="date" value={form.fecha} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Moneda</label>
            <select className="form-select" name="moneda" value={form.moneda} onChange={handleChange}>
              {MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Monto *</label>
            <input className="form-input" name="monto" type="number" value={form.monto} onChange={handleChange} placeholder="45000" />
          </div>

          <div className="form-group">
            <label className="form-label">Nro. de comprobante</label>
            <input className="form-input" name="comprobante" value={form.comprobante} onChange={handleChange} placeholder="RCP-GWS-202607" />
          </div>
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select className="form-select" name="estado" value={form.estado} onChange={handleChange}>
              {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Notas</label>
            <textarea className="form-textarea" name="notas" value={form.notas} onChange={handleChange} placeholder="Observaciones..." />
          </div>
        </div>
      </Modal>
    </>
  )
}
