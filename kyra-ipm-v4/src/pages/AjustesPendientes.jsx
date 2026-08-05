import { useState, useRef, Fragment } from 'react'
import Modal from '../components/Modal'

const TABS = ['Necesitan revisión', 'Listas para aprobar', 'Aprobadas', 'Historial']

/* ── Historial IPC ── */
const HISTORIAL_IPC = [
  { id:1, periodo:'Mayo 2026',    pct:'+8,4%',  clientes:11, fecha:'02/05/2026',
    detalle:[
      { cliente:'MAPED',      antes:'$ 442.000', despues:'$ 479.100' },
      { cliente:'EDDING ARG', antes:'$ 480.000', despues:'$ 520.300' },
      { cliente:'AYAX',       antes:'$ 260.000', despues:'$ 281.800' },
    ]},
  { id:2, periodo:'Abril 2026',   pct:'+9,1%',  clientes:10, fecha:'01/04/2026',
    detalle:[
      { cliente:'MAPED',      antes:'$ 405.100', despues:'$ 442.000' },
      { cliente:'TECHCORP',   antes:'US$ 733',   despues:'US$ 800' },
    ]},
  { id:3, periodo:'Marzo 2026',   pct:'+11,3%', clientes:12, fecha:'02/03/2026',
    detalle:[
      { cliente:'EDDING COL', antes:'US$ 1.402', despues:'US$ 1.560' },
      { cliente:'GRUPO CL',   antes:'$ 161.700', despues:'$ 180.000' },
    ]},
  { id:4, periodo:'Febrero 2026', pct:'+10,0%', clientes:12, fecha:'01/02/2026',
    detalle:[
      { cliente:'DRAFTEA',    antes:'$ 563.600', despues:'$ 620.000' },
    ]},
]

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

