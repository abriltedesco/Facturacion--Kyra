import { useState, useRef, useEffect } from 'react'
import Modal from '../components/Modal'

const PAGE_SIZE = 9
const ESTADOS = ['PENDIENTE', 'APROBADA', 'EMITIDA', 'ERROR']
const CLIENTES = ['Maped', 'Edding ARG', 'Edding COL', 'Ayax', 'TechCorp']
const SERVICIOS = ['Social Media', 'Diseño UX/UI', 'Consultoría', 'Branding', 'SEO']
const TIPOS = ['A', 'B', 'C', 'LLC']

const INITIAL_DATA = Array.from({ length: 60 }, (_, i) => ({
  id: i + 1,
  nro: i + 131,
  estado: ESTADOS[i % 4],
  cliente: CLIENTES[i % CLIENTES.length],
  servicio: SERVICIOS[i % SERVICIOS.length],
  importe: '$' + ((i % 5 + 1) * 50000).toLocaleString('es-AR') + ',00',
  total: '$' + ((i % 5 + 1) * 62400).toLocaleString('es-AR') + ',00',
  tipo: TIPOS[i % TIPOS.length],
  fecha: '27/05/2026',
}))

const TABS = ['Pendientes', 'Historial']

const EMPTY = { cliente: '', servicio: '', importe: '', tipo: '', fecha: '' }

function Badge({ estado }) {
  const cls = {
    PENDIENTE: 'badge badge-pendiente',
    APROBADA:  'badge badge-aprobada',
    EMITIDA:   'badge badge-emitida',
    ERROR:     'badge badge-error',
  }[estado] || 'badge'
  return <span className={cls}>{estado}</span>
}

function FilterBox({ id, label, options, value, onChange }) {
  const labelId = id + '-label'
  return (
    <div className="filter-box">
      <span id={labelId} className="filter-box-label">{label}</span>
      <select aria-labelledby={labelId} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Filtrar por {label.toLowerCase()}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Pagination({ total, page, setPage }) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)
  const show = totalPages <= 7
    ? Array.from({ length: totalPages }, (_, i) => i + 1)
    : [1, 2, 3, 4, 5, '…', totalPages]
  return (
    <nav aria-label="Paginacion" className="pagination">
      <span className="pagination-info">{from} - {to} de {total}</span>
      <div className="pagination-pages">
        <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1} aria-label="Primera pagina">«</button>
        <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Pagina anterior">‹</button>
        {show.map((n, i) => n === '…'
          ? <span key={'ellipsis-' + i} className="page-btn page-ellipsis" aria-hidden="true">…</span>
          : <button key={n} className={'page-btn' + (page === n ? ' active' : '')} onClick={() => setPage(n)} aria-label={'Pagina ' + n} aria-current={page === n ? 'page' : undefined}>{n}</button>
        )}
        <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Pagina siguiente">›</button>
        <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Ultima pagina">»</button>
      </div>
    </nav>
  )
}

const SVG_EXPORT = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const SVG_IMPORT = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

