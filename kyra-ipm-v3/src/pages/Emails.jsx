import { useState, useEffect } from 'react'

const PAGE_SIZE = 9
const ESTADOS = ['PENDIENTE', 'APROBADA', 'EMITIDA', 'ERROR']

const HISTORIAL = Array.from({ length: 48 }, (_, i) => ({
  id: i + 1,
  fecha: '01/07/2026',
  cliente: 'Cliente',
  estado: ESTADOS[i % 4],
  asunto: 'Factura julio 2026',
  nroFactura: String(i + 1).padStart(5, '0'),
}))

const PLANTILLAS = [
  { id: 1, nombre: 'Factura A / B', asunto: 'Tu factura del mes de julio — Kyra', activa: true },
  { id: 2, nombre: 'Factura LLC', asunto: 'Invoice for July 2026 — Kyra', activa: false },
]

const TABS = ['Historial', 'Plantillas', 'Configuracion']

function Badge({ estado }) {
  const cls = {
    PENDIENTE: 'badge badge-pendiente',
    APROBADA:  'badge badge-aprobada',
    EMITIDA:   'badge badge-emitida',
    ERROR:     'badge badge-error',
  }[estado] || 'badge'
  return <span className={cls}>{estado}</span>
}

function StatCard({ label, value, pct, icon }) {
  return (
    <div className="stat-card">
      {icon && <div className="stat-card-icon" aria-hidden="true">{icon}</div>}
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {pct !== undefined && (
        <div className="stat-card-pct" aria-label={pct + ' del total'}>{pct}</div>
      )}
    </div>
  )
}

function FilterBox({ id, label, options, value, onChange, type }) {
  const labelId = id + '-label'
  return (
    <div className="filter-box">
      <span id={labelId} className="filter-box-label">{label}</span>
      {type === 'date' ? (
        <input type="date" aria-labelledby={labelId} value={value}
          onChange={e => onChange(e.target.value)}
          style={{ font: 'inherit', fontSize: 12, border: 'none', background: 'none', color: 'var(--gray-700)', cursor: 'pointer' }}
        />
      ) : (
        <select aria-labelledby={labelId} value={value} onChange={e => onChange(e.target.value)}>
          <option value="">Todos</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
    </div>
  )
}

function CcChips({ emails, onChange }) {
  const [input, setInput] = useState('')
  const add = () => {
    const t = input.trim()
    if (t && !emails.includes(t)) onChange([...emails, t])
    setInput('')
  }
  return (
    <div className="cc-field">
      <label htmlFor="cc-inp" className="form-label-sm">CC — copiar en envios automaticos</label>
      <div className="cc-chips-wrap">
        {emails.map(e => (
          <span key={e} className="cc-chip">
            {e}
            <button className="cc-chip-x" onClick={() => onChange(emails.filter(x => x !== e))}
              aria-label={'Quitar ' + e}>x</button>
          </span>
        ))}
        <input
          id="cc-inp"
          className="cc-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
          placeholder="Email y Enter"
          type="email"
        />
      </div>
    </div>
  )
}

function Pagination({ total, page, setPage }) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  if (totalPages <= 1) return null
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)
  const nums = Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1)
  return (
    <nav aria-label="Paginacion" className="pagination">
      <span className="pagination-info">{from}-{to} de {total}</span>
      <div className="pagination-pages">
        <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1} aria-label="Primera pagina">«</button>
        <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Pagina anterior">‹</button>
        {nums.map(n => (
          <button key={n} className={'page-btn' + (page === n ? ' active' : '')}
            onClick={() => setPage(n)} aria-label={'Pagina ' + n}
            aria-current={page === n ? 'page' : undefined}>{n}</button>
        ))}
        {totalPages > 10 && <span className="page-btn" style={{ cursor: 'default', border: 'none' }} aria-hidden="true">...</span>}
        <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Pagina siguiente">›</button>
        <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Ultima pagina">»</button>
      </div>
    </nav>
  )
}

