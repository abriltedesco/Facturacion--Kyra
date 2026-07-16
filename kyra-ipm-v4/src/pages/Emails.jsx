import { useState, useRef } from 'react'

/* ─────────────────────────── SVG Icons ──────────────────────────── */
const IcoPaperPlane = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const IcoClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IcoTriangle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IcoEnvelope = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)
const IcoPdf = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)
const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IcoEnvSm = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)
const IcoMore = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
  </svg>
)
const IcoInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

/* ─────────────────────────── Mock Data ──────────────────────────── */
const CLIENTES_LIST = ['Maped', 'Edding ARG', 'Edding COL', 'Ayax', 'TechCorp', 'Draftea', 'Grupo CL']
const ESTADOS_LIST  = ['Enviado', 'Pendiente', 'Error']

const HISTORIAL = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  factura: `FAC-2026-${String(130 - i).padStart(3, '0')}`,
  cliente: CLIENTES_LIST[i % CLIENTES_LIST.length],
  email: `admin@${CLIENTES_LIST[i % CLIENTES_LIST.length].toLowerCase().replace(/\s/g,'')}.com`,
  fecha: `${String(1 + (i % 28)).padStart(2, '0')}/05/2026`,
  estado: i % 7 === 3 ? 'Error' : i % 5 === 2 ? 'Pendiente' : 'Enviado',
  entidad: i % 3 === 0 ? 'AFIP' : 'LLC',
}))

const PLANTILLAS_DATA = [
  { id: 1, nombre: 'Factura Kyra - General', activa: true,  fecha: '15/03/2026',
    asunto: 'Factura {{numero_factura}} - {{cliente}}',
    mensaje: 'Estimado {{cliente}},\n\nAdjuntamos la factura correspondiente al mes de {{mes}}.\n\nQuedamos a disposición ante cualquier consulta.\n\nSaludos,\nEquipo Kyra' },
  { id: 2, nombre: 'Factura LLC - Dólares',  activa: false, fecha: '02/04/2026',
    asunto: 'Invoice {{invoice_number}} — {{client}}',
    mensaje: 'Dear {{client}},\n\nPlease find attached your invoice for {{month}}.\n\nBest regards,\nKyra Team' },
  { id: 3, nombre: 'Recordatorio de pago',  activa: false, fecha: '10/04/2026',
    asunto: 'Recordatorio: Factura {{numero_factura}} pendiente de pago',
    mensaje: 'Estimado {{cliente}},\n\nTe recordamos que la factura adjunta se encuentra pendiente de pago.\n\nGracias,\nKyra' },
]

const PAGE_SIZE = 8

function BadgeEstado({ estado }) {
  const cls = estado === 'Enviado' ? 'email-badge-enviado'
            : estado === 'Pendiente' ? 'email-badge-pendiente'
            : 'email-badge-error'
  return <span className={`email-badge ${cls}`}>{estado}</span>
}

