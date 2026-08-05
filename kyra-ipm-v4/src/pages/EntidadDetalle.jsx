import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

/* ── Mock data ──────────────────────────────────────────────────────── */
const ENTIDADES = {
  1: { id: 1, nombre: 'Kyra SRL',       badge: 'ACTIVA', subtitulo: 'Entidad emisora · Responsable Inscripta · CUIT 30-71234567-8',
       datos: { Tipo: 'SRL (Sociedad de Responsabilidad Limitada)', 'Cuenta bancaria': 'Santander Río — CBU 072 0001 0087 ...', 'Comprobante default': 'Factura A', 'Identificación fiscal': 'CUIT 30-71234567-8', 'Entidades Mercury': 'No aplica' },
       arca: { estado: 'VIGENTE', vence: '15 de diciembre de 2026' },
       historial: [
         { fecha: '15/12/2024', vencimiento: '15/12/2026', cargadoPor: 'Mai Brandao', estado: 'VIGENTE' },
         { fecha: '10/12/2022', vencimiento: '10/12/2024', cargadoPor: 'Mai Brandao', estado: 'EXPIRADO' },
       ],
  },
  2: { id: 2, nombre: 'Kyra LLC',       badge: 'ACTIVA', subtitulo: 'Entidad emisora · Facturación propia (LLC) · EIN 12-3456789',
       datos: { Tipo: 'LLC (Limited Liability Company)', 'Cuenta bancaria': 'Mercury — IBAN 001 002 003 ...', 'Comprobante default': 'LLC Invoice', 'Identificación fiscal': 'EIN 12-3456789', 'Entidades Mercury': 'Activa' },
       arca: { estado: 'NO_APLICA' },
       historial: [],
  },
  3: { id: 3, nombre: 'Kyra Arg',       badge: 'ACTIVA', subtitulo: 'Entidad emisora · Monotributo · CUIT 20-35678901-4',
       datos: { Tipo: 'Persona Física — Monotributo', 'Cuenta bancaria': 'Galicia — CBU 007 0001 0055 ...', 'Comprobante default': 'Factura C', 'Identificación fiscal': 'CUIT 20-35678901-4', 'Entidades Mercury': 'No aplica' },
       arca: { estado: 'POR_VENCER', vence: '15 de agosto de 2026', diasRestantes: 23 },
       historial: [
         { fecha: '15/08/2024', vencimiento: '15/08/2026', cargadoPor: 'Mai Brandao', estado: 'POR_VENCER' },
         { fecha: '12/08/2022', vencimiento: '12/08/2024', cargadoPor: 'Mai Brandao', estado: 'EXPIRADO' },
       ],
  },
  4: { id: 4, nombre: 'Estudio AB',     badge: 'ACTIVA', subtitulo: 'Entidad emisora · Responsable Inscripta · CUIT 30-55555555-5',
       datos: { Tipo: 'SRL', 'Cuenta bancaria': 'BBVA — CBU 011 0001 0099 ...', 'Comprobante default': 'Factura A', 'Identificación fiscal': 'CUIT 30-55555555-5', 'Entidades Mercury': 'No aplica' },
       arca: { estado: 'VENCIDO', venció: '15 de agosto de 2026' },
       historial: [
         { fecha: '15/08/2022', vencimiento: '15/08/2024', cargadoPor: 'Mai Brandao', estado: 'EXPIRADO' },
       ],
  },
  5: { id: 5, nombre: 'Agencia X',      badge: 'ACTIVA', subtitulo: 'Entidad emisora · Responsable Inscripta · CUIT 30-44444444-4',
       datos: { Tipo: 'SA', 'Cuenta bancaria': 'Santander — CBU 072 0001 0088 ...', 'Comprobante default': 'Factura A', 'Identificación fiscal': 'CUIT 30-44444444-4', 'Entidades Mercury': 'No aplica' },
       arca: { estado: 'SIN_CERT' },
       historial: [],
  },
}

const ARCA_BADGE = {
  VIGENTE:    { cls: 'arca-badge-vigente',    icon: '●', label: 'VIGENTE' },
  POR_VENCER: { cls: 'arca-badge-por-vencer', icon: '⚠', label: 'POR VENCER' },
  VENCIDO:    { cls: 'arca-badge-vencido',    icon: '✕', label: 'VENCIDO' },
  SIN_CERT:   { cls: 'arca-badge-sin-cert',   icon: '—', label: 'SIN CERTIFICADO' },
  NO_APLICA:  { cls: 'arca-badge-no-aplica',  icon: '—', label: 'NO APLICA' },
  EXPIRADO:   { cls: 'arca-badge-sin-cert',   icon: '—', label: 'EXPIRADO' },
}

