// /src/pages/EmisionPage.jsx
// Módulo 6 — Generación de Facturas.
// Solo frontend. Cero backend. Todos los datos son mock.
// Módulo 8 integrado: auto-envío de email tras emisión exitosa.

import { useState, useRef } from 'react'
import { useFacturacion } from '../context/FacturacionContext'

import { CLIENTES_INICIAL } from '../data/clientes'
import { SERVICIOS_INICIAL } from '../data/servicios'
import { ENTIDADES_INICIAL } from '../data/entidades'
import {
  CONTADORES_INICIAL,
  claveContador,
  generarNroFactura,
} from '../data/contadoresFactura'
import { CONFIG_EMAIL_INICIAL } from '../data/configEnvioEmail'
import { PLANTILLAS_INICIAL } from '../data/plantillasEmail'
import { emitirEnARCA }   from '../utils/emisionARCA'
import { generarPDFllc }  from '../utils/generarPDFllc'
import { enviarEmailFactura, construirRegistroHistorial } from '../utils/envioEmailMock'

import TablaEmision       from '../components/Emision/TablaEmision'
import DrawerFacturaDetalle from '../components/Emision/DrawerFacturaDetalle'
import ModalNuevaFactura  from '../components/Emision/ModalNuevaFactura'

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background:'var(--bg-card, #fff)', border:'1px solid var(--border)',
      borderRadius:10, padding:'18px 22px', minWidth:140,
    }}>
      <div style={{ fontSize:28, fontWeight:800, color: color || 'var(--text-primary, #111827)',
        lineHeight:1.1 }}>
        {value}
      </div>
      <div style={{ fontSize:12, color:'var(--text-muted, #6b7280)', marginTop:4 }}>
        {label}
      </div>
    </div>
  )
}

const FILTROS = [
  { key:'todas',         label:'Todas' },
  { key:'aprobada',     label:'Por emitir' },
  { key:'emitiendo',   label:'Emitiendo' },
  { key:'emitida',     label:'Emitidas' },
  { key:'error_emision', label:'Con error' },
]