/* ─────────────────────────── Main Component ──────────────────────── */
export default function Emails() {
  const [tab, setTab]       = useState(0)
  const [page, setPage]     = useState(1)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [ccEmails, setCcEmails]   = useState(['adminkyra@gmail.com', 'contablekyra@gmail.com'])
  const [ccInput, setCcInput]     = useState('')
  const [autoEnvio, setAutoEnvio] = useState(false)
  const [selectedPlantilla, setSelectedPlantilla] = useState(0)
  const [plantillas, setPlantillas] = useState(PLANTILLAS_DATA)
  const [editNombre, setEditNombre] = useState(PLANTILLAS_DATA[0].nombre)
  const [editAsunto, setEditAsunto] = useState(PLANTILLAS_DATA[0].asunto)
  const [editMsg,    setEditMsg]    = useState(PLANTILLAS_DATA[0].mensaje)

  /* Filter historial */
  const filtered = HISTORIAL.filter(r => {
    if (filtroEstado && r.estado !== filtroEstado) return false
    if (filtroCliente && r.cliente !== filtroCliente) return false
    return true
  })
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function selectPlantilla(idx) {
    setSelectedPlantilla(idx)
    setEditNombre(plantillas[idx].nombre)
    setEditAsunto(plantillas[idx].asunto)
    setEditMsg(plantillas[idx].mensaje)
  }

  function guardarPlantilla() {
    setPlantillas(prev => prev.map((p, i) =>
      i === selectedPlantilla ? { ...p, nombre: editNombre, asunto: editAsunto, mensaje: editMsg, fecha: new Date().toLocaleDateString('es-AR') } : p
    ))
  }

  function addCc(e) {
    e.preventDefault()
    const val = ccInput.trim()
    if (val && !ccEmails.includes(val)) setCcEmails(prev => [...prev, val])
    setCcInput('')
  }

  function removeCc(email) {
    setCcEmails(prev => prev.filter(e => e !== email))
  }

  const STAT_CARDS = [
    { icon: <IcoPaperPlane />, label: 'Enviados',  value: '42', sub: '82% del total' },
    { icon: <IcoClock />,      label: 'Pendientes', value: '6',  sub: '12% del total' },
    { icon: <IcoTriangle />,   label: 'Con error',  value: '3',  sub: '6% del total'  },
    { icon: <IcoEnvelope />,   label: 'Total',      value: '51', sub: '100% del total' },
  ]

  return (
    <div className="emails-page">
      {/* Page title */}
      <div className="email-page-header">
        <div>
          <h1 className="page-title">Emails</h1>
          <p className="page-subtitle">Envío de facturas</p>
        </div>
      </div>

      {/* Global filter bar */}
      <div className="email-global-filters">
        <div className="email-filter-date">
          <label htmlFor="fecha-desde" className="filter-label-sm">Fecha desde</label>
          <input id="fecha-desde" type="date" className="email-date-input"
            value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
        </div>
        <span className="email-filter-sep">–</span>
        <div className="email-filter-date">
          <label htmlFor="fecha-hasta" className="filter-label-sm">Fecha hasta</label>
          <input id="fecha-hasta" type="date" className="email-date-input"
            value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
        </div>
        <div className="email-filter-select-wrap">
          <label htmlFor="fil-estado" className="filter-label-sm">Estado</label>
          <select id="fil-estado" className="email-filter-select"
            value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPage(1) }}>
            <option value="">Todos los estados</option>
            {ESTADOS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="email-filter-select-wrap">
          <label htmlFor="fil-cliente" className="filter-label-sm">Cliente</label>
          <select id="fil-cliente" className="email-filter-select"
            value={filtroCliente} onChange={e => { setFiltroCliente(e.target.value); setPage(1) }}>
            <option value="">Todos los clientes</option>
            {CLIENTES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="email-stat-cards">
        {STAT_CARDS.map(c => (
          <div key={c.label} className="email-stat-card">
            <div className="email-stat-icon">{c.icon}</div>
            <div className="email-stat-body">
              <div className="email-stat-value">{c.value}</div>
              <div className="email-stat-label">{c.label}</div>
              <div className="email-stat-sub">{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div role="tablist" className="email-tabs" aria-label="Secciones de emails">
        {['Envío automático', 'Plantillas'].map((t, i) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === i}
            aria-controls={`email-panel-${i}`}
            id={`email-tab-${i}`}
            tabIndex={tab === i ? 0 : -1}
            className={'email-tab' + (tab === i ? ' active' : '')}
            onClick={() => setTab(i)}
            onKeyDown={e => {
              if (e.key === 'ArrowRight') setTab(prev => (prev + 1) % 2)
              if (e.key === 'ArrowLeft') setTab(prev => (prev + 1) % 2)
            }}
          >{t}</button>
        ))}
      </div>

      {/* ── Tab 0: Envío automático ── */}
      <div role="tabpanel" id="email-panel-0" aria-labelledby="email-tab-0" hidden={tab !== 0}>

        {/* Historial table */}
        <section className="email-section">
          <h2 className="section-title-sm">Historial de envíos</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Cliente</th>
                  <th>Email destinatario</th>
                  <th>Fecha envío</th>
                  <th>Estado</th>
                  <th>Entidad</th>
                  <th aria-label="Acciones"></th>
                </tr>
              </thead>
              <tbody>
                {pageData.map(row => (
                  <tr key={row.id}>
                    <td>
                      <a href="#" className="factura-link" onClick={e => e.preventDefault()}>
                        <IcoPdf />
                        <span>{row.factura}</span>
                      </a>
                    </td>
                    <td>{row.cliente}</td>
                    <td className="text-muted-sm">{row.email}</td>
                    <td className="text-muted-sm">{row.fecha}</td>
                    <td><BadgeEstado estado={row.estado} /></td>
                    <td className="text-muted-sm">{row.entidad}</td>
                    <td><button className="btn-more" aria-label="Más opciones"><IcoMore /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="email-pagination">
            <span className="pagination-info">
              Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
            </span>
            <div className="pagination-pages">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} className={'page-btn' + (page === n ? ' active' : '')} onClick={() => setPage(n)}>{n}</button>
              ))}
              {totalPages > 5 && <span className="page-btn page-ellipsis">…</span>}
              {totalPages > 5 && (
                <button className={'page-btn' + (page === totalPages ? ' active' : '')} onClick={() => setPage(totalPages)}>{totalPages}</button>
              )}
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            </div>
            <div className="pagination-size">
              <span>Por página:</span>
              <select aria-label="Resultados por página" defaultValue="8">
                <option>8</option><option>16</option><option>32</option>
              </select>
            </div>
          </div>
        </section>

        {/* Bottom two cards */}
        <div className="email-bottom-cards">

          {/* Card: Plantilla activa */}
          <div className="email-card email-card-plantilla">
            <div className="email-card-header">
              <span className="email-card-title">Plantilla de email activa</span>
              <button className="btn-editar-plantilla">
                <IcoEdit /> Editar plantilla
              </button>
            </div>
            <div className="email-card-body">
              <div className="email-plantilla-row">
                <span className="epr-label">Plantilla:</span>
                <span className="epr-value">Factura Kyra - General</span>
              </div>
              <div className="email-plantilla-row">
                <span className="epr-label">Asunto:</span>
                <span className="epr-value text-mono">Factura {`{{numero_factura}}`} - {`{{cliente}}`}</span>
              </div>
              <div className="email-plantilla-badge-row">
                <span className="badge-activa">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  {' '}Activa
                </span>
              </div>
            </div>
          </div>

          {/* Card: Envío automático */}
          <div className="email-card email-card-config">
            <div className="email-card-header">
              <span className="email-card-title">Envío automático</span>
              <button
                role="switch"
                aria-checked={autoEnvio}
                className={'email-toggle' + (autoEnvio ? ' on' : '')}
                onClick={() => setAutoEnvio(p => !p)}
                aria-label="Activar envío automático"
              >
                <span className="email-toggle-knob" />
              </button>
            </div>
            <div className="email-card-body">
              <p className="email-cc-label">Incluir en copia (CC):</p>
              <div className="email-chips-row">
                {ccEmails.map(e => (
                  <span key={e} className="email-chip">
                    {e}
                    <button className="chip-remove" aria-label={`Quitar ${e}`} onClick={() => removeCc(e)}>×</button>
                  </span>
                ))}
              </div>
              <form className="email-cc-form" onSubmit={addCc}>
                <input
                  className="email-cc-input"
                  type="email"
                  placeholder="Agregar email"
                  value={ccInput}
                  onChange={e => setCcInput(e.target.value)}
                />
                <button type="submit" className="btn-add-cc">+</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab 1: Plantillas ── */}
      <div role="tabpanel" id="email-panel-1" aria-labelledby="email-tab-1" hidden={tab !== 1}>

        {/* Header */}
        <div className="plantillas-page-header">
          <div>
            <h2 className="section-title-sm">Plantillas de email</h2>
            <p className="text-muted-sm">Gestioná las plantillas utilizadas para el envío de facturas</p>
          </div>
          <button className="btn-cta">
            NUEVA PLANTILLA
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Editor area: list + editor */}
        <div className="plantillas-editor-area">
          {/* Left: list */}
          <div className="plantillas-list">
            {plantillas.map((p, i) => (
              <button
                key={p.id}
                className={'plantilla-list-item' + (selectedPlantilla === i ? ' selected' : '')}
                onClick={() => selectPlantilla(i)}
              >
                <IcoEnvSm />
                <div className="pli-body">
                  <span className="pli-name">{p.nombre}</span>
                  {p.activa && <span className="pli-badge">Activa</span>}
                  <span className="pli-date">Actualizada: {p.fecha}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Right: editor */}
          <div className="plantilla-editor">
            <div className="pe-field">
              <label className="pe-label" htmlFor="pe-nombre">Nombre de la plantilla</label>
              <input id="pe-nombre" className="pe-input" value={editNombre}
                onChange={e => setEditNombre(e.target.value)} />
            </div>
            <div className="pe-field">
              <label className="pe-label" htmlFor="pe-asunto">Asunto</label>
              <input id="pe-asunto" className="pe-input" value={editAsunto}
                onChange={e => setEditAsunto(e.target.value)} />
            </div>
            <div className="pe-field">
              <label className="pe-label" htmlFor="pe-msg">Mensaje</label>
              <div className="richtext-toolbar" aria-label="Herramientas de formato">
                <select className="rtt-para" aria-label="Estilo de párrafo"><option>Párrafo</option><option>H1</option><option>H2</option></select>
                <button className="rtt-btn" type="button" aria-label="Fuente">Aa</button>
                <button className="rtt-btn rtt-bold" type="button" aria-label="Negrita">B</button>
                <button className="rtt-btn rtt-italic" type="button" aria-label="Cursiva"><em>T</em></button>
                <button className="rtt-btn" type="button" aria-label="Tachado"><s>ƒ</s></button>
                <button className="rtt-btn" type="button" aria-label="Lista ordenada">≡</button>
                <button className="rtt-btn" type="button" aria-label="Lista desordenada">≣</button>
                <button className="rtt-btn" type="button" aria-label="Enlace">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </button>
                <button className="rtt-btn" type="button" aria-label="Adjuntar">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                </button>
              </div>
              <textarea id="pe-msg" className="pe-textarea" rows={8} value={editMsg}
                onChange={e => setEditMsg(e.target.value)} />
            </div>
            <button className="btn-guardar ready" onClick={guardarPlantilla}>Guardar cambios</button>
          </div>
        </div>

        {/* Bottom area: preview + info */}
        <div className="plantillas-bottom-area">
          {/* Preview */}
          <div className="email-preview-card">
            <h3 className="email-preview-title">Vista previa del email</h3>
            <div className="email-preview-meta">
              <span className="ep-meta-row"><strong>Para:</strong> admin@maped.com</span>
              <span className="ep-meta-row"><strong>Asunto:</strong> {editAsunto.replace('{{numero_factura}}', 'FAC-131').replace('{{cliente}}', 'Maped')}</span>
            </div>
            <div className="email-preview-body">
              <div className="email-preview-logo">KYRA</div>
              <p className="ep-body-text">
                {editMsg.split('\n').map((line, i) => (
                  <span key={i}>{line.replace('{{cliente}}', 'Maped').replace('{{mes}}', 'junio 2026')}<br /></span>
                ))}
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="plantilla-info-card">
            <h3 className="plantilla-info-title">
              Información de la plantilla <IcoInfo />
            </h3>
            <h4 className="plantilla-info-name">{plantillas[selectedPlantilla].nombre}</h4>
            <div className="pi-rows">
              <div className="pi-row">
                <span className="pi-key">Estado:</span>
                <span className="pi-val">
                  {plantillas[selectedPlantilla].activa
                    ? <><span className="dot-activo" aria-hidden="true">●</span> Activa</>
                    : <><span className="dot-inactivo" aria-hidden="true">●</span> Inactiva</>}
                </span>
              </div>
              <div className="pi-row"><span className="pi-key">Creada el:</span><span className="pi-val">15/01/2026</span></div>
              <div className="pi-row"><span className="pi-key">Última edición:</span><span className="pi-val">{plantillas[selectedPlantilla].fecha}</span></div>
              <div className="pi-row"><span className="pi-key">Último envío:</span><span className="pi-val">01/06/2026</span></div>
              <div className="pi-row"><span className="pi-key">Usada en:</span><span className="pi-val">42 envíos</span></div>
            </div>
            <div className="pi-actions">
              <button className="btn-eliminar">Eliminar plantilla</button>
              <button className="btn-usar">Usar plantilla</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
