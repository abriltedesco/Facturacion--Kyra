import { useState } from 'react'
import Modal from '../components/Modal'
import { emails as initialEmails, clientes, formatFecha } from '../data/mockData'

const TIPOS_EMAIL = [
  'Factura del mes',
  'Recordatorio 15 días',
  'Recordatorio 30 días (firme)',
]

const EMPTY_FORM = {
  clienteId: '',
  tipo: 'Factura del mes',
  asuntoCustom: '',
  fechaProgramada: '',
  adjunto: '',
  notas: '',
}

function Badge({ estado }) {
  const map = {
    enviado:    'badge-sent',
    programado: 'badge-pending',
    borrador:   'badge-draft',
    error:      'badge-inactive',
  }
  const label = {
    enviado:    'Enviado',
    programado: 'Programado',
    borrador:   'Borrador',
    error:      'Error',
  }
  return <span className={`badge ${map[estado] || 'badge-pending'}`}>{label[estado] || estado}</span>
}

function TipoTag({ tipo }) {
  const colors = {
    'Factura del mes':            { bg: 'rgba(212,201,168,0.08)', color: '#D4C9A8' },
    'Recordatorio 15 días':       { bg: 'rgba(175,175,175,0.08)', color: '#AFAFAF' },
    'Recordatorio 30 días (firme)': { bg: 'rgba(100,80,80,0.15)', color: '#cc9999' },
  }
  const style = colors[tipo] || colors['Recordatorio 15 días']
  return (
    <span style={{
      fontSize: '11px',
      background: style.bg,
      color: style.color,
      padding: '3px 8px',
      borderRadius: '4px',
      whiteSpace: 'nowrap',
    }}>
      {tipo}
    </span>
  )
}