/* ── Mock data ── */
const DATA_REVISION_INICIAL = [
  { id:1, nombre:'MAPED',      tipo:'SRL - Factura A - ARS',   impacto:'Alto impacto',  alerta:'Aumento significativo', ajuste:'+14,2%', monto:'$ 580.800', aplicar:'a aplicar en Julio' },
  { id:2, nombre:'EDDING COL', tipo:'SRL - Factura LLC - USD', impacto:'Bajo impacto',  alerta:'Aumento significativo', ajuste:'+14,2%', monto:'US$ 1.781', aplicar:'a aplicar en Julio' },
  { id:3, nombre:'EDDING COL', tipo:'SRL - Factura LLC - USD', impacto:'Alto impacto',  alerta:'Aumento significativo', ajuste:'+14,2%', monto:'US$ 450',   aplicar:'a aplicar en Julio' },
  { id:4, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS',   impacto:'Alto impacto',  alerta:'Aumento significativo', ajuste:'+14,2%', monto:'$ 420.000', aplicar:'a aplicar en Julio' },
  { id:5, nombre:'MAPED',      tipo:'SRL - Factura A - ARS',   impacto:'Bajo impacto',  alerta:'Dentro del rango esperado', ajuste:'+8%', monto:'$ 479.100', aplicar:'a aplicar en Julio' },
]

const DATA_APROBAR_INICIAL = [
  { id:1, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS', servicio:'Consultoría mensual - 12hs', base:'480.000 + IVA 21%', monto:'$ 580.800', aplicar:'a aplicar en Julio', ajuste:'+14,2%', margen:'+7%', ok:true },
  { id:2, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS', servicio:'Consultoría mensual - 12hs', base:'480.000 + IVA 21%', monto:'$ 580.800', aplicar:'a aplicar en Julio', ajuste:'+14,2%', margen:'+7%', ok:true },
  { id:3, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS', servicio:'Consultoría mensual - 12hs', base:'480.000 + IVA 21%', monto:'$ 580.800', aplicar:'a aplicar en Julio', ajuste:'+14,2%', margen:'+7%', ok:true },
]

const DATA_APROBADAS_INICIAL = [
  { id:1, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS', servicio:'Consultoría mensual - 12hs', base:'480.000 + IVA 21%', monto:'$ 580.800', aplicar:'a aplicar en Julio', ajuste:'+14,2%', margen:'+7%', ok:true },
  { id:2, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS', servicio:'Consultoría mensual - 12hs', base:'480.000 + IVA 21%', monto:'$ 580.800', aplicar:'a aplicar en Julio', ajuste:'+14,2%', margen:'+7%', ok:true },
]

/* ── Íconos ── */
const IcoWarn = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IcoCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoCheckCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IcoClock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IcoEditBig = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IcoCheckBig = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

/* ──────────────────────────────────────────────
   Vista de edición de un ajuste individual
────────────────────────────────────────────── */
function EditarAjuste({ item, onVolver, onAprobar }) {
  const [tipo, setTipo]       = useState('IPC')
  const [pct, setPct]         = useState('14,2')
  const [antes, setAntes]     = useState('$ x')
  const [despues, setDespues] = useState('$ x')
  const [motivo, setMotivo]   = useState('')

  return (
    <div className="ajuste-edit-page">
      <h1 className="page-title">Editar ajustes pendientes</h1>
      <p className="page-subtitle">Revisá la propuesta de ajuste y definí si corresponde aplicarla.</p>

      {/* Banner informativo */}
      <div className="ajuste-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span>Este mes se aplica ajuste IPC, al aprobar, se desbloquea el cálculo en Facturación.</span>
      </div>

      {/* Header card — 3 columnas */}
      <div className="ajuste-header-card">
        <div className="ajuste-hc-col">
          <div className="ajuste-hc-nombre">{item.nombre}</div>
          <div className="ajuste-hc-tipo">{item.tipo} · Alto impacto</div>
          <div className="ajuste-hc-alerta"><IcoWarn /> Alto impacto</div>
          <span className="fac-badge-cliente">Cliente</span>
        </div>
        <div className="ajuste-hc-col ajuste-hc-mid">
          <div className="ajuste-hc-sub">Ajuste propuesto (IPC)</div>
          <div className="ajuste-hc-pct">+14,2%</div>
          <div className="ajuste-hc-range">Antes $x · Ahora $x</div>
        </div>
        <div className="ajuste-hc-col">
          <div className="ajuste-hc-sub">Riesgo detectado</div>
          <div className="ajuste-hc-riesgo"><IcoWarn /> Aumento significativo</div>
          <div className="ajuste-hc-vs">Vs. últimos 3 ajustes</div>
        </div>
      </div>

      {/* Grid principal — 2 columnas */}
      <div className="ajuste-main-grid">

        {/* Formulario */}
        <div className="ajuste-form-card">
          <h2 className="ajuste-form-title">Ajuste propuesto</h2>
          <div className="ajuste-form-row">
            <div className="ajuste-form-field">
              <label htmlFor="af-tipo">Tipo de ajuste</label>
              <select id="af-tipo" value={tipo} onChange={e => setTipo(e.target.value)}>
                <option>IPC</option>
                <option>Manual</option>
                <option>Dólar</option>
              </select>
            </div>
            <div className="ajuste-form-field">
              <label htmlFor="af-pct">Porcentaje de ajuste</label>
              <div className="ajuste-pct-wrap">
                <input id="af-pct" type="text" value={pct} onChange={e => setPct(e.target.value)} />
                <span className="ajuste-pct-sym">%</span>
              </div>
            </div>
          </div>
          <div className="ajuste-form-row">
            <div className="ajuste-form-field">
              <label htmlFor="af-antes">
                Monto antes del ajuste{' '}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ marginLeft: 3, verticalAlign: 'middle' }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </label>
              <input id="af-antes" type="text" value={antes} onChange={e => setAntes(e.target.value)} />
            </div>
            <div className="ajuste-form-field">
              <label htmlFor="af-despues">
                Monto después del ajuste{' '}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ marginLeft: 3, verticalAlign: 'middle' }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </label>
              <input id="af-despues" type="text" value={despues} onChange={e => setDespues(e.target.value)} />
            </div>
          </div>
          <div className="ajuste-form-field">
            <label htmlFor="af-motivo">Motivo (opcional)</label>
            <textarea
              id="af-motivo" rows={6} maxLength={300}
              placeholder="Escribí un comentario si necesitás dejar contexto sobre este ajuste..."
              value={motivo} onChange={e => setMotivo(e.target.value)}
            />
            <div className="char-count">{motivo.length}/300</div>
          </div>
        </div>

        {/* Contexto del cliente */}
        <div className="ajuste-context-card">
          <h2 className="ajuste-form-title">Contexto del cliente</h2>
          <div className="ajuste-ctx-block">
            <div className="ajuste-ctx-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <div>
                <div className="ajuste-ctx-label">Último aumento</div>
                <div className="ajuste-ctx-val">Hace 4 meses</div>
              </div>
            </div>
            <div className="ajuste-ctx-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
              </svg>
              <div>
                <div className="ajuste-ctx-label">Variación acumulada anual</div>
                <div className="ajuste-ctx-val">+39%</div>
              </div>
            </div>
            <div className="ajuste-ctx-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <div>
                <div className="ajuste-ctx-label">Márgen proyectado</div>
                <div className="ajuste-ctx-val">+7%</div>
              </div>
            </div>
          </div>
          <div className="ajuste-ctx-impact">
            <div className="ajuste-impact-row">
              <span className="ajuste-impact-label">En base al nuevo monto</span>
              <span className="ajuste-impact-val">$ x</span>
            </div>
            <div className="ajuste-impact-row">
              <span className="ajuste-impact-label">Impacto mensual</span>
              <span className="ajuste-impact-val">$ x</span>
            </div>
            <div className="ajuste-impact-row">
              <span className="ajuste-impact-label">Impacto anual proyectado</span>
              <span className="ajuste-impact-val"><strong>Impacto estimado</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer de acciones */}
      <div className="ajuste-edit-footer">
        <button className="btn-cancelar" onClick={onVolver}>CANCELAR</button>
        <div className="ajuste-footer-right">
          <button className="btn-guardar ready">GUARDAR CAMBIOS</button>
          <button className="btn-aprobar-fac" onClick={() => onAprobar && onAprobar(item)}>
            APROBAR <IcoCheck />
          </button>
        </div>
      </div>

      <button className="ajuste-volver" onClick={onVolver}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        {' '}Volver
      </button>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Card compartida para Listas para aprobar / Aprobadas
────────────────────────────────────────────── */
function AjusteAprobarCard({ r, onRechazar, onAprobar, esAprobada = false }) {
  return (
    <div className="ajuste-aprobar-card">
      {/* Col izquierda */}
      <div className="ajuste-aprobar-left">
        <div className="ajuste-aprobar-nombre-row">
          <span className="fac-card-nombre">{r.nombre}</span>
          <span className="fac-badge-cliente">Cliente</span>
        </div>
        <div className="fac-card-tipo">{r.tipo}</div>
        <div className="ajuste-aprobar-monto">{r.monto}</div>
        <div className="ajuste-aprobar-aplicar">{r.aplicar}</div>
      </div>

      {/* Col central */}
      <div className="ajuste-aprobar-mid">
        <div className="ajuste-rev-tipo-label">Ajuste IPC</div>
        <div className="ajuste-rev-pct">{r.ajuste}</div>
        <div className="ajuste-rev-range">Antes $x · Ahora $x</div>
        <div className="ajuste-rev-range">Margen proyectado: {r.margen}</div>
        {r.ok && (
          <div className="ajuste-ok">
            <IcoCheckCircle /> Dentro del rango esperado.
          </div>
        )}
      </div>

      {/* Col derecha */}
      <div className="ajuste-aprobar-right-col">
        <div className="ajuste-service-name">{r.servicio}</div>
        <div className="ajuste-service-base">{r.base}</div>
        <div className="ajuste-aprobar-actions">
          <button
            className="btn-rechazar"
            onClick={() => onRechazar && onRechazar(r.id)}
          >
            RECHAZAR ×
          </button>
          <button
            className={'btn-aprobar-fac' + (esAprobada ? ' btn-aprobado-state' : '')}
            onClick={() => !esAprobada && onAprobar && onAprobar(r)}
            disabled={esAprobada}
            aria-label={esAprobada ? 'Ya aprobado' : 'Aprobar ajuste'}
          >
            APROBAR ✓
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Componente principal
────────────────────────────────────────────── */
export default function AjustesPendientes() {
  const [tab, setTab]             = useState(0)
  const [editItem, setEditItem]   = useState(null)

  /* listas mutables */
  const [revision, setRevision]       = useState([...DATA_REVISION_INICIAL])
  const [listaAprobar, setListaAprobar] = useState([...DATA_APROBAR_INICIAL])
  const [listaAprobadas, setListaAprobadas] = useState([...DATA_APROBADAS_INICIAL])

  /* modal IPC */
  const [ipcOpen, setIpcOpen]   = useState(false)
  const [ipcMes, setIpcMes]     = useState('')
  const [ipcAnio, setIpcAnio]   = useState('2026')
  const [ipcPct, setIpcPct]     = useState('')
  const [toast, setToast]       = useState(null)

  /* historial */
  const [expandido, setExpandido] = useState(null)

  const btnIpcRef = useRef(null)

  const pctNum     = parseFloat(String(ipcPct).replace(',', '.'))
  const ipcValido  = ipcMes && !isNaN(pctNum) && pctNum > 0
  const clientesAfectados = ipcValido ? 12 : 0

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function generarAjustes() {
    if (!ipcValido) return
    setIpcOpen(false)
    setTab(0)
    showToast('Se generaron ' + clientesAfectados + ' ajustes para ' + ipcMes + ' ' + ipcAnio)
  }

  /* ── Handlers de aprobación ── */
  function handleAprobarDesdeAprobar(row) {
    setListaAprobar(prev => prev.filter(r => r.id !== row.id))
    setListaAprobadas(prev => [...prev, row])
    showToast('Ajuste aprobado')
  }

  function handleRechazarDesdeAprobar(id) {
    setListaAprobar(prev => prev.filter(r => r.id !== id))
    showToast('Ajuste rechazado')
  }

  function handleRechazarDesdeAprobadas(id) {
    const row = listaAprobadas.find(r => r.id === id)
    if (!row) return
    setListaAprobadas(prev => prev.filter(r => r.id !== id))
    setListaAprobar(prev => [...prev, row])
    showToast('Aprobación revertida')
  }

  function handleAprobarDesdeEditar(item) {
    setEditItem(null)
    setRevision(prev => prev.filter(r => r.id !== item.id))
    setListaAprobadas(prev => [...prev, { ...item, servicio: 'Consultoría mensual - 12hs', base: '480.000 + IVA 21%', margen: '+7%', ok: true }])
    setTab(2)
    showToast('Ajuste aprobado desde edición')
  }

  function handleTabKey(e, idx) {
    if (e.key === 'ArrowRight') { e.preventDefault(); setTab((idx + 1) % TABS.length) }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); setTab((idx + TABS.length - 1) % TABS.length) }
  }

  /* ── Vista de edición (ocupa pantalla completa) ── */
  if (editItem) {
    return (
      <EditarAjuste
        item={editItem}
        onVolver={() => setEditItem(null)}
        onAprobar={handleAprobarDesdeEditar}
      />
    )
  }

  return (
    <div className="ajustes-page">

      {/* Header con CTA */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ajustes pendientes de Junio 2026</h1>
          <p className="page-subtitle">Revisá y gestioná los ajustes para subir precios a clientes y honorarios al equipo.</p>
        </div>
        <div className="page-header-actions">
          <button
            ref={btnIpcRef}
            className="btn-cta"
            onClick={() => { setIpcOpen(true); setIpcMes(''); setIpcPct('') }}
          >
            NUEVA ACTUALIZACIÓN IPC
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="ajustes-stat-cards">
        {[
          { icon: <IcoClock />,    label: 'Pendientes revisión', val: revision.length,       sub: 'ajustes pendientes' },
          { icon: <IcoEditBig />,  label: 'Listas para aprobar', val: listaAprobar.length,   sub: 'ajustes pendientes' },
          { icon: <IcoCheckBig />, label: 'Aprobadas',           val: listaAprobadas.length, sub: 'ajustes pendientes' },
        ].map(c => (
          <div key={c.label} className="ajuste-stat-card">
            <div className="ajuste-stat-icon">{c.icon}</div>
            <div className="ajuste-stat-body">
              <div className="ajuste-stat-label">{c.label}</div>
              <div className="ajuste-stat-value">{c.val}</div>
              <div className="ajuste-stat-sub">{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div role="tablist" className="subtabs fac-tabs" aria-label="Estado de ajustes">
        {TABS.map((t, i) => (
          <button
            key={t} role="tab"
            id={`ajust-tab-${i}`}
            aria-selected={tab === i}
            aria-controls={`ajust-panel-${i}`}
            tabIndex={tab === i ? 0 : -1}
            className={'subtab' + (tab === i ? ' active' : '')}
            onClick={() => setTab(i)}
            onKeyDown={e => handleTabKey(e, i)}
          >{t}</button>
        ))}
      </div>

      {/* ── Panel 0: Necesitan revisión ── */}
      <div role="tabpanel" id="ajust-panel-0" aria-labelledby="ajust-tab-0" hidden={tab !== 0}>
        <div className="fac-card-list">
          {revision.length === 0 && (
            <div className="fac-empty-state">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Sin ajustes pendientes de revisión
            </div>
          )}
          {revision.map(r => (
            <div key={r.id} className="ajuste-revision-card">
              {/* Col izquierda */}
              <div className="ajuste-rev-left">
                <div className="fac-card-nombre">{r.nombre}</div>
                <div className="fac-card-tipo">{r.tipo} · {r.impacto}</div>
                <div className="ajuste-rev-monto">{r.monto}</div>
                <div className="ajuste-rev-aplicar">{r.aplicar}</div>
                <div className="fac-card-alerta">
                  <IcoWarn /> {r.alerta}
                </div>
                <span className="fac-badge-cliente">Cliente</span>
              </div>

              {/* Col central */}
              <div className="ajuste-rev-mid">
                <div className="ajuste-rev-tipo-label">Ajuste IPC</div>
                <div className="ajuste-rev-pct">{r.ajuste}</div>
                <div className="ajuste-rev-range">Antes $x · Ahora $x</div>
              </div>

              {/* Col derecha */}
              <div className="ajuste-rev-right">
                <button className="btn-editar-fac" onClick={() => setEditItem(r)}>
                  EDITAR <IcoEdit />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel 1: Listas para aprobar ── */}
      <div role="tabpanel" id="ajust-panel-1" aria-labelledby="ajust-tab-1" hidden={tab !== 1}>
        <div className="fac-card-list">
          {listaAprobar.length === 0 && (
            <div className="fac-empty-state">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Todos los ajustes fueron procesados
            </div>
          )}
          {listaAprobar.map(r => (
            <AjusteAprobarCard
              key={r.id}
              r={r}
              onRechazar={handleRechazarDesdeAprobar}
              onAprobar={handleAprobarDesdeAprobar}
              esAprobada={false}
            />
          ))}
        </div>
      </div>

      {/* ── Panel 2: Aprobadas ── */}
      <div role="tabpanel" id="ajust-panel-2" aria-labelledby="ajust-tab-2" hidden={tab !== 2}>
        <div className="fac-card-list">
          {listaAprobadas.length === 0 && (
            <div className="fac-empty-state">No hay ajustes aprobados aún</div>
          )}
          {listaAprobadas.map(r => (
            <AjusteAprobarCard
              key={r.id}
              r={r}
              onRechazar={handleRechazarDesdeAprobadas}
              onAprobar={null}
              esAprobada={true}
            />
          ))}
        </div>
      </div>

      {/* ── Panel 3: Historial ── */}
      <div role="tabpanel" id="ajust-panel-3" aria-labelledby="ajust-tab-3" hidden={tab !== 3}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th scope="col">PERÍODO</th>
                <th scope="col">% IPC APLICADO</th>
                <th scope="col">CLIENTES ACTUALIZADOS</th>
                <th scope="col">FECHA DE APLICACIÓN</th>
                <th scope="col" style={{ width: 120 }}><span className="sr-only">Detalle</span></th>
              </tr>
            </thead>
            <tbody>
              {HISTORIAL_IPC.map(h => (
                <Fragment key={h.id}>
                  <tr>
                    <td>{h.periodo}</td>
                    <td className="td-muted">{h.pct}</td>
                    <td className="td-muted">{h.clientes} clientes</td>
                    <td className="td-muted">{h.fecha}</td>
                    <td>
                      <button
                        className="btn-ver-detalle"
                        aria-expanded={expandido === h.id}
                        onClick={() => setExpandido(expandido === h.id ? null : h.id)}
                      >
                        {expandido === h.id ? 'CERRAR' : 'VER DETALLE'}
                      </button>
                    </td>
                  </tr>
                  {expandido === h.id && (
                    <tr className="hist-detalle-row">
                      <td colSpan={5}>
                        <div className="hist-detalle">
                          {h.detalle.map(d => (
                            <div key={d.cliente} className="hist-detalle-item">
                              <span className="hist-detalle-cliente">{d.cliente}</span>
                              <span className="hist-detalle-montos">
                                {d.antes} → <strong>{d.despues}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Nueva actualización IPC ── */}
      <Modal
        isOpen={ipcOpen}
        onClose={() => setIpcOpen(false)}
        title="NUEVA ACTUALIZACIÓN IPC"
        triggerRef={btnIpcRef}
        footer={
          <div className="modal-footer-inner">
            <div className="modal-validation">
              {!ipcValido && ipcPct !== '' && (
                <span>Ingresá un período y un % válido</span>
              )}
            </div>
            <button
              className={'btn-guardar' + (ipcValido ? ' ready' : '')}
              onClick={generarAjustes}
            >
              Generar ajustes
            </button>
          </div>
        }
      >
        <p className="reenvio-desc">
          Ingresá el % de IPC acumulado del período. El sistema va a generar los ajustes
          pendientes para todos los clientes con actualización activa ese mes.
        </p>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ipc-mes">Mes</label>
            <select id="ipc-mes" className="form-select" value={ipcMes} onChange={e => setIpcMes(e.target.value)}>
              <option value="" />
              {MESES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="ipc-anio">Año</label>
            <select id="ipc-anio" className="form-select" value={ipcAnio} onChange={e => setIpcAnio(e.target.value)}>
              {['2026', '2027'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="ipc-pct">% acumulado de IPC</label>
          <div className="ajuste-pct-wrap">
            <input
              id="ipc-pct"
              className="form-input"
              inputMode="decimal"
              placeholder="14,2"
              value={ipcPct}
              onChange={e => setIpcPct(e.target.value)}
            />
            <span className="ajuste-pct-sym">%</span>
          </div>
        </div>
        {ipcValido && (
          <div className="ipc-preview">
            <div className="ipc-preview-title">Vista previa</div>
            <div className="ipc-preview-row">
              <span>Clientes afectados</span>
              <strong>{clientesAfectados}</strong>
            </div>
            <div className="ipc-preview-row">
              <span>Aumento promedio estimado</span>
              <strong>+{ipcPct}% sobre el monto actual</strong>
            </div>
            <div className="ipc-preview-row">
              <span>Se aplica en</span>
              <strong>{ipcMes} {ipcAnio}</strong>
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <div className="toast" role="status" aria-live="polite">{toast}</div>
      )}
    </div>
  )
}