export default function EntidadDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const entidad = ENTIDADES[Number(id)] || ENTIDADES[1]
  const [renovarMsg, setRenovarMsg] = useState(false)

  const arca = entidad.arca
  const badge = ARCA_BADGE[arca.estado] || ARCA_BADGE.SIN_CERT

  const handleRenovar = () => {
    setRenovarMsg(true)
    setTimeout(() => setRenovarMsg(false), 3000)
  }

  return (
    <div className="entidad-page">
      {/* Breadcrumb */}
      <div className="entidad-breadcrumb">
        <button className="entidad-back" onClick={() => navigate('/administracion?tab=2')}>
          ← Entidades
        </button>
      </div>

      {/* Encabezado */}
      <div className="entidad-heading">
        <div className="entidad-heading-row">
          <h1 className="entidad-nombre">{entidad.nombre}</h1>
          <span className="badge badge-activo" style={{ marginLeft: 16 }}>{entidad.badge}</span>
        </div>
        <p className="entidad-subtitulo">{entidad.subtitulo}</p>
      </div>
      <div className="entidad-divider" />

      {renovarMsg && (
        <div className="aprobado-toast" role="status" aria-live="polite">
          ✓ Solicitud de renovación iniciada
        </div>
      )}

      {/* Dos columnas */}
      <div className="entidad-cols">
        {/* Card datos */}
        <div className="entidad-card entidad-card-datos">
          <h2 className="entidad-card-title">Datos de la entidad</h2>
          <div className="entidad-datos-list">
            {Object.entries(entidad.datos).map(([label, val]) => (
              <div key={label} className="entidad-dato-row">
                <span className="entidad-dato-label">{label}</span>
                <span className="entidad-dato-val">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card ARCA */}
        <div className={'entidad-card entidad-card-arca' + (arca.estado === 'NO_APLICA' ? ' arca-card-inactive' : '')}>
          <h2 className={'entidad-card-title' + (arca.estado === 'NO_APLICA' ? ' entidad-card-title-muted' : '')}>
            Certificado ARCA
          </h2>
          <p className="entidad-card-sub">Necesario para la emisión automática de comprobantes A y B</p>
          <div className="arca-card-divider" />

          {arca.estado === 'NO_APLICA' ? (
            <div className="arca-no-aplica">
              <div className="arca-no-aplica-icon">—</div>
              <div>
                <div className="arca-no-aplica-title">No aplica</div>
                <div className="arca-no-aplica-text">{entidad.nombre} genera PDFs de factura propios.</div>
                <div className="arca-no-aplica-text">No utiliza la API de ARCA para la emisión.</div>
              </div>
            </div>
          ) : (
            <>
              <p className="arca-estado-label">Estado del certificado</p>
              <span className={`arca-badge ${badge.cls}`}>{badge.icon} {badge.label}</span>

              {arca.estado === 'POR_VENCER' && (
                <div className="arca-alert arca-alert-warn">
                  Vence en {arca.diasRestantes} días. Renovar antes del {arca.vence}.
                </div>
              )}
              {arca.estado === 'VENCIDO' && (
                <div className="arca-alert arca-alert-danger">
                  Certificado vencido el {arca.venció}. La emisión automática está bloqueada.
                </div>
              )}
              {arca.estado === 'SIN_CERT' && (
                <>
                  <p className="arca-sin-text">Esta entidad aún no tiene un certificado ARCA cargado.</p>
                  <p className="arca-sin-text">Sin el certificado, el sistema no puede emitir comprobantes A o B automáticamente.</p>
                </>
              )}

              {(arca.estado === 'VIGENTE' || arca.estado === 'POR_VENCER') && (
                <>
                  <div className="arca-vence-row">
                    <span className="arca-vence-label">Vence el:</span>
                    <span className={'arca-vence-val' + (arca.estado === 'POR_VENCER' ? ' arca-vence-warn' : '')}>{arca.vence}</span>
                  </div>
                </>
              )}
              {arca.estado === 'VENCIDO' && (
                <div className="arca-vence-row">
                  <span className="arca-vence-label">Venció el:</span>
                  <span className="arca-vence-val arca-vence-warn">{arca.venció}</span>
                </div>
              )}

              <button
                className={arca.estado === 'VIGENTE' ? 'btn-arca-secondary' : 'btn-cta'}
                style={{ marginTop: 16, fontSize: 13 }}
                onClick={handleRenovar}>
                ↑ {arca.estado === 'SIN_CERT' ? 'Cargar certificado' : 'Renovar certificado'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Historial */}
      <div className="entidad-historial">
        <h2 className="entidad-section-title">Historial de certificados</h2>
        {entidad.historial.length === 0 ? (
          <p className="entidad-empty">No se han cargado certificados anteriores.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>FECHA CARGA</th>
                  <th>VENCIMIENTO</th>
                  <th>CARGADO POR</th>
                  <th>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {entidad.historial.map((h, i) => (
                  <tr key={i}>
                    <td>{h.fecha}</td>
                    <td>{h.vencimiento}</td>
                    <td>{h.cargadoPor}</td>
                    <td>
                      <span className={`arca-badge ${ARCA_BADGE[h.estado]?.cls || 'arca-badge-sin-cert'}`} style={{ fontSize: 11, padding: '3px 8px' }}>
                        {ARCA_BADGE[h.estado]?.label || h.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
