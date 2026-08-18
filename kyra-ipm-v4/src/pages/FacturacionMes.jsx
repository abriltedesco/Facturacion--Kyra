import { useState, useRef } from 'react'
import Modal from '../components/Modal'
import { CLIENTES_INICIAL } from '../data/clientes'
import { ENTIDADES_INICIAL } from '../data/entidades'
import { SERVICIOS_INICIAL } from '../data/servicios'
import { LINEAS_INICIAL } from '../data/lineasFacturacion'

const MES_LABEL   = 'Agosto 2026'
const MES_ACTUAL  = 'agosto'
const ANIO_ACTUAL = 2026

const MOCK_DIRS = {
  1: 'Corrientes 1234, CABA',
  2: 'Libertad 856, CABA',
  3: 'Avenida del Libertador 3020, CABA',
  4: 'Charcas 2960, CABA',
  5: 'Bulnes 1745, CABA',
  6: 'Billinghurst 2190, CABA',
  7: 'Castillo 77, CABA',
  8: 'Thames 1854, CABA',
  9: 'Lafinur 3082, CABA',
}

// ─── Formatters ──────────────────────────────────────────────────────────────

function fmt$ARS(n) {
  if (n == null) return '—'
  return '$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmt$USD(n) {
  if (n == null) return '—'
  return 'US$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtMonto(n, moneda) {
  return moneda === 'USD' ? fmt$USD(n) : fmt$ARS(n)
}

function labelImp(tipoFactura) {
  if (tipoFactura === 'A') return 'IVA 21%'
  if (tipoFactura === 'LLC') return 'Tax 12.5%'
  return null
}

function pctImpLabel(tipoFactura) {
  if (tipoFactura === 'A') return '21%'
  if (tipoFactura === 'LLC') return '12.5%'
  return '0%'
}

function calcImpuesto(neto, tipoFactura) {
  if (tipoFactura === 'A') return neto * 0.21
  if (tipoFactura === 'LLC') return neto * 0.125
  return 0
}

// ─── Business logic ──────────────────────────────────────────────────────────

function contadorNroFac(lineas, entidadId) {
  const prefix = entidadId === 1 ? '0001' : '0002'
  const existing = lineas
    .filter(l => l.nroFactura && l.entidadId === entidadId)
    .map(l => parseInt(l.nroFactura.split('-')[1], 10))
    .filter(n => !isNaN(n))
  const max = existing.length ? Math.max(...existing) : 0
  return `${prefix}-${String(max + 1).padStart(8, '0')}`
}

function variLabel(diff, moneda) {
  if (diff == null || diff === 0) return null
  const sign = diff > 0 ? '+' : ''
  return sign + fmtMonto(diff, moneda) + ' vs. mes anterior'
}

function fechaHoy() {
  return new Date().toISOString().split('T')[0]
}

function fechaUltimoDia(mes, anio) {
  const meses = { enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6,
                  julio:7, agosto:8, septiembre:9, octubre:10, noviembre:11, diciembre:12 }
  const m = meses[mes] || 8
  return new Date(anio, m, 0).toISOString().split('T')[0]
}

function fmtFecha(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function IcoWarn() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function IcoEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function IcoCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IcoXSm() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function IcoEye() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function IcoChevL() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  )
}

function IcoChevR() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

function IcoPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function IcoSend() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  )
}

// ─── Atoms ───────────────────────────────────────────────────────────────────

function TagCliente({ nombre }) {
  return (
    <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', opacity: .55 }}>
      {nombre}
    </span>
  )
}

const ALERTA_LABELS = {
  ipc_pendiente:    { txt: 'IPC pendiente de aplicar', color: '#e67e22' },
  variacion_umbral: { txt: 'Variación sobre umbral',   color: '#8e44ad' },
}

function BadgesAlerta({ alertas }) {
  if (!alertas || alertas.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
      {alertas.map(a => {
        const cfg = ALERTA_LABELS[a] || { txt: a, color: '#666' }
        return (
          <span key={a} style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: '11px', fontWeight: 600,
            color: cfg.color, background: cfg.color + '18',
            border: `1px solid ${cfg.color}40`,
            borderRadius: '4px', padding: '2px 7px',
          }}>
            <IcoWarn /> {cfg.txt}
          </span>
        )
      })}
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e5e7eb)',
      borderRadius: '12px', padding: '20px 24px', flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', opacity: .5, marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-.01em' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', opacity: .5, marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

// ─── Card: Pendiente Revisión ─────────────────────────────────────────────────

