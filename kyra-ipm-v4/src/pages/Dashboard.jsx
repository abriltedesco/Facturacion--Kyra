import { useState } from 'react'

/* ── tiny sparkline via SVG polyline ── */
function Sparkline({ data, w = 80, h = 36 }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline points={pts} fill="none" stroke="var(--black)" strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/* ── bar chart ── */
function BarChart() {
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago']
  const ingresos = [320,480,360,520,440,580,420,500]
  const egresos  = [180,220,200,280,220,260,200,240]
  const max = 620
  const barW = 22, gap = 14, chartH = 160, chartW = months.length * (barW*2 + gap + 8)
  return (
    <svg viewBox={`0 0 ${chartW} ${chartH + 24}`} width="100%" aria-label="Gráfico de barras ingresos vs egresos">
      {months.map((m, i) => {
        const x = i * (barW * 2 + gap + 8)
        const hi = (ingresos[i] / max) * chartH
        const he = (egresos[i]  / max) * chartH
        return (
          <g key={m}>
            <rect x={x} y={chartH - hi} width={barW} height={hi} fill="var(--black)" rx="2" />
            <rect x={x + barW + 3} y={chartH - he} width={barW} height={he} fill="var(--gray-300)" rx="2" />
            <text x={x + barW} y={chartH + 16} textAnchor="middle" fontSize="10" fill="var(--gray-500)">{m}</text>
          </g>
        )
      })}
    </svg>
  )
}

/* ── donut chart ── */
function Donut({ pct = 68 }) {
  const r = 60, cx = 80, cy = 80
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg viewBox="0 0 160 160" width="160" height="160" aria-label={`${pct}% facturación real`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--gray-200)" strokeWidth="18" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--black)" strokeWidth="18"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--black)">{pct}%</text>
    </svg>
  )
}

const SPARKDATA = [180, 220, 195, 260, 240, 280, 220, 290]
const PENDING_CLIENTS = [
  { name: 'Maped SRL', desc: 'Factura A · $580.800' },
  { name: 'Edding ARG', desc: 'Factura A · $480.000' },
  { name: 'Edding COL', desc: 'Factura LLC · US$1.560' },
  { name: 'Ayax', desc: 'Factura B · $320.000' },
  { name: 'TechCorp', desc: 'Factura LLC · US$895' },
  { name: 'Draftea', desc: 'Factura A · $620.000' },
  { name: 'Grupo CL', desc: 'Factura A · $410.000' },
]
const ACTIVE_CLIENTS = [
  { nro: 131, estado: 'PENDIENTE', cliente: 'Maped', servicio: 'Social Media', importe: '$62.400,00', tipo: 'A', pct: '20%' },
  { nro: 131, estado: 'APROBADA',  cliente: 'Maped', servicio: 'Social Media', importe: '$62.400,00', tipo: 'A', pct: '20%' },
  { nro: 131, estado: 'PENDIENTE', cliente: 'Maped', servicio: 'Social Media', importe: '$62.400,00', tipo: 'A', pct: '20%' },
  { nro: 131, estado: 'PENDIENTE', cliente: 'Maped', servicio: 'Social Media', importe: '$62.400,00', tipo: 'A', pct: '20%' },
  { nro: 131, estado: 'APROBADA',  cliente: 'Maped', servicio: 'Social Media', importe: '$62.400,00', tipo: 'A', pct: '20%' },
  { nro: 131, estado: 'EMITIDA',   cliente: 'Maped', servicio: 'Social Media', importe: '$62.400,00', tipo: 'A', pct: '20%' },
]

