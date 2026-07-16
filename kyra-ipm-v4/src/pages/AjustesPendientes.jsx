import { useState } from 'react'

const TABS = ['Necesitan revisión', 'Listas para aprobar', 'Aprobadas']

/* ── Mock data ── */
const DATA_REVISION = [
  { id:1, nombre:'MAPED',      tipo:'SRL - Factura A - ARS · Alto impacto',  alerta:'Aumento significativo', ajuste:'+14,2%', antes:'$x', ahora:'$x' },
  { id:2, nombre:'EDDING COL', tipo:'SRL - Factura LLC - USD · Bajo impacto', alerta:'Aumento significativo', ajuste:'+14,2%', antes:'$x', ahora:'$x' },
  { id:3, nombre:'EDDING COL', tipo:'SRL - Factura LLC - USD · Alto impacto', alerta:'Aumento significativo', ajuste:'+14,2%', antes:'$x', ahora:'$x' },
  { id:4, nombre:'EDDING COL', tipo:'SRL - Factura LLC - USD · Alto impacto', alerta:'Aumento significativo', ajuste:'+14,2%', antes:'$x', ahora:'$x' },
  { id:5, nombre:'MAPED',      tipo:'SRL - Factura A - ARS · Bajo impacto',  alerta:'Dentro del rango esperado', ajuste:'+8%', antes:'$x', ahora:'$x' },
]

