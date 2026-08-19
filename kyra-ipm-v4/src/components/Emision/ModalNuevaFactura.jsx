// /src/components/Emision/ModalNuevaFactura.jsx
// Modal para registrar manualmente una nueva factura (3 secciones).
// Navegación entre secciones con flechas. Validación inline.

import { useState } from 'react'

const SECCIONES = ['CLIENTE / SERVICIO', 'IMPORTES', 'FACTURA']

const EMPTY = {
  clienteId:   '',
  servicioId:  '',
  entidadId:   '',
  tipoFactura: 'A',
  moneda:      'ARS',
  cantidadHoras: '',
  tarifaHora:  '',
  montoBase:   '',
  impuesto:    '',
  nroFactura:  '',
  fechaEmision:'',
  fechaVencimiento:'',
}

function Field({ label, children, error }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600,
        color:'var(--text-muted, #6b7280)', marginBottom:5, letterSpacing:'0.04em' }}>
        {label}
      </label>
      {children}
      {error && <div style={{ fontSize:11, color:'#dc2626', marginTop:3 }}>{error}</div>}
    </div>
  )
}

function Input({ value, onChange, type='text', placeholder, disabled }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width:'100%', boxSizing:'border-box',
        padding:'8px 11px', fontSize:13,
        border:'1px solid var(--border)', borderRadius:7,
        background: disabled ? 'var(--bg-page, #f8fafc)' : 'var(--bg-card, #fff)',
        color:'var(--text-primary, #111827)',
        outline:'none',
      }}
    />
  )
}

function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width:'100%', boxSizing:'border-box',
        padding:'8px 11px', fontSize:13,
        border:'1px solid var(--border)', borderRadius:7,
        background:'var(--bg-card, #fff)',
        color:'var(--text-primary, #111827)',
        outline:'none',
      }}
    >
      {children}
    </select>
  )
}