export default function Ingresos() {
  const [data, setData] = useState(INITIAL_DATA)
  const [tabIdx, setTabIdx] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroServicio, setFiltroServicio] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [aprobadoMsg, setAprobadoMsg] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [submitted, setSubmitted] = useState(false)
  const btnNuevoRef = useRef(null)

  useEffect(() => { document.title = 'Ingresos — IPM Kyra' }, [])

  const pendientes = data.filter(r => r.estado === 'PENDIENTE')
  const historial  = data.filter(r => r.estado !== 'PENDIENTE')
  const base = tabIdx === 0 ? pendientes : historial

  const filtered = base.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || String(r.nro).includes(q) || r.cliente.toLowerCase().includes(q)
    const matchEstado = !filtroEstado || r.estado === filtroEstado
    const matchCliente = !filtroCliente || r.cliente === filtroCliente
    const matchServicio = !filtroServicio || r.servicio === filtroServicio
    return matchSearch && matchEstado && matchCliente && matchServicio
  })

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleAll = () => {
    if (selected.size === pageRows.length) setSelected(new Set())
    else setSelected(new Set(pageRows.map(r => r.id)))
  }
  const toggleOne = id => {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }

  const aprobarSeleccionadas = () => {
    setData(prev => prev.map(r =>
      selected.has(r.id) ? { ...r, estado: 'APROBADA' } : r
    ))
    setSelected(new Set())
    setAprobadoMsg(true)
    setTimeout(() => setAprobadoMsg(false), 3000)
  }

  const handleTabKey = (e, idx) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = (idx + 1) % TABS.length
      setTabIdx(next); setPage(1)
      document.getElementById('ing-tab-' + next)?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = (idx - 1 + TABS.length) % TABS.length
      setTabIdx(prev); setPage(1)
      document.getElementById('ing-tab-' + prev)?.focus()
    }
  }

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  const isReady = form.cliente && form.servicio && form.tipo

  const guardar = () => {
    setSubmitted(true)
    if (!isReady) return
    const newItem = {
      id: Date.now(),
      nro: data.length + 131,
      estado: 'PENDIENTE',
      cliente: form.cliente,
      servicio: form.servicio,
      importe: form.importe || '$50.000,00',
      total: '$62.400,00',
      tipo: form.tipo,
      fecha: new Date().toLocaleDateString('es-AR'),
    }
    setData(prev => [newItem, ...prev])
    setForm(EMPTY); setSubmitted(false); setOpen(false)
  }

  const allSelected = pageRows.length > 0 && selected.size === pageRows.length

  return (
    <div>
      <a href="#main-content" className="skip-link">Saltar al contenido</a>

      <div className="page-header">
        <h1 className="page-title">Ingresos</h1>
        <div className="page-header-actions">
          <button className="icon-btn" aria-label="Exportar">{SVG_EXPORT}</button>
          <button className="icon-btn" aria-label="Importar">{SVG_IMPORT}</button>
          {selected.size > 0 ? (
            <button className="btn-aprobar" onClick={aprobarSeleccionadas}>
              Aprobar ({selected.size})
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          ) : (
            <button ref={btnNuevoRef} className="btn-cta" onClick={() => { setSubmitted(false); setOpen(true) }}>
              NUEVO INGRESO
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {aprobadoMsg && (
        <div className="aprobado-toast" role="status" aria-live="polite">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          {' '}Facturas aprobadas — aparecen en Historial
        </div>
      )}

      {/* Filters */}
      <div className="filter-row">
        <FilterBox id="ing-estado" label="Estado" options={ESTADOS} value={filtroEstado}
          onChange={v => { setFiltroEstado(v); setPage(1) }} />
        <FilterBox id="ing-cliente" label="Cliente" options={CLIENTES} value={filtroCliente}
          onChange={v => { setFiltroCliente(v); setPage(1) }} />
        <FilterBox id="ing-servicio" label="Servicio" options={SERVICIOS} value={filtroServicio}
          onChange={v => { setFiltroServicio(v); setPage(1) }} />
        <div className="search-wrap">
          <label htmlFor="ing-search" className="sr-only">Buscar facturas</label>
          <input id="ing-search" className="search-input" placeholder="Buscar"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          <span className="search-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Secciones de ingresos" className="subtabs">
        {TABS.map((t, idx) => (
          <button
            key={t}
            id={'ing-tab-' + idx}
            role="tab"
            aria-selected={tabIdx === idx}
            aria-controls="ing-tabpanel"
            tabIndex={tabIdx === idx ? 0 : -1}
            className={'subtab' + (tabIdx === idx ? ' active' : '')}
            onClick={() => { setTabIdx(idx); setPage(1) }}
            onKeyDown={e => handleTabKey(e, idx)}
          >{t}</button>
        ))}
      </div>

      {/* Table */}
      <div id="ing-tabpanel" role="tabpanel" aria-labelledby={"ing-tab-" + tabIdx} className="table-container">
        <table>
          <thead>
            <tr>
              <th scope="col" style={{ width: 36 }}>
                <input type="checkbox" className="row-check" checked={allSelected} onChange={toggleAll}
                  aria-label={allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'} />
              </th>
              <th scope="col">NRO</th>
              <th scope="col">ESTADO</th>
              <th scope="col">CLIENTE</th>
              <th scope="col">SERVICIO</th>
              <th scope="col">IMPORTE</th>
              <th scope="col">TOTAL</th>
              <th scope="col">TIPO</th>
              <th scope="col">FECHA ↑</th>
              <th scope="col" style={{ width: 36 }}><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={10} className="td-empty">Sin resultados</td></tr>
            ) : pageRows.map(r => (
              <tr key={r.id}>
                <td>
                  <input type="checkbox" className="row-check" checked={selected.has(r.id)}
                    onChange={() => toggleOne(r.id)} aria-label={'Seleccionar factura #' + r.nro} />
                </td>
                <td><span className="link-nro">{r.nro}</span></td>
                <td><Badge estado={r.estado} /></td>
                <td>{r.cliente}</td>
                <td className="td-muted">{r.servicio}</td>
                <td className="td-muted">{r.importe}</td>
                <td className="td-muted">{r.total}</td>
                <td className="td-muted">{r.tipo}</td>
                <td className="td-muted">{r.fecha}</td>
                <td>
                  <button className="dots-btn" aria-label={'Opciones factura #' + r.nro}>⋮</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination total={filtered.length} page={page} setPage={setPage} />

      <Modal
        isOpen={open}
        onClose={() => { setOpen(false); setForm(EMPTY); setSubmitted(false) }}
        title="NUEVA FACTURA"
        triggerRef={btnNuevoRef}
        footer={
          <div className="modal-footer-inner">
            <div className="modal-validation">
              {(!isReady) && (
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
          <label htmlFor="ing-f-cliente">Cliente</label>
          <select id="ing-f-cliente" className="form-select" name="cliente" value={form.cliente} onChange={change}>
            <option value=""></option>
            {CLIENTES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="ing-f-servicio">Servicio</label>
          <select id="ing-f-servicio" className="form-select" name="servicio" value={form.servicio} onChange={change}>
            <option value=""></option>
            {SERVICIOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ing-f-tipo">Tipo de Factura</label>
            <select id="ing-f-tipo" className="form-select" name="tipo" value={form.tipo} onChange={change}>
              <option value=""></option>
              {TIPOS.map(t => <option key={t} value={t}>Factura {t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="ing-f-importe">Importe Neto</label>
            <input id="ing-f-importe" className="form-input" name="importe" value={form.importe} onChange={change} placeholder="$0,00" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