const DATA_APROBAR = [
  { id:1, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS', servicio:'Consultoría mensual - 12hrs', base:'480.000 + IVA 21%', monto:'$ 580.800', aplicar:'a aplicar en Julio', ajuste:'+14,2%', margen:'+7%', ok:true },
  { id:2, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS', servicio:'Consultoría mensual - 12hrs', base:'480.000 + IVA 21%', monto:'$ 580.800', aplicar:'a aplicar en Julio', ajuste:'+14,2%', margen:'+7%', ok:true },
  { id:3, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS', servicio:'Consultoría mensual - 12hrs', base:'480.000 + IVA 21%', monto:'$ 580.800', aplicar:'a aplicar en Julio', ajuste:'+14,2%', margen:'+7%', ok:true },
]

const DATA_APROBADAS = [
  { id:1, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS', servicio:'Consultoría mensual - 12hrs', base:'480.000 + IVA 21%', monto:'$ 580.800', aplicar:'a aplicar en Julio', ajuste:'+14,2%', margen:'+7%', ok:true },
  { id:2, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS', servicio:'Consultoría mensual - 12hrs', base:'480.000 + IVA 21%', monto:'$ 580.800', aplicar:'a aplicar en Julio', ajuste:'+14,2%', margen:'+7%', ok:true },
]

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
const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

/* ── Edit detail view ── */
function EditarAjuste({ item, onVolver }) {
  const [tipo, setTipo]     = useState('IPC')
  const [pct, setPct]       = useState('14,2')
  const [antes, setAntes]   = useState('$ x')
  const [despues, setDespues] = useState('$ x')
  const [motivo, setMotivo] = useState('')

  return (
    <div className="ajuste-edit-page">
      <h1 className="page-title">Editar ajustes pendientes</h1>
      <p className="page-subtitle">Revisá la propuesta de ajuste y definí si corresponde aplicarla.</p>

      {/* Info banner */}
      <div className="ajuste-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span>Este mes se aplica ajuste IPC, al aprobar, se desbloquea el cálculo en Facturación.</span>
      </div>

      {/* Header card */}
      <div className="ajuste-header-card">
        <div className="ajuste-hc-col">
          <div className="ajuste-hc-nombre">{item.nombre}</div>
          <div className="ajuste-hc-tipo">SRL - Factura A - ARS · Alto impacto</div>
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

      {/* Main two-column */}
      <div className="ajuste-main-grid">
        {/* Left: form */}
        <div className="ajuste-form-card">
          <h2 className="ajuste-form-title">Ajuste propuesto</h2>
          <div className="ajuste-form-row">
            <div className="ajuste-form-field">
              <label htmlFor="af-tipo">Tipo de ajuste</label>
              <select id="af-tipo" value={tipo} onChange={e => setTipo(e.target.value)}>
                <option>IPC</option><option>Manual</option><option>Dólar</option>
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
              <label htmlFor="af-antes">Monto antes del ajuste
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{marginLeft:4}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </label>
              <input id="af-antes" type="text" value={antes} onChange={e => setAntes(e.target.value)} />
            </div>
            <div className="ajuste-form-field">
              <label htmlFor="af-despues">Monto después del ajuste
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{marginLeft:4}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </label>
              <input id="af-despues" type="text" value={despues} onChange={e => setDespues(e.target.value)} />
            </div>
          </div>
          <div className="ajuste-form-field">
            <label htmlFor="af-motivo">Motivo (opcional)</label>
            <textarea id="af-motivo" rows={6} maxLength={300}
              placeholder="Escribí un comentario si necesitás dejar contexto sobre este ajuste..."
              value={motivo} onChange={e => setMotivo(e.target.value)} />
            <div className="char-count">{motivo.length}/300</div>
          </div>
        </div>

        {/* Right: context */}
        <div className="ajuste-context-card">
          <h2 className="ajuste-form-title">Contexto del cliente</h2>
          <div className="ajuste-ctx-block">
            <div className="ajuste-ctx-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <div>
                <div className="ajuste-ctx-label">Último aumento</div>
                <div className="ajuste-ctx-val">Hace 4 meses</div>
              </div>
            </div>
            <div className="ajuste-ctx-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              <div>
                <div className="ajuste-ctx-label">Variación acumulada anual</div>
                <div className="ajuste-ctx-val">+39%</div>
              </div>
            </div>
            <div className="ajuste-ctx-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
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

      {/* Footer actions */}
      <div className="ajuste-edit-footer">
        <button className="btn-cancelar" onClick={onVolver}>CANCELAR</button>
        <div className="ajuste-footer-right">
          <button className="btn-guardar ready">GUARDAR CAMBIOS</button>
          <button className="btn-aprobar-fac">APROBAR <IcoCheck /></button>
        </div>
      </div>

      <button className="ajuste-volver" onClick={onVolver}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        {' '}Volver
      </button>
    </div>
  )
}

/* ── Main component ── */
export default function AjustesPendientes() {
  const [tab, setTab]       = useState(0)
  const [editItem, setEditItem] = useState(null)

  function handleTabKey(e, idx) {
    if (e.key === 'ArrowRight') { e.preventDefault(); setTab((idx+1) % TABS.length) }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); setTab((idx+TABS.length-1) % TABS.length) }
  }

  if (editItem) return <EditarAjuste item={editItem} onVolver={() => setEditItem(null)} />

  const IcoClock  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  const IcoEditBig = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  const IcoCheckBig = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>

  return (
    <div className="ajustes-page">
      <h1 className="page-title">Ajustes pendientes de Junio 2026</h1>
      <p className="page-subtitle">Revisá y gestioná los ajustes para subir precios a clientes y honorarios al equipo.</p>

      {/* Stat cards */}
      <div className="ajustes-stat-cards">
        {[
          { icon: <IcoClock />,    label: 'Pendientes revisión', val: DATA_REVISION.length, sub: 'ajustes pendientes' },
          { icon: <IcoEditBig />,  label: 'Listas para aprobar', val: DATA_APROBAR.length,  sub: 'ajustes pendientes' },
          { icon: <IcoCheckBig />, label: 'Aprobadas',           val: DATA_APROBADAS.length,sub: 'ajustes pendientes' },
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

      {/* Tabs */}
      <div role="tablist" className="subtabs fac-tabs" aria-label="Estado de ajustes">
        {TABS.map((t, i) => (
          <button key={t} role="tab" id={`ajust-tab-${i}`}
            aria-selected={tab === i} aria-controls={`ajust-panel-${i}`}
            tabIndex={tab === i ? 0 : -1}
            className={'subtab' + (tab === i ? ' active' : '')}
            onClick={() => setTab(i)}
            onKeyDown={e => handleTabKey(e, i)}
          >{t}</button>
        ))}
      </div>

      {/* Panel 0: Necesitan revisión */}
      <div role="tabpanel" id="ajust-panel-0" aria-labelledby="ajust-tab-0" hidden={tab !== 0}>
        <div className="fac-card-list">
          {DATA_REVISION.map(r => (
            <div key={r.id} className="ajuste-revision-card">
              <div className="ajuste-rev-left">
                <div className="fac-card-nombre">{r.nombre}</div>
                <div className="fac-card-tipo">{r.tipo}</div>
                <div className="fac-card-alerta"><IcoWarn /> {r.alerta}</div>
                <span className="fac-badge-cliente">Cliente</span>
              </div>
              <div className="ajuste-rev-mid">
                <div className="ajuste-rev-tipo-label">Ajuste IPC</div>
                <div className="ajuste-rev-pct">{r.ajuste}</div>
                <div className="ajuste-rev-range">antes {r.antes} - ahora {r.ahora}</div>
              </div>
              <div className="ajuste-rev-right">
                <button className="btn-editar-fac" onClick={() => setEditItem(r)}>
                  EDITAR <IcoEdit />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel 1: Listas para aprobar */}
      <div role="tabpanel" id="ajust-panel-1" aria-labelledby="ajust-tab-1" hidden={tab !== 1}>
        <div className="fac-card-list">
          {DATA_APROBAR.map(r => (
            <div key={r.id} className="ajuste-aprobar-card">
              <div className="ajuste-aprobar-left">
                <div>
                  <span className="fac-card-nombre">{r.nombre}</span>
                  <span className="fac-badge-cliente">Cliente</span>
                </div>
                <div className="fac-card-tipo">{r.tipo}</div>
                <div className="ajuste-aprobar-monto">{r.monto}</div>
                <div className="ajuste-aprobar-aplicar">{r.aplicar}</div>
                <span className="fac-badge-cliente">Cliente</span>
              </div>
              <div className="ajuste-aprobar-mid">
                <div className="ajuste-rev-tipo-label">Ajuste IPC</div>
                <div className="ajuste-rev-pct">{r.ajuste}</div>
                <div className="ajuste-rev-range">Antes $x - Ahora $x</div>
                <div className="ajuste-rev-range">Margen proyectado: {r.margen}</div>
                {r.ok && (
                  <div className="ajuste-ok">
                    <IcoCheck /> Dentro del rango esperado.
                  </div>
                )}
              </div>
              <div className="ajuste-rev-mid">
                <div className="ajuste-service-name">{r.servicio}</div>
                <div className="ajuste-service-base">{r.base}</div>
              </div>
              <div className="ajuste-aprobar-actions">
                <button className="btn-rechazar">RECHAZAR ×</button>
                <button className="btn-aprobar-fac">APROBAR ✓</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel 2: Aprobadas */}
      <div role="tabpanel" id="ajust-panel-2" aria-labelledby="ajust-tab-2" hidden={tab !== 2}>
        <div className="fac-card-list">
          {DATA_APROBADAS.map(r => (
            <div key={r.id} className="ajuste-aprobar-card">
              <div className="ajuste-aprobar-left">
                <div>
                  <span className="fac-card-nombre">{r.nombre}</span>
                  <span className="fac-badge-cliente">Cliente</span>
                </div>
                <div className="fac-card-tipo">{r.tipo}</div>
                <div className="ajuste-aprobar-monto">{r.monto}</div>
                <div className="ajuste-aprobar-aplicar">{r.aplicar}</div>
                <span className="fac-badge-cliente">Cliente</span>
              </div>
              <div className="ajuste-aprobar-mid">
                <div className="ajuste-rev-tipo-label">Ajuste IPC</div>
                <div className="ajuste-rev-pct">{r.ajuste}</div>
                <div className="ajuste-rev-range">Antes $x - Ahora $x</div>
                <div className="ajuste-rev-range">Margen proyectado: {r.margen}</div>
                {r.ok && <div className="ajuste-ok"><IcoCheck /> Dentro del rango esperado.</div>}
              </div>
              <div className="ajuste-rev-mid">
                <div className="ajuste-service-name">{r.servicio}</div>
                <div className="ajuste-service-base">{r.base}</div>
              </div>
              <div className="ajuste-aprobar-actions">
                <button className="btn-rechazar">RECHAZAR ×</button>
                <button className="btn-aprobar-fac active">APROBAR ✓</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
