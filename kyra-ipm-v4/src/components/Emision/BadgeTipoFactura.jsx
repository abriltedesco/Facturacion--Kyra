// /src/components/Emision/BadgeTipoFactura.jsx
// Badge inline para el tipo de factura: A, B, C, LLC, S, F

const COLORES = {
  A:   { bg: '#dbeafe', color: '#1d4ed8', label: 'A' },
  B:   { bg: '#f3e8ff', color: '#7c3aed', label: 'B' },
  C:   { bg: '#dcfce7', color: '#15803d', label: 'C' },
  LLC: { bg: '#fef9c3', color: '#854d0e', label: 'LLC' },
  S:   { bg: '#f1f5f9', color: '#475569', label: 'S/F' },
  F:   { bg: '#f1f5f9', color: '#475569', label: 'S/F' },
}

export default function BadgeTipoFactura({ tipo }) {
  const cfg = COLORES[tipo] || { bg: '#f1f5f9', color: '#475569', label: tipo }

  return (
    <span style={{
      display:       'inline-block',
      padding:       '2px 7px',
      borderRadius:  '4px',
      fontSize:      '11px',
      fontWeight:    700,
      letterSpacing: '0.04em',
      background:    cfg.bg,
      color:         cfg.color,
      lineHeight:    '18px',
    }}>
      {cfg.label}
    </span>
  )
}
