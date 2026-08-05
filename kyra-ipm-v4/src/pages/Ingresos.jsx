import { useState, useRef, useEffect } from 'react'
import Modal from '../components/Modal'

const PAGE_SIZE = 9
const ESTADOS = ['PENDIENTE', 'APROBADA', 'EMITIDA', 'ERROR']
const CLIENTES = ['Maped', 'Edding ARG', 'Edding COL', 'Ayax', 'TechCorp', 'ALAIAB', 'Suprasafe', 'Kretz', 'Fate']
const SERVICIOS = ['Social Media', 'Diseño UX/UI', 'Consultoría', 'Branding', 'SEO']
const TIPOS = ['A', 'B', 'C', 'LLC']
const ENTIDADES = ['Kyra SRL', 'Monotributo Personal Mai', 'Mercury LLC']

const INITIAL_DATA = Array.from({ length: 60 }, (_, i) => ({
  id: i + 1,
  nro: i + 131,
  estado: i === 5 ? 'ERROR' : ESTADOS[i % 4],
  cliente: CLIENTES[i % CLIENTES.length],
  servicio: SERVICIOS[i % SERVICIOS.length],
  importe: '$' + ((i % 5 + 1) * 50000).toLocaleString('es-AR') + ',00',
  total: '$' + ((i % 5 + 1) * 62400).toLocaleString('es-AR') + ',00',
  tipo: TIPOS[i % TIPOS.length],
  entidad: ENTIDADES[i % ENTIDADES.length],
  fecha: '27/05/2026',
  errorCode: i === 5 ? 'ERR_RECEPTOR_DATA' : null,
  errorMsg: i === 5 ? 'Los datos del receptor no coinciden con los registros fiscales vigentes.' : null,
}))

/* ── Control de Pagos data ──────────────────────────────────────────── */
const PAGOS_DATA = [
  { id: 1, nro: 138, cliente: 'Maped',     periodo: 'mayo 2026', total: 62400,  estadoPago: 'VENCIDA SIN PAGO', saldo: 62400,  dias: 28, pagos: [] },
  { id: 2, nro: 139, cliente: 'ALAIAB',    periodo: 'mayo 2026', total: 45200,  estadoPago: 'PAGO PARCIAL',     saldo: 20200,  dias: 15, pagos: [{ fecha: '15/05/2026', monto: 25000, medio: 'Transferencia', notas: 'Pago parcial acordado con cliente' }] },
  { id: 3, nro: 140, cliente: 'Suprasafe', periodo: 'mayo 2026', total: 85000,  estadoPago: 'PENDIENTE',        saldo: 85000,  dias: 8,  pagos: [] },
  { id: 4, nro: 141, cliente: 'Kretz',     periodo: 'mayo 2026', total: 32000,  estadoPago: 'PENDIENTE',        saldo: 32000,  dias: 3,  pagos: [] },
  { id: 5, nro: 142, cliente: 'Fate',      periodo: 'mayo 2026', total: 28500,  estadoPago: 'PAGADA',           saldo: 0,      dias: 0,  pagos: [{ fecha: '05/05/2026', monto: 28500, medio: 'Transferencia', notas: '' }] },
  { id: 6, nro: 143, cliente: 'TechCorp',  periodo: 'abril 2026',total: 62400,  estadoPago: 'PAGADA',           saldo: 0,      dias: 0,  pagos: [{ fecha: '02/04/2026', monto: 62400, medio: 'Cheque', notas: '' }] },
  { id: 7, nro: 144, cliente: 'Edding ARG',periodo: 'abril 2026',total: 50000,  estadoPago: 'PAGADA',           saldo: 0,      dias: 0,  pagos: [{ fecha: '01/04/2026', monto: 50000, medio: 'Transferencia', notas: '' }] },
]

