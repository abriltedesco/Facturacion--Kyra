// /src/components/Emision/TablaEmision.jsx
// Tabla completa de líneas para emitir, con columnas y filas.

import FilaEmision from './FilaEmision'

export default function TablaEmision({
  lineas, clientes, servicios, entidades,
  onEmitir, onReintentar, onVerDetalle,
}) {
  const thStyle = {
    padding:     '10px 14px',
    fontSize:    11,
    fontWeight:  700,
    letterSpacing: '0.06em',
    color:       'var(--text-muted, #6b7280)',
    textAlign:   'left',
    borderBottom:'2px solid var(--border)',
    background:  'var(--bg-page, #f8fafc)',
    whiteSpace:  'nowrap',
  }

  if (!lineas || lineas.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--text-muted, #6b7280)' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ marginBottom:12, opacity:0.4 }}>
          <rect x="6" y="8" width="28" height="24" rx="3" stroke="currentColor" strokeWidth="2"/>
          <line x1="12" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="12" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p style={{ margin:0, fontSize:14 }}>No hay facturas en esta categoría.</p>
      </div>
    )
  }

  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', minWidth:680 }}>
        <thead>
          <tr>
            <th style={thStyle}>Cliente</th>
            <th style={thStyle}>Tipo</th>
            <th style={thStyle}>Servicio</th>
            <th style={{ ...thStyle, textAlign:'right' }}>Importe neto</th>
            <th style={thStyle}>Estado</th>
            <th style={{ ...thStyle, textAlign:'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {lineas.map(linea => (
            <FilaEmision
              key={linea.id}
              linea={linea}
              cliente={clientes.find(c => c.id === linea.clienteId)}
              servicio={servicios.find(s => s.id === linea.servicioId)}
              entidad={entidades.find(e => e.id === linea.entidadId)}
              onEmitir={onEmitir}
              onReintentar={onReintentar}
              onVerDetalle={onVerDetalle}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