export default function EmisionPage() {
  const { lineas, setLineas } = useFacturacion()
  const contadoresRef                     = useRef({ ...CONTADORES_INICIAL })
  const historialEmailRef                 = useRef([])        // local historial de emails de esta sesión
  const [emitirTodoActivo, setEmitirTodoActivo] = useState(false)
  const [summaryBanner, setSummaryBanner] = useState(null)
  const [drawerLinea, setDrawerLinea]   = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [showNueva, setShowNueva]       = useState(false)

  // ── helpers ────────────────────────────────────────────────────────────────

  function getCliente(id)  { return CLIENTES_INICIAL.find(c => c.id === id) }
  function getServicio(id) { return SERVICIOS_INICIAL.find(s => s.id === id) }
  function getEntidad(id)  { return ENTIDADES_INICIAL.find(e => e.id === id) }

  function setLineaStatus(id, patch) {
    setLineas(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
  }

  function siguienteNro(tipoFactura, entidadId) {
    const clave = claveContador(tipoFactura, entidadId)
    contadoresRef.current[clave] += 1
    return generarNroFactura(contadoresRef.current[clave], tipoFactura, entidadId)
  }

  // ── Auto-envío de email tras emisión exitosa ───────────────────────────────
  // Se llama con la linea ya emitida (tiene nroFactura, fechaEmision, etc.)
  // Si el cliente o la config global tienen auto-envío desactivado → no hace nada.

  async function intentarEnvioEmail(lineaEmitida) {
    const cliente = getCliente(lineaEmitida.clienteId)

    // S/F → sin envío
    if (lineaEmitida.tipoFactura === 'S' || lineaEmitida.tipoFactura === 'F') return

    // Sin email → sin_email en el estado
    if (!cliente?.emailConfig?.emailPrincipal && !cliente?.email) {
      setLineaStatus(lineaEmitida.id, { emailEstado: 'sin_email' })
      return
    }

    // Respetar toggles de auto-envío
    const globalOn = CONFIG_EMAIL_INICIAL.envioAutomaticoGlobal
    const clienteOn = cliente?.emailConfig?.envioAutomatico !== false
    if (!globalOn || !clienteOn) {
      setLineaStatus(lineaEmitida.id, { emailEstado: 'pendiente' })
      return
    }

    // Plantilla del cliente (o default)
    const plantillaId = cliente?.emailConfig?.plantillaId || CONFIG_EMAIL_INICIAL.plantillaDefaultId
    const plantilla = PLANTILLAS_INICIAL.find(p => p.id === plantillaId) || PLANTILLAS_INICIAL[0]
    const servicio  = getServicio(lineaEmitida.servicioId)

    // Marcar como enviando
    setLineaStatus(lineaEmitida.id, { emailEstado: 'enviando' })

    const resultado = await enviarEmailFactura({
      lineaFacturacion: lineaEmitida,
      cliente,
      servicio,
      plantilla,
      config: CONFIG_EMAIL_INICIAL,
    })

    // Guardar en historial local de la sesión
    const nextId = historialEmailRef.current.length + 1000
    const registro = construirRegistroHistorial(resultado, lineaEmitida, nextId)
    historialEmailRef.current = [registro, ...historialEmailRef.current]

    // Actualizar estado en la linea
    setLineaStatus(lineaEmitida.id, {
      emailEstado:   resultado.success ? 'enviado' : 'error',
      emailError:    resultado.success ? null : resultado.errorMensaje,
      emailFechaEnvio: resultado.success ? resultado.fechaEnvio : null,
    })
  }

  // ── emisión individual ─────────────────────────────────────────────────────

  async function emitirLinea(linea) {
    const nro = siguienteNro(linea.tipoFactura, linea.entidadId)

    setLineaStatus(linea.id, { status: 'emitiendo', nroFactura: null })

    try {
      if (linea.tipoFactura === 'LLC') {
        const cliente  = getCliente(linea.clienteId)
        const servicio = getServicio(linea.servicioId)
        const pdfUri   = generarPDFllc({ linea, cliente, servicio, nroInvoice: nro })

        const hoy = new Date()
        const fechaEmision = hoy.toISOString().split('T')[0]
        const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
        const fechaVencimiento = ultimoDia.toISOString().split('T')[0]

        const lineaEmitida = {
          ...linea, status: 'emitida', nroFactura: nro,
          fechaEmision, fechaVencimiento, pdfBlob: pdfUri,
          errorCodigo: null, errorMensaje: null,
        }
        setLineaStatus(linea.id, lineaEmitida)
        intentarEnvioEmail(lineaEmitida)

      } else if (linea.tipoFactura === 'S' || linea.tipoFactura === 'F') {
        const hoy = new Date().toISOString().split('T')[0]
        const lineaEmitida = {
          ...linea, status: 'emitida', nroFactura: nro,
          fechaEmision: hoy, fechaVencimiento: hoy,
          errorCodigo: null, errorMensaje: null,
          emailEstado: 'na',
        }
        setLineaStatus(linea.id, lineaEmitida)

      } else {
        // ARCA async mock (A, B, C)
        const resultado = await emitirEnARCA(linea, nro)

        if (resultado.success) {
          const lineaEmitida = {
            ...linea, status: 'emitida',
            nroFactura:      resultado.nroFactura,
            fechaEmision:    resultado.fechaEmision,
            fechaVencimiento:resultado.fechaVencimiento,
            cae:             resultado.cae,
            fechaVencimientoCAE: resultado.fechaVencimientoCAE,
            errorCodigo: null, errorMensaje: null,
          }
          setLineaStatus(linea.id, lineaEmitida)
          intentarEnvioEmail(lineaEmitida)
        } else {
          const clave = claveContador(linea.tipoFactura, linea.entidadId)
          contadoresRef.current[clave] -= 1
          setLineaStatus(linea.id, {
            status:       'error_emision',
            errorCodigo:  resultado.codigo,
            errorMensaje: resultado.mensaje,
          })
        }
      }
    } catch (err) {
      const clave = claveContador(linea.tipoFactura, linea.entidadId)
      contadoresRef.current[clave] -= 1
      setLineaStatus(linea.id, {
        status:       'error_emision',
        errorCodigo:  'JS-ERROR',
        errorMensaje: err?.message || 'Error inesperado.',
      })
    }
  }

  // ── Emitir todo ────────────────────────────────────────────────────────────

  async function handleEmitirTodo() {
    const candidatas = lineas.filter(l => l.status === 'aprobada')
    if (!candidatas.length) return

    setEmitirTodoActivo(true)
    setSummaryBanner(null)

    let emitidas = 0
    let errores  = 0

    for (const linea of candidatas) {
      const nro = siguienteNro(linea.tipoFactura, linea.entidadId)
      setLineaStatus(linea.id, { status: 'emitiendo', nroFactura: null })

      try {
        if (linea.tipoFactura === 'LLC') {
          const cliente  = getCliente(linea.clienteId)
          const servicio = getServicio(linea.servicioId)
          const pdfUri   = generarPDFllc({ linea, cliente, servicio, nroInvoice: nro })

          const hoy = new Date()
          const fechaEmision = hoy.toISOString().split('T')[0]
          const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
          const fechaVencimiento = ultimoDia.toISOString().split('T')[0]

          const lineaEmitida = {
            ...linea, status:'emitida', nroFactura:nro,
            fechaEmision, fechaVencimiento, pdfBlob:pdfUri,
            errorCodigo:null, errorMensaje:null,
          }
          setLineaStatus(linea.id, lineaEmitida)
          intentarEnvioEmail(lineaEmitida)
          emitidas++

        } else if (linea.tipoFactura === 'S' || linea.tipoFactura === 'F') {
          const hoy = new Date().toISOString().split('T')[0]
          setLineaStatus(linea.id, {
            status:'emitida', nroFactura:nro,
            fechaEmision:hoy, fechaVencimiento:hoy,
            errorCodigo:null, errorMensaje:null,
            emailEstado: 'na',
          })
          emitidas++

        } else {
          const resultado = await emitirEnARCA(linea, nro)
          if (resultado.success) {
            const lineaEmitida = {
              ...linea, status:'emitida',
              nroFactura:resultado.nroFactura,
              fechaEmision:resultado.fechaEmision,
              fechaVencimiento:resultado.fechaVencimiento,
              cae:resultado.cae,
              fechaVencimientoCAE:resultado.fechaVencimientoCAE,
              errorCodigo:null, errorMensaje:null,
            }
            setLineaStatus(linea.id, lineaEmitida)
            intentarEnvioEmail(lineaEmitida)
            emitidas++
          } else {
            const clave = claveContador(linea.tipoFactura, linea.entidadId)
            contadoresRef.current[clave] -= 1
            setLineaStatus(linea.id, {
              status:'error_emision',
              errorCodigo:resultado.codigo, errorMensaje:resultado.mensaje,
            })
            errores++
          }
        }
      } catch (err) {
        const clave = claveContador(linea.tipoFactura, linea.entidadId)
        contadoresRef.current[clave] -= 1
        setLineaStatus(linea.id, {
          status:'error_emision',
          errorCodigo:'JS-ERROR', errorMensaje:err?.message || 'Error inesperado.',
        })
        errores++
      }
    }

    setEmitirTodoActivo(false)
    setSummaryBanner({ emitidas, errores })
  }

  // ── Reintentar ─────────────────────────────────────────────────────────────

  async function handleReintentar(linea) {
    setLineaStatus(linea.id, {
      status: 'aprobada', nroFactura: null,
      errorCodigo: null, errorMensaje: null,
    })
    setTimeout(() => emitirLinea(linea), 100)
  }

  // ── Nueva factura manual ───────────────────────────────────────────────────

  function handleNuevaFactura(datos) {
    const nueva = {
      id:            Date.now(),
      mes:           'agosto',
      anio:          2026,
      ajusteIPCPendiente: false,
      alertas:       [],
      variacionVsMesAnterior: null,
      ...datos,
      errorCodigo:   null,
      errorMensaje:  null,
      pdfBlob:       null,
      emailEstado:   null,
    }
    setLineas(prev => [nueva, ...prev])
    setShowNueva(false)
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const porEmitir  = lineas.filter(l => l.status === 'aprobada').length
  const emitidas   = lineas.filter(l => l.status === 'emitida').length
  const emitiendo  = lineas.filter(l => l.status === 'emitiendo').length
  const conError   = lineas.filter(l => l.status === 'error_emision').length

  const lineasFiltradas = filtroEstado === 'todas'
    ? lineas
    : lineas.filter(l => l.status === filtroEstado)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding:'28px 32px', maxWidth:1100 }}>

      {/* Título */}
      <div style={{ marginBottom:24, display:'flex', alignItems:'flex-start',
        justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:800,
            color:'var(--text-primary, #111827)' }}>
            Generación de Facturas
          </h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'var(--text-muted, #6b7280)' }}>
            Agosto 2026 · Facturación del mes
          </p>
        </div>

        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button
            onClick={() => setShowNueva(true)}
            style={{ background:'none', border:'1px solid var(--border)',
              borderRadius:7, padding:'8px 16px', fontSize:13,
              cursor:'pointer', color:'var(--text-primary, #111827)',
              display:'flex', alignItems:'center', gap:6 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Nueva factura
          </button>

          <button
            onClick={handleEmitirTodo}
            disabled={emitirTodoActivo || porEmitir === 0}
            style={{
              background: (emitirTodoActivo || porEmitir === 0)
                ? 'var(--border, #e5e7eb)' : 'var(--color-cta, #2563eb)',
              color: (emitirTodoActivo || porEmitir === 0) ? '#9ca3af' : '#fff',
              border:'none', borderRadius:7, padding:'9px 20px',
              fontSize:13, fontWeight:700, cursor:
                (emitirTodoActivo || porEmitir === 0) ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', gap:8,
              transition:'background 0.2s',
            }}
          >
            {emitirTodoActivo ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                  style={{ animation:'spin 0.8s linear infinite' }}>
                  <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                  <path d="M7 2a5 5 0 0 1 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Emitiendo…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Emitir todo ({porEmitir})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'flex', gap:14, marginBottom:24, flexWrap:'wrap' }}>
        <StatCard label="Por emitir"  value={porEmitir}  color="var(--color-cta, #2563eb)" />
        <StatCard label="Emitidas"    value={emitidas}   color="#15803d" />
        {emitiendo > 0 && (
          <StatCard label="Emitiendo"  value={emitiendo}  color="#92400e" />
        )}
        {conError > 0 && (
          <StatCard label="Con error"  value={conError}   color="#991b1b" />
        )}
      </div>

      {/* Banner post-emisión */}
      {summaryBanner && (
        <div style={{
          marginBottom:20, padding:'14px 18px', borderRadius:8,
          background: summaryBanner.errores === 0 ? '#dcfce7' : '#fef3c7',
          border: `1px solid ${summaryBanner.errores === 0 ? '#bbf7d0' : '#fde68a'}`,
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <span style={{ fontSize:14, fontWeight:600,
            color: summaryBanner.errores === 0 ? '#15803d' : '#92400e' }}>
            {summaryBanner.errores === 0
              ? `✓ ${summaryBanner.emitidas} factura${summaryBanner.emitidas !== 1 ? 's' : ''} emitida${summaryBanner.emitidas !== 1 ? 's' : ''} — enviando emails…`
              : `${summaryBanner.emitidas} emitidas · ${summaryBanner.errores} con error — revisá las filas marcadas en rojo.`}
          </span>
          <button onClick={() => setSummaryBanner(null)} style={{ background:'none',
            border:'none', cursor:'pointer', fontSize:16,
            color: summaryBanner.errores === 0 ? '#15803d' : '#92400e', padding:'0 4px' }}>
            ×
          </button>
        </div>
      )}

      {/* Filtros de tab */}
      <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid var(--border)' }}>
        {FILTROS.map(f => {
          const count = f.key === 'todas'
            ? lineas.length
            : lineas.filter(l => l.status === f.key).length
          const activo = filtroEstado === f.key
          return (
            <button
              key={f.key}
              onClick={() => setFiltroEstado(f.key)}
              style={{
                background:'none', border:'none', cursor:'pointer',
                padding:'8px 14px', fontSize:12, fontWeight:600,
                letterSpacing:'0.04em',
                color: activo ? 'var(--color-cta, #2563eb)' : 'var(--text-muted, #6b7280)',
                borderBottom: activo ? '2px solid var(--color-cta, #2563eb)' : '2px solid transparent',
                marginBottom:'-1px',
                display:'flex', alignItems:'center', gap:5,
              }}
            >
              {f.label}
              <span style={{
                background: activo ? 'var(--color-cta, #2563eb)' : 'var(--border, #e5e7eb)',
                color: activo ? '#fff' : 'var(--text-muted, #6b7280)',
                borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:700,
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tabla */}
      <div style={{ background:'var(--bg-card, #fff)', border:'1px solid var(--border)',
        borderRadius:10, overflow:'hidden' }}>
        <TablaEmision
          lineas={lineasFiltradas}
          clientes={CLIENTES_INICIAL}
          servicios={SERVICIOS_INICIAL}
          entidades={ENTIDADES_INICIAL}
          onEmitir={emitirLinea}
          onReintentar={handleReintentar}
          onVerDetalle={setDrawerLinea}
        />
      </div>

      {/* Drawer detalle */}
      {drawerLinea && (
        <DrawerFacturaDetalle
          linea={lineas.find(l => l.id === drawerLinea.id) || drawerLinea}
          cliente={getCliente(drawerLinea.clienteId)}
          servicio={getServicio(drawerLinea.servicioId)}
          entidad={getEntidad(drawerLinea.entidadId)}
          onClose={() => setDrawerLinea(null)}
        />
      )}

      {/* Modal nueva factura */}
      {showNueva && (
        <ModalNuevaFactura
          clientes={CLIENTES_INICIAL}
          servicios={SERVICIOS_INICIAL}
          entidades={ENTIDADES_INICIAL}
          onGuardar={handleNuevaFactura}
          onClose={() => setShowNueva(false)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
