import { useState } from 'react'

const PAGE_SIZE = 9

const ESTADOS = ['PENDIENTE', 'APROBADA', 'EMITIDA']

const INGRESOS_DATA = Array.from({ length: 54 }, (_, i) => ({
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
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            className={`page-btn${page === i + 1 ? ' active' : ''}`}
            onClick={() => setPage(i + 1)}
          >{i + 1}</button>
        ))}
      </div>
    </div>
  )
}

export default function Ingresos() {
  const [tab, setTab] = useState('Pendientes')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [selected, setSelected] = useState(new Set())

  const pendientes = INGRESOS_DATA.filter(r => r.estado === 'PENDIENTE')
  const historial  = INGRESOS_DATA.filter(r => r.estado !== 'PENDIENTE')
  const base = tab === 'Pendientes' ? pendientes : historial

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

  return (
    <>
      <h1 className="page-title">Ingresos</h1>

      {/* Toolbar */}
      <div className="toolbar">
        <FilterBox label="Estado" options={ESTADOS} value={filtroEstado} onChange={v => { setFiltroEstado(v); setPage(1) }} />
        <FilterBox label="Cliente" options={['Cliente']} value={filtroCliente} onChange={v => { setFiltroCliente(v); setPage(1) }} />
        <FilterBox label="Servicio" options={['Servicio']} value="" onChange={() => {}} />
        <div className="search-wrap">
          <input
            className="search-input"
            placeholder="Buscar"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <span className="search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
        </div>
        <div className="toolbar-right">
          <button className="icon-btn" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
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
              <th style={{ width: 32 }}>
                <input type="checkbox" checked={selected.size === pageRows.length && pageRows.length > 0} onChange={toggleAll} />
              </th>
              <th>Nro</th>
              <th>Estado</th>
              <th>Cliente</th>
              <th>Servicio</th>
              <th>Cant. Hs</th>
              <th>Hs $</th>
              <th>Importe Neto</th>
              <th>Impuesto</th>
              <th style={{ width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map(r => (
              <tr key={r.id}>
                <td>
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} />
                </td>
                <td><a href="#" className="link-nro">#{r.nro}</a></td>
                <td><Badge estado={r.estado} /></td>
                <td>{r.cliente}</td>
                <td className="td-muted">{r.servicio}</td>
                <td className="td-muted">{r.cantHs}</td>
                <td className="td-muted">{r.hsPrecio}</td>
                <td className="td-muted">{r.importeNeto}</td>
                <td className="td-muted">{r.impuesto}</td>
                <td>
                  <button className="dots-btn" title="Opciones">⋮</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination total={filtered.length} page={page} setPage={setPage} />
    </>
  )
}
