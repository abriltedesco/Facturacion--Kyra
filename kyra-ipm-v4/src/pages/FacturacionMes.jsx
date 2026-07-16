import { useState } from 'react'

const TABS = ['Necesitan revisión', 'Listas para aprobar', 'Aprobadas']

const DATA_REVISION = [
  { id:1, nombre:'MAPED',       tipo:'SRL - Factura A - ARS', alerta:'Variación de monto por encima del umbral' },
  { id:2, nombre:'EDDING COL',  tipo:'SRL - Factura LLC - USD', alerta:'Ajuste IPC +14,2% · US$1.560 → US$1.781' },
  { id:3, nombre:'EDDING ARG',  tipo:'SRL - Factura A - ARG', alerta:'Ajuste IPC +10% · AR$100K → AR$150K' },
  { id:4, nombre:'EDDING COL',  tipo:'SRL - Factura LLC - USD', alerta:'Ajuste IPC +14,2% · US$376 → US$450' },
  { id:5, nombre:'AYAX',        tipo:'SRL - Factura B - ARS', alerta:'Variación de monto por encima del umbral' },
  { id:6, nombre:'TECHCORP',    tipo:'SRL - Factura LLC - USD', alerta:'Ajuste IPC +12% · US$800 → US$896' },
  { id:7, nombre:'DRAFTEA',     tipo:'SRL - Factura A - ARS', alerta:'Variación de monto por encima del umbral' },
  { id:8, nombre:'GRUPO CL',    tipo:'SRL - Factura A - ARS', alerta:'Ajuste IPC +10% · AR$200K → AR$220K' },
  { id:9, nombre:'MAPED',       tipo:'SRL - Factura B - ARS', alerta:'Variación de monto por encima del umbral' },
]

