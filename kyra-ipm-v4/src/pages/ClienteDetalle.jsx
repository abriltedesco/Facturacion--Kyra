import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const CLIENTES_MAP = {
  1:  { nombre: 'Maped',       estado: 'ACTIVO', subtitulo: 'Cliente activo · facturación mensual · Kyra SRL' },
  2:  { nombre: 'Edding ARG',  estado: 'ACTIVO', subtitulo: 'Cliente activo · facturación mensual · Kyra SRL' },
  3:  { nombre: 'Edding COL',  estado: 'ACTIVO', subtitulo: 'Cliente activo · facturación mensual · Mercury LLC' },
  4:  { nombre: 'Ayax',        estado: 'ACTIVO', subtitulo: 'Cliente activo · facturación mensual · Kyra SRL' },
  5:  { nombre: 'TechCorp',    estado: 'ACTIVO', subtitulo: 'Cliente activo · facturación mensual · Mercury LLC' },
}

const SERVICIOS_CLIENTE = [
  { id: 1, nombre: 'Social Media',  tipo: 'Fijo',     tarifa: '$85,000.00',  moneda: 'ARS', periodicidad: 'Mensual',    estado: 'ACTIVO' },
  { id: 2, nombre: 'Diseño UX/UI',  tipo: 'Por hora', tarifa: '$4,500.00/h', moneda: 'ARS', periodicidad: 'Mensual',    estado: 'ACTIVO' },
  { id: 3, nombre: 'Reporting',     tipo: 'Fijo',     tarifa: '$4,500.00',   moneda: 'USD', periodicidad: 'Trimestral', estado: 'PAUSADO' },
]

const HISTORIAL_PRECIOS = {
  1: [
    { fecha: '01/07/2026', anterior: '$70,000', nuevo: '$85,000', motivo: 'Actualización IPC — julio 2026' },
    { fecha: '01/04/2026', anterior: '$60,000', nuevo: '$70,000', motivo: 'Actualización IPC — abril 2026' },
    { fecha: '01/01/2026', anterior: '$50,000', nuevo: '$60,000', motivo: 'Revisión anual — enero 2026' },
    { fecha: '15/03/2025', anterior: '—',       nuevo: '$50,000', motivo: 'Alta del servicio' },
  ],
}

const TABS_PERFIL = ['Datos generales', 'Servicios', 'Historial de facturas', 'Documentos']

const BADGE_MAP = {
  ACTIVO:    'badge badge-activo',
  PAUSADO:   'badge badge-emitida',
  FINALIZADO:'badge badge-inactivo',
}

