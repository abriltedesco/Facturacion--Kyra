import { useState } from 'react'
import Modal from '../components/Modal'

const TABS = ['Clientes', 'Proveedores', 'Entidades', 'Servicios']

const CLIENTES = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  nombre: 'Cliente',
  estado: i % 3 === 0 ? 'inactivo' : 'activo',
  mail: 'mailCliente@gmail.com',
  tipoFactura: 'Periodo',
  impuesto: 'Impuesto',
  identificacion: 'Identificación Fiscal',
}))

const EMPTY = {
  nombre: '', email: '', tipoFactura: '', periodo: '',
  impuesto: '', identificacion: '', contacto: '', anotaciones: '',
}

function Badge({ estado }) {
  if (estado === 'activo')   return <span className="badge badge-activo">Activo</span>
  if (estado === 'inactivo') return <span className="badge badge-inactivo">Inactivo</span>
  return null
}

function FilterBox({ label, options, value, onChange }) {
  return (
    <div className="filter-box" style={{ minWidth: 170 }}>
      <span className="filter-box-label">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Filtrar por {label.toLowerCase()}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function Administracion() {
  const [tab, setTab] = useState('Clientes')
  const [rows, setRows] = useState(CLIENTES)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.nombre.toLowerCase().includes(q) || r.mail.toLowerCase().includes(q)
    const matchEstado = !filtroEstado || r.estado === filtroEstado.toLowerCase()
    return matchSearch && matchEstado
  })

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const isReady = form.nombre && form.email && form.tipoFactura && form.impuesto

  const guardar = () => {
    if (!isReady) return
    setRows(p => [...p, {
      id: Date.now(), nombre: form.nombre, estado: 'activo',
      mail: form.email, tipoFactura: form.tipoFactura,
      impuesto: form.impuesto, identificacion: form.identificacion,
    }])
    setForm(EMPTY); setOpen(false)
  }

  return (
    <>
      <h1 className="page-title">Administración</h1>

      {/* Filter + CTA row */}
      <div className="toolbar">
        <FilterBox label="Estado" options={['Activo', 'Inactivo']} value={filtroEstado} onChange={setFiltroEstado} />
        <div className="search-wrap">
          <input className="search-input" placeholder="Buscar" value={search} onChange={e => setSearch(e.target.value)} />
          <span className="search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
        </div>
        <div className="toolbar-right">
          <button className="icon-btn" title="Exportar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
          <button className="icon-btn" title="Importar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button className="btn-cta" onClick={() => setOpen(true)}>
            NUEVO
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="subtabs">
        {TABS.map(t => (
          <button key={t} className={`subtab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Mail</th>
              <th>Tipo Factura</th>
              <th>Impuesto Adicional</th>
              <th>Identificación Fiscal</th>
            </tr>
          </thead>
          <tbody>
            {tab !== 'Clientes' ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)', fontSize: 13 }}>
                Sección {tab} — sin datos cargados
              </td></tr>
            ) : filtered.map(r => (
              <tr key={r.id}>
                <td>{r.nombre}</td>
                <td><Badge estado={r.estado} /></td>
                <td className="td-muted">{r.mail}</td>
                <td className="td-muted">{r.tipoFactura}</td>
                <td className="td-muted">{r.impuesto}</td>
                <td className="td-muted">{r.identificacion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Cliente */}
      <Modal
        isOpen={open}
        onClose={() => { setOpen(false); setForm(EMPTY) }}
        title="Nuevo Cliente"
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
          <label>Nombre del Cliente</label>
          <input className="form-input" name="nombre" value={form.nombre} onChange={change} />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input className="form-input" name="email" type="email" value={form.email} onChange={change} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Factura</label>
            <select className="form-select" name="tipoFactura" value={form.tipoFactura} onChange={change}>
              <option value=""></option>
              {['A', 'B', 'C', 'LLC'].map(t => <option key={t} value={t}>Factura {t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Período de Facturación</label>
            <select className="form-select" name="periodo" value={form.periodo} onChange={change}>
              <option value=""></option>
              {['Mensual', 'Bimestral', 'Trimestral', 'Anual'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Impuesto Adicional</label>
          <input className="form-input" name="impuesto" value={form.impuesto} onChange={change} />
          {!form.impuesto && (
            <div className="form-field-error">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Falta ingresar el impuesto adicional
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Identificación Fiscal</label>
          <input className="form-input" name="identificacion" value={form.identificacion} onChange={change} />
        </div>

        <div className="form-group">
          <label>Nombre de Contacto</label>
          <input className="form-input" name="contacto" value={form.contacto} onChange={change} />
        </div>

        <div className="form-group">
          <label>Anotaciones</label>
          <textarea className="form-textarea" name="anotaciones" value={form.anotaciones} onChange={change} />
        </div>
      </Modal>
    </>
  )
}
