// /src/components/Emails/BadgeEstadoEnvio.jsx
// Chip visual de estado de envío de email.
// estados: "enviado" | "error" | "pendiente" | "enviando" | "na" | "sin_email"

const ESTADOS = {
  enviado: {
    label:  'Enviado ✓',
    bg:     'rgba(34, 197, 94, 0.12)',
    color:  '#16a34a',
    border: 'rgba(34, 197, 94, 0.3)',
    pulse:  false,
  },
  error: {
    label:  'Error ✗',
    bg:     'rgba(239, 68, 68, 0.12)',
    color:  '#dc2626',
    border: 'rgba(239, 68, 68, 0.3)',
    pulse:  false,
  },
  pendiente: {
    label:  'Pendiente',
    bg:     'rgba(245, 158, 11, 0.12)',
    color:  '#d97706',
    border: 'rgba(245, 158, 11, 0.3)',
    pulse:  false,
  },
  enviando: {
    label:  'Enviando…',
    bg:     'rgba(59, 130, 246, 0.12)',
    color:  '#2563eb',
    border: 'rgba(59, 130, 246, 0.3)',
    pulse:  true,
  },
  na: {
    label:  'Sin envío (S/F)',
    bg:     'rgba(160, 160, 160, 0.1)',
    color:  '#6b7280',
    border: 'rgba(160, 160, 160, 0.25)',
    pulse:  false,
  },
  sin_email: {
    label:  'Sin email',
    bg:     'rgba(239, 68, 68, 0.08)',
    color:  '#9ca3af',
    border: 'rgba(239, 68, 68, 0.2)',
    pulse:  false,
  },
}

/**
 * @param {string} estado  — clave del estado
 * @param {string} [size]  — "sm" | "md" (default "md")
 */
export default function BadgeEstadoEnvio({ estado, size = 'md' }) {
  const cfg = ESTADOS[estado] || ESTADOS.pendiente
  const sm  = size === 'sm'

  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          sm ? 4 : 5,
      padding:      sm ? '2px 8px' : '3px 10px',
      borderRadius: 20,
      fontSize:     sm ? 11 : 12,
      fontWeight:   600,
      background:   cfg.bg,
      color:        cfg.color,
      border:       `1px solid ${cfg.border}`,
      whiteSpace:   'nowrap',
      letterSpacing: '0.01em',
    }}>
      {cfg.pulse && (
        <span style={{
          width:        6,
          height:       6,
          borderRadius: '50%',
          background:   cfg.color,
          flexShrink:   0,
          animation:    'pulse-email 1.2s ease-in-out infinite',
        }} />
      )}
      {cfg.label}

      <style>{`
        @keyframes pulse-email {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(0.65); }
        }
      `}</style>
    </span>
  )
}
