// /src/components/Emision/DrawerFacturaDetalle.jsx
// Drawer derecho (480px) con el detalle completo de una factura emitida o en proceso.

import EstadoEmision from './EstadoEmision'
import BadgeTipoFactura from './BadgeTipoFactura'
import { generarPDFllc }  from '../../utils/generarPDFllc'
import { generarPDFafip } from '../../utils/generarPDFafip'

const MESES = {
  enero:'Enero', febrero:'Febrero', marzo:'Marzo', abril:'Abril',
  mayo:'Mayo', junio:'Junio', julio:'Julio', agosto:'Agosto',
  septiembre:'Septiembre', octubre:'Octubre', noviembre:'Noviembre', diciembre:'Diciembre',
}

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
function fmtFecha(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline',
      padding:'9px 0', borderBottom:'1px solid var(--border)', gap:12 }}>
      <span style={{ fontSize:13, color:'var(--text-muted, #6b7280)', flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:13, fontWeight: bold ? 700 : 400, color:'var(--text-primary, #111827)',
        textAlign:'right' }}>{value}</span>
    </div>
  )
}

function IcoDownload() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

export default function DrawerFacturaDetalle({ linea, cliente, servicio, entidad, onClose }) {
  if (!linea) return null

  const moneda = linea.moneda || 'ARS'
  const esLLC  = linea.tipoFactura === 'LLC'
  const emitida = linea.status === 'emitida'

  function handleDescargarPDF() {
    if (esLLC) {
      generarPDFllc({ linea, cliente, servicio, nroInvoice: linea.nroFactura })
    } else {
      generarPDFafip({ linea, cliente, servicio, entidad })
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.4)',
          zIndex:200, animation:'fadeIn 0.2s ease',
        }}
      />

      {/* Drawer */}
      <div style={{
        position:'fixed', top:0, right:0, width:480, height:'100vh',
        background:'var(--bg-card, #fff)', boxShadow:'-4px 0 24px rgba(0,0,0,0.12)',
        zIndex:201, display:'flex', flexDirection:'column',
        animation:'slideIn 0.25s ease',
        overflowY:'auto',
      }}>

        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <BadgeTipoFactura tipo={linea.tipoFactura} />
              <EstadoEmision status={linea.status} />
            </div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'var(--text-primary, #111827)' }}>
              {cliente?.nombre || `Cliente ${linea.clienteId}`}
            </h2>
            <p style={{ margin:'2px 0 0', fontSize:13, color:'var(--text-muted, #6b7280)' }}>
              {servicio?.nombre || `Servicio ${linea.servicioId}`} · {MESES[linea.mes]} {linea.anio}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background:'none', border:'none', cursor:'pointer', padding:6,
              color:'var(--text-muted, #6b7280)', borderRadius:6,
              display:'flex', alignItems:'center', justifyContent:'center' }}
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:'0 24px 24px', flex:1 }}>

          {/* Número de factura + botón PDF (si emitida) */}
          {linea.nroFactura && emitida && (
            <div style={{ margin:'20px 0 16px', padding:'14px 16px', borderRadius:8,
              background:'var(--bg-page, #f8fafc)', border:'1px solid var(--border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em',
                    color:'var(--text-muted, #6b7280)', marginBottom:4 }}>
                    {esLLC ? 'INVOICE NUMBER' : 'NRO. FACTURA'}
                  </div>
                  <div style={{ fontSize:20, fontWeight:800, color:'var(--text-primary, #111827)',
                    fontFamily:'monospace', letterSpacing:'0.02em' }}>
                    {linea.nroFactura}
                  </div>
                  {linea.fechaEmision && (
                    <div style={{ display:'flex', gap:20, marginTop:8 }}>
                      <span style={{ fontSize:12, color:'var(--text-muted, #6b7280)' }}>
                        Emisión: <strong>{fmtFecha(linea.fechaEmision)}</strong>
                      </span>
                      <span style={{ fontSize:12, color:'var(--text-muted, #6b7280)' }}>
                        Vto: <strong>{fmtFecha(linea.fechaVencimiento)}</strong>
                      </span>
                    </div>
                  )}
                  {linea.cae && (
                    <div style={{ marginTop:6, fontSize:11, color:'var(--text-muted, #6b7280)' }}>
                      CAE: <span style={{ fontFamily:'monospace' }}>{linea.cae}</span>
                    </div>
                  )}
                </div>

                {/* ── Botón Descargar PDF ── */}
                <button
                  onClick={handleDescargarPDF}
                  style={{
                    display:'flex', alignItems:'center', gap:6,
                    padding:'8px 14px', borderRadius:7, cursor:'pointer',
                    background:'var(--color-cta, #2563eb)', color:'#fff',
                    border:'none', fontSize:12, fontWeight:600,
                    flexShrink:0, marginLeft:12,
                  }}
                >
                  <IcoDownload />
                  {esLLC ? 'Descargar Invoice' : 'Descargar PDF'}
                </button>
              </div>
            </div>
          )}

          {/* Error (si error_emision) */}
          {linea.status === 'error_emision' && linea.errorMensaje && (
            <div style={{ margin:'20px 0 16px', padding:'14px 16px', borderRadius:8,
              background:'#fff1f2', border:'1px solid #fecaca' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#991b1b', marginBottom:4 }}>
                {linea.errorCodigo || 'ERROR'}
              </div>
              <div style={{ fontSize:13, color:'#7f1d1d' }}>{linea.errorMensaje}</div>
            </div>
          )}

          {/* Sección: Entidad emisora */}
          <div style={{ marginTop:20, marginBottom:4, fontSize:11, fontWeight:700,
            letterSpacing:'0.06em', color:'var(--text-muted, #6b7280)' }}>
            ENTIDAD EMISORA
          </div>
          <Row label="Entidad"       value={entidad?.nombre || `Entidad ${linea.entidadId}`} />
          <Row label="Tipo factura"  value={`Factura ${linea.tipoFactura}`} />
          <Row label="Moneda"        value={moneda} />

          {/* Sección: Importes */}
          <div style={{ marginTop:20, marginBottom:4, fontSize:11, fontWeight:700,
            letterSpacing:'0.06em', color:'var(--text-muted, #6b7280)' }}>
            IMPORTES
          </div>

          {linea.cantidadHoras && (
            <>
              <Row label="Horas"      value={`${linea.cantidadHoras} hs`} />
              <Row label="Tarifa/hora" value={fmtMonto(linea.tarifaHora, moneda)} />
            </>
          )}
          {!linea.cantidadHoras && linea.montoBase && (
            <Row label="Monto base"  value={fmtMonto(linea.montoBase, moneda)} />
          )}
          <Row label="Importe neto"  value={fmtMonto(linea.importeNeto, moneda)} />
          {linea.impuesto > 0 && (
            <Row label="Impuesto"    value={fmtMonto(linea.impuesto, moneda)} />
          )}
          <Row label="Total bruto"   value={fmtMonto(linea.importeBruto, moneda)} bold />

          {linea.ajusteIPCPendiente && (
            <div style={{ marginTop:12, padding:'10px 14px', borderRadius:6,
              background:'#fef9c3', border:'1px solid #fde68a', fontSize:12 }}>
              ⚠ Ajuste IPC pendiente ({linea.porcentajeIPC}%) — monto con IPC: {fmtMonto(linea.montoConIPC, moneda)}
            </div>
          )}

          {/* Sección: Cliente */}
          <div style={{ marginTop:20, marginBottom:4, fontSize:11, fontWeight:700,
            letterSpacing:'0.06em', color:'var(--text-muted, #6b7280)' }}>
            CLIENTE
          </div>
          <Row label="Nombre"  value={cliente?.nombre || '—'} />
          {cliente?.email && <Row label="Email" value={cliente.email} />}
          {cliente?.cuit  && <Row label="CUIT"  value={cliente.cuit} />}

        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  )
}