/* ── Error codes map ──────────────────────────────────────────────────── */
const ERROR_MAP = {
  ERR_CERT_EXPIRED:  { label: 'Certificado vencido',       desc: 'El certificado ARCA de {entidad} está vencido. Renovarlo para reintentar.' },
  ERR_CERT_MISSING:  { label: 'Sin certificado',            desc: 'No hay certificado ARCA cargado para {entidad}.' },
  ERR_RECEPTOR_DATA: { label: 'Error de validación fiscal', desc: 'Los datos del receptor no coinciden con los registros fiscales vigentes.' },
  ERR_TIMEOUT:       { label: 'Tiempo de espera agotado',   desc: 'ARCA no respondió en el tiempo esperado. Reintentar más tarde.' },
  ERR_DUPLICATE:     { label: 'Comprobante duplicado',      desc: 'ARCA detectó un comprobante duplicado. Verificar si ya fue emitido.' },
}

const TABS = ['Pendientes', 'Historial', 'Control de Pagos']
const EMPTY_FAC = { cliente: '', servicio: '', importe: '', tipo: '', fecha: '' }
const EMPTY_PAGO = { fecha: '', monto: '', medio: '', banco: '', retenciones: '', notas: '' }

/* ── Badge ─────────────────────────────────────────────────────────────── */
function Badge({ estado }) {
  const map = {
    PENDIENTE:       'badge badge-pendiente',
    APROBADA:        'badge badge-aprobada',
    EMITIDA:         'badge badge-emitida',
    ERROR:           'badge badge-error',
    'VENCIDA SIN PAGO': 'badge badge-pago-vencida',
    'PAGO PARCIAL':  'badge badge-pago-parcial',
    PAGADA:          'badge badge-pagada',
  }
  return <span className={map[estado] || 'badge'}>{estado}</span>
}

/* ── FilterBox ─────────────────────────────────────────────────────────── */
function FilterBox({ id, label, options, value, onChange }) {
  return (
    <div className="filter-box">
      <span id={id + '-label'} className="filter-box-label">{label}</span>
      <select aria-labelledby={id + '-label'} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Filtrar por {label.toLowerCase()}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

/* ── Pagination ────────────────────────────────────────────────────────── */
function Pagination({ total, page, setPage }) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)
  const show = totalPages <= 7
    ? Array.from({ length: totalPages }, (_, i) => i + 1)
    : [1, 2, 3, 4, 5, '…', totalPages]
  return (
    <nav aria-label="Paginacion" className="pagination">
      <span className="pagination-info">{from} - {to} de {total}</span>
      <div className="pagination-pages">
        <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1} aria-label="Primera">«</button>
        <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Anterior">‹</button>
        {show.map((n, i) => n === '…'
          ? <span key={'el' + i} className="page-btn page-ellipsis" aria-hidden="true">…</span>
          : <button key={n} className={'page-btn' + (page === n ? ' active' : '')} onClick={() => setPage(n)}>{n}</button>
        )}
        <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Siguiente">›</button>
        <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Ultima">»</button>
      </div>
    </nav>
  )
}