export default function Emails() {
  const [emails, setEmails] = useState(initialEmails)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [previewId, setPreviewId] = useState(null)

  const filtered = emails.filter(e =>
    e.cliente?.toLowerCase().includes(search.toLowerCase()) ||
    e.asunto?.toLowerCase().includes(search.toLowerCase()) ||
    e.tipo?.toLowerCase().includes(search.toLowerCase())
  )

  const enviados = emails.filter(e => e.estado === 'enviado').length
  const programados = emails.filter(e => e.estado === 'programado').length

  const handleClose = () => { setModalOpen(false); setForm(EMPTY_FORM) }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const buildAsunto = (tipo, clienteNombre) => {
    const map = {
      'Factura del mes':            `Factura Julio 2026 · We Are Kyra`,
      'Recordatorio 15 días':       `Recordatorio de pago · We Are Kyra`,
      'Recordatorio 30 días (firme)': `Aviso de deuda · We Are Kyra`,
    }
    return map[tipo] || tipo
  }

  const handleSubmit = () => {
    if (!form.clienteId || !form.tipo) return
    const cliente = clientes.find(c => c.id === Number(form.clienteId))
    if (!cliente) return
    const newId = Math.max(...emails.map(e => e.id)) + 1
    setEmails(prev => [...prev, {
      id: newId,
      clienteId: Number(form.clienteId),
      destinatario: cliente.email,
      cliente: cliente.nombre,
      asunto: form.asuntoCustom || buildAsunto(form.tipo, cliente.nombre),
      tipo: form.tipo,
      fechaEnvio: null,
      fechaProgramada: form.fechaProgramada || null,
      estado: form.fechaProgramada ? 'programado' : 'borrador',
      adjunto: form.adjunto || '',
    }])
    handleClose()
  }

  const previewEmail = previewId ? emails.find(e => e.id === previewId) : null

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Emails</h1>
          <p className="page-subtitle">{enviados} enviado{enviados !== 1 ? 's' : ''} · {programados} programado{programados !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo email
        </button>
      </div>

      {/* Summary cards */}
      <div className="summary-row">
        <div className="summary-card">
          <div className="summary-label">Enviados</div>
          <div className="summary-value">{enviados}</div>
          <div className="summary-note">en el período</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Programados</div>
          <div className="summary-value" style={{ color: '#D4C9A8' }}>{programados}</div>
          <div className="summary-note">pendientes de envío</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total</div>
          <div className="summary-value">{emails.length}</div>
          <div className="summary-note">en este ciclo</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
          <input
            className="search-input"
            placeholder="Buscar cliente o asunto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Destinatario</th>
              <th>Asunto</th>
              <th>Tipo</th>
              <th>Adjunto</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8}>
                <div className="empty-state">
                  <div className="empty-icon">◻</div>
                  <div className="empty-title">Sin emails registrados</div>
                  <div className="empty-desc">Los emails generados por el sistema aparecerán acá.</div>
                </div>
              </td></tr>
            ) : filtered.map(e => (
              <tr key={e.id}>
                <td style={{ fontWeight: 500 }}>{e.cliente}</td>
                <td className="td-secondary" style={{ fontSize: '12px' }}>{e.destinatario}</td>
                <td style={{ fontSize: '12px', maxWidth: '220px' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.asunto}
                  </div>
                </td>
                <td><TipoTag tipo={e.tipo} /></td>
                <td style={{ fontSize: '11px', color: '#555', fontFamily: 'monospace' }}>
                  {e.adjunto
                    ? <span style={{ color: '#AFAFAF' }}>{e.adjunto}</span>
                    : <span style={{ color: '#333' }}>—</span>
                  }
                </td>
                <td className="td-secondary td-mono" style={{ fontSize: '12px' }}>
                  {e.estado === 'enviado'
                    ? formatFecha(e.fechaEnvio)
                    : e.fechaProgramada
                      ? <span style={{ color: '#D4C9A8' }}>{formatFecha(e.fechaProgramada)}</span>
                      : <span style={{ color: '#444' }}>—</span>
                  }
                </td>
                <td><Badge estado={e.estado} /></td>
                <td>
                  <div className="row-actions">
                    <button className="action-btn" onClick={() => setPreviewId(e.id)}>
                      Ver
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Nuevo email */}
      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title="Nuevo email"
        footer={
          <>
            <button className="btn-ghost" onClick={handleClose}>Cancelar</button>
            <button className="btn-primary" onClick={handleSubmit}>Crear email</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Cliente destinatario *</label>
            <select className="form-select" name="clienteId" value={form.clienteId} onChange={handleChange}>
              <option value="">— Seleccioná un cliente —</option>
              {clientes.filter(c => c.estado === 'activo').map(c => (
                <option key={c.id} value={c.id}>{c.nombre} · {c.email}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Tipo de email *</label>
            <select className="form-select" name="tipo" value={form.tipo} onChange={handleChange}>
              {TIPOS_EMAIL.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Asunto (opcional — se genera automáticamente)</label>
            <input
              className="form-input"
              name="asuntoCustom"
              value={form.asuntoCustom}
              onChange={handleChange}
              placeholder={buildAsunto(form.tipo)}
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Archivo adjunto</label>
            <input className="form-input" name="adjunto" value={form.adjunto} onChange={handleChange} placeholder="FAC-A-0001-00000090.pdf" />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Programar envío (dejar vacío para borrador)</label>
            <input className="form-input" name="fechaProgramada" type="datetime-local" value={form.fechaProgramada} onChange={handleChange} />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Notas internas</label>
            <textarea className="form-textarea" name="notas" value={form.notas} onChange={handleChange} placeholder="Observaciones sobre este envío..." />
          </div>
        </div>
      </Modal>

      {/* Modal: Preview de email */}
      {previewEmail && (
        <Modal
          isOpen={!!previewId}
          onClose={() => setPreviewId(null)}
          title={`Email · ${previewEmail.cliente}`}
          footer={
            <button className="btn-ghost" onClick={() => setPreviewId(null)}>Cerrar</button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              ['Para',       previewEmail.destinatario],
              ['Asunto',     previewEmail.asunto],
              ['Tipo',       previewEmail.tipo],
              ['Adjunto',    previewEmail.adjunto || '—'],
              ['Fecha',      previewEmail.estado === 'enviado' ? formatFecha(previewEmail.fechaEnvio) : (previewEmail.fechaProgramada ? `Programado: ${formatFecha(previewEmail.fechaProgramada)}` : '—')],
              ['Estado',     previewEmail.estado],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span style={{
                  width: '72px',
                  minWidth: '72px',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#555',
                  paddingTop: '1px',
                }}>
                  {label}
                </span>
                <span style={{ fontSize: '13px', color: '#AFAFAF', wordBreak: 'break-all' }}>
                  {value}
                </span>
              </div>
            ))}

            <div style={{ height: '1px', background: '#2A2A2A', margin: '8px 0' }} />

            {/* Email body preview */}
            <div style={{
              background: '#0A0A0A',
              border: '1px solid #2A2A2A',
              borderRadius: '8px',
              padding: '20px',
              fontSize: '12px',
              color: '#AFAFAF',
              lineHeight: 1.7,
              fontStyle: 'italic',
            }}>
              {previewEmail.tipo === 'Factura del mes' && (
                <>
                  Estimado/a,<br /><br />
                  Adjunto encontrará la factura correspondiente al mes en curso por los servicios de marketing prestados por <strong style={{ color: '#FFFFFF' }}>We Are Kyra</strong>.<br /><br />
                  Ante cualquier consulta, no dude en contactarnos.<br /><br />
                  Saludos cordiales,<br />
                  <strong style={{ color: '#D4C9A8' }}>We Are Kyra</strong>
                </>
              )}
              {previewEmail.tipo === 'Recordatorio 15 días' && (
                <>
                  Estimado/a,<br /><br />
                  Le recordamos que la factura emitida el 1° del mes se encuentra pendiente de pago. Le pedimos que, de ser posible, regularice la situación a la brevedad.<br /><br />
                  Ante cualquier consulta, estamos a disposición.<br /><br />
                  Saludos cordiales,<br />
                  <strong style={{ color: '#D4C9A8' }}>We Are Kyra</strong>
                </>
              )}
              {previewEmail.tipo === 'Recordatorio 30 días (firme)' && (
                <>
                  Estimado/a,<br /><br />
                  A 30 días de la emisión de la factura, la misma se encuentra impaga. Le solicitamos que regularice el pago a la brevedad para evitar la interrupción del servicio.<br /><br />
                  Quedamos en espera de su respuesta.<br /><br />
                  We Are Kyra
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
