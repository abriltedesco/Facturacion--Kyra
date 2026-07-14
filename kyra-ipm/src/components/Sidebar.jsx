import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  {
    to: '/administracion',
    label: 'Administración',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: '/ingresos',
    label: 'Ingresos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    ),
  },
  {
    to: '/egresos',
    label: 'Egresos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </svg>
    ),
  },
  {
    to: '/emails',
    label: 'Emails',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
]

const DISABLED_ITEMS = [
  {
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  return (
    <aside style={{
      width: '220px',
      minWidth: '220px',
      background: '#121418',
      borderRight: '1px solid #2A2A2A',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: '28px 24px 24px',
        borderBottom: '1px solid #2A2A2A',
      }}>
        <div style={{
          fontSize: '9px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#666',
          marginBottom: '2px',
        }}>
          WE ARE
        </div>
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '22px',
          fontWeight: 400,
          color: '#FFFFFF',
          letterSpacing: '-0.5px',
        }}>
          'Kyra
        </div>
        <div style={{
          marginTop: '6px',
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#444',
        }}>
          IPM · Interno
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>

        {/* Section label */}
        <div style={{
          fontSize: '9.5px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#444',
          padding: '8px 12px 6px',
        }}>
          Módulos
        </div>

        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: isActive ? 500 : 400,
              color: isActive ? '#FFFFFF' : '#AFAFAF',
              background: isActive ? '#202020' : 'transparent',
              transition: 'all 0.16s ease',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.background = '#1a1a1a'
                e.currentTarget.style.color = '#FFFFFF'
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.getAttribute('aria-current')) {
                e.currentTarget.style.background = ''
                e.currentTarget.style.color = ''
              }
            }}
          >
            {icon}
            {label}
          </NavLink>
        ))}

        {/* Disabled items */}
        <div style={{
          fontSize: '9.5px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#444',
          padding: '16px 12px 6px',
        }}>
          Próximamente
        </div>

        {DISABLED_ITEMS.map(({ label, icon }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#444',
              cursor: 'not-allowed',
              userSelect: 'none',
            }}
          >
            {icon}
            {label}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid #2A2A2A',
      }}>
        <div style={{ fontSize: '11px', color: '#444' }}>Mai · Directora</div>
        <div style={{ fontSize: '10px', color: '#333', marginTop: '2px' }}>info@wearekyra.com</div>
      </div>
    </aside>
  )
}
