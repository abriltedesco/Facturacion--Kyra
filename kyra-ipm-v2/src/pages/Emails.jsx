import { useState } from 'react'

const PAGE_SIZE = 10

const ESTADOS = ['ENVIADA', 'PENDIENTE', 'ERROR']

const EMAILS_DATA = Array.from({ length: 54 }, (_, i) => ({
  id: i + 1,
  factura: 'Factura',
  cliente: 'Cliente',
  email: 'mailCliente@gmail.com',
  fechaEnvio: i % 3 !== 1 ? '01/07/2026' : '-',
  estado: ESTADOS[i % 3],
  entidad: 'AFIP',
}))

const TABS_EMAILS = ['Envío automático', 'Plantillas']

function Badge({ estado }) {
  const cls = {
    ENVIADA:   'badge badge-emitida',
    PENDIENTE: 'badge badge-pendiente',
    ERROR:     'badge badge-error',
  }[estado] || 'badge'
  return <span className={cls}>{estado}</span>
}

function FilterBox({ label, options, value, onChange, type }) {
  if (type === 'date') {
    return (
      <div className="filter-box" style={{ minWidth: 200 }}>
        <span className="filter-box-label">{label}</span>
        <div style={{ display: 'flex', gap: 4, padding: '2px 6px' }}>
          <input type="date" style={{ border: 'none', outline: 'none', fontSize: 11, color: 'var(--gray-700)', background: 'transparent', width: '50%' }} />
          <span style={{ color: 'var(--gray-400)', fontSize: 11, alignSelf: 'center' }}>—</span>
          <input type="date" style={{ border: 'none', outline: 'none', fontSize: 11, color: 'var(--gray-700)', background: 'transparent', width: '50%' }} />
        </div>
      </div>
    )
  }
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

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

const IconPDF = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)

export default function Emails() {
  const [tab, setTab] = useState('Envío automático')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [autoEnvio, setAutoEnvio] = useState(true)
  const [ccEmails, setCcEmails] = useState('')

  const enviados = EMAILS_DATA.filter(r => r.estado === 'ENVIADA').length
  const pendientes = EMAILS_DATA.filter(r => r.estado === 'PENDIENTE').length
  const conError = EMAILS_DATA.filter(r => r.estado === 'ERROR').length

  const filtered = EMAILS_DATA.filter(r => {
    const matchEstado = !filtroEstado || r.estado === filtroEstado
    const matchCliente = !filtroCliente || r.cliente === filtroCliente
    return matchEstado && matchCliente
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const from = (page - 1) * perPage + 1
  const to = Math.min(page * perPage, filtered.length)
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <>
      <div className="emails-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Emails</h1>
          <div className="emails-subtitle">Envío de facturas</div>
        </div>
      </div>

      {/* Filters */}
      <div className="toolbar">
        <FilterBox label="Estado" options={ESTADOS} value={filtroEstado} onChange={v => { setFiltroEstado(v); setPage(1) }} />
        <FilterBox label="Cliente" options={['Cliente']} value={filtroCliente} onChange={v => { setFiltroCliente(v); setPage(1) }} />
        <FilterBox label="Período" type="date" value="" onChange={() => {}} />
      </div>

      {/* Stat cards */}
      <div className="stat-cards">
        <StatCard label="Enviados" value={enviados} />
        <StatCard label="Pendientes" value={pendientes} />
        <StatCard label="Con error" value={conError} />
        <StatCard label="Total" value={EMAILS_DATA.length} />
      </div>

      {/* Sub-tabs */}
      <div className="subtabs">
        {TABS_EMAILS.map(t => (
          <button key={t} className={`subtab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>Factura</th>
              <th>Cliente</th>
              <th>Email destinatario</th>
              <th>Fecha envío</th>
              <th>Estado</th>
              <th>Entidad</th>
              <th style={{ width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map(r => (
              <tr key={r.id}>
                <td style={{ color: 'var(--gray-400)', textAlign: 'center' }}>
                  <IconPDF />
                </td>
                <td>{r.factura}</td>
                <td>{r.cliente}</td>
                <td className="td-muted">{r.email}</td>
                <td className="td-muted">{r.fechaEnvio}</td>
                <td><Badge estado={r.estado} /></td>
                <td className="td-muted">{r.entidad}</td>
                <td><button className="dots-btn" title="Opciones">⋮</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination + per-page */}
      <div className="pagination">
        <span className="pagination-info">{from}-{to} de {filtered.length}</span>
        <div className="pagination-pages">
          {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => (
            <button
              key={i + 1}
              className={`page-btn${page === i + 1 ? ' active' : ''}`}
              onClick={() => setPage(i + 1)}
            >{i + 1}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Por página</span>
          <select
            value={perPage}
            onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
            style={{ fontSize: 12, border: '1px solid var(--gray-200)', borderRadius: 4, padding: '2px 6px', color: 'var(--gray-700)' }}
          >
            {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Bottom cards */}
      <div className="bottom-cards">
        {/* Plantilla activa */}
        <div className="bottom-card">
          <div className="bottom-card-title">Plantilla activa</div>
          <div className="bottom-card-body">
            <div className="plantilla-preview">
              <div className="plantilla-header">
                <div className="plantilla-logo">'Kyra</div>
              </div>
              <div className="plantilla-content">
                <p>Hola [Nombre],</p>
                <p>Adjuntamos la factura correspondiente al mes de [Mes].</p>
                <div className="plantilla-cta">Ver factura</div>
                <p className="plantilla-footer-text">© 2026 We Are Kyra</p>
              </div>
            </div>
          </div>
          <div className="bottom-card-footer">
            <button className="btn-cta" style={{ fontSize: 11 }}>Editar plantilla</button>
          </div>
        </div>

        {/* Envío automático */}
        <div className="bottom-card">
          <div className="bottom-card-title">Envío automático</div>
          <div className="bottom-card-body">
            <div className="toggle-row">
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)' }}>Activar envío automático</div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>El día 1 de cada mes</div>
              </div>
              <button
                className={`toggle${autoEnvio ? ' on' : ''}`}
                onClick={() => setAutoEnvio(p => !p)}
                aria-label="Toggle envío automático"
              >
                <span className="toggle-thumb" />
              </button>
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 4, display: 'block' }}>
                Emails en copia (CC)
              </label>
              <input
                className="form-input"
                placeholder="email@ejemplo.com, otro@ejemplo.com"
                value={ccEmails}
                onChange={e => setCcEmails(e.target.value)}
                style={{ fontSize: 12 }}
              />
            </div>
          </div>
          <div className="bottom-card-footer">
            <button className="btn-cta" style={{ fontSize: 11 }}>Guardar configuración</button>
          </div>
        </div>
      </div>
    </>
  )
}
