import { useState } from 'react'
import Modal from '../components/Modal'
import { ingresos as initialIngresos, clientes, formatMonto, formatFecha } from '../data/mockData'

const TIPOS_COMPROBANTE = ['Factura A', 'Factura B', 'Factura C', 'LLC Invoice', 'Recibo', 'Nota de crédito']
const MONEDAS = ['ARS', 'USD']
const ESTADOS = ['pendiente', 'cobrado']

const EMPTY_FORM = {
  clienteId: '',
  concepto: '',
  monto: '',
  moneda: 'ARS',
  fecha: new Date().toISOString().split('T')[0],
  tipoComprobante: 'Factura A',
  nroComprobante: '',
  estado: 'pendiente',
  notas: '',
}

function Badge({ estado }) {
  const map = {
    cobrado: 'badge-active',
    pendiente: 'badge-pending',
  }
  const label = { cobrado: 'Cobrado', pendiente: 'Pendiente' }
  return <span className={`badge ${map[estado] || 'badge-pending'}`}>{label[estado] || estado}</span>
}

export default function Ingresos() {
  const [ingresos, setIngresos] = useState(initialIngresos)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)

  const filtered = ingresos.filter(i =>
    i.cliente.toLowerCase().includes(search.toLowerCase()) ||
    i.concepto.toLowerCase().includes(search.toLowerCase())
  )

  const totalARS = ingresos.filter(i => i.moneda === 'ARS' && i.estado === 'cobrado').reduce((s, i) => s + i.monto, 0)
  const totalUSD = ingresos.filter(i => i.moneda === 'USD' && i.estado === 'cobrado').reduce((s, i) => s + i.monto, 0)
  const pendienteARS = ingresos.filter(i => i.moneda === 'ARS' && i.estado === 'pendiente').reduce((s, i) => s + i.monto, 0)

  const handleOpen = (ingreso = null) => {
    if (ingreso) {
      setForm({ ...ingreso })
      setEditingId(ingreso.id)
    } else {
      setForm(EMPTY_FORM)
      setEditingId(null)
    }
    setModalOpen(true)
  }

  const handleClose = () => { setModalOpen(false); setForm(EMPTY_FORM); setEditingId(null) }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    if (!form.concepto || !form.monto || !form.fecha) return
    const cliente = clientes.find(c => c.id === Number(form.clienteId))
    if (editingId) {
      setIngresos(prev => prev.map(i => i.id === editingId
        ? { ...form, id: editingId, monto: Number(form.monto), cliente: cliente?.nombre || form.cliente }
        : i
      ))
    } else {
      const newId = Math.max(...ingresos.map(i => i.id)) + 1
      setIngresos(prev => [...prev, {
        ...form, id: newId, monto: Number(form.monto),
        cliente: cliente?.nombre || '—',
      }])
    }
    handleClose()
  }

  const handleToggleEstado = (id) => {
    setIngresos(prev =>
      prev.map(i => i.id === id ? { ...i, estado: i.estado === 'cobrado' ? 'pendiente' : 'cobrado' } : i)
    )
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ingresos</h1>
          <p className="page-subtitle">{ingresos.length} comprobante{ingresos.length !== 1 ? 's' : ''} registrado{ingresos.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpen()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo ingreso
        </button>
      </div>

      {/* Summary cards */}
      <div className="summary-row">
        <div className="summary-card">
          <div className="summary-label">Cobrado ARS</div>
          <div className="summary-value">{formatMonto(totalARS, 'ARS')}</div>
          <div className="summary-note">en el período</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Cobrado USD</div>
          <div className="summary-value">{formatMonto(totalUSD, 'USD')}</div>
          <div className="summary-note">en el período</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Pendiente de cobro</div>
          <div className="summary-value" style={{ color: '#D4C9A8' }}>{formatMonto(pendienteARS, 'ARS')}</div>
          <div className="summary-note">{ingresos.filter(i => i.estado === 'pendiente').length} comprobante{ingresos.filter(i => i.estado === 'pendiente').length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
          <input
            className="search-input"
            placeholder="Buscar cliente o concepto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Concepto</th>
              <th>Comprobante</th>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-icon">◻</div>
                  <div className="empty-title">Sin ingresos registrados</div>
                  <div className="empty-desc">Agregá el primer ingreso con el botón "Nuevo ingreso".</div>
                </div>
              </td></tr>
            ) : filtered.map(i => (
              <tr key={i.id}>
                <td style={{ fontWeight: 500 }}>{i.cliente}</td>
                <td className="td-secondary" style={{ maxWidth: '260px' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {i.concepto}
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '12px', color: '#AFAFAF' }}>{i.tipoComprobante}</div>
                  <div style={{ fontSize: '11px', color: '#555', fontFamily: 'monospace' }}>{i.nroComprobante}</div>
                </td>
                <td className="td-secondary td-mono">{formatFecha(i.fecha)}</td>
                <td className="td-mono" style={{ fontWeight: 500 }}>{formatMonto(i.monto, i.moneda)}</td>
                <td><Badge estado={i.estado} /></td>
                <td>
                  <div className="row-actions">
                    <button className="action-btn" onClick={() => handleOpen(i)}>Editar</button>
                    <button className="action-btn" onClick={() => handleToggleEstado(i.id)}>
                      {i.estado === 'cobrado' ? 'Pendiente' : 'Marcar cobrado'}
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
        title={editingId ? 'Editar ingreso' : 'Nuevo ingreso'}
        footer={
          <>
            <button className="btn-ghost" onClick={handleClose}>Cancelar</button>
            <button className="btn-primary" onClick={handleSubmit}>
              {editingId ? 'Guardar cambios' : 'Registrar ingreso'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Cliente</label>
            <select className="form-select" name="clienteId" value={form.clienteId} onChange={handleChange}>
              <option value="">— Seleccioná un cliente —</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Concepto *</label>
            <input className="form-input" name="concepto" value={form.concepto} onChange={handleChange} placeholder="Servicio de marketing mensual · Julio 2026" />
          </div>

          <div className="form-group">
            <label className="form-label">Moneda</label>
            <select className="form-select" name="moneda" value={form.moneda} onChange={handleChange}>
              {MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Monto *</label>
            <input className="form-input" name="monto" type="number" value={form.monto} onChange={handleChange} placeholder="500000" />
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de comprobante</label>
            <select className="form-select" name="tipoComprobante" value={form.tipoComprobante} onChange={handleChange}>
              {TIPOS_COMPROBANTE.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nro. de comprobante</label>
            <input className="form-input" name="nroComprobante" value={form.nroComprobante} onChange={handleChange} placeholder="A 0001-00000090" />
          </div>

          <div className="form-group">
            <label className="form-label">Fecha *</label>
            <input className="form-input" name="fecha" type="date" value={form.fecha} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select className="form-select" name="estado" value={form.estado} onChange={handleChange}>
              {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </>
  )
}
