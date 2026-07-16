import { useState, useRef, useEffect } from 'react'
import Modal from '../components/Modal'

const TABS = ['Clientes', 'Proveedores', 'Entidades', 'Servicios']
const PAGE_SIZE = 10

const CLIENTES = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  nombre: 'Cliente',
  estado: i % 3 === 0 ? 'inactivo' : 'activo',
  mail: 'mailCliente@gmail.com',
  tipoFactura: 'Periodo',
  impuesto: 'Impuesto',
  identificacion: 'Identificacion Fiscal',
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

function FilterBox({ id, label, options, value, onChange }) {
  const labelId = id + '-label'
  return (
    <div className="filter-box" style={{ minWidth: 170 }}>
      <span id={labelId} className="filter-box-label">{label}</span>
      <select aria-labelledby={labelId} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Filtrar por {label.toLowerCase()}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Paginacion" className="pagination">
      <button className="page-btn" onClick={() => onChange(1)} disabled={page === 1} aria-label="Primera pagina">«</button>
      <button className="page-btn" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Pagina anterior">‹</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button
          key={p}
          className={'page-btn' + (p === page ? ' active' : '')}
          onClick={() => onChange(p)}
          aria-label={'Pagina ' + p}
          aria-current={p === page ? 'page' : undefined}
        >{p}</button>
      ))}
      <button className="page-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label="Pagina siguiente">›</button>
      <button className="page-btn" onClick={() => onChange(totalPages)} disabled={page === totalPages} aria-label="Ultima pagina">»</button>
    </nav>
  )
}

export default function Administracion() {
  const [tab, setTab] = useState(0)
  const [rows, setRows] = useState(CLIENTES)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [page, setPage] = useState(1)
  const btnNuevoRef = useRef(null)

  useEffect(() => { document.title = 'Administracion — IPM Kyra' }, [])

  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.nombre.toLowerCase().includes(q) || r.mail.toLowerCase().includes(q)
    const matchEstado = !filtroEstado || r.estado === filtroEstado.toLowerCase()
    return matchSearch && matchEstado
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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

  const handleTabKey = (e, idx) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = (idx + 1) % TABS.length
      setTab(next)
      document.getElementById('tab-' + next)?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = (idx - 1 + TABS.length) % TABS.length
      setTab(prev)
      document.getElementById('tab-' + prev)?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault(); setTab(0); document.getElementById('tab-0')?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      const last = TABS.length - 1
      setTab(last); document.getElementById('tab-' + last)?.focus()
    }
  }

  return (
    <div>
      <h1 className="page-title">Administracion</h1>

      <div className="toolbar">
        <FilterBox id="filtro-estado" label="Estado" options={['Activo', 'Inactivo']}
          value={filtroEstado} onChange={v => { setFiltroEstado(v); setPage(1) }} />
        <div className="search-wrap">
          <label htmlFor="admin-search" className="sr-only">Buscar clientes</label>
          <input id="admin-search" className="search-input" placeholder="Buscar"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          <span className="search-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
        </div>
        <div className="toolbar-right">
          <button className="icon-btn" aria-label="Exportar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
          <button className="icon-btn" aria-label="Importar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button ref={btnNuevoRef} className="btn-cta" onClick={() => setOpen(true)}>
            NUEVO
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      <div role="tablist" aria-label="Secciones de administracion" className="subtabs">
        {TABS.map((t, idx) => (
          <button
            key={t}
            id={'tab-' + idx}
            role="tab"
            aria-selected={tab === idx}
            aria-controls="tabpanel-admin"
            tabIndex={tab === idx ? 0 : -1}
            className={'subtab' + (tab === idx ? ' active' : '')}
            onClick={() => setTab(idx)}
            onKeyDown={e => handleTabKey(e, idx)}
          >{t}</button>
        ))}
      </div>

      <div id="tabpanel-admin" role="tabpanel" aria-labelledby={'tab-' + tab} className="table-container">
        <table>
          <thead>
            <tr>
              <th scope="col">Cliente</th>
              <th scope="col">Estado</th>
              <th scope="col">Mail</th>
              <th scope="col">Tipo Factura</th>
              <th scope="col">Impuesto Adicional</th>
              <th scope="col">Identificacion Fiscal</th>
            </tr>
          </thead>
          <tbody>
            {tab !== 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)', fontSize: 13 }}>
                Seccion {TABS[tab]} — sin datos cargados
              </td></tr>
            ) : pageRows.map(r => (
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
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      <Modal
        isOpen={open}
        onClose={() => { setOpen(false); setForm(EMPTY) }}
        title="Nuevo Cliente"
        triggerRef={btnNuevoRef}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div className="modal-validation">
              {!isReady && (
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  {' '}Faltan llenar datos
                </span>
              )}
            </div>
            <button className={'btn-guardar' + (isReady ? ' ready' : '')} onClick={guardar}>Guardar</button>
          </div>
        }
      >
        <div className="form-group">
          <label htmlFor="admin-nombre">Nombre del Cliente</label>
          <input id="admin-nombre" className="form-input" name="nombre" value={form.nombre} onChange={change} />
        </div>
        <div className="form-group">
          <label htmlFor="admin-email">Email</label>
          <input id="admin-email" className="form-input" name="email" type="email" value={form.email} onChange={change} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="admin-tipoFactura">Tipo de Factura</label>
            <select id="admin-tipoFactura" className="form-select" name="tipoFactura" value={form.tipoFactura} onChange={change}>
              <option value=""></option>
              {['A', 'B', 'C', 'LLC'].map(t => <option key={t} value={t}>Factura {t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="admin-periodo">Periodo de Facturacion</label>
            <select id="admin-periodo" className="form-select" name="periodo" value={form.periodo} onChange={change}>
              <option value=""></option>
              {['Mensual', 'Bimestral', 'Trimestral', 'Anual'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="admin-impuesto">Impuesto Adicional</label>
          <input id="admin-impuesto" className="form-input" name="impuesto" value={form.impuesto} onChange={change} />
          {!form.impuesto && (
            <div className="form-field-error" role="alert">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {' '}Falta ingresar el impuesto adicional
            </div>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="admin-identificacion">Identificacion Fiscal</label>
          <input id="admin-identificacion" className="form-input" name="identificacion" value={form.identificacion} onChange={change} />
        </div>
        <div className="form-group">
          <label htmlFor="admin-contacto">Nombre de Contacto</label>
          <input id="admin-contacto" className="form-input" name="contacto" value={form.contacto} onChange={change} />
        </div>
        <div className="form-group">
          <label htmlFor="admin-anotaciones">Anotaciones</label>
          <textarea id="admin-anotaciones" className="form-textarea" name="anotaciones" value={form.anotaciones} onChange={change} />
        </div>
      </Modal>
    </div>
  )
}
