// /src/components/Emision/EstadoEmision.jsx
// Chip de estado dentro del flujo de emisión.
// Estados: aprobada → emitiendo → emitida | error_emision

const ESTADOS = {
  aprobada: {
    label: 'Por emitir',
    bg:    '#f1f5f9',
    color: '#475569',
    pulse: false,
  },
  emitiendo: {
    label: 'Emitiendo…',
    bg:    '#fef3c7',
    color: '#92400e',
    pulse: true,
  },
  emitida: {
    label: 'Emitida',
    bg:    '#dcfce7',
    color: '#15803d',
    pulse: false,
  },
  error_emision: {
    label: 'Error',
    bg:    '#fee2e2',
    color: '#991b1b',
    pulse: false,
  },
}

export default function EstadoEmision({ status }) {
  const cfg = ESTADOS[status] || ESTADOS.aprobada

  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '5px',
      padding:      '3px 10px',
      borderRadius: '20px',
      fontSize:     '12px',
      fontWeight:   600,
      background:   cfg.bg,
      color:        cfg.color,
      whiteSpace:   'nowrap',
    }}>
      {cfg.pulse && (
        <span style={{
          width:        '6px',
          height:       '6px',
          borderRadius: '50%',
          background:   cfg.color,
          animation:    'pulse-dot 1.2s ease-in-out infinite',
          flexShrink:   0,
        }} />
      )}
      {status === 'emitida' && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="6" fill={cfg.color} opacity="0.2" />
          <path d="M3.5 6L5.5 8L8.5 4.5" stroke={cfg.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {status === 'error_emision' && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="6" fill={cfg.color} opacity="0.2" />
          <path d="M6 3.5V6.5M6 8.5V9" stroke={cfg.color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      {cfg.label}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </span>
  )
}