export default function Emails() {
  const [tabIdx, setTabIdx] = useState(0)
  const [page, setPage] = useState(1)
  const [filtroFecha, setFiltroFecha] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [autoEnvio, setAutoEnvio] = useState(true)
  const [ccEmails, setCcEmails] = useState(['mai@wearekyra.com'])

  useEffect(() => { document.title = 'Emails — IPM Kyra' }, [])

  const filtered = HISTORIAL.filter(r => {
    const matchEstado = !filtroEstado || r.estado === filtroEstado
    const matchCliente = !filtroCliente || r.cliente === filtroCliente
    return matchEstado && matchCliente
  })
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const total = HISTORIAL.length
  const emitidas = HISTORIAL.filter(r => r.estado === 'EMITIDA').length
  const pendientes = HISTORIAL.filter(r => r.estado === 'PENDIENTE').length
  const errores = HISTORIAL.filter(r => r.estado === 'ERROR').length

  const handleTabKey = (e, idx) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = (idx + 1) % TABS.length
      setTabIdx(next); setPage(1)
      document.getElementById('em-tab-' + next)?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = (idx - 1 + TABS.length) % TABS.length
      setTabIdx(prev); setPage(1)
      document.getElementById('em-tab-' + prev)?.focus()
    }
  }

  return (
    <div>
      <h1 className="page-title">Emails</h1>

      <div className="stat-cards" role="region" aria-label="Resumen de emails">
        <StatCard label="Total enviados" value={total}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>}
        />
        <StatCard label="Emitidas" value={emitidas}
          pct={total > 0 ? Math.round(emitidas / total * 100) + '%' : '0%'}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
        />
        <StatCard label="Pendientes" value={pendientes}
          pct={total > 0 ? Math.round(pendientes / total * 100) + '%' : '0%'}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatCard label="Con error" value={errores}
          pct={total > 0 ? Math.round(errores / total * 100) + '%' : '0%'}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
      </div>

      <div role="tablist" aria-label="Secciones de emails" className="subtabs">
        {TABS.map((t, idx) => (
          <button
            key={t}
            id={'em-tab-' + idx}
            role="tab"
            aria-selected={tabIdx === idx}
            aria-controls="em-tabpanel"
            tabIndex={tabIdx === idx ? 0 : -1}
            className={'subtab' + (tabIdx === idx ? ' active' : '')}
            onClick={() => { setTabIdx(idx); setPage(1) }}
            onKeyDown={e => handleTabKey(e, idx)}
          >{t}</button>
        ))}
      </div>

      <div id="em-tabpanel" role="tabpanel" aria-labelledby={'em-tab-' + tabIdx}>

        {tabIdx === 0 && (
          <div>
            <div className="toolbar">
              <FilterBox id="em-fecha" label="Fecha" type="date" value={filtroFecha}
                onChange={v => { setFiltroFecha(v); setPage(1) }} />
              <FilterBox id="em-estado" label="Estado" options={ESTADOS} value={filtroEstado}
                onChange={v => { setFiltroEstado(v); setPage(1) }} />
              <FilterBox id="em-cliente" label="Cliente" options={['Cliente']} value={filtroCliente}
                onChange={v => { setFiltroCliente(v); setPage(1) }} />
            </div>

            <div className="section-header">Historial de envios</div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Nro Factura</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Asunto</th>
                    <th scope="col">Estado</th>
                    <th scope="col" style={{ width: 32 }}><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(r => (
                    <tr key={r.id}>
                      <td className="td-muted">{r.fecha}</td>
                      <td><button className="link-nro" onClick={() => {}}>#{r.nroFactura}</button></td>
                      <td>{r.cliente}</td>
                      <td className="td-muted">{r.asunto}</td>
                      <td><Badge estado={r.estado} /></td>
                      <td><button className="dots-btn" aria-label={'Opciones envio #' + r.nroFactura}>+</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination total={filtered.length} page={page} setPage={setPage} />
          </div>
        )}

        {tabIdx === 1 && (
          <div className="plantillas-grid">
            {PLANTILLAS.map(p => (
              <div key={p.id} className="plantilla-card">
                <div className="plantilla-card-head">
                  <span className="plantilla-nombre">{p.nombre}</span>
                  {p.activa && <span className="badge badge-activo">Activa</span>}
                </div>
                <div className="plantilla-meta">
                  <div className="plantilla-meta-row">
                    <span className="plantilla-meta-key">Plantilla</span>
                    <span className="plantilla-meta-val">{p.nombre}</span>
                  </div>
                  <div className="plantilla-meta-row">
                    <span className="plantilla-meta-key">Asunto</span>
                    <span className="plantilla-meta-val">{p.asunto}</span>
                  </div>
                  <div className="plantilla-meta-row">
                    <span className="plantilla-meta-key">Estado</span>
                    <span className="plantilla-meta-val">{p.activa ? 'Activa' : 'Inactiva'}</span>
                  </div>
                </div>
                <button className="btn-outline">Editar plantilla</button>
              </div>
            ))}
          </div>
        )}

        {tabIdx === 2 && (
          <div className="config-section">
            <div className="config-card">
              <div className="config-card-head">
                <div>
                  <div className="config-card-title">Envio automatico</div>
                  <div className="config-card-desc">
                    El sistema envia las facturas aprobadas el 1ro de cada mes
                  </div>
                </div>
                <button
                  className={'toggle' + (autoEnvio ? ' on' : '')}
                  role="switch"
                  aria-checked={autoEnvio}
                  aria-label={'Envio automatico: ' + (autoEnvio ? 'activado' : 'desactivado')}
                  onClick={() => setAutoEnvio(p => !p)}
                >
                  <span className="toggle-thumb" />
                </button>
              </div>
              {autoEnvio && (
                <div className="config-card-body">
                  <div className="config-status-row">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Proximo envio: 01/08/2026</span>
                  </div>
                  <CcChips emails={ccEmails} onChange={setCcEmails} />
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