function CardRevision({ linea, cliente, entidad, servicio, onAprobar, onEditar }) {
  const canAprobar = linea.importeNeto != null

  function handleAprobar() {
    onAprobar(linea.id, {})
  }

  const impLabel = labelImp(linea.tipoFactura)

  return (
    <div style={{
      background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e5e7eb)',
      borderRadius: '12px', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <TagCliente nombre={cliente?.nombre || '—'} />
          <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '2px' }}>{servicio?.nombre || '—'}</div>
          <BadgesAlerta alertas={linea.alertas} />
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '22px', fontWeight: 700 }}>
            {fmtMonto(linea.importeBruto, linea.moneda)}
          </div>
          {impLabel && (
            <div style={{ fontSize: '11px', opacity: .5 }}>
              Neto {fmtMonto(linea.importeNeto, linea.moneda)} + {impLabel}
            </div>
          )}
          {linea.ajusteIPCPendiente && linea.montoConIPC && (
            <div style={{ fontSize: '11px', color: '#e67e22', marginTop: '2px' }}>
              Con IPC: {fmtMonto(linea.montoConIPC, linea.moneda)}
            </div>
          )}
        </div>
      </div>

      {linea.cantidadHoras != null && (
        <div style={{
          background: 'var(--bg-page, #f5f6fa)', borderRadius: '8px',
          padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, opacity: .6, textTransform: 'uppercase', letterSpacing: '.04em' }}>
            Detalle de horas
          </div>
          <div style={{ fontSize: '13px' }}>
            {linea.cantidadHoras} hs × {fmtMonto(linea.tarifaHora, linea.moneda)} / h
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '12px', opacity: .5 }}>
          {entidad?.nombre} · Factura {linea.tipoFactura} · {linea.moneda}
          {linea.variacionVsMesAnterior != null && linea.variacionVsMesAnterior !== 0 && (
            <span style={{ marginLeft: '8px', color: linea.variacionVsMesAnterior > 0 ? '#27ae60' : '#c0392b' }}>
              {variLabel(linea.variacionVsMesAnterior, linea.moneda)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary btn-sm" onClick={() => onEditar(linea)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <IcoEdit /> Editar
          </button>
          <button
            className="btn-cta btn-sm"
            onClick={handleAprobar}
            disabled={!canAprobar}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', opacity: canAprobar ? 1 : .45 }}
          >
            <IcoCheck /> Aprobar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Card: Aprobada ───────────────────────────────────────────────────────────

function CardAprobada({ linea, cliente, entidad, servicio, onEmitir, onRechazar }) {
  const impLabel = labelImp(linea.tipoFactura)
  return (
    <div style={{
      background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e5e7eb)',
      borderRadius: '12px', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <TagCliente nombre={cliente?.nombre || '—'} />
          <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '2px' }}>{servicio?.nombre || '—'}</div>
          {linea.cantidadHoras && (
            <div style={{ fontSize: '12px', opacity: .55, marginTop: '2px' }}>
              {linea.cantidadHoras} h × {fmtMonto(linea.tarifaHora, linea.moneda)}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '22px', fontWeight: 700 }}>
            {fmtMonto(linea.importeBruto, linea.moneda)}
          </div>
          {impLabel && (
            <div style={{ fontSize: '11px', opacity: .5 }}>
              Neto {fmtMonto(linea.importeNeto, linea.moneda)} + {impLabel}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '12px', opacity: .5 }}>
          {entidad?.nombre} · Factura {linea.tipoFactura} · {linea.moneda}
          {linea.variacionVsMesAnterior != null && linea.variacionVsMesAnterior !== 0 && (
            <span style={{ marginLeft: '8px', color: linea.variacionVsMesAnterior > 0 ? '#27ae60' : '#c0392b' }}>
              {variLabel(linea.variacionVsMesAnterior, linea.moneda)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-secondary btn-sm"
            onClick={() => onRechazar(linea.id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#c0392b' }}
          >
            <IcoXSm /> Rechazar
          </button>
          <button
            className="btn-cta btn-sm"
            onClick={() => onEmitir(linea.id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <IcoSend /> Emitir
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Card: Emitida ────────────────────────────────────────────────────────────

function CardEmitida({ linea, cliente, entidad, servicio, onVerDetalle, onEnviar }) {
  const impLabel = labelImp(linea.tipoFactura)
  return (
    <div style={{
      background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e5e7eb)',
      borderRadius: '12px', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <TagCliente nombre={cliente?.nombre || '—'} />
          <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '2px' }}>{servicio?.nombre || '—'}</div>
          <div style={{ fontSize: '12px', opacity: .55, marginTop: '3px' }}>
            {linea.nroFactura} · Vence {fmtFecha(linea.fechaVencimiento)}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '22px', fontWeight: 700 }}>
            {fmtMonto(linea.importeBruto, linea.moneda)}
          </div>
          {impLabel && (
            <div style={{ fontSize: '11px', opacity: .5 }}>
              Neto {fmtMonto(linea.importeNeto, linea.moneda)} + {impLabel}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '12px', opacity: .5 }}>
          {entidad?.nombre} · Emitida {fmtFecha(linea.fechaEmision)}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary btn-sm" onClick={() => onVerDetalle(linea)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <IcoEye /> Ver detalle
          </button>
          <button className="btn-cta btn-sm" onClick={() => onEnviar(linea.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <IcoCheck /> Marcar enviada
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Card: Enviada ────────────────────────────────────────────────────────────

function CardEnviada({ linea, cliente, entidad, servicio, onVerDetalle }) {
  const impLabel = labelImp(linea.tipoFactura)
  return (
    <div style={{
      background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e5e7eb)',
      borderRadius: '12px', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px',
      opacity: .85,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <TagCliente nombre={cliente?.nombre || '—'} />
          <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '2px' }}>{servicio?.nombre || '—'}</div>
          <div style={{ fontSize: '12px', opacity: .55, marginTop: '3px' }}>
            {linea.nroFactura} · Enviada {fmtFecha(linea.fechaEnvio || linea.fechaEmision)}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '22px', fontWeight: 700 }}>
            {fmtMonto(linea.importeBruto, linea.moneda)}
          </div>
          {impLabel && (
            <div style={{ fontSize: '11px', opacity: .5 }}>
              Neto {fmtMonto(linea.importeNeto, linea.moneda)} + {impLabel}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '12px', opacity: .5 }}>
          {entidad?.nombre} · Vence {fmtFecha(linea.fechaVencimiento)}
        </div>
        <button className="btn-secondary btn-sm" onClick={() => onVerDetalle(linea)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <IcoEye /> Ver detalle
        </button>
      </div>
    </div>
  )
}

// ─── Drawer Factura ───────────────────────────────────────────────────────────

const STATUS_DRAWER = {
  revision: { label: 'Pendiente revisión', bg: '#f5f5f5',  color: '#525252' },
  aprobada: { label: 'Aprobada',           bg: '#f5f5f5',  color: '#525252' },
  emitida:  { label: 'Emitida',            bg: '#171717',  color: '#fff'    },
  enviada:  { label: 'Enviada',            bg: '#404040',  color: '#fff'    },
}

function DrawerFactura({ linea, onClose, clientes, entidades, servicios }) {
  if (!linea) return null
  const cliente  = clientes.find(c => c.id === linea.clienteId)
  const entidad  = entidades.find(e => e.id === linea.entidadId)
  const servicio = servicios.find(s => s.id === linea.servicioId)
  const impLabel = labelImp(linea.tipoFactura)
  const st       = STATUS_DRAWER[linea.status] || STATUS_DRAWER.revision

  const Row = ({ label, value }) => value ? (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border, #e5e7eb)' }}>
      <span style={{ fontSize: '12px', color: 'var(--gray-500, #737373)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  ) : null

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 199, backdropFilter: 'blur(1px)' }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', maxWidth: '95vw',
        background: '#fff', zIndex: 200, overflowY: 'auto',
        boxShadow: '-4px 0 32px rgba(0,0,0,.14)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Sticky header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px', borderBottom: '1px solid var(--border, #e5e7eb)',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--gray-400, #a3a3a3)' }}>Factura</span>
            <span style={{ fontSize: '15px', fontWeight: 700 }}>{cliente?.nombre || '—'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: st.bg, color: st.color }}>{st.label}</span>
            <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '22px', lineHeight: 1, color: 'var(--gray-400, #a3a3a3)', padding: '2px 6px' }} aria-label="Cerrar">×</button>
          </div>
        </div>

        {/* ── Importe hero ── */}
        <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid var(--border, #e5e7eb)', background: 'var(--gray-50, #fafafa)' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--gray-400, #a3a3a3)', marginBottom: '8px' }}>Importe total</div>
          <div style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1 }}>
            {fmtMonto(linea.importeBruto, linea.moneda)}
          </div>
          {impLabel && (
            <div style={{ fontSize: '12px', color: 'var(--gray-500, #737373)', marginTop: '8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span>{fmtMonto(linea.importeNeto, linea.moneda)} neto</span>
              <span style={{ opacity: .4 }}>+</span>
              <span>{impLabel} {fmtMonto(linea.impuesto, linea.moneda)}</span>
            </div>
          )}
          {linea.cantidadHoras && (
            <div style={{ fontSize: '12px', color: 'var(--gray-500, #737373)', marginTop: '4px' }}>
              {linea.cantidadHoras} h × {fmtMonto(linea.tarifaHora, linea.moneda)}
            </div>
          )}
        </div>

        {/* ── Cuerpo ── */}
        <div style={{ padding: '0 20px 32px', flex: 1 }}>

          {/* Servicio y entidad */}
          <div style={{ paddingTop: '4px' }}>
            <Row label="Servicio"      value={servicio?.nombre} />
            <Row label="Entidad"       value={entidad?.nombre} />
            <Row label="Tipo factura"  value={linea.tipoFactura ? `Factura ${linea.tipoFactura}` : null} />
            <Row label="Nro. factura"  value={linea.nroFactura} />
          </div>

          {/* Fechas */}
          <div style={{ marginTop: '16px', paddingTop: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--gray-400, #a3a3a3)', padding: '8px 0 4px' }}>Fechas</div>
            <Row label="Período"      value={linea.mes ? `${linea.mes.charAt(0).toUpperCase() + linea.mes.slice(1)} ${linea.anio}` : null} />
            <Row label="Emisión"      value={fmtFecha(linea.fechaEmision)} />
            <Row label="Vencimiento"  value={fmtFecha(linea.fechaVencimiento)} />
            {linea.fechaEnvio && <Row label="Enviada" value={fmtFecha(linea.fechaEnvio)} />}
          </div>

          {/* Dirección fiscal */}
          {cliente && MOCK_DIRS[cliente.id] && (
            <div style={{ marginTop: '20px', padding: '14px 16px', background: 'var(--gray-50, #fafafa)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--gray-400, #a3a3a3)', marginBottom: '6px' }}>Dirección fiscal</div>
              <div style={{ fontSize: '13px' }}>{MOCK_DIRS[cliente.id]}</div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

// ─── Modal Editar Línea ───────────────────────────────────────────────────────

function ModalEditarLinea({ linea, onClose, onGuardar, clientes, entidades, servicios, triggerRef }) {
  const cliente  = clientes.find(c => c.id === linea.clienteId)
  const servicio = servicios.find(s => s.id === linea.servicioId)

  const [montoBase,  setMontoBase]  = useState(String(linea.montoBase ?? ''))
  const [cantHoras,  setCantHoras]  = useState(String(linea.cantidadHoras ?? ''))
  const [tarifaHora, setTarifaHora] = useState(String(linea.tarifaHora ?? ''))
  const [aplicarIPC, setAplicarIPC] = useState(linea.ajusteIPCPendiente)
  const [nota,       setNota]       = useState('')
  const [errors,     setErrors]     = useState({})

  const esHoras = servicio?.tipo === 'por_hora' || linea.cantidadHoras != null

  function validate() {
    const e = {}
    if (esHoras) {
      if (!cantHoras  || Number(cantHoras)  <= 0) e.cantHoras  = 'Requerido'
      if (!tarifaHora || Number(tarifaHora) <= 0) e.tarifaHora = 'Requerido'
    } else {
      if (!montoBase || Number(montoBase) <= 0) e.montoBase = 'Requerido'
    }
    return e
  }

  function handleGuardar() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    let cambios = { ajusteIPCPendiente: aplicarIPC }
    if (esHoras) {
      const neto = Number(cantHoras) * Number(tarifaHora)
      const imp  = calcImpuesto(neto, linea.tipoFactura)
      cambios = { ...cambios, cantidadHoras: Number(cantHoras), tarifaHora: Number(tarifaHora),
                  importeNeto: neto, impuesto: imp, importeBruto: neto + imp,
                  alertas: linea.alertas ?? [] }
    } else {
      const base  = Number(montoBase)
      const imp   = calcImpuesto(base, linea.tipoFactura)
      const bruto = aplicarIPC && linea.porcentajeIPC
        ? base * (1 + linea.porcentajeIPC / 100)
        : base + imp
      cambios = { ...cambios, montoBase: base, importeNeto: base, impuesto: imp, importeBruto: bruto,
                  alertas: linea.alertas?.filter(a => a !== 'ipc_pendiente') ?? [] }
    }
    onGuardar(linea.id, cambios)
    onClose()
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Editar línea — ${cliente?.nombre || ''}`}
      triggerRef={triggerRef}
      footer={
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-cta" onClick={handleGuardar}>Guardar</button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '13px', opacity: .55 }}>{servicio?.nombre} · Factura {linea.tipoFactura} · {linea.moneda}</div>

        {esHoras ? (
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Horas trabajadas <span className="label-req">*</span></label>
              <input type="number" min="0" step="0.5" className="form-input"
                value={cantHoras} onChange={e => { setCantHoras(e.target.value); setErrors(p => ({...p, cantHoras: ''})) }} />
              {errors.cantHoras && <div className="form-field-error">{errors.cantHoras}</div>}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Tarifa / hora <span className="label-req">*</span></label>
              <input type="number" min="0" className="form-input"
                value={tarifaHora} onChange={e => { setTarifaHora(e.target.value); setErrors(p => ({...p, tarifaHora: ''})) }} />
              {errors.tarifaHora && <div className="form-field-error">{errors.tarifaHora}</div>}
            </div>
          </div>
        ) : (
          <div className="form-group">
            <label>Monto base ({linea.moneda}) <span className="label-req">*</span></label>
            <input type="number" min="0" className="form-input"
              value={montoBase} onChange={e => { setMontoBase(e.target.value); setErrors(p => ({...p, montoBase: ''})) }} />
            {errors.montoBase && <div className="form-field-error">{errors.montoBase}</div>}
          </div>
        )}

        {linea.ajusteIPCPendiente && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
            <input type="checkbox" checked={aplicarIPC} onChange={e => setAplicarIPC(e.target.checked)} />
            Aplicar ajuste IPC ({linea.porcentajeIPC}%)
          </label>
        )}

        <div className="form-group">
          <label>Nota interna (opcional)</label>
          <textarea className="form-input" rows={2} value={nota} onChange={e => setNota(e.target.value)} />
        </div>

        {linea.montoBaseAnterior != null && (
          <div style={{ fontSize: '12px', opacity: .5, borderTop: '1px solid var(--border, #e5e7eb)', paddingTop: '12px' }}>
            Mes anterior: {fmtMonto(linea.montoBaseAnterior, linea.moneda)}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Modal Nueva Factura ──────────────────────────────────────────────────────

const TIPOS_FACTURA = ['A', 'C', 'LLC']
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function ModalNuevaFactura({ isOpen, onClose, onAgregar, clientes, entidades, servicios, triggerRef }) {
  const pasos = ['Datos básicos', 'Importe', 'Confirmar']
  const [paso, setPaso]   = useState(0)
  const [form, setForm]   = useState({
    clienteId: '', servicioId: '', entidadId: '', tipoFactura: 'A', moneda: 'ARS',
    mes: MES_ACTUAL, anio: String(ANIO_ACTUAL),
    montoBase: '', cantidadHoras: '', tarifaHora: '', nota: '',
  })
  const [errors, setErrors] = useState({})

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const clienteSrvs = form.clienteId
    ? servicios.filter(s => String(s.clienteId) === String(form.clienteId))
    : []
  const servSel  = servicios.find(s => String(s.id) === String(form.servicioId))
  const esHoras  = servSel?.tipo === 'por_hora'
  const clienteSel = clientes.find(c => String(c.id) === String(form.clienteId))
  const entidadSel = entidades.find(e => String(e.id) === String(form.entidadId))

  function validatePaso0() {
    const e = {}
    if (!form.clienteId)   e.clienteId   = 'Seleccioná un cliente'
    if (!form.servicioId)  e.servicioId  = 'Seleccioná un servicio'
    if (!form.entidadId)   e.entidadId   = 'Seleccioná una entidad'
    if (!form.tipoFactura) e.tipoFactura = 'Requerido'
    return e
  }

  function validatePaso1() {
    const e = {}
    if (esHoras) {
      if (!form.cantidadHoras || Number(form.cantidadHoras) <= 0) e.cantidadHoras = 'Requerido'
      if (!form.tarifaHora    || Number(form.tarifaHora)    <= 0) e.tarifaHora    = 'Requerido'
    } else {
      if (!form.montoBase || Number(form.montoBase) <= 0) e.montoBase = 'Requerido'
    }
    return e
  }

  function next() {
    let e = {}
    if (paso === 0) e = validatePaso0()
    if (paso === 1) e = validatePaso1()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setPaso(p => p + 1)
  }

  function handleAgregar() {
    let neto, imp, bruto, cantH, tarH
    if (esHoras) {
      cantH = Number(form.cantidadHoras)
      tarH  = Number(form.tarifaHora)
      neto  = cantH * tarH
    } else {
      neto = Number(form.montoBase)
    }
    imp   = calcImpuesto(neto, form.tipoFactura)
    bruto = neto + imp

    onAgregar({
      clienteId:    Number(form.clienteId),
      servicioId:   Number(form.servicioId),
      entidadId:    Number(form.entidadId),
      tipoFactura:  form.tipoFactura,
      moneda:       form.moneda,
      mes:          form.mes,
      anio:         Number(form.anio),
      cantidadHoras: esHoras ? cantH : null,
      tarifaHora:    esHoras ? tarH  : null,
      montoBase:     esHoras ? null  : Number(form.montoBase),
      montoBaseAnterior: null,
      ajusteIPCPendiente: false,
      importeNeto:   neto,
      impuesto:      imp,
      importeBruto:  bruto,
      alertas:       [],
      variacionVsMesAnterior: null,
      status:        'revision',
    })
    onClose()
    setPaso(0)
    setForm({ clienteId:'', servicioId:'', entidadId:'', tipoFactura:'A', moneda:'ARS',
              mes:MES_ACTUAL, anio:String(ANIO_ACTUAL), montoBase:'', cantidadHoras:'', tarifaHora:'', nota:'' })
  }

  const previewNeto = esHoras && Number(form.cantidadHoras) > 0 && Number(form.tarifaHora) > 0
    ? Number(form.cantidadHoras) * Number(form.tarifaHora)
    : !esHoras && Number(form.montoBase) > 0
      ? Number(form.montoBase)
      : 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva línea de facturación"
      triggerRef={triggerRef}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', opacity: .5 }}>Paso {paso + 1} de {pasos.length}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {paso > 0 && (
              <button className="btn-secondary" onClick={() => setPaso(p => p - 1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <IcoChevL /> Anterior
              </button>
            )}
            {paso < pasos.length - 1 && (
              <button className="btn-cta" onClick={next} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Siguiente <IcoChevR />
              </button>
            )}
            {paso === pasos.length - 1 && (
              <button className="btn-cta" onClick={handleAgregar}>Agregar línea</button>
            )}
          </div>
        </div>
      }
    >
      {/* Step indicator */}
      <div style={{ display: 'flex', marginBottom: '24px' }}>
        {pasos.map((p, i) => (
          <div key={p} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative' }}>
            {i > 0 && (
              <div style={{
                position: 'absolute', top: '14px', right: '50%', left: '-50%',
                height: '2px', background: i <= paso ? 'var(--color-cta, #111)' : 'var(--border, #e5e7eb)', zIndex: 0,
              }} />
            )}
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', zIndex: 1,
              background: i <= paso ? 'var(--color-cta, #111)' : 'var(--border, #e5e7eb)',
              color: i <= paso ? '#fff' : '#999',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700,
            }}>{i + 1}</div>
            <span style={{ fontSize: '11px', opacity: i === paso ? 1 : .45, fontWeight: i === paso ? 600 : 400 }}>{p}</span>
          </div>
        ))}
      </div>

      {/* Paso 0: Datos básicos */}
      {paso === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label>Cliente <span className="label-req">*</span></label>
            <select className="form-select" value={form.clienteId}
              onChange={e => { setF('clienteId', e.target.value); setF('servicioId', '') }}>
              <option value="">— Seleccioná —</option>
              {clientes.filter(c => c.estado === 'activo').map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            {errors.clienteId && <div className="form-field-error">{errors.clienteId}</div>}
          </div>
          <div className="form-group">
            <label>Servicio <span className="label-req">*</span></label>
            <select className="form-select" value={form.servicioId} disabled={!form.clienteId}
              onChange={e => setF('servicioId', e.target.value)}>
              <option value="">— Seleccioná —</option>
              {clienteSrvs.filter(s => s.estado === 'activo').map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
            {errors.servicioId && <div className="form-field-error">{errors.servicioId}</div>}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Entidad emisora <span className="label-req">*</span></label>
              <select className="form-select" value={form.entidadId} onChange={e => setF('entidadId', e.target.value)}>
                <option value="">— Seleccioná —</option>
                {entidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
              {errors.entidadId && <div className="form-field-error">{errors.entidadId}</div>}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Tipo factura <span className="label-req">*</span></label>
              <select className="form-select" value={form.tipoFactura} onChange={e => setF('tipoFactura', e.target.value)}>
                {TIPOS_FACTURA.map(t => <option key={t} value={t}>Factura {t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Mes</label>
              <select className="form-select" value={form.mes} onChange={e => setF('mes', e.target.value)}>
                {MESES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Moneda</label>
              <select className="form-select" value={form.moneda} onChange={e => setF('moneda', e.target.value)}>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Paso 1: Importe */}
      {paso === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '13px', opacity: .55 }}>
            {clienteSel?.nombre} · {servSel?.nombre} · Factura {form.tipoFactura} · {form.moneda}
          </div>
          {esHoras ? (
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Horas trabajadas <span className="label-req">*</span></label>
                <input type="number" min="0" step="0.5" className="form-input"
                  value={form.cantidadHoras}
                  onChange={e => { setF('cantidadHoras', e.target.value); setErrors(p => ({...p, cantidadHoras:''})) }} />
                {errors.cantidadHoras && <div className="form-field-error">{errors.cantidadHoras}</div>}
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Tarifa / hora ({form.moneda}) <span className="label-req">*</span></label>
                <input type="number" min="0" className="form-input"
                  value={form.tarifaHora}
                  onChange={e => { setF('tarifaHora', e.target.value); setErrors(p => ({...p, tarifaHora:''})) }} />
                {errors.tarifaHora && <div className="form-field-error">{errors.tarifaHora}</div>}
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label>Monto base ({form.moneda}) <span className="label-req">*</span></label>
              <input type="number" min="0" className="form-input"
                value={form.montoBase}
                onChange={e => { setF('montoBase', e.target.value); setErrors(p => ({...p, montoBase:''})) }} />
              {errors.montoBase && <div className="form-field-error">{errors.montoBase}</div>}
            </div>
          )}
          {previewNeto > 0 && (
            <div style={{ background:'var(--bg-page,#f5f6fa)', borderRadius:'8px', padding:'14px', fontSize:'13px', display:'flex', flexDirection:'column', gap:'6px' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{opacity:.55}}>Neto</span>
                <span>{fmtMonto(previewNeto, form.moneda)}</span>
              </div>
              {calcImpuesto(previewNeto, form.tipoFactura) > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{opacity:.55}}>{labelImp(form.tipoFactura)}</span>
                  <span>{fmtMonto(calcImpuesto(previewNeto, form.tipoFactura), form.moneda)}</span>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, borderTop:'1px solid var(--border,#e5e7eb)', paddingTop:'6px', marginTop:'2px' }}>
                <span>Total</span>
                <span>{fmtMonto(previewNeto + calcImpuesto(previewNeto, form.tipoFactura), form.moneda)}</span>
              </div>
            </div>
          )}
          <div className="form-group">
            <label>Nota interna (opcional)</label>
            <textarea className="form-input" rows={2} value={form.nota} onChange={e => setF('nota', e.target.value)} />
          </div>
        </div>
      )}

      {/* Paso 2: Confirmar */}
      {paso === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '13px', opacity: .6, marginBottom: '4px' }}>Revisá los datos antes de agregar.</div>
          {[
            ['Cliente',         clienteSel?.nombre],
            ['Servicio',        servSel?.nombre],
            ['Entidad emisora', entidadSel?.nombre],
            ['Tipo factura',    `Factura ${form.tipoFactura}`],
            ['Moneda',          form.moneda],
            ['Período',         `${form.mes.charAt(0).toUpperCase() + form.mes.slice(1)} ${form.anio}`],
            esHoras
              ? ['Horas × tarifa', `${form.cantidadHoras} h × ${fmtMonto(Number(form.tarifaHora), form.moneda)}`]
              : ['Monto base', fmtMonto(Number(form.montoBase), form.moneda)],
          ].map(([label, value]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:'14px', borderBottom:'1px solid var(--border,#e5e7eb)', paddingBottom:'8px' }}>
              <span style={{ opacity:.5 }}>{label}</span>
              <span style={{ fontWeight:500 }}>{value || '—'}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'15px', fontWeight:700, marginTop:'4px' }}>
            <span>Total estimado</span>
            <span>{fmtMonto(previewNeto + calcImpuesto(previewNeto, form.tipoFactura), form.moneda)}</span>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FacturacionMes() {
  const [lineas,      setLineas]      = useState(LINEAS_INICIAL)
  const [tabActivo,   setTabActivo]   = useState('revision')
  const [drawerLinea, setDrawerLinea] = useState(null)
  const [lineaEditar, setLineaEditar] = useState(null)

  const btnNuevaRef = useRef(null)

  const clientes  = CLIENTES_INICIAL
  const entidades = ENTIDADES_INICIAL
  const servicios = SERVICIOS_INICIAL

  // ── State machine ───────────────────────────────────────────────────────────

  function aprobarLinea(id, cambios) {
    setLineas(ls => ls.map(l => l.id === id
      ? { ...l, ...cambios, status: 'aprobada' }
      : l
    ))
  }

  function emitirLinea(id) {
    setLineas(ls => {
      const linea  = ls.find(l => l.id === id)
      const nroFac = contadorNroFac(ls, linea?.entidadId)
      return ls.map(l => l.id === id
        ? { ...l, status: 'emitida', nroFactura: nroFac,
            fechaEmision: fechaHoy(),
            fechaVencimiento: fechaUltimoDia(l.mes, l.anio) }
        : l
      )
    })
  }

  function enviarLinea(id) {
    setLineas(ls => ls.map(l => l.id === id
      ? { ...l, status: 'enviada', fechaEnvio: fechaHoy() }
      : l
    ))
  }

  function rechazarLinea(id) {
    setLineas(ls => ls.map(l => l.id === id
      ? { ...l, status: 'revision',
          nroFactura: undefined, fechaEmision: undefined, fechaVencimiento: undefined }
      : l
    ))
  }

  function guardarEdicion(id, cambios) {
    setLineas(ls => ls.map(l => l.id === id ? { ...l, ...cambios } : l))
  }

  function agregarLinea(nueva) {
    const nextId = Math.max(...lineas.map(l => l.id), 0) + 1
    setLineas(ls => [...ls, { ...nueva, id: nextId }])
  }

  // ── Filtered lists ──────────────────────────────────────────────────────────

  const enRevision = lineas.filter(l => l.status === 'revision')
  const aprobadas  = lineas.filter(l => l.status === 'aprobada')
  const emitidas   = lineas.filter(l => l.status === 'emitida')
  const enviadas   = lineas.filter(l => l.status === 'enviada')

  // ── Totals (emitidas + enviadas = revenue confirmado) ───────────────────────

  const totalARS = lineas
    .filter(l => (l.status === 'emitida' || l.status === 'enviada') && l.moneda === 'ARS')
    .reduce((s, l) => s + (l.importeBruto ?? 0), 0)

  const totalUSD = lineas
    .filter(l => (l.status === 'emitida' || l.status === 'enviada') && l.moneda === 'USD')
    .reduce((s, l) => s + (l.importeBruto ?? 0), 0)

  const TABS = [
    { key: 'revision', label: 'Pendiente revisión', count: enRevision.length },
    { key: 'aprobada', label: 'Aprobadas',           count: aprobadas.length },
    { key: 'emitida',  label: 'Emitidas',            count: emitidas.length },
    { key: 'enviada',  label: 'Enviadas',             count: enviadas.length },
  ]

  const tabLabels = { revision: 'pendientes revisión', aprobada: 'aprobadas', emitida: 'emitidas', enviada: 'enviadas' }
  const tabCounts = { revision: enRevision.length, aprobada: aprobadas.length, emitida: emitidas.length, enviada: enviadas.length }

  function lookup(linea) {
    return {
      cliente:  clientes.find(c => c.id === linea.clienteId),
      entidad:  entidades.find(e => e.id === linea.entidadId),
      servicio: servicios.find(s => s.id === linea.servicioId),
    }
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '2px' }}>Facturación del mes</h1>
          <div style={{ fontSize: '13px', opacity: .5 }}>{MES_LABEL}</div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <StatCard
          label="Total ARS (AFIP)"
          value={fmt$ARS(totalARS)}
          sub="emitidas + enviadas"
        />
        <StatCard
          label="Total USD (LLC)"
          value={fmt$USD(totalUSD)}
          sub="emitidas + enviadas"
        />
        <StatCard
          label={`Líneas ${tabLabels[tabActivo]}`}
          value={String(tabCounts[tabActivo])}
          sub={`de ${lineas.length} en total`}
        />
      </div>

      {/* Tabs */}
      <div className="subtabs" style={{ marginBottom: '20px' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`subtab${tabActivo === t.key ? ' active' : ''}`}
            onClick={() => setTabActivo(t.key)}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{
                marginLeft: '6px', fontSize: '11px', fontWeight: 700,
                background: tabActivo === t.key ? 'rgba(255,255,255,.25)' : 'var(--border,#e5e7eb)',
                color: tabActivo === t.key ? 'inherit' : '#666',
                borderRadius: '10px', padding: '1px 6px',
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tabActivo === 'revision' && enRevision.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', opacity: .4, fontSize: '14px' }}>
            No hay líneas pendientes de revisión.
          </div>
        )}
        {tabActivo === 'revision' && enRevision.map(linea => {
          const { cliente, entidad, servicio } = lookup(linea)
          return (
            <CardRevision
              key={linea.id}
              linea={linea}
              cliente={cliente}
              entidad={entidad}
              servicio={servicio}
              onAprobar={aprobarLinea}
              onEditar={setLineaEditar}
            />
          )
        })}

        {tabActivo === 'aprobada' && aprobadas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', opacity: .4, fontSize: '14px' }}>
            No hay líneas aprobadas.
          </div>
        )}
        {tabActivo === 'aprobada' && aprobadas.map(linea => {
          const { cliente, entidad, servicio } = lookup(linea)
          return (
            <CardAprobada
              key={linea.id}
              linea={linea}
              cliente={cliente}
              entidad={entidad}
              servicio={servicio}
              onEmitir={emitirLinea}
              onRechazar={rechazarLinea}
            />
          )
        })}

        {tabActivo === 'emitida' && emitidas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', opacity: .4, fontSize: '14px' }}>
            No hay líneas emitidas.
          </div>
        )}
        {tabActivo === 'emitida' && emitidas.map(linea => {
          const { cliente, entidad, servicio } = lookup(linea)
          return (
            <CardEmitida
              key={linea.id}
              linea={linea}
              cliente={cliente}
              entidad={entidad}
              servicio={servicio}
              onVerDetalle={setDrawerLinea}
              onEnviar={enviarLinea}
            />
          )
        })}

        {tabActivo === 'enviada' && enviadas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', opacity: .4, fontSize: '14px' }}>
            No hay líneas enviadas.
          </div>
        )}
        {tabActivo === 'enviada' && enviadas.map(linea => {
          const { cliente, entidad, servicio } = lookup(linea)
          return (
            <CardEnviada
              key={linea.id}
              linea={linea}
              cliente={cliente}
              entidad={entidad}
              servicio={servicio}
              onVerDetalle={setDrawerLinea}
            />
          )
        })}
      </div>

      {/* Drawer */}
      {drawerLinea && (
        <DrawerFactura
          linea={drawerLinea}
          onClose={() => setDrawerLinea(null)}
          clientes={clientes}
          entidades={entidades}
          servicios={servicios}
        />
      )}

      {/* Modal Editar */}
      {lineaEditar && (
        <ModalEditarLinea
          linea={lineaEditar}
          onClose={() => setLineaEditar(null)}
          onGuardar={guardarEdicion}
          clientes={clientes}
          entidades={entidades}
          servicios={servicios}
          triggerRef={btnNuevaRef}
        />
      )}

    </div>
  )
}