function EstadoBadge({ estado }) {
  const cls = { PENDIENTE:'badge badge-pendiente', APROBADA:'badge badge-aprobada', EMITIDA:'badge badge-emitida', ERROR:'badge badge-error' }
  return <span className={cls[estado] || 'badge'}>{estado}</span>
}

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      <h1 className="page-title">Dashboard</h1>

      {/* ── Top grid: 3 columns ── */}
      <div className="dash-top-grid">

        {/* Col 1: two meta cards stacked */}
        <div className="dash-meta-col">
          <div className="dash-meta-card">
            <div className="dash-meta-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <button className="dash-card-more" aria-label="Más opciones">⋯</button>
            <div className="dash-meta-label">Meta Inicial</div>
            <div className="dash-meta-progress-wrap">
              <div className="dash-meta-progress-bar">
                <div className="dash-meta-progress-fill" style={{ width: '43%' }} />
              </div>
              <div className="dash-meta-progress-labels">
                <span>15 Facturas</span><span>35 Facturas</span>
              </div>
            </div>
          </div>

          <div className="dash-meta-card">
            <div className="dash-meta-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="dash-meta-label">Meta: clientes</div>
            <div className="dash-meta-sublabel">Objetivo: 15 clientes activos.</div>
            <div className="dash-meta-progress-wrap">
              <div className="dash-meta-progress-bar">
                <div className="dash-meta-progress-fill" style={{ width: '68%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Col 2: stat cards — Clientes + Servicios activos (T01) */}
        <div className="dash-stat-col">
          {[
            { value: '220', label: 'Clientes', pct: '6.76%', icon: 'user' },
            { value: '48', label: 'Servicios activos', pct: '4.20%', icon: 'briefcase' },
          ].map(s => (
            <div key={s.label} className="dash-stat-card">
              <div className="dash-stat-icon-wrap">
                {s.icon === 'user' ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                )}
              </div>
              <div className="dash-stat-body">
                <div className="dash-stat-value">{s.value}</div>
                <div className="dash-stat-label">{s.label}</div>
                <div className="dash-stat-pct">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  {' '}{s.pct} <span className="pct-context">Contra el mes pasado</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Col 3: two sparkline cards */}
        <div className="dash-spark-col">
          {[0,1].map(i => (
            <div key={i} className="dash-spark-card">
              <button className="dash-card-more" aria-label="Más opciones">⋯</button>
              <div className="dash-spark-top">
                <div>
                  <div className="dash-spark-sub">Total Clientes</div>
                  <div className="dash-spark-value">220</div>
                  <div className="dash-stat-pct">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    {' '}6.76% <span className="pct-context">vs mes pasado</span>
                  </div>
                </div>
                <Sparkline data={SPARKDATA} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 2: Charts ── */}
      <div className="dash-charts-row">
        <div className="dash-chart-card dash-chart-bar">
          <div className="dash-chart-header">
            <h2 className="dash-chart-title">Resumen de Facturación (Ingresos vs. Egresos)</h2>
            <button className="dash-card-more" aria-label="Más opciones">⋯</button>
          </div>
          <div className="dash-bar-wrap">
            <BarChart />
          </div>
          <div className="dash-chart-footer">
            <span className="dash-total-label">Total Recaudado: <strong>$4.620.000</strong></span>
            <a href="#" className="dash-detail-link" onClick={e => e.preventDefault()}>Ver Resumen en Detalle →</a>
          </div>
        </div>

        <div className="dash-chart-card dash-chart-donut">
          <div className="dash-chart-header">
            <h2 className="dash-chart-title">Porcentaje de Facturación:<br/>Ingreso vs. Egreso</h2>
            <button className="dash-card-more" aria-label="Más opciones">⋯</button>
          </div>
          <div className="dash-donut-wrap">
            <Donut pct={68} />
          </div>
          <div className="dash-donut-legend">
            <div className="donut-leg-item">
              <span className="donut-leg-dot donut-leg-dark" />
              <div>
                <div className="donut-leg-label">Facturación Real</div>
                <div className="donut-leg-val">$XXX.XXX</div>
              </div>
            </div>
            <div className="donut-leg-divider" />
            <div className="donut-leg-item">
              <span className="donut-leg-dot donut-leg-light" />
              <div>
                <div className="donut-leg-label">Facturación Esperada</div>
                <div className="donut-leg-val">$XXX.XXX</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Pending + Active Clients ── */}
      <div className="dash-bottom-row">
        {/* Clientes Pendientes de Pago */}
        <div className="dash-pending-card">
          <h2 className="dash-section-title">Clientes Pendientes de Pago</h2>
          <ul className="dash-pending-list">
            {PENDING_CLIENTS.map((c, i) => (
              <li key={i} className="dash-pending-item">
                <div className="dash-pending-thumb" aria-hidden="true" />
                <div className="dash-pending-body">
                  <div className="dash-pending-name">{c.name}</div>
                  <div className="dash-pending-desc">{c.desc}</div>
                </div>
                <div className="dash-pending-dot" aria-hidden="true" />
              </li>
            ))}
          </ul>
          <a href="#" className="dash-section-link" onClick={e => e.preventDefault()}>Ir a la sección →</a>
        </div>

        {/* Clientes Activos */}
        <div className="dash-active-card">
          <div className="dash-chart-header">
            <h2 className="dash-section-title">Clientes Activos</h2>
            <button className="dash-card-more" aria-label="Más opciones">⋯</button>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th><input type="checkbox" aria-label="Seleccionar todos" /></th>
                  <th>NRO</th>
                  <th>ESTADO</th>
                  <th>CLIENTE</th>
                  <th>SERVICIO</th>
                  <th>IMPORTE</th>
                  <th>TIPO</th>
                  <th>%</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {ACTIVE_CLIENTS.map((r, i) => (
                  <tr key={i}>
                    <td><input type="checkbox" aria-label={`Seleccionar ${r.cliente}`} /></td>
                    <td className="text-muted-sm">{r.nro}</td>
                    <td><EstadoBadge estado={r.estado} /></td>
                    <td>{r.cliente}</td>
                    <td className="text-muted-sm">{r.servicio}</td>
                    <td>{r.importe}</td>
                    <td className="text-muted-sm">{r.tipo}</td>
                    <td className="text-muted-sm">{r.pct}</td>
                    <td>
                      <button className="btn-more" aria-label="Más opciones">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="dash-active-footer">
            <span className="pagination-info">Página: 1</span>
            <a href="#" className="dash-detail-link" onClick={e => e.preventDefault()}>Ver Clientes en Detalle →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
