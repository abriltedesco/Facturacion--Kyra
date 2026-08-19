import { useState, useRef, useEffect } from 'react'
import Modal from '../components/Modal'
import BadgeEstadoEnvio from '../components/Emails/BadgeEstadoEnvio'
import EditorPlantilla from '../components/Emails/EditorPlantilla'
import { PLANTILLAS_INICIAL } from '../data/plantillasEmail'
import { CONFIG_EMAIL_INICIAL } from '../data/configEnvioEmail'
import { HISTORIAL_INICIAL } from '../data/historialEnvios'
import { CLIENTES_INICIAL } from '../data/clientes'
import { useFacturacion } from '../context/FacturacionContext'

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

/* ─────────────────────────── Helpers ────────────────────────────── */
const PAGE_SIZE = 8

function formatFecha(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function tipoDoc(archivoAdjunto) {
  if (!archivoAdjunto) return '—'
  return archivoAdjunto.startsWith('Invoice_') ? 'LLC' : 'AFIP'
}

function nombreCliente(clienteId) {
  const c = CLIENTES_INICIAL.find(c => c.id === clienteId)
  return c?.nombre || `Cliente ${clienteId}`
}

/* ─────────────────────────── Main Component ──────────────────────── */
export default function Emails() {
  const [tab, setTab]             = useState(0)

  // ── Historial: HISTORIAL_INICIAL + lo generado en la sesión (desde contexto compartido) ──
  const { historialEmail, addHistorialEmail } = useFacturacion()
  const historial = [...HISTORIAL_INICIAL, ...historialEmail]
  const [menuOpen, setMenuOpen]   = useState(null)
  const [reenvioRow, setReenvioRow] = useState(null)
  const [reenvioDest, setReenvioDest] = useState('')
  const [reenvioCcs, setReenvioCcs]   = useState([])
  const [errorRow, setErrorRow]   = useState(null)
  const [toast, setToast]         = useState(null)
  const menuRef = useRef(null)
  const reenvioTriggerRef = useRef(null)

  // ── Filtros / paginación ──
  const [page, setPage]           = useState(1)
  const [filtroEstado, setFiltroEstado]   = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  // ── Config de envío ──
  const [config, setConfig]       = useState(CONFIG_EMAIL_INICIAL)
  const [ccInput, setCcInput]     = useState('')

  // ── Plantillas ──
  const [plantillas, setPlantillas]         = useState(PLANTILLAS_INICIAL)
  const [selectedPlantilla, setSelectedPlantilla] = useState(0)
  const [editNombre, setEditNombre]   = useState(PLANTILLAS_INICIAL[0].nombre)
  const [editAsunto, setEditAsunto]   = useState(PLANTILLAS_INICIAL[0].asunto)
  const [editCuerpo, setEditCuerpo]   = useState(PLANTILLAS_INICIAL[0].cuerpo)

  // ── Efectos ──
  useEffect(() => {
    if (menuOpen === null) return
    const close = e => { if (!menuRef.current?.contains(e.target)) setMenuOpen(null) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  // ── Historial handlers ──
  const abrirReenvio = row => {
    setReenvioRow(row)
    setReenvioDest(row.emailDestino)
    setReenvioCcs(row.ccs || [])
    setMenuOpen(null)
  }

  const confirmarReenvio = () => {
    const nuevoRegistro = {
      ...reenvioRow,
      id: Date.now(),
      emailDestino: reenvioDest,
      ccs: reenvioCcs,
      fechaEnvio: new Date().toISOString(),
      estado: 'enviado',
      errorMensaje: null,
      intentos: (reenvioRow.intentos || 1) + 1,
    }
    addHistorialEmail(nuevoRegistro)
    setToast('Email reenviado a ' + reenvioDest)
    setReenvioRow(null)
  }

  const copiarDestinatario = row => {
    navigator.clipboard?.writeText(row.emailDestino)
    setToast('Destinatario copiado: ' + row.emailDestino)
    setMenuOpen(null)
  }

  // ── Filtros ──
  const clientesEnHistorial = [...new Set(historial.map(h => nombreCliente(h.clienteId)))]
  const estadosFiltro = ['enviado', 'error', 'pendiente']

  const filtered = historial.filter(r => {
    if (filtroEstado && r.estado !== filtroEstado) return false
    if (filtroCliente && nombreCliente(r.clienteId) !== filtroCliente) return false
    if (fechaDesde && r.fechaEnvio < fechaDesde) return false
    if (fechaHasta && r.fechaEnvio > fechaHasta + 'T23:59:59') return false
    return true
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Stat cards calculados del historial real ──
  const enviados  = historial.filter(h => h.estado === 'enviado').length
  const pendientes = historial.filter(h => h.estado === 'pendiente').length
  const errores   = historial.filter(h => h.estado === 'error').length
  const totalEnvios = historial.length

  const STAT_CARDS = [
    { icon: <IcoPaperPlane />, label: 'Enviados',   value: String(enviados),  sub: `${Math.round(enviados / totalEnvios * 100) || 0}% del total` },
    { icon: <IcoClock />,      label: 'Pendientes', value: String(pendientes), sub: `${Math.round(pendientes / totalEnvios * 100) || 0}% del total` },
    { icon: <IcoTriangle />,   label: 'Con error',  value: String(errores),   sub: `${Math.round(errores / totalEnvios * 100) || 0}% del total` },
    { icon: <IcoEnvelope />,   label: 'Total',      value: String(totalEnvios), sub: '100% del total' },
  ]

  // ── Config CC handlers ──
  function addCc(e) {
    e.preventDefault()
    const val = ccInput.trim()
    if (val && !(config.ccs || []).includes(val)) {
      setConfig(prev => ({ ...prev, ccs: [...(prev.ccs || []), val] }))
    }
    setCcInput('')
  }

  function removeCc(email) {
    setConfig(prev => ({ ...prev, ccs: (prev.ccs || []).filter(e => e !== email) }))
  }

  // ── Plantillas handlers ──
  function selectPlantilla(idx) {
    setSelectedPlantilla(idx)
    setEditNombre(plantillas[idx].nombre)
    setEditAsunto(plantillas[idx].asunto)
    setEditCuerpo(plantillas[idx].cuerpo)
  }

  function guardarPlantilla() {
    setPlantillas(prev => prev.map((p, i) =>
      i === selectedPlantilla
        ? { ...p, nombre: editNombre, asunto: editAsunto, cuerpo: editCuerpo, ultimaModificacion: new Date().toISOString().slice(0, 10) }
        : p
    ))
    setToast('Plantilla guardada')
  }

  const plantillaDefault = plantillas.find(p => p.id === config.plantillaDefaultId) || plantillas[0]

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
            value={fechaDesde} onChange={e => { setFechaDesde(e.target.value); setPage(1) }} />
        </div>
        <span className="email-filter-sep">–</span>
        <div className="email-filter-date">
          <label htmlFor="fecha-hasta" className="filter-label-sm">Fecha hasta</label>
          <input id="fecha-hasta" type="date" className="email-date-input"
            value={fechaHasta} onChange={e => { setFechaHasta(e.target.value); setPage(1) }} />
        </div>
        <div className="email-filter-select-wrap">
          <label htmlFor="fil-estado" className="filter-label-sm">Estado</label>
          <select id="fil-estado" className="email-filter-select"
            value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPage(1) }}>
            <option value="">Todos los estados</option>
            {estadosFiltro.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="email-filter-select-wrap">
          <label htmlFor="fil-cliente" className="filter-label-sm">Cliente</label>
          <select id="fil-cliente" className="email-filter-select"
            value={filtroCliente} onChange={e => { setFiltroCliente(e.target.value); setPage(1) }}>
            <option value="">Todos los clientes</option>
            {clientesEnHistorial.map(c => <option key={c} value={c}>{c}</option>)}
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
              if (e.key === 'ArrowLeft')  setTab(prev => (prev + 1) % 2)
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
                  <th>Tipo</th>
                  <th aria-label="Acciones"></th>
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                      Sin resultados para los filtros aplicados
                    </td>
                  </tr>
                ) : pageData.map(row => (
                  <tr key={row.id}>
                    <td>
                      <a href="#" className="factura-link" onClick={e => e.preventDefault()}>
                        <IcoPdf />
                        <span>{row.nroFactura}</span>
                      </a>
                    </td>
                    <td>{nombreCliente(row.clienteId)}</td>
                    <td className="text-muted-sm">{row.emailDestino}</td>
                    <td className="text-muted-sm">{formatFecha(row.fechaEnvio)}</td>
                    <td><BadgeEstadoEnvio estado={row.estado} size="sm" /></td>
                    <td className="text-muted-sm">{tipoDoc(row.archivoAdjunto)}</td>
                    <td className="row-menu-cell">
                      <button
                        className="btn-more"
                        aria-haspopup="true"
                        aria-expanded={menuOpen === row.id}
                        aria-label={'Acciones para ' + row.nroFactura}
                        onClick={() => setMenuOpen(menuOpen === row.id ? null : row.id)}
                      >
                        <IcoMore />
                      </button>
                      {menuOpen === row.id && (
                        <div className="row-menu" role="menu" ref={menuRef}>
                          <button role="menuitem" className="row-menu-item" onClick={() => abrirReenvio(row)}>
                            Reenviar email
                          </button>
                          <button role="menuitem" className="row-menu-item"
                            onClick={() => { setMenuOpen(null); setToast('Descargando ' + (row.archivoAdjunto || 'PDF') + '…') }}>
                            Ver PDF adjunto
                          </button>
                          <button role="menuitem" className="row-menu-item" onClick={() => copiarDestinatario(row)}>
                            Copiar destinatario
                          </button>
                          {row.estado === 'error' && (
                            <button role="menuitem" className="row-menu-item row-menu-item-error"
                              onClick={() => { setErrorRow(row); setMenuOpen(null) }}>
                              Ver detalle del error
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="email-pagination">
            <span className="pagination-info">
              {filtered.length === 0
                ? 'Sin resultados'
                : `Mostrando ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} de ${filtered.length}`}
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
              <button className="btn-editar-plantilla" onClick={() => setTab(1)}>
                <IcoEdit /> Editar plantilla
              </button>
            </div>
            <div className="email-card-body">
              <div className="email-plantilla-row">
                <span className="epr-label">Plantilla:</span>
                <span className="epr-value">{plantillaDefault.nombre}</span>
              </div>
              <div className="email-plantilla-row">
                <span className="epr-label">Asunto:</span>
                <span className="epr-value text-mono">{plantillaDefault.asunto}</span>
              </div>
              <div className="email-plantilla-row">
                <span className="epr-label">Remitente:</span>
                <span className="epr-value">{config.nombreRemitente} &lt;{config.emailRemitente}&gt;</span>
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
                aria-checked={config.envioAutomaticoGlobal}
                className={'email-toggle' + (config.envioAutomaticoGlobal ? ' on' : '')}
                onClick={() => setConfig(prev => ({ ...prev, envioAutomaticoGlobal: !prev.envioAutomaticoGlobal }))}
                aria-label="Activar envío automático"
              >
                <span className="email-toggle-knob" />
              </button>
            </div>
            <div className="email-card-body">
              <p className="email-cc-label">Incluir en copia (CC):</p>
              <div className="email-chips-row">
                {(config.ccs || []).map(e => (
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
                  placeholder="Agregar email CC"
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
                  {p.id === config.plantillaDefaultId && <span className="pli-badge">Activa</span>}
                  <span className="pli-date">Actualizada: {p.ultimaModificacion}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Right: editor */}
          <div className="plantilla-editor">
            <EditorPlantilla
              nombre={editNombre}
              asunto={editAsunto}
              cuerpo={editCuerpo}
              esActiva={plantillas[selectedPlantilla]?.id === config.plantillaDefaultId}
              emailPreview={
                CLIENTES_INICIAL.find(c => c.emailConfig?.emailPrincipal)?.emailConfig?.emailPrincipal
                || 'contacto@ayax.com.ar'
              }
              onChange={({ nombre, asunto, cuerpo }) => {
                setEditNombre(nombre)
                setEditAsunto(asunto)
                setEditCuerpo(cuerpo)
              }}
              onGuardar={guardarPlantilla}
              onActivar={() => {
                setConfig(prev => ({ ...prev, plantillaDefaultId: plantillas[selectedPlantilla].id }))
                setToast('Plantilla activada: ' + plantillas[selectedPlantilla].nombre)
              }}
            />
          </div>
        </div>

        {/* Info card — datos estadísticos de la plantilla seleccionada */}
        <div className="plantilla-info-card" style={{ marginTop: 24 }}>
          <h3 className="plantilla-info-title">
            Información de la plantilla <IcoInfo />
          </h3>
          <h4 className="plantilla-info-name">{plantillas[selectedPlantilla].nombre}</h4>
          <div className="pi-rows">
            <div className="pi-row">
              <span className="pi-key">Estado:</span>
              <span className="pi-val">
                {plantillas[selectedPlantilla].id === config.plantillaDefaultId
                  ? <><span className="dot-activo" aria-hidden="true">●</span> Activa</>
                  : <><span className="dot-inactivo" aria-hidden="true">●</span> Inactiva</>}
              </span>
            </div>
            <div className="pi-row">
              <span className="pi-key">Tipo:</span>
              <span className="pi-val">{plantillas[selectedPlantilla].tipo}</span>
            </div>
            <div className="pi-row">
              <span className="pi-key">Última edición:</span>
              <span className="pi-val">{plantillas[selectedPlantilla].ultimaModificacion}</span>
            </div>
            <div className="pi-row">
              <span className="pi-key">Envíos exitosos:</span>
              <span className="pi-val">
                {historial.filter(h => h.plantillaId === plantillas[selectedPlantilla].id && h.estado === 'enviado').length}
              </span>
            </div>
          </div>
          <div className="pi-actions">
            <button
              className="btn-eliminar"
              onClick={() => {
                if (plantillas.length <= 1) { setToast('No podés eliminar la única plantilla'); return }
                setPlantillas(prev => prev.filter((_, i) => i !== selectedPlantilla))
                setSelectedPlantilla(0)
                setEditNombre(plantillas[0].nombre)
                setEditAsunto(plantillas[0].asunto)
                setEditCuerpo(plantillas[0].cuerpo)
                setToast('Plantilla eliminada')
              }}
            >
              Eliminar plantilla
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal de reenvío ── */}
      <Modal
        isOpen={!!reenvioRow}
        onClose={() => setReenvioRow(null)}
        title="REENVIAR EMAIL"
        triggerRef={reenvioTriggerRef}
        footer={
          <div className="modal-footer-inner">
            <div className="modal-validation" />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-cancelar" onClick={() => setReenvioRow(null)}>Cancelar</button>
              <button className="btn-guardar ready" onClick={confirmarReenvio}>Reenviar</button>
            </div>
          </div>
        }
      >
        {reenvioRow && (
          <>
            <p className="reenvio-desc">
              Vas a reenviar <strong>{reenvioRow.nroFactura}</strong> ({nombreCliente(reenvioRow.clienteId)}) con el PDF adjunto.
              El reenvío queda registrado como un envío nuevo en el historial.
            </p>
            <div className="form-group">
              <label htmlFor="reenvio-dest">Destinatario</label>
              <input id="reenvio-dest" className="form-input" type="email"
                value={reenvioDest} onChange={e => setReenvioDest(e.target.value)} />
              <span className="field-hint">Podés cambiar el destinatario antes de reenviar</span>
            </div>
            {reenvioCcs.length > 0 && (
              <div className="form-group">
                <label>CC</label>
                <div className="email-chips-row" style={{ marginTop: 4 }}>
                  {reenvioCcs.map(cc => (
                    <span key={cc} className="email-chip">{cc}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* ── Modal detalle del error ── */}
      <Modal
        isOpen={!!errorRow}
        onClose={() => setErrorRow(null)}
        title="DETALLE DEL ERROR"
        triggerRef={reenvioTriggerRef}
        footer={
          <div className="modal-footer-inner">
            <div className="modal-validation" />
            <button className="btn-guardar ready" onClick={() => { const r = errorRow; setErrorRow(null); abrirReenvio(r) }}>
              Reintentar envío
            </button>
          </div>
        }
      >
        {errorRow && (
          <div className="error-detail">
            <div className="error-detail-row"><span className="error-detail-key">Factura</span><span>{errorRow.nroFactura}</span></div>
            <div className="error-detail-row"><span className="error-detail-key">Cliente</span><span>{nombreCliente(errorRow.clienteId)}</span></div>
            <div className="error-detail-row"><span className="error-detail-key">Destinatario</span><span>{errorRow.emailDestino}</span></div>
            <div className="error-detail-row"><span className="error-detail-key">Fecha del intento</span><span>{formatFecha(errorRow.fechaEnvio)}</span></div>
            <div className="error-detail-row"><span className="error-detail-key">Intentos</span><span>{errorRow.intentos}</span></div>
            <div className="error-detail-msg">
              <IcoTriangle />
              <span>{errorRow.errorMensaje || 'Error desconocido. Intentá reenviar en unos minutos.'}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Toast ── */}
      {toast && (
        <div className="toast" role="status" aria-live="polite">{toast}</div>
      )}
    </div>
  )
}
