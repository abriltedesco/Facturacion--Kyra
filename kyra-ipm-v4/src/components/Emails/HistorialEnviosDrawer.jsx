// /src/components/Emails/HistorialEnviosDrawer.jsx
// Drawer lateral que muestra el historial de envíos de email para una línea de facturación.
// Se abre desde FacturacionMes al hacer click en el badge de email de una línea emitida.
// Lee el historial de HISTORIAL_INICIAL (mismo data source que la página Emails).

import { useState } from 'react'
import BadgeEstadoEnvio from './BadgeEstadoEnvio'

// ── Icons ─────────────────────────────────────────────────────────────────────
const IcoMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const IcoSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

const IcoWarn = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatFecha(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * @param {Object}   props
 * @param {Object}   props.linea            — la línea de facturación (del context)
 * @param {Array}    props.historial         — array completo de HISTORIAL_INICIAL + nuevos registros
 * @param {Function} props.onClose
 * @param {Function} props.onReenviar       — (lineaId) => void — lanzar reenvío manual
 */
export default function HistorialEnviosDrawer({ linea, historial, onClose, onReenviar }) {
  const [reenvioConfirmado, setReenvioConfirmado] = useState(false)

  if (!linea) return null

  // Filtrar historial de esta línea (por lineaFacturacionId o por nroFactura)
  const registros = (historial || []).filter(h =>
    h.lineaFacturacionId === linea.id || h.nroFactura === linea.nroFactura
  )

  const ultimoEnvio  = registros.find(r => r.estado === 'enviado')
  const tieneError   = registros.some(r => r.estado === 'error')
  const esSF         = linea.tipoFactura === 'S' || linea.tipoFactura === 'F'

  function handleReenviar() {
    setReenvioConfirmado(true)
    onReenviar?.(linea.id)
    setTimeout(() => setReenvioConfirmado(false), 3000)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
          zIndex: 299, backdropFilter: 'blur(1px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, maxWidth: '95vw',
        background: 'var(--bg-card, #fff)', zIndex: 300, overflowY: 'auto',
        boxShadow: '-4px 0 24px rgba(0,0,0,.12)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border, #e5e7eb)',
          position: 'sticky', top: 0, background: 'var(--bg-card, #fff)', zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', opacity: .45 }}>
              Historial de emails
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
              {linea.nroFactura || 'Factura sin nro.'}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1, opacity: .5, padding: '4px 8px' }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>

          {/* Resumen de estado email actual */}
          <div style={{
            background: 'var(--bg-page, #f9fafb)',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 10, padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IcoMail />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Estado de envío</div>
                {ultimoEnvio && (
                  <div style={{ fontSize: 11, opacity: .55, marginTop: 2 }}>
                    Último envío: {formatFecha(ultimoEnvio.fechaEnvio)}
                  </div>
                )}
              </div>
            </div>
            <BadgeEstadoEnvio
              estado={
                esSF ? 'na'
                : linea.emailEstado || (registros.length === 0 ? 'pendiente' : ultimoEnvio ? 'enviado' : 'error')
              }
              size="md"
            />
          </div>

          {/* Acción de reenvío */}
          {!esSF && (
            <button
              onClick={handleReenviar}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '10px 16px', borderRadius: 8,
                background: reenvioConfirmado ? 'rgba(34,197,94,.1)' : 'var(--color-cta, #2563eb)',
                color: reenvioConfirmado ? '#16a34a' : '#fff',
                border: reenvioConfirmado ? '1px solid rgba(34,197,94,.3)' : 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                transition: 'all .2s',
              }}
            >
              {reenvioConfirmado
                ? <><span>✓</span> Email en cola de envío</>
                : <><IcoSend /> Reenviar email ahora</>}
            </button>
          )}

          {/* Sin envío S/F */}
          {esSF && (
            <div style={{
              padding: '12px 14px', borderRadius: 8,
              background: 'rgba(160,160,160,.08)',
              border: '1px solid rgba(160,160,160,.2)',
              fontSize: 13, color: 'var(--text-muted, #6b7280)',
            }}>
              Las facturas S/F no generan envío de email.
            </div>
          )}

          {/* Timeline de envíos */}
          <div>
            <div style={{
              fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '.06em', opacity: .45, marginBottom: 12,
            }}>
              {registros.length === 0 ? 'Sin envíos registrados' : `${registros.length} intento${registros.length !== 1 ? 's' : ''} de envío`}
            </div>

            {registros.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '24px 0',
                color: 'var(--text-muted, #6b7280)', fontSize: 13,
              }}>
                Esta factura no tiene registros de envío todavía.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...registros].reverse().map((r, i) => (
                  <div
                    key={r.id}
                    style={{
                      padding: '14px 16px', borderRadius: 10,
                      background: r.estado === 'error'
                        ? 'rgba(239,68,68,.04)'
                        : r.estado === 'enviado'
                          ? 'rgba(34,197,94,.04)'
                          : 'rgba(245,158,11,.04)',
                      border: `1px solid ${
                        r.estado === 'error' ? 'rgba(239,68,68,.15)'
                        : r.estado === 'enviado' ? 'rgba(34,197,94,.15)'
                        : 'rgba(245,158,11,.15)'}`,
                      display: 'flex', flexDirection: 'column', gap: 8,
                    }}
                  >
                    {/* Primera línea: fecha + badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, opacity: .7 }}>
                        {formatFecha(r.fechaEnvio)}
                        {r.intentos > 1 && (
                          <span style={{ marginLeft: 6, fontSize: 11, opacity: .5 }}>
                            (intento {r.intentos})
                          </span>
                        )}
                      </div>
                      <BadgeEstadoEnvio estado={r.estado} size="sm" />
                    </div>

                    {/* Destinatario */}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      <strong style={{ opacity: .6 }}>Para:</strong> {r.emailDestino}
                      {r.ccs?.length > 0 && (
                        <span style={{ opacity: .6 }}> · CC: {r.ccs.join(', ')}</span>
                      )}
                    </div>

                    {/* Asunto */}
                    {r.asuntoEnviado && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        "{r.asuntoEnviado}"
                      </div>
                    )}

                    {/* Adjunto */}
                    {r.archivoAdjunto && (
                      <div style={{ fontSize: 11, opacity: .55 }}>
                        📎 {r.archivoAdjunto}
                      </div>
                    )}

                    {/* Cuerpo del email enviado */}
                    {r.estado === 'enviado' && r.cuerpoEnviado && (
                      <details style={{ marginTop: 4 }}>
                        <summary style={{
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          color: 'var(--color-cta, #2563eb)', userSelect: 'none',
                          listStyle: 'none', display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          ▸ Ver email enviado
                        </summary>
                        <div style={{
                          marginTop: 8, padding: '12px 14px',
                          background: 'var(--bg-page, #f9fafb)',
                          border: '1px solid var(--border, #e5e7eb)',
                          borderRadius: 8, fontSize: 12,
                          whiteSpace: 'pre-wrap', lineHeight: 1.6,
                          color: 'var(--text-primary, #111)',
                          fontFamily: 'inherit',
                        }}>
                          {r.cuerpoEnviado}
                        </div>
                      </details>
                    )}

                    {/* Error */}
                    {r.estado === 'error' && r.errorMensaje && (
                      <div style={{
                        display: 'flex', gap: 6, alignItems: 'flex-start',
                        marginTop: 4, padding: '8px 10px',
                        background: 'rgba(239,68,68,.08)', borderRadius: 6,
                        fontSize: 12, color: '#dc2626',
                      }}>
                        <IcoWarn style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>{r.errorMensaje}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
