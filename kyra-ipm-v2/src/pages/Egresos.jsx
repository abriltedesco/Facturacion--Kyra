import { useState } from 'react'
import Modal from '../components/Modal'

const PAGE_SIZE = 9

const ESTADOS = ['PENDIENTE', 'APROBADA', 'EMITIDA', 'ERROR']

const EGRESOS_DATA = Array.from({ length: 180 }, (_, i) => ({
  id: i + 1,
  nro: String(i + 1).padStart(5, '0'),
  estado: ESTADOS[i % 4],
  contacto: 'Proveedor',
  emision: '01/07/2026',
  vencimiento: '31/07/2026',
  pago: i % 4 === 2 ? '15/07/2026' : '-',
  concepto: 'Concepto',
  total: '$' + ((i % 10 + 1) * 500),
}))

const TABS = ['Pendientes', 'Historial']

const EMPTY_EGRESO = {
  contacto: '', concepto: '', total: '', emision: '', vencimiento: '',
}

function Badge({ estado }) {
  const cls = {
    PENDIENTE: 'badge badge-pendiente',
    APROBADA:  'badge badge-aprobada',
    EMITIDA:   'badge badge-emitida',
    ERROR:     'badge badge-error',
  }[estado] || 'badge'
  return <span className={cls}>{estado}</span>
}

function FilterBox({ label, options, value, onChange }) {
  return (
    <div className="filter-box">
      <span className="filter-box-label">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Todos</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Pagination({ total, page, setPage }) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)
  return (
    <div className="pagination">
      <span className="pagination-info">{from}-{to} de {total}</span>
      <div className="pagination-pages">
        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
          <button
            key={i + 1}
            className={`page-btn${page === i + 1 ? ' active' : ''}`}
            onClick={() => setPage(i + 1)}
          >{i + 1}</button>
        ))}
        {totalPages > 10 && <span className="page-btn" style={{ cursor: 'default', border: 'none' }}>…</span>}
      </div>
    </div>
  )
}

export default function Egresos() {
  const [tab, setTab] = useState('Pendientes')
  const [page, setPage] = useState(1)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroContacto, setFiltroContacto] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_EGRESO)

  const pendientes = EGRESOS_DATA.filter(r => r.estado === 'PENDIENTE')
  const historial  = EGRESOS_DATA.filter(r => r.estado !== 'PENDIENTE')
  const base = tab === 'Pendientes' ? pendientes : historial

  const filtered = base.filter(r => {
    const matchEstado = !filtroEstado || r.estado === filtroEstado
    const matchContacto = !filtroContacto || r.contacto === filtroContacto
    return matchEstado && matchContacto
  })

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  const isReady = form.contacto && form.concepto && form.total

  const guardar = () => {
    if (!isReady) return
    setOpen(false)
    setForm(EMPTY_EGRESO)
  }

  return (
    <>
      <h1 className="page-title">Egresos</h1>

      {/* Toolbar - filters ABOVE tabs, CTA on right */}
      <div className="toolbar">
        <FilterBox label="Estado" options={ESTADOS} value={filtroEstado} onChange={v => { setFiltroEstado(v); setPage(1) }} />
        <FilterBox label="Contacto" options={['Proveedor']} value={filtroContacto} onChange={v => { setFiltroContacto(v); setPage(1) }} />
        <FilterBox label="Concepto" options={['Concepto']} value="" onChange={() => {}} />
        <div className="toolbar-right">
          <button className="btn-cta" onClick={() => setOpen(true)}>
            NUEVO EGRESO
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="subtabs">
        {TABS.map(t => (
          <button key={t} className={`subtab${tab === t ? ' active' : ''}`} onClick={() => { setTab(t); setPage(1) }}>{t}</button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nro</th>
              <th>Estado</th>
              <th>Contacto</th>
              <th>Emisión</th>
              <th>Vencimiento</th>
              <th>Pago</th>
              <th>Concepto</th>
              <th>Total</th>
              <th style={{ width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map(r => (
              <tr key={r.id}>
                <td><a href="#" className="link-nro">#{r.nro}</a></td>
                <td><Badge estado={r.estado} /></td>
                <td>{r.contacto}</td>
                <td className="td-muted">{r.emision}</td>
                <td className="td-muted">{r.vencimiento}</td>
                <td className="td-muted">{r.pago}</td>
                <td className="td-muted">{r.concepto}</td>
                <td className="td-muted">{r.total}</td>
                <td><button className="dots-btn" title="Opciones">⋮</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination total={filtered.length} page={page} setPage={setPage} />

      {/* Modal Nuevo Egreso */}
      <Modal
        isOpen={open}
        onClose={() => { setOpen(false); setForm(EMPTY_EGRESO) }}
        title="Nuevo Egreso"
        footer={
          <>
            <div className="modal-validation">
              {!isReady && (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Faltan llenar datos
                </>
              )}
            </div>
            <button className={`btn-guardar${isReady ? ' ready' : ''}`} onClick={guardar}>Guardar</button>
          </>
        }
      >
        <div className="form-group">
          <label>Contacto / Proveedor</label>
          <input className="form-input" name="contacto" value={form.contacto} onChange={change} />
        </div>
        <div className="form-group">
          <label>Concepto</label>
          <input className="form-input" name="concepto" value={form.concepto} onChange={change} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Fecha de Emisión</label>
            <input className="form-input" name="emision" type="date" value={form.emision} onChange={change} />
          </div>
          <div className="form-group">
            <label>Vencimiento</label>
            <input className="form-input" name="vencimiento" type="date" value={form.vencimiento} onChange={change} />
          </div>
        </div>
        <div className="form-group">
          <label>Total</label>
          <input className="form-input" name="total" value={form.total} onChange={change} placeholder="$0" />
        </div>
      </Modal>
    </>
  )
}
