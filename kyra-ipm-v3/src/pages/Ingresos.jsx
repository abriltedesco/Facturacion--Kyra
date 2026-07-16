import { useState, useEffect } from 'react'

const PAGE_SIZE = 10
const ESTADOS = ['PENDIENTE', 'APROBADA', 'EMITIDA']

const INITIAL_DATA = Array.from({ length: 60 }, (_, i) => ({
  id: i + 1,
  nro: String(i + 1).padStart(5, '0'),
  estado: ESTADOS[i % 3],
  cliente: 'Cliente',
  servicio: 'Servicio',
  cantHs: (i % 10) + 1,
  hsPrecio: '$' + ((i % 5 + 1) * 100),
  importeNeto: '$' + ((i % 5 + 1) * 800),
  impuesto: '$' + ((i % 5 + 1) * 100),
}))

const TABS = ['Pendientes', 'Historial']

function Badge({ estado }) {
  const cls = {
    PENDIENTE: 'badge badge-pendiente',
    APROBADA:  'badge badge-aprobada',
    EMITIDA:   'badge badge-emitida',
  }[estado] || 'badge'
  return <span className={cls}>{estado}</span>
}

function FilterBox({ id, label, options, value, onChange }) {
  const labelId = id + '-label'
  return (
    <div className="filter-box">
      <span id={labelId} className="filter-box-label">{label}</span>
      <select aria-labelledby={labelId} value={value} onChange={e => onChange(e.target.value)}>
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
    <nav aria-label="Paginacion" className="pagination">
      <span className="pagination-info">{from}-{to} de {total}</span>
      <div className="pagination-pages">
        <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1} aria-label="Primera pagina">«</button>
        <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Pagina anterior">‹</button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            className={'page-btn' + (page === i + 1 ? ' active' : '')}
            onClick={() => setPage(i + 1)}
            aria-label={'Pagina ' + (i + 1)}
            aria-current={page === i + 1 ? 'page' : undefined}
          >{i + 1}</button>
        ))}
        <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Pagina siguiente">›</button>
        <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Ultima pagina">»</button>
      </div>
    </nav>
  )
}

export default function Ingresos() {
  const [data, setData] = useState(INITIAL_DATA)
  const [tabIdx, setTabIdx] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [aprobadoMsg, setAprobadoMsg] = useState(false)

  useEffect(() => { document.title = 'Ingresos — IPM Kyra' }, [])

  const pendientes = data.filter(r => r.estado === 'PENDIENTE')
  const historial  = data.filter(r => r.estado !== 'PENDIENTE')
  const base = tabIdx === 0 ? pendientes : historial

  const filtered = base.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.nro.includes(q) || r.cliente.toLowerCase().includes(q)
    const matchEstado = !filtroEstado || r.estado === filtroEstado
    return matchSearch && matchEstado
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

  const allSelected = pageRows.length > 0 && selected.size === pageRows.length

  return (
    <div>
      <h1 className="page-title">Ingresos</h1>

      {aprobadoMsg && (
        <div className="aprobado-toast" role="status" aria-live="polite">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          {' '}Facturas aprobadas correctamente — aparecen ahora en Historial
        </div>
      )}

      <div className="toolbar">
        <FilterBox id="ing-estado" label="Estado" options={ESTADOS} value={filtroEstado}
          onChange={v => { setFiltroEstado(v); setPage(1) }} />
        <FilterBox id="ing-cliente" label="Cliente" options={['Cliente']} value={filtroCliente}
          onChange={v => { setFiltroCliente(v); setPage(1) }} />
        <FilterBox id="ing-servicio" label="Servicio" options={['Servicio']} value="" onChange={() => {}} />
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
          {selected.size > 0 ? (
            <button className="btn-aprobar" onClick={aprobarSeleccionadas}>
              Aprobar ({selected.size})
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          ) : (
            <button className="btn-cta">
              NUEVA FACTURA
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

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

      <div id="ing-tabpanel" role="tabpanel" aria-labelledby={'ing-tab-' + tabIdx} className="table-container">
        <table>
          <thead>
            <tr>
              <th scope="col" style={{ width: 32 }}>
                <input
                  type="checkbox"
                  className="row-check"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label={allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                />
              </th>
              <th scope="col">Nro</th>
              <th scope="col">Estado</th>
              <th scope="col">Cliente</th>
              <th scope="col">Servicio</th>
              <th scope="col">Cant. Hs</th>
              <th scope="col">Hs $</th>
              <th scope="col">Importe Neto</th>
              <th scope="col">Impuesto</th>
              <th scope="col" style={{ width: 32 }}><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map(r => (
              <tr key={r.id}>
                <td>
                  <input
                    type="checkbox"
                    className="row-check"
                    checked={selected.has(r.id)}
                    onChange={() => toggleOne(r.id)}
                    aria-label={'Seleccionar factura #' + r.nro}
                  />
                </td>
                <td><button className="link-nro" onClick={() => {}}>#{r.nro}</button></td>
                <td><Badge estado={r.estado} /></td>
                <td>{r.cliente}</td>
                <td className="td-muted">{r.servicio}</td>
                <td className="td-muted">{r.cantHs}</td>
                <td className="td-muted">{r.hsPrecio}</td>
                <td className="td-muted">{r.importeNeto}</td>
                <td className="td-muted">{r.impuesto}</td>
                <td>
                  <button className="dots-btn" aria-label={'Opciones factura #' + r.nro}>+</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination total={filtered.length} page={page} setPage={setPage} />
    </div>
  )
}