export default function ClienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const cliente = CLIENTES_MAP[Number(id)] || CLIENTES_MAP[1]
  const [tabPerfil, setTabPerfil]   = useState(1)  /* default: Servicios */
  const [histPanel, setHistPanel]   = useState(null)
  const [servicios, setServicios]   = useState(SERVICIOS_CLIENTE)
  const [addModal, setAddModal]     = useState(false)
  const [newSvc, setNewSvc]         = useState({ nombre: '', tarifa: '', moneda: 'ARS', periodicidad: 'Mensual', estado: 'ACTIVO' })

  const changeNewSvc = e => setNewSvc(p => ({ ...p, [e.target.name]: e.target.value }))
  const guardarSvc = () => {
    if (!newSvc.nombre || !newSvc.tarifa) return
    setServicios(prev => [...prev, { id: Date.now(), tipo: 'Fijo', ...newSvc }])
    setAddModal(false)
    setNewSvc({ nombre: '', tarifa: '', moneda: 'ARS', periodicidad: 'Mensual', estado: 'ACTIVO' })
  }

  return (
    <div className="entidad-page">
      {/* Overlay historial */}
      {histPanel !== null && (
        <div className="modal-overlay" onClick={() => setHistPanel(null)}>
          <aside className="error-panel hist-panel" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="error-panel-header">
              <div>
                <h2 className="error-panel-title">Historial de precios</h2>
                <p className="error-panel-sub">{SERVICIOS_CLIENTE[histPanel]?.nombre} · {cliente.nombre}</p>
              </div>
              <button className="error-panel-close" onClick={() => setHistPanel(null)}>✕</button>
            </div>
            <div className="error-panel-divider" />
            <div className="hist-list">
              {(HISTORIAL_PRECIOS[SERVICIOS_CLIENTE[histPanel]?.id] || []).map((item, i) => (
                <div key={i} className="hist-item">
                  <div className="hist-fecha">{item.fecha}</div>
                  <div className="hist-cambio">
                    <span className="hist-anterior">{item.anterior}</span>
                    <span className="hist-arrow"> → </span>
                    <span className="hist-nuevo">{item.nuevo}</span>
                  </div>
                  <div className="hist-motivo">{item.motivo}</div>
                </div>
              ))}
              {!(HISTORIAL_PRECIOS[SERVICIOS_CLIENTE[histPanel]?.id]) && (
                <p className="entidad-empty">Sin historial de cambios.</p>
              )}
            </div>
            <button className="btn-secondary-full" style={{ margin: '16px 24px' }} onClick={() => setHistPanel(null)}>Cerrar</button>
          </aside>
        </div>
      )}

      {/* Modal agregar servicio */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="pago-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="pago-modal-header">
              <h2 className="pago-modal-title">Agregar servicio</h2>
              <button className="error-panel-close" onClick={() => setAddModal(false)}>✕</button>
            </div>
            <div className="error-panel-divider" />
            <div className="pago-modal-body">
              <div className="form-group">
                <label className="form-label">Servicio del catálogo <span className="label-req">*</span></label>
                <select className="form-select" name="nombre" value={newSvc.nombre} onChange={changeNewSvc}>
                  <option value="">Seleccionar servicio</option>
                  {['Social Media', 'Diseño UX/UI', 'Dev a medida', 'Reporting', 'Consultoría'].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tarifa propia <span className="label-req">*</span></label>
                <input className="form-input" name="tarifa" value={newSvc.tarifa} onChange={changeNewSvc} placeholder="0.00" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Moneda</label>
                  <select className="form-select" name="moneda" value={newSvc.moneda} onChange={changeNewSvc}>
                    <option>ARS</option><option>USD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Periodicidad</label>
                  <select className="form-select" name="periodicidad" value={newSvc.periodicidad} onChange={changeNewSvc}>
                    <option>Mensual</option><option>Bimestral</option><option>Trimestral</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="error-panel-divider" />
            <div className="pago-modal-footer">
              <button className="btn-cta" style={{ width: '100%' }} onClick={guardarSvc}
                disabled={!newSvc.nombre || !newSvc.tarifa}>Guardar</button>
              <button className="btn-secondary-full" onClick={() => setAddModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="entidad-breadcrumb">
        <button className="entidad-back" onClick={() => navigate('/administracion')}>← Clientes</button>
      </div>

      {/* Encabezado */}
      <div className="entidad-heading">
        <div className="entidad-heading-row">
          <h1 className="entidad-nombre">{cliente.nombre}</h1>
          <span className="badge badge-activo" style={{ marginLeft: 16 }}>{cliente.estado}</span>
        </div>
        <p className="entidad-subtitulo">{cliente.subtitulo}</p>
      </div>
      <div className="entidad-divider" />

      {/* Tabs perfil */}
      <div role="tablist" className="subtabs" style={{ marginTop: 24 }}>
        {TABS_PERFIL.map((t, i) => (
          <button key={t} role="tab" aria-selected={tabPerfil === i}
            className={'subtab' + (tabPerfil === i ? ' active' : '')}
            onClick={() => setTabPerfil(i)}>{t}</button>
        ))}
      </div>

      {/* TAB: Servicios */}
      {tabPerfil === 1 && (
        <div style={{ marginTop: 24 }}>
          <div className="servicios-section-header">
            <h2 className="entidad-section-title" style={{ margin: 0 }}>Servicios de {cliente.nombre}</h2>
            <button className="btn-cta" style={{ fontSize: 13 }} onClick={() => setAddModal(true)}>
              + Agregar servicio
            </button>
          </div>

          <div className="table-container" style={{ marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>SERVICIO</th>
                  <th>TIPO</th>
                  <th>TARIFA</th>
                  <th>MONEDA</th>
                  <th>PERIODICIDAD</th>
                  <th>ESTADO</th>
                  <th>HISTORIAL</th>
                  <th><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((s, i) => (
                  <tr key={s.id}>
                    <td><strong>{s.nombre}</strong></td>
                    <td className="td-muted">{s.tipo}</td>
                    <td>{s.tarifa}</td>
                    <td><span className="moneda-badge">{s.moneda}</span></td>
                    <td className="td-muted">{s.periodicidad}</td>
                    <td><span className={BADGE_MAP[s.estado] || 'badge'}>{s.estado}</span></td>
                    <td>
                      <button className="link-nro" style={{ fontWeight: 500, fontSize: 13 }}
                        onClick={() => setHistPanel(i)}>Ver →</button>
                    </td>
                    <td><button className="dots-btn">⋮</button></td>
                  </tr>
                ))}
                {servicios.length === 0 && (
                  <tr><td colSpan={8} className="td-empty">Sin servicios cargados</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="servicios-nota">Los precios y condiciones por cliente se configuran aquí. El catálogo base se gestiona en Administración.</p>
        </div>
      )}

      {/* TAB: Datos generales */}
      {tabPerfil === 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="entidad-card entidad-card-datos" style={{ maxWidth: 560 }}>
            <h2 className="entidad-card-title">Datos generales</h2>
            {[['Entidad emisora', 'Kyra SRL'], ['Tipo de factura', 'A'], ['Período', 'Mensual'], ['CUIT', '20-11111111-1'], ['Email de contacto', 'admin@maped.com'], ['Condición IVA', 'Responsable Inscripto']].map(([label, val]) => (
              <div key={label} className="entidad-dato-row"><span className="entidad-dato-label">{label}</span><span className="entidad-dato-val">{val}</span></div>
            ))}
          </div>
        </div>
      )}

      {/* TABs: Historial y Documentos — placeholders */}
      {tabPerfil === 2 && (
        <div style={{ marginTop: 24 }}>
          <p className="entidad-empty">El historial de facturas de {cliente.nombre} se mostrará aquí.</p>
        </div>
      )}
      {tabPerfil === 3 && (
        <div style={{ marginTop: 24 }}>
          <p className="entidad-empty">Los documentos adjuntos de {cliente.nombre} se mostrarán aquí.</p>
        </div>
      )}
    </div>
  )
}