export default function ModalNuevaFactura({ clientes, servicios, entidades, onGuardar, onClose }) {
  const [form, setForm]         = useState(EMPTY)
  const [seccion, setSeccion]   = useState(0)
  const [errors, setErrors]     = useState({})
  const [submitted, setSubmitted] = useState(false)

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    if (submitted) setErrors(e => ({ ...e, [key]: undefined }))
  }

  // Calcula importe neto según modo horas o monto base
  const importeNeto = form.cantidadHoras && form.tarifaHora
    ? Number(form.cantidadHoras) * Number(form.tarifaHora)
    : Number(form.montoBase) || 0
  const impuesto    = Number(form.impuesto) || 0
  const importeBruto = importeNeto + impuesto

  function validar() {
    const e = {}
    if (!form.clienteId)    e.clienteId   = 'Requerido'
    if (!form.servicioId)   e.servicioId  = 'Requerido'
    if (!form.entidadId)    e.entidadId   = 'Requerido'
    if (!form.tipoFactura)  e.tipoFactura = 'Requerido'
    if (!form.moneda)       e.moneda      = 'Requerido'
    if (!importeNeto)       e.montoBase   = 'Ingresá monto base o horas + tarifa'
    return e
  }

  function handleGuardar() {
    setSubmitted(true)
    const e = validar()
    if (Object.keys(e).length) { setErrors(e); return }

    onGuardar({
      clienteId:    Number(form.clienteId),
      servicioId:   Number(form.servicioId),
      entidadId:    Number(form.entidadId),
      tipoFactura:  form.tipoFactura,
      moneda:       form.moneda,
      cantidadHoras: form.cantidadHoras ? Number(form.cantidadHoras) : null,
      tarifaHora:   form.tarifaHora ? Number(form.tarifaHora) : null,
      montoBase:    form.montoBase ? Number(form.montoBase) : null,
      importeNeto,
      impuesto,
      importeBruto,
      nroFactura:   form.nroFactura || null,
      fechaEmision: form.fechaEmision || null,
      fechaVencimiento: form.fechaVencimiento || null,
      status:       form.nroFactura ? 'emitida' : 'aprobada',
      alertas:      [],
      mes:          'agosto',
      anio:         2026,
    })
  }

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300 }} />

      {/* Modal */}
      <div style={{
        position:'fixed', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)',
        width:520, maxHeight:'90vh',
        background:'var(--bg-card, #fff)', borderRadius:12,
        boxShadow:'0 20px 60px rgba(0,0,0,0.2)',
        zIndex:301, display:'flex', flexDirection:'column',
        overflow:'hidden',
      }}>

        {/* Header */}
        <div style={{ padding:'18px 24px 14px', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <h2 style={{ margin:0, fontSize:16, fontWeight:700 }}>Nueva factura</h2>
            <p style={{ margin:'2px 0 0', fontSize:12, color:'var(--text-muted, #6b7280)' }}>
              Agosto 2026
            </p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer',
            color:'var(--text-muted, #6b7280)', padding:4, borderRadius:6,
            display:'flex', alignItems:'center' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs de sección */}
        <div style={{ display:'flex', padding:'0 24px', borderBottom:'1px solid var(--border)',
          flexShrink:0 }}>
          {SECCIONES.map((s, i) => (
            <button
              key={i}
              onClick={() => setSeccion(i)}
              style={{
                background:'none', border:'none', cursor:'pointer',
                padding:'10px 14px', fontSize:11, fontWeight:700,
                letterSpacing:'0.05em',
                color: seccion === i ? 'var(--color-cta, #2563eb)' : 'var(--text-muted, #6b7280)',
                borderBottom: seccion === i ? '2px solid var(--color-cta, #2563eb)' : '2px solid transparent',
                marginBottom:'-1px',
              }}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>

        {/* Cuerpo scrollable */}
        <div style={{ padding:'20px 24px', overflowY:'auto', flex:1 }}>

          {/* SECCIÓN 0: Cliente / Servicio */}
          {seccion === 0 && (
            <>
              <Field label="Cliente *" error={errors.clienteId}>
                <Select value={form.clienteId} onChange={v => set('clienteId', v)}>
                  <option value="">— Seleccioná —</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </Select>
              </Field>

              <Field label="Servicio *" error={errors.servicioId}>
                <Select value={form.servicioId} onChange={v => set('servicioId', v)}>
                  <option value="">— Seleccioná —</option>
                  {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </Select>
              </Field>

              <Field label="Entidad emisora *" error={errors.entidadId}>
                <Select value={form.entidadId} onChange={v => set('entidadId', v)}>
                  <option value="">— Seleccioná —</option>
                  {entidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </Select>
              </Field>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Field label="Tipo factura *" error={errors.tipoFactura}>
                  <Select value={form.tipoFactura} onChange={v => set('tipoFactura', v)}>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="LLC">LLC</option>
                    <option value="S">S/F</option>
                  </Select>
                </Field>

                <Field label="Moneda *" error={errors.moneda}>
                  <Select value={form.moneda} onChange={v => set('moneda', v)}>
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </Select>
                </Field>
              </div>
            </>
          )}

          {/* SECCIÓN 1: Importes */}
          {seccion === 1 && (
            <>
              <p style={{ margin:'0 0 16px', fontSize:13, color:'var(--text-muted, #6b7280)' }}>
                Ingresá monto base <strong>o</strong> horas + tarifa (no ambos).
              </p>

              <Field label="Monto base" error={errors.montoBase}>
                <Input
                  type="number" value={form.montoBase}
                  onChange={v => set('montoBase', v)}
                  placeholder="ej. 320000"
                  disabled={!!form.cantidadHoras}
                />
              </Field>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Field label="Horas">
                  <Input
                    type="number" value={form.cantidadHoras}
                    onChange={v => set('cantidadHoras', v)}
                    placeholder="ej. 3"
                    disabled={!!form.montoBase}
                  />
                </Field>
                <Field label="Tarifa / hora">
                  <Input
                    type="number" value={form.tarifaHora}
                    onChange={v => set('tarifaHora', v)}
                    placeholder="ej. 22840"
                    disabled={!!form.montoBase}
                  />
                </Field>
              </div>

              <Field label="Impuesto">
                <Input
                  type="number" value={form.impuesto}
                  onChange={v => set('impuesto', v)}
                  placeholder="ej. 67200"
                />
              </Field>

              {importeNeto > 0 && (
                <div style={{ marginTop:12, padding:'12px 14px', borderRadius:8,
                  background:'var(--bg-page, #f8fafc)', border:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13,
                    color:'var(--text-muted, #6b7280)', marginBottom:4 }}>
                    <span>Importe neto</span>
                    <span>{form.moneda === 'USD'
                      ? `USD ${importeNeto.toLocaleString('es-AR', { minimumFractionDigits:2 })}`
                      : `$ ${importeNeto.toLocaleString('es-AR')}`}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:14,
                    fontWeight:700, color:'var(--text-primary, #111827)' }}>
                    <span>Total bruto</span>
                    <span>{form.moneda === 'USD'
                      ? `USD ${importeBruto.toLocaleString('es-AR', { minimumFractionDigits:2 })}`
                      : `$ ${importeBruto.toLocaleString('es-AR')}`}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* SECCIÓN 2: Factura (opcional, si ya fue emitida externamente) */}
          {seccion === 2 && (
            <>
              <p style={{ margin:'0 0 16px', fontSize:13, color:'var(--text-muted, #6b7280)' }}>
                Opcional — completá si la factura ya fue emitida fuera del sistema.
              </p>

              <Field label="Número de factura">
                <Input
                  value={form.nroFactura}
                  onChange={v => set('nroFactura', v)}
                  placeholder="ej. 0001-00000132"
                />
              </Field>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Field label="Fecha emisión">
                  <Input
                    type="date" value={form.fechaEmision}
                    onChange={v => set('fechaEmision', v)}
                  />
                </Field>
                <Field label="Fecha vencimiento">
                  <Input
                    type="date" value={form.fechaVencimiento}
                    onChange={v => set('fechaVencimiento', v)}
                  />
                </Field>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)',
          display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>

          {/* Flechas de navegación */}
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={() => setSeccion(s => Math.max(0, s - 1))}
              disabled={seccion === 0}
              style={{ background:'none', border:'1px solid var(--border)', borderRadius:6,
                padding:'6px 12px', cursor: seccion === 0 ? 'not-allowed' : 'pointer',
                color: seccion === 0 ? 'var(--border)' : 'var(--text-primary, #111827)',
                fontSize:13 }}
            >
              ← Anterior
            </button>
            <button
              onClick={() => setSeccion(s => Math.min(2, s + 1))}
              disabled={seccion === 2}
              style={{ background:'none', border:'1px solid var(--border)', borderRadius:6,
                padding:'6px 12px', cursor: seccion === 2 ? 'not-allowed' : 'pointer',
                color: seccion === 2 ? 'var(--border)' : 'var(--text-primary, #111827)',
                fontSize:13 }}
            >
              Siguiente →
            </button>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ background:'none', border:'1px solid var(--border)',
              borderRadius:6, padding:'8px 16px', fontSize:13, cursor:'pointer',
              color:'var(--text-primary, #111827)' }}>
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              style={{ background:'var(--color-cta, #2563eb)', color:'#fff',
                border:'none', borderRadius:6, padding:'8px 20px',
                fontSize:13, fontWeight:600, cursor:'pointer' }}
            >
              Guardar factura
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
