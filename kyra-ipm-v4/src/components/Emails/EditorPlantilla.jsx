// /src/components/Emails/EditorPlantilla.jsx
// Editor de plantillas de email con:
//  - Inserción de {{variables}} en la posición del cursor
//  - Vista previa live con sustitución de variables de ejemplo
//  - Toolbar visual (formato básico — solo UI, sin rich text real)

import { useRef } from 'react'
import { VARIABLES_DISPONIBLES, renderizarTemplate } from '../../utils/renderizarTemplate'

// ── Variables de ejemplo para la preview ──────────────────────────────────────
const VARS_EJEMPLO = {
  nombre_cliente:    'Ayax',
  nombre_contacto:   'Administración Ayax',
  mes:               'Agosto',
  año:               '2026',
  anio:              '2026',
  nro_factura:       '0001-00000132',
  tipo_factura:      'Factura A',
  importe_bruto:     '$ 627.844',
  importe_neto:      '$ 518.880',
  fecha_vencimiento: '31 de agosto de 2026',
  servicio:          'Google Ads',
}

// ── Icons ────────────────────────────────────────────────────────────────────
const IcoInsert = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

/**
 * @param {Object}   props
 * @param {string}   props.nombre      — nombre de la plantilla
 * @param {string}   props.asunto      — asunto del email
 * @param {string}   props.cuerpo      — cuerpo (texto plano con {{variables}})
 * @param {Function} props.onChange    — ({ nombre, asunto, cuerpo }) => void
 * @param {Function} props.onGuardar   — () => void
 * @param {boolean}  props.esActiva    — si esta plantilla es la activa
 * @param {Function} props.onActivar   — () => void
 * @param {string}   [props.emailPreview] — email del destinatario para preview
 */
export default function EditorPlantilla({
  nombre,
  asunto,
  cuerpo,
  onChange,
  onGuardar,
  esActiva,
  onActivar,
  emailPreview = 'contacto@ayax.com.ar',
}) {
  const cuerpoRef = useRef(null)

  // ── Inserta la variable en la posición actual del cursor ──────────────────
  function insertarVariable(key) {
    const el   = cuerpoRef.current
    if (!el) return

    const tag   = `{{${key}}}`
    const start = el.selectionStart
    const end   = el.selectionEnd
    const nuevo = cuerpo.slice(0, start) + tag + cuerpo.slice(end)

    onChange({ nombre, asunto, cuerpo: nuevo })

    // Restaurar foco + posición del cursor justo después del tag insertado
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + tag.length, start + tag.length)
    })
  }

  const asuntoPreview = renderizarTemplate(asunto, VARS_EJEMPLO)
  const cuerpoPreview = renderizarTemplate(cuerpo, VARS_EJEMPLO)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Campos nombre + asunto ── */}
      <div className="pe-field">
        <label className="pe-label" htmlFor="ed-nombre">Nombre de la plantilla</label>
        <input
          id="ed-nombre"
          className="pe-input"
          value={nombre}
          onChange={e => onChange({ nombre: e.target.value, asunto, cuerpo })}
        />
      </div>

      <div className="pe-field">
        <label className="pe-label" htmlFor="ed-asunto">Asunto</label>
        <input
          id="ed-asunto"
          className="pe-input"
          value={asunto}
          onChange={e => onChange({ nombre, asunto: e.target.value, cuerpo })}
        />
        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
          Preview: <em>{asuntoPreview}</em>
        </div>
      </div>

      {/* ── Variables disponibles ── */}
      <div>
        <div style={{
          fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '.06em', opacity: .5, marginBottom: 8,
        }}>
          Variables disponibles — hacé click para insertar en el cursor
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {VARIABLES_DISPONIBLES.map(v => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertarVariable(v.key)}
              title={`Ejemplo: ${v.ejemplo}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 9px', borderRadius: 20,
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: 'rgba(37,99,235,.08)', color: '#2563eb',
                border: '1px solid rgba(37,99,235,.2)',
                transition: 'background .15s',
              }}
            >
              <IcoInsert />
              {`{{${v.key}}}`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cuerpo / textarea ── */}
      <div className="pe-field">
        <label className="pe-label" htmlFor="ed-cuerpo">Cuerpo del email</label>
        {/* Toolbar visual (decorativa — no implementa rich text) */}
        <div className="richtext-toolbar" aria-label="Herramientas de formato">
          <select className="rtt-para" aria-label="Estilo de párrafo">
            <option>Párrafo</option><option>H1</option><option>H2</option>
          </select>
          <button className="rtt-btn rtt-bold" type="button" aria-label="Negrita">B</button>
          <button className="rtt-btn rtt-italic" type="button" aria-label="Cursiva"><em>T</em></button>
          <button className="rtt-btn" type="button" aria-label="Lista">≡</button>
          <button className="rtt-btn" type="button" aria-label="Enlace">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </button>
        </div>
        <textarea
          id="ed-cuerpo"
          ref={cuerpoRef}
          className="pe-textarea"
          rows={12}
          value={cuerpo}
          onChange={e => onChange({ nombre, asunto, cuerpo: e.target.value })}
        />
      </div>

      {/* ── Acciones ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn-guardar ready" onClick={onGuardar}>
          Guardar cambios
        </button>
        {!esActiva && (
          <button className="btn-usar" onClick={onActivar}>
            Usar como activa
          </button>
        )}
        {esActiva && (
          <span style={{
            fontSize: 12, fontWeight: 600, color: '#16a34a',
            background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)',
            borderRadius: 20, padding: '3px 10px',
          }}>
            ✓ Plantilla activa
          </span>
        )}
      </div>

      {/* ── Preview live ── */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '.06em', opacity: .45, marginBottom: 12,
        }}>
          Vista previa (variables con datos de ejemplo)
        </div>
        <div className="email-preview-card">
          <div className="email-preview-meta">
            <span className="ep-meta-row"><strong>Para:</strong> {emailPreview}</span>
            <span className="ep-meta-row"><strong>Asunto:</strong> {asuntoPreview}</span>
          </div>
          <div className="email-preview-body">
            <div className="email-preview-logo">KYRA</div>
            <p className="ep-body-text">
              {cuerpoPreview.split('\n').map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