const DATA_APROBAR = [
  { id:1, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS', servicio:'Social Media I 8hs', monto:'$ 580.800', base:'480.000 + IVA 21%', diff:'$15k más que en mayo' },
  { id:2, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS', servicio:'Social Media I 8hs', monto:'$ 580.800', base:'480.000 + IVA 21%', diff:'$15k más que en mayo' },
  { id:3, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS', servicio:'Social Media I 8hs', monto:'$ 580.800', base:'480.000 + IVA 21%', diff:'$15k más que en mayo' },
  { id:4, nombre:'EDDING COL', tipo:'SRL - Factura LLC - USD', servicio:'Consultoría I 12hs', monto:'US$ 1.781', base:'US$1.560 + sin IVA', diff:'US$221 más que en mayo' },
  { id:5, nombre:'AYAX',       tipo:'SRL - Factura B - ARS', servicio:'Branding I 4hs', monto:'$ 320.000', base:'260.000 + IVA 21%', diff:'$60k más que en mayo' },
  { id:6, nombre:'MAPED',      tipo:'SRL - Factura A - ARS', servicio:'SEO I 6hs', monto:'$ 480.000', base:'400.000 + IVA 21%', diff:'$80k más que en mayo' },
  { id:7, nombre:'TECHCORP',   tipo:'SRL - Factura LLC - USD', servicio:'Social Media I 8hs', monto:'US$ 896', base:'US$800 + sin IVA', diff:'US$96 más que en mayo' },
  { id:8, nombre:'DRAFTEA',    tipo:'SRL - Factura A - ARS', servicio:'Diseño UX/UI I 10hs', monto:'$ 750.000', base:'620.000 + IVA 21%', diff:'$130k más que en mayo' },
  { id:9, nombre:'GRUPO CL',   tipo:'SRL - Factura A - ARS', servicio:'Social Media I 8hs', monto:'$ 220.000', base:'180.000 + IVA 21%', diff:'$40k más que en mayo' },
  { id:10, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS', servicio:'Branding I 6hs', monto:'$ 420.000', base:'350.000 + IVA 21%', diff:'$70k más que en mayo' },
]

const DATA_APROBADAS = [
  { id:1, nombre:'MAPED',      tipo:'SRL - Factura A - ARS', servicio:'Social Media I 8hs', monto:'$ 580.800' },
  { id:2, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS', servicio:'Consultoría I 12hs', monto:'$ 480.000' },
  { id:3, nombre:'AYAX',       tipo:'SRL - Factura B - ARS', servicio:'Branding I 4hs',     monto:'$ 320.000' },
  { id:4, nombre:'TECHCORP',   tipo:'SRL - Factura LLC - USD', servicio:'SEO I 6hs',        monto:'US$ 896' },
]

const IcoWarn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IcoEye = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

export default function FacturacionMes() {
  const [tab, setTab] = useState(1)
  const [aprobadas, setAprobadas] = useState(new Set())
  const [rechazadas, setRechazadas] = useState(new Set())

  function handleAprobar(id) {
    setAprobadas(prev => { const n = new Set(prev); n.add(id); return n })
    setRechazadas(prev => { const n = new Set(prev); n.delete(id); return n })
  }
  function handleRechazar(id) {
    setRechazadas(prev => { const n = new Set(prev); n.add(id); return n })
    setAprobadas(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  function handleTabKey(e, idx) {
    if (e.key === 'ArrowRight') { e.preventDefault(); setTab((idx+1) % TABS.length) }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); setTab((idx+TABS.length-1) % TABS.length) }
  }

  return (
    <div className="facturacion-page">
      <h1 className="page-title">Facturación de junio 2026</h1>

      {/* Stat cards */}
      <div className="fac-stat-cards">
        <div className="fac-stat-card">
          <div className="fac-stat-label">Total ARS (AFIP)</div>
          <div className="fac-stat-value">$1.320.500,50</div>
          <div className="fac-stat-pct">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            {' '}6.76% vs mes pasado
          </div>
        </div>
        <div className="fac-stat-card">
          <div className="fac-stat-label">Total USD (LLC)</div>
          <div className="fac-stat-value">US$895,30</div>
          <div className="fac-stat-pct">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            {' '}10% vs mes pasado
          </div>
        </div>
        <div className="fac-stat-card">
          <div className="fac-stat-label">{tab === 1 ? 'Aprobar' : 'Revisar'}</div>
          <div className="fac-stat-value">{tab === 1 ? DATA_APROBAR.length : DATA_REVISION.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" className="subtabs fac-tabs" aria-label="Estado de facturas">
        {TABS.map((t, i) => (
          <button key={t} role="tab" id={`fac-tab-${i}`}
            aria-selected={tab === i} aria-controls={`fac-panel-${i}`}
            tabIndex={tab === i ? 0 : -1}
            className={'subtab' + (tab === i ? ' active' : '')}
            onClick={() => setTab(i)}
            onKeyDown={e => handleTabKey(e, i)}
          >{t}</button>
        ))}
      </div>

      {/* Panel 0: Necesitan revisión */}
      <div role="tabpanel" id="fac-panel-0" aria-labelledby="fac-tab-0" hidden={tab !== 0}>
        <div className="fac-card-list">
          {DATA_REVISION.map(r => (
            <div key={r.id} className="fac-revision-card">
              <div className="fac-card-left">
                <div className="fac-card-nombre">{r.nombre}</div>
                <div className="fac-card-tipo">{r.tipo}</div>
                <div className="fac-card-alerta">
                  <IcoWarn /> {r.alerta}
                </div>
              </div>
              <div className="fac-card-right">
                <button className="btn-editar-fac"><IcoEdit /> EDITAR</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel 1: Listas para aprobar */}
      <div role="tabpanel" id="fac-panel-1" aria-labelledby="fac-tab-1" hidden={tab !== 1}>
        <div className="fac-card-list">
          {DATA_APROBAR.map(r => {
            const isAp = aprobadas.has(r.id)
            const isRe = rechazadas.has(r.id)
            return (
              <div key={r.id} className={'fac-aprobar-card' + (isAp ? ' card-aprobada' : isRe ? ' card-rechazada' : '')}>
                <div className="fac-aprobar-top">
                  <div>
                    <span className="fac-card-nombre">{r.nombre}</span>
                    <span className="fac-badge-cliente">Cliente</span>
                  </div>
                  <div className="fac-aprobar-service">
                    <div className="fac-service-name">{r.servicio}</div>
                    <div className="fac-service-base">{r.base}</div>
                  </div>
                </div>
                <div className="fac-card-tipo" style={{ marginBottom: 6 }}>{r.tipo}</div>
                <div className="fac-aprobar-monto">{r.monto}</div>
                <div className="fac-aprobar-diff">{r.diff}</div>
                <div className="fac-aprobar-actions">
                  <button
                    className={'btn-rechazar' + (isRe ? ' active' : '')}
                    onClick={() => handleRechazar(r.id)}
                    aria-pressed={isRe}
                  >
                    RECHAZAR ×
                  </button>
                  <button
                    className={'btn-aprobar-fac' + (isAp ? ' active' : '')}
                    onClick={() => handleAprobar(r.id)}
                    aria-pressed={isAp}
                  >
                    APROBAR ✓
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Panel 2: Aprobadas */}
      <div role="tabpanel" id="fac-panel-2" aria-labelledby="fac-tab-2" hidden={tab !== 2}>
        <div className="fac-card-list">
          {DATA_APROBADAS.map(r => (
            <div key={r.id} className="fac-aprobada-card">
              <div className="fac-card-left">
                <div className="fac-card-nombre">{r.nombre}</div>
                <div className="fac-card-tipo">{r.tipo}</div>
                <div className="fac-aprobada-monto">{r.monto}</div>
                <div className="fac-aprobada-service">{r.servicio}</div>
              </div>
              <div className="fac-card-right">
                <button className="btn-ver-detalle"><IcoEye /> VER DETALLE</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