/* ── SVG icons ─────────────────────────────────────────────────────────── */
const IcoExport = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
const IcoImport = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const IcoCheck = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
const IcoPlus = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoChevron = ({ open }) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points={open ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/></svg>

/* ═══════════════════════════════════════════════════════════════════════ */
export default function Ingresos() {
  /* facturas */
  const [data, setData]             = useState(INITIAL_DATA)
  const [tabIdx, setTabIdx]         = useState(0)
  const [page, setPage]             = useState(1)
  const [search, setSearch]         = useState('')
  const [filtroEstado, setFiltroEstado]   = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroServicio, setFiltroServicio] = useState('')
  const [filtroEntidad, setFiltroEntidad]   = useState('')
  const [selected, setSelected]     = useState(new Set())
  const [aprobadoMsg, setAprobadoMsg] = useState(false)
  /* modal nueva factura */
  const [open, setOpen]             = useState(false)
  const [form, setForm]             = useState(EMPTY_FAC)
  const [submitted, setSubmitted]   = useState(false)
  const btnNuevoRef = useRef(null)
  /* error panel */
  const [errorRow, setErrorRow]     = useState(null)
  /* Control de Pagos */
  const [pagosData, setPagosData]   = useState(PAGOS_DATA)
  const [pagoFilter, setPagoFilter] = useState('por-cobrar')   /* 'por-cobrar' | 'cobradas' */
  const [expandedPago, setExpandedPago] = useState(null)
  const [pagoModal, setPagoModal]   = useState(null)          /* row seleccionado para registrar pago */
  const [formPago, setFormPago]     = useState(EMPTY_PAGO)
  const [montoLive, setMontoLive]   = useState(0)

  useEffect(() => { document.title = 'Ingresos — IPM Kyra' }, [])

  /* ── Tab helpers ─────────────────────────────────────────────────── */
  const erroresCount = data.filter(r => r.estado === 'ERROR').length

  const pendientes = data.filter(r => r.estado === 'PENDIENTE')
  const historial  = data.filter(r => r.estado !== 'PENDIENTE')
  const base = tabIdx === 0 ? pendientes : historial

  const filtered = base.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || String(r.nro).includes(q) || r.cliente.toLowerCase().includes(q)
    const matchEstado = !filtroEstado || r.estado === filtroEstado
    const matchCliente = !filtroCliente || r.cliente === filtroCliente
    const matchServicio = !filtroServicio || r.servicio === filtroServicio
    const matchEntidad = !filtroEntidad || r.entidad === filtroEntidad
    return matchSearch && matchEstado && matchCliente && matchServicio && matchEntidad
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
    setData(prev => prev.map(r => selected.has(r.id) ? { ...r, estado: 'APROBADA' } : r))
    setSelected(new Set())
    setAprobadoMsg(true)
    setTimeout(() => setAprobadoMsg(false), 3000)
  }
  const handleTabKey = (e, idx) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); const n=(idx+1)%TABS.length; setTabIdx(n);setPage(1);document.getElementById('ing-tab-'+n)?.focus() }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); const n=(idx-1+TABS.length)%TABS.length; setTabIdx(n);setPage(1);document.getElementById('ing-tab-'+n)?.focus() }
  }

  /* ── Nueva factura ────────────────────────────────────────────────── */
  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  const isReady = form.cliente && form.servicio && form.tipo
  const guardar = () => {
    setSubmitted(true)
    if (!isReady) return
    setData(prev => [{ id: Date.now(), nro: prev.length + 131, estado: 'PENDIENTE', cliente: form.cliente, servicio: form.servicio, importe: form.importe || '$50.000,00', total: '$62.400,00', tipo: form.tipo, entidad: 'Kyra SRL', fecha: new Date().toLocaleDateString('es-AR'), errorCode: null }, ...prev])
    setForm(EMPTY_FAC); setSubmitted(false); setOpen(false)
  }

  /* ── Control de Pagos ─────────────────────────────────────────────── */
  const pagosPorCobrar = pagosData.filter(r => r.estadoPago !== 'PAGADA').sort((a, b) => b.dias - a.dias)
  const pagosCobradas  = pagosData.filter(r => r.estadoPago === 'PAGADA')
  const pagoRows = pagoFilter === 'por-cobrar' ? pagosPorCobrar : pagosCobradas
  const totalPorCobrar = pagosPorCobrar.reduce((s, r) => s + r.saldo, 0)

  const changePago = e => {
    const val = e.target.value
    setFormPago(p => ({ ...p, [e.target.name]: val }))
    if (e.target.name === 'monto' && pagoModal) {
      setMontoLive(pagoModal.saldo - (parseFloat(val) || 0))
    }
  }

  const guardarPago = () => {
    if (!formPago.fecha || !formPago.monto || !formPago.medio) return
    const monto = parseFloat(formPago.monto) || 0
    setPagosData(prev => prev.map(r => {
      if (r.id !== pagoModal.id) return r
      const nuevoSaldo = r.saldo - monto
      const nuevoPagos = [...r.pagos, { fecha: formPago.fecha, monto, medio: formPago.medio, notas: formPago.notas }]
      const nuevoEstado = nuevoSaldo <= 0 ? 'PAGADA' : 'PAGO PARCIAL'
      return { ...r, saldo: Math.max(0, nuevoSaldo), estadoPago: nuevoEstado, pagos: nuevoPagos }
    }))
    setPagoModal(null); setFormPago(EMPTY_PAGO); setMontoLive(0)
  }

  const diasColor = dias => {
    if (dias === 0) return {}
    if (dias <= 7)  return { color: '#000000' }
    if (dias <= 15) return { color: '#7A5A00' }
    return { color: '#B00000' }
  }

  const allSelected = pageRows.length > 0 && selected.size === pageRows.length

  /* ─────────────────────────────────────────────────────────────────── */
  return (
    <div>
      <a href="#main-content" className="skip-link">Saltar al contenido</a>

      {/* Error panel (T12) */}
      {errorRow && (
        <div className="error-panel-overlay" onClick={() => setErrorRow(null)} aria-hidden="true" />
      )}
      {errorRow && (
        <aside className="error-panel" role="dialog" aria-modal="true" aria-label="Detalle del error">
          <div className="error-panel-header">
            <h2 className="error-panel-title">Detalle del error</h2>
            <button className="error-panel-close" onClick={() => setErrorRow(null)} aria-label="Cerrar">✕</button>
          </div>
          <div className="error-panel-divider" />

          <section className="error-panel-section">
            {[
              ['Factura', `${errorRow.tipo} 0001-${String(errorRow.nro).padStart(8,'0')}`],
              ['Cliente', errorRow.cliente],
              ['Entidad', errorRow.entidad],
              ['Fecha intento', errorRow.fecha + ' — 11:32 hs'],
            ].map(([label, val]) => (
              <div key={label} className="error-panel-row">
                <span className="error-panel-label">{label}</span>
                <span className="error-panel-val">{val}</span>
              </div>
            ))}
          </section>
          <div className="error-panel-divider" />

          <section className="error-panel-section">
            <div className="error-badge-box">
              <span className="error-badge-x">✕</span>
              <span className="error-badge-label">{ERROR_MAP[errorRow.errorCode]?.label || 'Error de emisión'}</span>
            </div>
            <p className="error-panel-desc">{ERROR_MAP[errorRow.errorCode]?.desc || errorRow.errorMsg}</p>
            <p className="error-panel-code">({errorRow.errorCode})</p>
          </section>
          <div className="error-panel-divider" />

          <section className="error-panel-section">
            <h3 className="error-panel-subtitle">¿Qué hacer?</h3>
            <div className="error-step">
              <span className="error-step-bullet">1</span>
              <div>
                <div className="error-step-text">Verificar los datos fiscales del cliente {errorRow.cliente}</div>
                <a href="#" className="error-step-link" onClick={e => e.preventDefault()}>→ Ir al perfil del cliente</a>
              </div>
            </div>
            <div className="error-step">
              <span className="error-step-bullet">2</span>
              <div className="error-step-text">Corregir y reintentar la emisión</div>
            </div>
          </section>
          <div className="error-panel-divider" />

          <div className="error-panel-actions">
            <button className="btn-cta" style={{ width: '100%' }} onClick={() => setErrorRow(null)}>↺ Reintentar emisión</button>
            <button className="btn-secondary-full" onClick={() => setErrorRow(null)}>Cancelar</button>
          </div>
        </aside>
      )}

      <div className="page-header">
        <h1 className="page-title">Ingresos</h1>
        <div className="page-header-actions">
          <button className="icon-btn" aria-label="Exportar"><IcoExport /></button>
          <button className="icon-btn" aria-label="Importar"><IcoImport /></button>
          {tabIdx < 2 && (
            selected.size > 0 ? (
              <button className="btn-aprobar" onClick={aprobarSeleccionadas}>Aprobar ({selected.size}) <IcoCheck /></button>
            ) : (
              <button ref={btnNuevoRef} className="btn-cta" onClick={() => { setSubmitted(false); setOpen(true) }}>
                NUEVO INGRESO <IcoPlus />
              </button>
            )
          )}
        </div>
      </div>

      {aprobadoMsg && (
        <div className="aprobado-toast" role="status" aria-live="polite">
          <IcoCheck /> Facturas aprobadas — aparecen en Historial
        </div>
      )}

      {/* Filters — solo para tabs 0 y 1 */}
      {tabIdx < 2 && (
        <div className="filter-row">
          <FilterBox id="ing-estado" label="Estado" options={ESTADOS} value={filtroEstado} onChange={v => { setFiltroEstado(v); setPage(1) }} />
          <FilterBox id="ing-cliente" label="Cliente" options={CLIENTES} value={filtroCliente} onChange={v => { setFiltroCliente(v); setPage(1) }} />
          <FilterBox id="ing-servicio" label="Servicio" options={SERVICIOS} value={filtroServicio} onChange={v => { setFiltroServicio(v); setPage(1) }} />
          <FilterBox id="ing-entidad" label="Entidad emisora" options={ENTIDADES} value={filtroEntidad} onChange={v => { setFiltroEntidad(v); setPage(1) }} />
          <div className="search-wrap">
            <label htmlFor="ing-search" className="sr-only">Buscar facturas</label>
            <input id="ing-search" className="search-input" placeholder="Buscar" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            <span className="search-icon" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div role="tablist" aria-label="Secciones de ingresos" className="subtabs">
        {TABS.map((t, idx) => (
          <button key={t} id={'ing-tab-' + idx} role="tab"
            aria-selected={tabIdx === idx} aria-controls="ing-tabpanel"
            tabIndex={tabIdx === idx ? 0 : -1}
            className={'subtab' + (tabIdx === idx ? ' active' : '')}
            onClick={() => { setTabIdx(idx); setPage(1) }}
            onKeyDown={e => handleTabKey(e, idx)}>
            {t}
            {idx === 1 && erroresCount > 0 && (
              <span className="tab-error-badge" aria-label={erroresCount + ' errores'}>{erroresCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── PANEL: Control de Pagos ──────────────────────────────────────── */}
      {tabIdx === 2 ? (
        <div id="ing-tabpanel" role="tabpanel" aria-labelledby="ing-tab-2">
          {/* Filter pills */}
          <div className="pagos-pills">
            {[['por-cobrar', 'Por cobrar'], ['cobradas', 'Cobradas']].map(([val, label]) => (
              <button key={val}
                className={'pagos-pill' + (pagoFilter === val ? ' active' : '')}
                onClick={() => setPagoFilter(val)}>
                {label}
              </button>
            ))}
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th scope="col">NRO</th>
                  <th scope="col">CLIENTE</th>
                  <th scope="col">PERÍODO</th>
                  <th scope="col">TOTAL FACTURADO</th>
                  <th scope="col">ESTADO PAGO</th>
                  <th scope="col">SALDO PENDIENTE</th>
                  <th scope="col">DÍAS DEMORA</th>
                  <th scope="col"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {pagoRows.length === 0 ? (
                  <tr><td colSpan={8} className="td-empty">Sin resultados</td></tr>
                ) : pagoRows.map(r => {
                  const isVencida = r.estadoPago === 'VENCIDA SIN PAGO'
                  const isParcial = r.estadoPago === 'PAGO PARCIAL'
                  const isExpanded = expandedPago === r.id
                  return (
                    <>
                      <tr key={r.id}
                        className={'pago-row' + (isVencida ? ' pago-row-vencida' : '') + (isExpanded ? ' pago-row-expanded' : '')}>
                        <td>
                          <span className="link-nro" onClick={() => setExpandedPago(isExpanded ? null : r.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {isParcial && <IcoChevron open={isExpanded} />}
                            {r.nro}
                          </span>
                        </td>
                        <td>{r.cliente}</td>
                        <td className="td-muted">{r.periodo}</td>
                        <td>${r.total.toLocaleString('es-AR')},00</td>
                        <td><Badge estado={r.estadoPago} /></td>
                        <td style={isVencida ? { color: '#B00000', fontWeight: 600 } : {}}>
                          {r.saldo > 0 ? '$' + r.saldo.toLocaleString('es-AR') + ',00' : '—'}
                        </td>
                        <td style={diasColor(r.dias)}>
                          {r.dias > 0 ? <strong>{r.dias} días</strong> : '—'}
                        </td>
                        <td>
                          <div className="pago-row-actions">
                            {r.estadoPago !== 'PAGADA' && (
                              <button className="btn-pago-registrar"
                                onClick={() => { setPagoModal(r); setFormPago(EMPTY_PAGO); setMontoLive(r.saldo) }}>
                                Registrar pago
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && isParcial && (
                        <tr key={r.id + '-expanded'} className="pago-expanded-row">
                          <td colSpan={8}>
                            <div className="pago-expanded-inner">
                              <div className="pago-expanded-title">Historial de pagos parciales recibidos</div>
                              <table className="pago-sub-table">
                                <tbody>
                                  {r.pagos.map((p, i) => (
                                    <tr key={i}>
                                      <td>{p.fecha}</td>
                                      <td>${p.monto.toLocaleString('es-AR')},00</td>
                                      <td className="td-muted">{p.medio}</td>
                                      <td className="td-muted">{p.notas}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="pago-expanded-footer">
                                <span className="pago-saldo-label">Saldo pendiente: ${r.saldo.toLocaleString('es-AR')},00</span>
                                <button className="btn-pago-registrar"
                                  onClick={() => { setPagoModal(r); setFormPago(EMPTY_PAGO); setMontoLive(r.saldo) }}>
                                  + Registrar siguiente pago
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          {pagoFilter === 'por-cobrar' && (
            <div className="pagos-total-bar">
              <span className="pagos-total-label">Total por cobrar:</span>
              <span className="pagos-total-val">${totalPorCobrar.toLocaleString('es-AR')},00</span>
            </div>
          )}

          {/* Modal registro de pago */}
          {pagoModal && (
            <div className="modal-overlay" onClick={() => setPagoModal(null)}>
              <div className="pago-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="pago-modal-header">
                  <div>
                    <h2 className="pago-modal-title">Registrar pago recibido</h2>
                    <p className="pago-modal-sub">Factura #{pagoModal.nro} · {pagoModal.cliente} · Total ${pagoModal.total.toLocaleString('es-AR')},00</p>
                  </div>
                  <button className="error-panel-close" onClick={() => setPagoModal(null)}>✕</button>
                </div>
                <div className="error-panel-divider" />
                <div className="pago-modal-body">
                  <div className="form-group">
                    <label className="form-label">Fecha de pago recibido <span className="label-req">*</span></label>
                    <input type="date" className="form-input" name="fecha" value={formPago.fecha} onChange={changePago} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monto recibido <span className="label-req">*</span></label>
                    <p className="form-hint">Puede ser menor al total (pago parcial)</p>
                    <input type="number" className="form-input" name="monto" value={formPago.monto} onChange={changePago} placeholder="0.00" />
                    {formPago.monto && (
                      <p className="pago-live-saldo">Saldo pendiente tras este pago: ${Math.max(0, montoLive).toLocaleString('es-AR')},00</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Medio de pago <span className="label-req">*</span></label>
                    <select className="form-select" name="medio" value={formPago.medio} onChange={changePago}>
                      <option value="">Seleccionar</option>
                      <option>Transferencia bancaria</option>
                      <option>Efectivo</option>
                      <option>Cheque</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Banco de destino</label>
                    <input className="form-input" name="banco" value={formPago.banco} onChange={changePago} placeholder="Nombre del banco o cuenta" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Retenciones aplicadas</label>
                    <p className="form-hint">(IIBB, Ganancias, etc.)</p>
                    <input type="number" className="form-input" name="retenciones" value={formPago.retenciones} onChange={changePago} placeholder="0.00 (opcional)" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notas internas</label>
                    <textarea className="form-textarea" name="notas" value={formPago.notas} onChange={changePago} placeholder="Observaciones del pago (opcional)" rows={3} />
                  </div>
                </div>
                <div className="error-panel-divider" />
                <div className="pago-modal-footer">
                  <button className="btn-cta" style={{ width: '100%' }} onClick={guardarPago}
                    disabled={!formPago.fecha || !formPago.monto || !formPago.medio}>
                    Guardar pago
                  </button>
                  <button className="btn-secondary-full" onClick={() => setPagoModal(null)}>Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>

      /* ── PANEL: Pendientes / Historial ────────────────────────────────── */
      ) : (
        <>
          <div id="ing-tabpanel" role="tabpanel" aria-labelledby={"ing-tab-" + tabIdx} className="table-container">
            <table>
              <thead>
                <tr>
                  <th scope="col" style={{ width: 36 }}>
                    <input type="checkbox" className="row-check" checked={allSelected} onChange={toggleAll}
                      aria-label={allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'} />
                  </th>
                  <th scope="col">NRO</th>
                  <th scope="col">ESTADO</th>
                  <th scope="col">CLIENTE</th>
                  <th scope="col">SERVICIO</th>
                  <th scope="col">IMPORTE</th>
                  <th scope="col">TOTAL</th>
                  <th scope="col">TIPO</th>
                  <th scope="col">FECHA ↑</th>
                  <th scope="col" style={{ width: 36 }}><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr><td colSpan={10} className="td-empty">Sin resultados</td></tr>
                ) : pageRows.map(r => {
                  const isError = r.estado === 'ERROR'
                  return (
                    <tr key={r.id} className={isError ? 'tr-error' : ''}>
                      <td>
                        <input type="checkbox" className="row-check" checked={selected.has(r.id)}
                          onChange={() => toggleOne(r.id)} aria-label={'Seleccionar factura #' + r.nro} />
                      </td>
                      <td>
                        {isError && <span className="error-nro-badge" aria-hidden="true">!</span>}
                        <span className={isError ? 'link-nro error-nro' : 'link-nro'}>{r.nro}</span>
                      </td>
                      <td><Badge estado={r.estado} /></td>
                      <td>{r.cliente}</td>
                      <td className="td-muted">{r.servicio}</td>
                      <td className="td-muted">{r.importe}</td>
                      <td className="td-muted">{r.total}</td>
                      <td className="td-muted">{r.tipo}</td>
                      <td className="td-muted">{r.fecha}</td>
                      <td style={{ position: 'relative' }}>
                        <button className={'dots-btn' + (isError ? ' dots-btn-error' : '')}
                          aria-label={'Opciones factura #' + r.nro}
                          onClick={() => isError && setErrorRow(r)}>
                          ⋮
                          {isError && <span className="dots-error-dot" aria-hidden="true" />}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination total={filtered.length} page={page} setPage={setPage} />
        </>
      )}

      {/* Modal nueva factura */}
      <Modal isOpen={open} onClose={() => { setOpen(false); setForm(EMPTY_FAC); setSubmitted(false) }}
        title="NUEVA FACTURA" triggerRef={btnNuevoRef}
        footer={
          <div className="modal-footer-inner">
            <div className="modal-validation">
              {!isReady && <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Faltan llenar datos</span>}
            </div>
            <button className={'btn-guardar' + (isReady ? ' ready' : '')} disabled={!isReady} onClick={guardar}>Guardar</button>
          </div>
        }>
        <div className="form-group">
          <label htmlFor="ing-f-cliente">Cliente <span className="label-req">*</span></label>
          <select id="ing-f-cliente" className="form-select" name="cliente" value={form.cliente} onChange={change}>
            <option value=""></option>
            {CLIENTES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="ing-f-servicio">Servicio <span className="label-req">*</span></label>
          <select id="ing-f-servicio" className="form-select" name="servicio" value={form.servicio} onChange={change}>
            <option value=""></option>
            {SERVICIOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ing-f-tipo">Tipo <span className="label-req">*</span></label>
            <select id="ing-f-tipo" className="form-select" name="tipo" value={form.tipo} onChange={change}>
              <option value=""></option>
              {TIPOS.map(t => <option key={t} value={t}>Factura {t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="ing-f-importe">Importe Neto</label>
            <input id="ing-f-importe" className="form-input" name="importe" value={form.importe} onChange={change} placeholder="$0,00" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
