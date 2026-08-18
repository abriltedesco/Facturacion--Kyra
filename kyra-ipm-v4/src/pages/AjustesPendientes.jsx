import { useState, useEffect } from 'react'
import { AJUSTES_INICIAL } from '../data/ajustes'
import { HISTORIAL_PERIODOS } from '../data/historialPeriodos'
import { CLIENTES_INICIAL } from '../data/clientes'
import { ENTIDADES_INICIAL } from '../data/entidades'
import { SERVICIOS_INICIAL } from '../data/servicios'

// ── Período actual ────────────────────────────────────────────────────────────
const MES_ACTUAL = 'agosto'
const ANIO_ACTUAL = 2026
const MES_SIGUIENTE = 'septiembre'
const TIPOS_AJUSTE = ['IPC', 'Manual', 'Comercial']

// ── Funciones puras ───────────────────────────────────────────────────────────

function calcularMontoDespues(montoAntes, porcentaje) {
  const m = parseFloat(montoAntes)
  const p = parseFloat(porcentaje)
  if (isNaN(m) || m <= 0 || isNaN(p) || p < 0) return null
  return Math.round(m * (1 + p / 100))
}

function formatARS(valor) {
  if (valor === null || valor === undefined || valor === '') return '—'
  const n = Number(valor)
  if (isNaN(n)) return '—'
  return '$ ' + n.toLocaleString('es-AR')
}

function formatPct(pct, plus = true) {
  const n = parseFloat(pct)
  if (isNaN(n)) return '—'
  return (plus && n > 0 ? '+' : '') + n.toFixed(1).replace('.', ',') + '%'
}

// ── Lookups ───────────────────────────────────────────────────────────────────

function useCliente(clienteId) {
  return CLIENTES_INICIAL.find(c => c.id === clienteId) || null
}

function useEntidadDeCliente(clienteId) {
  const c = CLIENTES_INICIAL.find(cl => cl.id === clienteId)
  if (!c) return null
  return ENTIDADES_INICIAL.find(e => e.id === c.entidadEmisoraId) || null
}

// ── Atoms UI ──────────────────────────────────────────────────────────────────

function TagCliente() {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 5,
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
      color: '#4f46e5', background: '#eef2ff',
    }}>Cliente</span>
  )
}

function BadgeAlerta({ alerta }) {
  if (alerta) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        color: '#92400e', background: '#fef3c7', border: '1px solid #fcd34d',
      }}>⚠ Aumento significativo</span>
    )
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7',
    }}>✓ Dentro del rango esperado</span>
  )
}

function BadgeImpacto({ nivel }) {
  const alto = nivel === 'alto'
  return (
    <span style={{
      display: 'inline-block', padding: '2px 7px', borderRadius: 5,
      fontSize: 11, fontWeight: 600,
      color: alto ? '#b91c1c' : '#6b7280',
      background: alto ? '#fee2e2' : '#f3f4f6',
    }}>{alto ? 'Alto' : 'Bajo'} impacto</span>
  )
}

function BadgeStatus({ status }) {
  const cfg = {
    aprobada:  { label: '✓ Aprobada',  color: '#065f46', bg: '#d1fae5' },
    rechazada: { label: '× Rechazada', color: '#b91c1c', bg: '#fee2e2' },
  }[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' }
  return (
    <span style={{
      display: 'inline-block', padding: '4px 10px', borderRadius: 8,
      fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.bg,
    }}>{cfg.label}</span>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, count, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, minWidth: 150, padding: '18px 22px', textAlign: 'left',
        background: active ? color + '12' : '#fff',
        border: '1.5px solid ' + (active ? color : '#e5e7eb'),
        borderRadius: 12, cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        boxShadow: active ? '0 0 0 3px ' + color + '20' : 'none',
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1.1 }}>{count}</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 5, fontWeight: 500 }}>{label}</div>
    </button>
  )
}

