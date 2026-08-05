import { useState, useRef } from 'react'
import Modal from '../components/Modal'

const TABS = ['Necesitan revisión', 'Listas para aprobar', 'Aprobadas', 'Excluidas']
const LS_KEY = 'ipm-excluidas-jun2026'

/* ── Mock data ── */
const DATA_REVISION = [
  { id:1, nombre:'MAPED',      tipo:'SRL - Factura A - ARS',   alerta:'Variación de monto por encima del umbral' },
  { id:2, nombre:'EDDING COL', tipo:'SRL - Factura LLC - USD', alerta:'Ajuste IPC +14,2% · US$1.560 → US$1.781' },
  { id:3, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS',   alerta:'Ajuste IPC +10% · AR$100K → AR$150K' },
  { id:4, nombre:'EDDING COL', tipo:'SRL - Factura LLC - USD', alerta:'Ajuste IPC +14,2% · US$376 → US$450' },
  { id:5, nombre:'AYAX',       tipo:'SRL - Factura B - ARS',   alerta:'Variación de monto por encima del umbral' },
  { id:6, nombre:'TECHCORP',   tipo:'SRL - Factura LLC - USD', alerta:'Ajuste IPC +12% · US$800 → US$896' },
  { id:7, nombre:'DRAFTEA',    tipo:'SRL - Factura A - ARS',   alerta:'Variación de monto por encima del umbral' },
  { id:8, nombre:'GRUPO CL',   tipo:'SRL - Factura A - ARS',   alerta:'Ajuste IPC +10% · AR$200K → AR$220K' },
  { id:9, nombre:'MAPED',      tipo:'SRL - Factura B - ARS',   alerta:'Variación de monto por encima del umbral' },
]

const DATA_APROBAR_INICIAL = [
  { id:1,  nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS',   servicio:'Social Media · 8hs',    monto:'$ 580.800',  base:'480.000 + IVA 21%', diff:'$15k más que en mayo' },
  { id:2,  nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS',   servicio:'Consultoría · 12hs',    monto:'$ 580.800',  base:'480.000 + IVA 21%', diff:'$15k más que en mayo' },
  { id:3,  nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS',   servicio:'Branding · 6hs',        monto:'$ 420.000',  base:'350.000 + IVA 21%', diff:'$70k más que en mayo' },
  { id:4,  nombre:'EDDING COL', tipo:'SRL - Factura LLC - USD', servicio:'Consultoría · 12hs',    monto:'US$ 1.781',  base:'US$1.560 sin IVA',  diff:'US$221 más que en mayo' },
  { id:5,  nombre:'AYAX',       tipo:'SRL - Factura B - ARS',   servicio:'Branding · 4hs',        monto:'$ 320.000',  base:'260.000 + IVA 21%', diff:'$60k más que en mayo' },
  { id:6,  nombre:'MAPED',      tipo:'SRL - Factura A - ARS',   servicio:'SEO · 6hs',             monto:'$ 480.000',  base:'400.000 + IVA 21%', diff:'$80k más que en mayo' },
  { id:7,  nombre:'TECHCORP',   tipo:'SRL - Factura LLC - USD', servicio:'Social Media · 8hs',    monto:'US$ 896',    base:'US$800 sin IVA',    diff:'US$96 más que en mayo' },
  { id:8,  nombre:'DRAFTEA',    tipo:'SRL - Factura A - ARS',   servicio:'Diseño UX/UI · 10hs',   monto:'$ 750.000',  base:'620.000 + IVA 21%', diff:'$130k más que en mayo' },
  { id:9,  nombre:'GRUPO CL',   tipo:'SRL - Factura A - ARS',   servicio:'Social Media · 8hs',    monto:'$ 220.000',  base:'180.000 + IVA 21%', diff:'$40k más que en mayo' },
  { id:10, nombre:'MAPED',      tipo:'SRL - Factura A - ARS',   servicio:'Diseño gráfico · 8hs',  monto:'$ 580.800',  base:'480.000 + IVA 21%', diff:'$20k más que en mayo' },
]

const DATA_APROBADAS_INICIAL = [
  { id:101, nombre:'MAPED',      tipo:'SRL - Factura A - ARS',   servicio:'Social Media · 8hs',  monto:'$ 580.800' },
  { id:102, nombre:'EDDING ARG', tipo:'SRL - Factura A - ARS',   servicio:'Consultoría · 12hs',  monto:'$ 480.000' },
  { id:103, nombre:'AYAX',       tipo:'SRL - Factura B - ARS',   servicio:'Branding · 4hs',      monto:'$ 320.000' },
  { id:104, nombre:'TECHCORP',   tipo:'SRL - Factura LLC - USD', servicio:'SEO · 6hs',           monto:'US$ 896'   },
]

/* Servicios por hora que aún no tienen horas cargadas */
const POR_HORA_SIN_HORAS = new Set([4, 8])

function loadFromLS() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]')) }
  catch { return new Set() }
}
function saveToLS(set) {
  try { localStorage.setItem(LS_KEY, JSON.stringify([...set])) } catch {}
}

/* ── Íconos ── */
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

export default function FacturacionMes() {
  const [tab, setTab] = useState(0)

  /* ── estado de listas ── */
  const [listaAprobar, setListaAprobar] = useState(() => {
    const excIds = loadFromLS()
    return DATA_APROBAR_INICIAL.filter(r => !excIds.has(r.id))
  })
  const [listaAprobadas, setListaAprobadas]   = useState([])
  const [listaExcluidas, setListaExcluidas]   = useState(() => {
    const excIds = loadFromLS()
    return DATA_APROBAR_INICIAL.filter(r => excIds.has(r.id))
  })
  const [aprobadas, setAprobadas]             = useState([...DATA_APROBADAS_INICIAL])
  const [horasCargadas, setHorasCargadas]     = useState({})
  const [horasModal, setHorasModal]           = useState(null)
  const [horasInput, setHorasInput]           = useState('')
  const [toast, setToast]                     = useState(null)
  const triggerRef                             = useRef(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  /* ── handlers ── */
  function handleAprobar(row) {
    if (POR_HORA_SIN_HORAS.has(row.id) && !horasCargadas[row.id]) {
      setHorasModal(row); setHorasInput(''); return
    }
    setListaAprobar(prev => prev.filter(r => r.id !== row.id))
    setListaAprobadas(prev => [...prev, row])
    showToast('Factura aprobada')
  }

  function handleRechazar(id) {
    const row = listaAprobar.find(r => r.id === id)
    if (!row) return
    setListaAprobar(prev => prev.filter(r => r.id !== id))
    setListaExcluidas(prev => {
      const next = [...prev, row]
      saveToLS(new Set(next.map(r => r.id)))
      return next
    })
  }

  function handleDeshacerExcluir(id) {
    const row = listaExcluidas.find(r => r.id === id)
    if (!row) return
    setListaExcluidas(prev => {
      const next = prev.filter(r => r.id !== id)
      saveToLS(new Set(next.map(r => r.id)))
      return next
    })
    setListaAprobar(prev => [...prev, row])
  }

  function confirmarHoras() {
    const h = parseFloat(horasInput)
    if (!h || h <= 0) return
    const row = horasModal
    setHorasCargadas(p => ({ ...p, [row.id]: h }))
    setListaAprobar(prev => prev.filter(r => r.id !== row.id))
    setListaAprobadas(prev => [...prev, row])
    setHorasModal(null)
    showToast('Horas cargadas — factura aprobada')
  }

  function handleTabKey(e, idx) {
    if (e.key === 'ArrowRight') { e.preventDefault(); setTab((idx + 1) % TABS.length) }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); setTab((idx + TABS.length - 1) % TABS.length) }
  }

  const allAprobadas = [...aprobadas, ...listaAprobadas]

  /* ── counts para stat cards ── */
  const counts = [
    DATA_REVISION.length,
    listaAprobar.length,
    allAprobadas.length,
    listaExcluidas.length,
  ]
  const countLabels = ['Por revisar', 'Por aprobar', 'Aprobadas', 'Excluidas']

  return (
    <div className="facturacion-page">
      <h1 className="page-title">Facturación de Junio 2026</h1>
      <p className="page-subtitle">Revisá y aprobá las facturas del mes antes del 1ro de julio.</p>

      {/* ── Stat cards ── */}
      <div className="fac-stat-cards">
        <div className="fac-stat-card">
          <div className="fac-stat-label">Total ARS (AFIP)</div>
          <div className="fac-stat-value">$1.320.500,50</div>
          <div className="fac-stat-pct">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
            {' '}6.76% vs mes pasado
          </div>
        </div>
        <div className="fac-stat-card">
          <div className="fac-stat-label">Total USD (LLC)</div>
          <div className="fac-stat-value">US$2.677</div>
          <div className="fac-stat-pct">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
            {' '}10% vs mes pasado
          </div>
        </div>
        <div className="fac-stat-card">
          <div className="fac-stat-label">{countLabels[tab]}</div>
          <div className="fac-stat-value">{counts[tab]}</div>
          <div className="fac-stat-sub">facturas este mes</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div role="tablist" className="subtabs fac-tabs" aria-label="Estado de facturas">
        {TABS.map((t, i) => (
          <button
            key={t} role="tab"
            id={`fac-tab-${i}`}
            aria-selected={tab === i}
            aria-controls={`fac-panel-${i}`}
            tabIndex={tab === i ? 0 : -1}
            className={'subtab' + (tab === i ? ' active' : '')}
            onClick={() => setTab(i)}
            onKeyDown={e => handleTabKey(e, i)}
          >{t}</button>
        ))}
      </div>

      {/* ── Panel 0: Necesitan revisión ── */}
      <div role="tabpanel" id="fac-panel-0" aria-labelledby="fac-tab-0" hidden={tab !== 0}>
        <div className="fac-card-list">
          {DATA_REVISION.length === 0 && (
            <div className="fac-empty-state">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Sin pendientes de revisión
            </div>
          )}
          {DATA_REVISION.map(r => (
            <div key={r.id} className="fac-revision-card">
              <div className="fac-rev-left">
                <div className="fac-card-nombre">{r.nombre}</div>
                <div className="fac-card-tipo">{r.tipo}</div>
                <div className="fac-card-alerta">
                  <IcoWarn /> {r.alerta}
                </div>
              </div>
              <div className="fac-rev-right">
                <button className="btn-editar-fac">
                  <IcoEdit /> EDITAR
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel 1: Listas para aprobar ── */}
      <div role="tabpanel" id="fac-panel-1" aria-labelledby="fac-tab-1" hidden={tab !== 1}>
        <div className="fac-card-list">
          {listaAprobar.length === 0 && (
            <div className="fac-empty-state">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Todas las facturas del mes fueron procesadas
            </div>
          )}
          {listaAprobar.map(r => {
            const needsHours = POR_HORA_SIN_HORAS.has(r.id) && !horasCargadas[r.id]
            return (
              <div key={r.id} className="fac-aprobar-card">
                {/* Columna izquierda */}
                <div className="fac-aprobar-col-left">
                  <div className="fac-aprobar-nombre-row">
                    <span className="fac-card-nombre">{r.nombre}</span>
                    <span className="fac-badge-cliente">Cliente</span>
                  </div>
                  <div className="fac-card-tipo">{r.tipo}</div>
                  <div className="fac-aprobar-monto">{r.monto}</div>
                  <div className="fac-aprobar-diff">{r.diff}</div>
                  {needsHours && (
                    <div className="fac-horas-aviso">
                      <IcoWarn /> Servicio por hora — faltan horas de junio
                    </div>
                  )}
                  {horasCargadas[r.id] && (
                    <div className="fac-horas-ok">✓ {horasCargadas[r.id]} hs cargadas</div>
                  )}
                </div>

                {/* Divisor vertical */}
                <div className="fac-aprobar-divider" aria-hidden="true" />

                {/* Columna derecha */}
                <div className="fac-aprobar-col-right">
                  <div className="fac-service-name">{r.servicio}</div>
                  <div className="fac-service-base">{r.base}</div>
                  <div className="fac-aprobar-actions">
                    <button
                      className="btn-rechazar"
                      onClick={() => handleRechazar(r.id)}
                      title="No facturar este mes; el servicio sigue activo"
                    >
                      RECHAZAR ×
                    </button>
                    <button
                      ref={needsHours ? triggerRef : null}
                      className="btn-aprobar-fac"
                      onClick={() => handleAprobar(r)}
                    >
                      APROBAR ✓
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Panel 2: Aprobadas ── */}
      <div role="tabpanel" id="fac-panel-2" aria-labelledby="fac-tab-2" hidden={tab !== 2}>
        <div className="fac-card-list">
          {allAprobadas.length === 0 && (
            <div className="fac-empty-state">No hay facturas aprobadas aún</div>
          )}
          {allAprobadas.map(r => (
            <div key={r.id} className="fac-aprobada-card">
              <div className="fac-aprobada-left">
                <div className="fac-aprobada-nombre-row">
                  <span className="fac-card-nombre">{r.nombre}</span>
                  <span className="fac-badge-cliente">Cliente</span>
                </div>
                <div className="fac-card-tipo">{r.tipo}</div>
                <div className="fac-aprobada-monto">{r.monto}</div>
                {r.servicio && (
                  <div className="fac-aprobada-service">{r.servicio}</div>
                )}
              </div>
              <div className="fac-aprobada-right">
                <button className="btn-ver-detalle-fac">
                  <IcoEye /> VER DETALLE
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel 3: Excluidas ── */}
      <div role="tabpanel" id="fac-panel-3" aria-labelledby="fac-tab-3" hidden={tab !== 3}>
        <div className="fac-card-list">
          {listaExcluidas.length === 0 && (
            <div className="fac-empty-state">No hay facturas excluidas este mes</div>
          )}
          {listaExcluidas.map(r => (
            <div key={r.id} className="fac-aprobada-card fac-excluida-card">
              <div className="fac-aprobada-left">
                <div className="fac-card-nombre">{r.nombre}</div>
                <div className="fac-card-tipo">{r.tipo} · {r.servicio}</div>
                <div className="fac-excluida-msg">
                  Excluida de junio — el servicio sigue activo para el próximo mes
                </div>
              </div>
              <div className="fac-aprobada-right">
                <button className="btn-deshacer" onClick={() => handleDeshacerExcluir(r.id)}>
                  Deshacer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal: cargar horas ── */}
      <Modal
        isOpen={!!horasModal}
        onClose={() => setHorasModal(null)}
        title="INGRESAR HORAS"
        triggerRef={triggerRef}
        footer={
          <div className="modal-footer-inner">
            <div className="modal-validation" />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-cancelar" onClick={() => setHorasModal(null)}>Cancelar</button>
              <button
                className={'btn-guardar' + (parseFloat(horasInput) > 0 ? ' ready' : '')}
                onClick={confirmarHoras}
                disabled={!(parseFloat(horasInput) > 0)}
              >
                Guardar y aprobar
              </button>
            </div>
          </div>
        }
      >
        {horasModal && (
          <>
            <p className="reenvio-desc">
              <strong>{horasModal.nombre}</strong> — {horasModal.servicio}<br />
              Antes de aprobar, ingresá las horas trabajadas en junio.
              Sin ese dato el sistema no puede calcular el total.
            </p>
            <div className="form-group">
              <label htmlFor="horas-input">Horas de junio</label>
              <input
                id="horas-input"
                className="form-input"
                type="number"
                min="0"
                step="0.5"
                value={horasInput}
                onChange={e => setHorasInput(e.target.value)}
                placeholder="0"
              />
            </div>
          </>
        )}
      </Modal>

      {toast && (
        <div className="toast" role="status" aria-live="polite">{toast}</div>
      )}
    </div>
  )
}
