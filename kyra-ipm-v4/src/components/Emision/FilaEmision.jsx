// /src/components/Emision/FilaEmision.jsx
// Fila de tabla para el módulo de emisión.
// Adapta su UI según el status de la línea.

import BadgeTipoFactura from './BadgeTipoFactura'
import EstadoEmision    from './EstadoEmision'
import { getEmissionWarnings } from '../../domain/emissionWarnings'

function fmtARS(n) {
  if (n == null) return '—'
  return `$ ${Number(n).toLocaleString('es-AR')}`
}
function fmtUSD(n) {
  if (n == null) return '—'
  return `USD ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
}
function fmtMonto(n, moneda) {
  return moneda === 'USD' ? fmtUSD(n) : fmtARS(n)
}

// Spinner SVG inline
function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      style={{ animation:'spin 0.8s linear infinite', flexShrink:0 }}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}

export default function FilaEmision({
  linea, cliente, servicio, entidad,
  onEmitir, onReintentar, onVerDetalle,
}) {
  const moneda    = linea.moneda || 'ARS'
  const emitiendo = linea.status === 'emitiendo'
  const esError   = linea.status === 'error_emision'
  const emitida   = linea.status === 'emitida'
  const warnings  = getEmissionWarnings({ entity: entidad, voucherType: linea.tipoFactura, currency: moneda })

  const tdBase = {
    padding:    '12px 14px',
    fontSize:   13,
    color:      'var(--text-primary, #111827)',
    verticalAlign: 'middle',
    borderBottom: '1px solid var(--border)',
    background: emitiendo ? 'rgba(251,191,36,0.06)' : 'transparent',
    transition: 'background 0.3s',
  }

  return (
    <tr style={{ opacity: emitiendo ? 0.85 : 1 }}>

      {/* Cliente */}
      <td style={tdBase}>
        <div style={{ fontWeight:600, marginBottom:1 }}>
          {cliente?.nombre || `Cliente ${linea.clienteId}`}
        </div>
        <div style={{ fontSize:11, color:'var(--text-muted, #6b7280)' }}>
          {entidad?.name || `Entidad ${linea.entidadId}`}
        </div>
        {warnings.length > 0 && (
          <span className="emission-warning-count" title={warnings.map(warning => warning.message).join('\n')}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {warnings.length} {warnings.length === 1 ? 'advertencia' : 'advertencias'}
          </span>
        )}
      </td>

      {/* Tipo */}
      <td style={tdBase}>
        <BadgeTipoFactura tipo={linea.tipoFactura} />
      </td>

      {/* Servicio */}
      <td style={tdBase}>
        <span>{servicio?.nombre || `Servicio ${linea.servicioId}`}</span>
        {linea.cantidadHoras && (
          <div style={{ fontSize:11, color:'var(--text-muted, #6b7280)' }}>
            {linea.cantidadHoras} hs × {fmtMonto(linea.tarifaHora, moneda)}
          </div>
        )}
      </td>

      {/* Importe */}
      <td style={{ ...tdBase, fontWeight:700, textAlign:'right' }}>
        {fmtMonto(linea.importeNeto, moneda)}
        {linea.impuesto > 0 && (
          <div style={{ fontSize:11, fontWeight:400, color:'var(--text-muted, #6b7280)' }}>
            + {fmtMonto(linea.impuesto, moneda)} imp.
          </div>
        )}
      </td>

      {/* Estado */}
      <td style={{ ...tdBase, whiteSpace:'nowrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {emitiendo && <Spinner />}
          <EstadoEmision status={linea.status} />
        </div>
        {emitida && linea.nroFactura && (
          <button
            onClick={() => onVerDetalle(linea)}
            style={{ marginTop:4, fontSize:11, color:'var(--color-cta, #2563eb)',
              background:'none', border:'none', cursor:'pointer', padding:0,
              textDecoration:'underline', fontFamily:'monospace' }}
          >
            {linea.nroFactura}
          </button>
        )}
        {esError && linea.errorCodigo && (
          <div style={{ marginTop:3, fontSize:11, color:'#991b1b' }}>
            {linea.errorCodigo}
          </div>
        )}
      </td>

      {/* Acciones */}
      <td style={{ ...tdBase, textAlign:'right', whiteSpace:'nowrap' }}>

        {/* Ver detalle — siempre disponible si hay algo que mostrar */}
        {(emitida || esError) && (
          <button
            onClick={() => onVerDetalle(linea)}
            style={{ background:'none', border:'1px solid var(--border)', borderRadius:6,
              padding:'5px 11px', fontSize:12, cursor:'pointer', marginRight:6,
              color:'var(--text-primary, #111827)' }}
          >
            Ver detalle
          </button>
        )}

        {/* Emitir — solo si aprobada */}
        {linea.status === 'aprobada' && (
          <button
            onClick={() => onEmitir(linea)}
            style={{ background:'var(--color-cta, #2563eb)', color:'#fff',
              border:'none', borderRadius:6, padding:'5px 14px',
              fontSize:12, fontWeight:600, cursor:'pointer' }}
          >
            Emitir
          </button>
        )}

        {/* Emitiendo — deshabilitado */}
        {emitiendo && (
          <button disabled style={{ background:'var(--border, #e5e7eb)', color:'#9ca3af',
            border:'none', borderRadius:6, padding:'5px 14px',
            fontSize:12, fontWeight:600, cursor:'not-allowed' }}>
            Emitiendo…
          </button>
        )}

        {/* Reintentar — si error */}
        {esError && (
          <button
            onClick={() => onReintentar(linea)}
            style={{ background:'#fee2e2', color:'#991b1b',
              border:'1px solid #fca5a5', borderRadius:6, padding:'5px 12px',
              fontSize:12, fontWeight:600, cursor:'pointer' }}
          >
            Reintentar
          </button>
        )}
      </td>
    </tr>
  )
}