// ── Card: Necesitan revisión ──────────────────────────────────────────────────

function CardRevision({ ajuste, servicios, onEditar }) {
  const cliente = useCliente(ajuste.clienteId)
  const entidad = useEntidadDeCliente(ajuste.clienteId)
  const svc = servicios.find(s => s.id === ajuste.servicioId)
  const montoDespues = calcularMontoDespues(ajuste.montoAntes, ajuste.porcentajeIPC)

  return (
    <div style={{
      background: '#fff',
      border: '1.5px solid ' + (ajuste.alertaAumentoSignificativo ? '#fcd34d' : '#e5e7eb'),
      borderRadius: 12, padding: '18px 22px', marginBottom: 12,
      boxShadow: ajuste.alertaAumentoSignificativo ? '0 2px 8px #fef3c750' : '0 1px 3px #0001',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>

        {/* Info cliente + servicio */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{cliente?.nombre || '—'}</span>
            <TagCliente />
            {ajuste.alertaAumentoSignificativo && <BadgeAlerta alerta={true} />}
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span>{entidad?.nombre || '—'}</span>
            <span>·</span>
            <span>Factura {cliente?.tipoFactura || '—'}</span>
            <span>·</span>
            <span>{svc?.moneda || 'ARS'}</span>
            <span>·</span>
            <BadgeImpacto nivel={ajuste.impactoNivel} />
          </div>
          <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
            {svc?.nombre || '—'}
            {svc?.descripcion ? <span style={{ color: '#9ca3af', fontWeight: 400 }}> — {svc.descripcion}</span> : null}
          </div>
        </div>

        {/* Porcentaje + montos */}
        <div style={{
          textAlign: 'center', padding: '0 22px',
          borderLeft: '1px solid #f3f4f6', borderRight: '1px solid #f3f4f6',
          minWidth: 160,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Ajuste IPC</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#4f46e5', lineHeight: 1 }}>{formatPct(ajuste.porcentajeIPC)}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            {ajuste.montoAntes !== null
              ? <>antes {formatARS(ajuste.montoAntes)}<br />ahora {formatARS(montoDespues)}</>
              : <span style={{ color: '#d97706', fontWeight: 600 }}>Sin precio definido</span>
            }
          </div>
        </div>

        {/* Botón editar */}
        <div>
          <button
            onClick={() => onEditar(ajuste)}
            style={{
              padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              color: '#4f46e5', background: '#eef2ff', border: '1.5px solid #a5b4fc',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            EDITAR ✏
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Card: Listas para aprobar / Aprobadas ─────────────────────────────────────

function CardAprobacion({ ajuste, servicios, onAprobar, onRechazar, esHistorial }) {
  const cliente = useCliente(ajuste.clienteId)
  const entidad = useEntidadDeCliente(ajuste.clienteId)
  const svc = servicios.find(s => s.id === ajuste.servicioId)
  const montoDespues = ajuste.montoDespues ?? calcularMontoDespues(ajuste.montoAntes, ajuste.porcentajeIPC)
  const impactoMensual = (ajuste.montoAntes !== null && montoDespues !== null)
    ? montoDespues - ajuste.montoAntes : null

  return (
    <div style={{
      background: '#fff',
      border: '1.5px solid ' + (esHistorial ? '#d1fae5' : '#e5e7eb'),
      borderRadius: 12, padding: '18px 22px', marginBottom: 12,
      boxShadow: '0 1px 3px #0001',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>

        {/* Columna izq: monto grande */}
        <div style={{ minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{cliente?.nombre || '—'}</span>
            <TagCliente />
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
            {entidad?.nombre || '—'} · Factura {cliente?.tipoFactura || '—'} · {svc?.moneda || 'ARS'}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {formatARS(montoDespues)}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
            a aplicar en {MES_SIGUIENTE}
          </div>
          {esHistorial && ajuste.fechaAprobacion && (
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>
              Aprobado: {ajuste.fechaAprobacion}
            </div>
          )}
        </div>

        {/* Centro: detalle IPC */}
        <div style={{ flex: 1, borderLeft: '1px solid #f3f4f6', paddingLeft: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Ajuste IPC</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#4f46e5', marginBottom: 5 }}>{formatPct(ajuste.porcentajeIPC)}</div>
          <div style={{ fontSize: 13, color: '#374151', marginBottom: 5 }}>
            Antes: {formatARS(ajuste.montoAntes)} → Ahora: {formatARS(montoDespues)}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
            Margen proyectado: +{ajuste.contexto?.margenProyectado ?? '—'}%
          </div>
          <BadgeAlerta alerta={ajuste.alertaAumentoSignificativo} />
          {ajuste.motivo && (
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, fontStyle: 'italic' }}>
              "{ajuste.motivo}"
            </div>
          )}
        </div>

        {/* Columna der: servicio + acciones */}
        <div style={{ minWidth: 180, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{svc?.nombre || '—'}</div>
            {svc?.descripcion && <div style={{ fontSize: 12, color: '#9ca3af' }}>{svc.descripcion}</div>}
            {impactoMensual !== null && (
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                Impacto: +{formatARS(impactoMensual)}/mes
              </div>
            )}
          </div>

          {!esHistorial ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => onRechazar(ajuste.id)}
                style={{
                  padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  color: '#dc2626', background: '#fff', border: '1.5px solid #fca5a5',
                  cursor: 'pointer',
                }}
              >RECHAZAR ×</button>
              <button
                onClick={() => onAprobar(ajuste.id)}
                style={{
                  padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  color: '#fff', background: '#4f46e5', border: 'none', cursor: 'pointer',
                }}
              >APROBAR ✓</button>
            </div>
          ) : (
            <BadgeStatus status={ajuste.status} />
          )}
        </div>

      </div>
    </div>
  )
}

// ── Historial de períodos ─────────────────────────────────────────────────────

function TabHistorial() {
  return (
    <div>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
        Períodos anteriores ya cerrados.
      </p>
      {HISTORIAL_PERIODOS.map(p => (
        <div key={p.mes + p.anio} style={{
          background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12,
          padding: '16px 22px', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <div style={{ minWidth: 130 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', textTransform: 'capitalize' }}>
              {p.mes} {p.anio}
            </div>
          </div>
          <div style={{ textAlign: 'center', minWidth: 80 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#4f46e5' }}>{formatPct(p.porcentajeIPC)}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>IPC aplicado</div>
          </div>
          <div style={{ display: 'flex', gap: 24, flex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#374151' }}>{p.totalAjustes}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>ajustes</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#059669' }}>{p.aprobados}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>aprobados</div>
            </div>
            {p.rechazados > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#dc2626' }}>{p.rechazados}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>rechazados</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Pantalla de edición (Pantalla 3) ─────────────────────────────────────────

function PaginaEditar({ ajuste, servicios, onGuardar, onAprobar, onCancelar }) {
  const [form, setForm] = useState({
    tipo: ajuste.tipoAjuste || 'IPC',
    porcentaje: String(ajuste.porcentajeIPC),
    montoAntes: ajuste.montoAntes !== null && ajuste.montoAntes !== undefined ? String(ajuste.montoAntes) : '',
    motivo: ajuste.motivo || '',
  })

  const cliente = useCliente(ajuste.clienteId)
  const entidad = useEntidadDeCliente(ajuste.clienteId)
  const svc = servicios.find(s => s.id === ajuste.servicioId)

  const pct = parseFloat(form.porcentaje)
  const monto = parseFloat(form.montoAntes)
  const pctValido = !isNaN(pct) && pct >= 0 && pct <= 100
  const montoValido = !isNaN(monto) && monto > 0
  const sinPrecio = form.montoAntes === '' || form.montoAntes === null

  const montoDespues = (pctValido && montoValido) ? calcularMontoDespues(form.montoAntes, form.porcentaje) : null
  const impactoMensual = montoDespues !== null && montoValido ? montoDespues - monto : null
  const impactoAnual = impactoMensual !== null ? impactoMensual * 12 : null

  const puedeAprobar = pctValido && montoValido

  const chF = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const buildCambios = () => ({
    tipoAjuste: form.tipo,
    porcentajeIPC: pct,
    montoAntes: montoValido ? monto : null,
    montoDespues,
    motivo: form.motivo,
  })

  return (
    <div>

      {/* Banner informativo */}
      <div style={{
        background: '#eef2ff', border: '1px solid #a5b4fc', borderRadius: 10,
        padding: '12px 20px', marginBottom: 28,
        display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 13, color: '#3730a3', fontWeight: 500,
      }}>
        <span style={{ fontSize: 16 }}>ℹ</span>
        Este mes se aplica ajuste IPC. Al aprobar, se desbloquea el cálculo en Facturación del mes.
      </div>

      {/* Encabezado */}
      <h1 className="page-title" style={{ marginBottom: 4 }}>
        Editar ajuste — {cliente?.nombre || '—'}
      </h1>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 22 }}>
        {entidad?.nombre || '—'} · Factura {cliente?.tipoFactura || '—'} · {svc?.moneda || 'ARS'} · {ajuste.impactoNivel === 'alto' ? '🔴 Alto impacto' : '🟢 Bajo impacto'}
      </div>

      {/* Card resumen del ajuste */}
      <div style={{
        background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12,
        padding: '18px 22px', marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{cliente?.nombre || '—'}</span>
            <TagCliente />
            {ajuste.impactoNivel === 'alto' && (
              <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#b91c1c', background: '#fee2e2' }}>
                ⚠ Alto impacto
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            {svc?.nombre || '—'} · {entidad?.nombre || '—'} · Factura {cliente?.tipoFactura || '—'} · {svc?.moneda || 'ARS'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#4f46e5', lineHeight: 1 }}>
            {formatPct(form.porcentaje)}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
            antes {form.montoAntes ? formatARS(form.montoAntes) : '—'} → ahora {formatARS(montoDespues)}
          </div>
        </div>
      </div>

      {/* Alerta de riesgo */}
      {ajuste.alertaAumentoSignificativo && (
        <div style={{
          background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 10,
          padding: '14px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠</span>
          <div>
            <div style={{ fontWeight: 700, color: '#92400e', fontSize: 14, marginBottom: 3 }}>
              Riesgo detectado: Aumento significativo
            </div>
            <div style={{ fontSize: 13, color: '#b45309' }}>
              Vs. últimos 3 ajustes del cliente. Revisá si el porcentaje es apropiado antes de aprobar.
            </div>
          </div>
        </div>
      )}

      {/* Layout 2 columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>

        {/* Columna izquierda: formulario */}
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#111827' }}>
            Ajuste propuesto
          </h3>

          {/* Tipo de ajuste */}
          <div className="form-group">
            <label htmlFor="ea-tipo">Tipo de ajuste</label>
            <select id="ea-tipo" className="form-select" name="tipo" value={form.tipo} onChange={chF} style={{ maxWidth: 200 }}>
              {TIPOS_AJUSTE.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Porcentaje */}
          <div className="form-group">
            <label htmlFor="ea-pct">Porcentaje de ajuste <span className="label-req">*</span></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                id="ea-pct"
                className={'form-input' + (!pctValido && form.porcentaje !== '' ? ' input-error' : '')}
                name="porcentaje" type="number" min="0" max="100" step="0.1"
                value={form.porcentaje} onChange={chF}
                style={{ maxWidth: 110 }}
              />
              <span style={{ fontWeight: 700, color: '#374151', fontSize: 16 }}>%</span>
            </div>
            {!pctValido && form.porcentaje !== '' && (
              <span className="field-error">El porcentaje debe estar entre 0 y 100</span>
            )}
          </div>

          {/* Monto antes */}
          <div className="form-group">
            <label htmlFor="ea-antes">Monto antes del ajuste <span className="label-req">*</span></label>
            <input
              id="ea-antes"
              className={'form-input' + (sinPrecio ? ' input-error' : '')}
              name="montoAntes" type="number" min="0" step="100"
              value={form.montoAntes} onChange={chF}
              placeholder="Ingresá el monto actual del servicio"
              style={{ maxWidth: 260 }}
            />
            {sinPrecio && (
              <span className="field-error">
                Este servicio no tiene precio definido. Ingresá el monto actual antes de aprobar.
              </span>
            )}
          </div>

          {/* Monto después (solo lectura, calculado) */}
          <div className="form-group">
            <label>Monto después del ajuste</label>
            <div style={{
              padding: '10px 14px', background: '#f9fafb',
              border: '1.5px solid #e5e7eb', borderRadius: 8,
              fontSize: 20, fontWeight: 700, color: '#111827',
              maxWidth: 260,
            }}>
              {montoDespues !== null ? formatARS(montoDespues) : '—'}
            </div>
            <span className="field-hint">Calculado automáticamente: monto × (1 + % / 100)</span>
          </div>

          {/* Motivo */}
          <div className="form-group">
            <label htmlFor="ea-motivo">Motivo (opcional)</label>
            <textarea
              id="ea-motivo" className="form-textarea" name="motivo"
              value={form.motivo} onChange={chF}
              maxLength={300} rows={3}
              placeholder="ej: Ajuste IPC bimestral — período jun/ago 2026"
            />
            <span className="field-hint">{form.motivo.length}/300 caracteres</span>
          </div>
        </div>

        {/* Columna derecha: contexto del cliente */}
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#111827' }}>
            Contexto del cliente
          </h3>

          {[
            { label: 'Último aumento', value: 'Hace ' + ajuste.contexto.ultimoAumentoHaceMeses + ' meses' },
            { label: 'Variación acumulada anual', value: '+' + ajuste.contexto.variacionAcumuladaAnual + '%' },
            { label: 'Margen proyectado', value: '+' + ajuste.contexto.margenProyectado + '%' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid #f3f4f6',
            }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{item.value}</span>
            </div>
          ))}

          {/* Monto nuevo destacado */}
          <div style={{
            marginTop: 18, padding: '14px', background: '#f8fafc',
            borderRadius: 8, border: '1px solid #e5e7eb',
          }}>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>En base al nuevo monto</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{formatARS(montoDespues)}</div>
          </div>

          {/* Impacto */}
          <div style={{ marginTop: 14 }}>
            {[
              { label: 'Impacto mensual', value: impactoMensual !== null ? (impactoMensual >= 0 ? '+' : '') + formatARS(impactoMensual) : '—' },
              { label: 'Impacto anual proyectado', value: impactoAnual !== null ? (impactoAnual >= 0 ? '+' : '') + formatARS(impactoAnual) : '—' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 0', borderBottom: '1px solid #f3f4f6',
              }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Aviso si no puede aprobar */}
      {sinPrecio && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8,
          padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#92400e',
        }}>
          ⚠ Completá el campo <strong>Monto antes del ajuste</strong> para poder aprobar.
        </div>
      )}

      {/* Footer de acciones */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          onClick={onCancelar}
          style={{
            padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            color: '#6b7280', background: '#fff', border: '1.5px solid #e5e7eb', cursor: 'pointer',
          }}
        >CANCELAR</button>
        <button
          onClick={() => onGuardar(ajuste.id, buildCambios())}
          style={{
            padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            color: '#4f46e5', background: '#eef2ff', border: '1.5px solid #a5b4fc', cursor: 'pointer',
          }}
        >GUARDAR CAMBIOS</button>
        <button
          onClick={() => puedeAprobar && onAprobar(ajuste.id, buildCambios())}
          disabled={!puedeAprobar}
          style={{
            padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            color: '#fff',
            background: puedeAprobar ? '#4f46e5' : '#c7d2fe',
            border: 'none',
            cursor: puedeAprobar ? 'pointer' : 'not-allowed',
          }}
        >APROBAR ✓</button>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onCancelar}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13 }}
        >
          ← Volver a Ajustes pendientes
        </button>
      </div>

    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

const TABS = [
  { key: 'revision',      label: 'Necesitan revisión' },
  { key: 'lista_aprobar', label: 'Listas para aprobar' },
  { key: 'aprobada',      label: 'Aprobadas' },
  { key: 'historial',     label: 'Historial' },
]

export default function AjustesPendientes() {
  useEffect(() => { document.title = 'Ajustes IPC — IPM Kyra' }, [])

  const [ajustes, setAjustes] = useState(AJUSTES_INICIAL)
  const [servicios, setServicios] = useState(SERVICIOS_INICIAL)
  const [tabActivo, setTabActivo] = useState('revision')
  const [ajusteEnEdicion, setAjusteEnEdicion] = useState(null)

  // Conteos para stat cards
  const countRevision    = ajustes.filter(a => a.status === 'revision').length
  const countListaApro   = ajustes.filter(a => a.status === 'lista_aprobar').length
  const countAprobada    = ajustes.filter(a => a.status === 'aprobada' || a.status === 'rechazada').length

  // ── Lógica de negocio ─────────────────────────────────────────────────────

  function aprobarAjuste(ajusteId, cambios) {
    const hoy = new Date().toISOString().slice(0, 10)
    const ajuste = ajustes.find(a => a.id === ajusteId)
    if (!ajuste) return

    const montoNuevo = cambios.montoDespues
    const motivo = cambios.motivo || ('Ajuste IPC ' + ajuste.mes + ' ' + ajuste.anio)

    // Actualizar ajuste
    setAjustes(prev => prev.map(a =>
      a.id !== ajusteId ? a : {
        ...a,
        ...cambios,
        status: 'aprobada',
        fechaAprobacion: hoy,
      }
    ))

    // Actualizar servicio en Módulo 3
    if (montoNuevo !== null) {
      setServicios(prev => prev.map(s => {
        if (s.id !== ajuste.servicioId) return s
        const valorAnterior = s.tipo === 'fijo' ? s.montoBase : s.tarifaHora
        const historial = [
          { fecha: hoy, valorAnterior, valorNuevo: montoNuevo, motivo },
          ...(s.historialPrecios || []),
        ]
        return {
          ...s,
          montoBase:   s.tipo === 'fijo'     ? montoNuevo : s.montoBase,
          tarifaHora:  s.tipo === 'por_hora' ? montoNuevo : s.tarifaHora,
          historialPrecios: historial,
        }
      }))
    }

    setAjusteEnEdicion(null)
    setTabActivo('aprobada')
  }

  function rechazarAjuste(ajusteId) {
    const hoy = new Date().toISOString().slice(0, 10)
    setAjustes(prev => prev.map(a =>
      a.id !== ajusteId ? a : { ...a, status: 'rechazada', fechaAprobacion: hoy }
    ))
  }

  function guardarCambios(ajusteId, cambios) {
    setAjustes(prev => prev.map(a =>
      a.id !== ajusteId ? a : {
        ...a,
        ...cambios,
        status: 'lista_aprobar',
        alertaAumentoSignificativo: false, // ya fue revisado
      }
    ))
    setAjusteEnEdicion(null)
    setTabActivo('lista_aprobar')
  }

  // Ajustes del tab activo
  const ajustesFiltrados = ajustes.filter(a => {
    if (tabActivo === 'revision')      return a.status === 'revision'
    if (tabActivo === 'lista_aprobar') return a.status === 'lista_aprobar'
    if (tabActivo === 'aprobada')      return a.status === 'aprobada' || a.status === 'rechazada'
    return false
  })

  // ── Pantalla de edición ───────────────────────────────────────────────────

  if (ajusteEnEdicion) {
    return (
      <PaginaEditar
        ajuste={ajusteEnEdicion}
        servicios={servicios}
        onGuardar={guardarCambios}
        onAprobar={aprobarAjuste}
        onCancelar={() => setAjusteEnEdicion(null)}
      />
    )
  }

  // ── Pantalla principal ────────────────────────────────────────────────────

  return (
    <div>
      <h1 className="page-title" style={{ textTransform: 'capitalize' }}>
        Ajustes pendientes de {MES_ACTUAL} {ANIO_ACTUAL}
      </h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginTop: -6, marginBottom: 28 }}>
        Revisá y gestioná los ajustes para subir precios a clientes y honorarios al equipo.
      </p>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 32 }}>
        <StatCard
          label="Pendientes revisión"
          count={countRevision}
          color="#d97706"
          active={tabActivo === 'revision'}
          onClick={() => setTabActivo('revision')}
        />
        <StatCard
          label="Listas para aprobar"
          count={countListaApro}
          color="#4f46e5"
          active={tabActivo === 'lista_aprobar'}
          onClick={() => setTabActivo('lista_aprobar')}
        />
        <StatCard
          label="Aprobadas"
          count={countAprobada}
          color="#059669"
          active={tabActivo === 'aprobada'}
          onClick={() => setTabActivo('aprobada')}
        />
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Secciones de ajustes IPC" className="subtabs" style={{ marginBottom: 24 }}>
        {TABS.map(tab => {
          const count = tab.key === 'revision' ? countRevision
                      : tab.key === 'lista_aprobar' ? countListaApro
                      : tab.key === 'aprobada' ? countAprobada : null
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={tabActivo === tab.key}
              className={'subtab' + (tabActivo === tab.key ? ' active' : '')}
              onClick={() => setTabActivo(tab.key)}
            >
              {tab.label}
              {count !== null && count > 0 && (
                <span style={{
                  marginLeft: 6, minWidth: 18, height: 18, padding: '0 5px',
                  borderRadius: 9, fontSize: 11, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: tabActivo === tab.key ? '#4f46e5' : '#e5e7eb',
                  color: tabActivo === tab.key ? '#fff' : '#374151',
                }}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Contenido del tab */}
      {tabActivo === 'historial' ? (
        <TabHistorial />
      ) : ajustesFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 24px', color: '#9ca3af', fontSize: 14 }}>
          {tabActivo === 'revision'      ? 'No hay ajustes pendientes de revisión para este período.' :
           tabActivo === 'lista_aprobar' ? 'No hay ajustes listos para aprobar todavía.' :
                                          'No hay ajustes aprobados en este período.'}
        </div>
      ) : (
        <div>
          {tabActivo === 'revision' && ajustesFiltrados.map(a => (
            <CardRevision
              key={a.id}
              ajuste={a}
              servicios={servicios}
              onEditar={setAjusteEnEdicion}
            />
          ))}
          {(tabActivo === 'lista_aprobar' || tabActivo === 'aprobada') && ajustesFiltrados.map(a => (
            <CardAprobacion
              key={a.id}
              ajuste={a}
              servicios={servicios}
              onAprobar={id => aprobarAjuste(id, {
                tipoAjuste: a.tipoAjuste,
                porcentajeIPC: a.porcentajeIPC,
                montoAntes: a.montoAntes,
                montoDespues: a.montoDespues ?? calcularMontoDespues(a.montoAntes, a.porcentajeIPC),
                motivo: a.motivo,
              })}
              onRechazar={rechazarAjuste}
              esHistorial={tabActivo === 'aprobada'}
            />
          ))}
        </div>
      )}
    </div>
  )
}