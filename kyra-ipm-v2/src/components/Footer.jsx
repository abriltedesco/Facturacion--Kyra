import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <div className="footer-logo">
          'Kyra
          <span style={{ color: 'var(--gray-300)', fontFamily: 'sans-serif', fontSize: 20, fontWeight: 300 }}>|</span>
          <span className="footer-social">
            {/* Facebook */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            {/* Twitter/X */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
            {/* Instagram */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </span>
        </div>
      </div>

      <div className="footer-nav">
        <Link to="/administracion">Administración</Link>
        <span className="footer-sep">|</span>
        <Link to="/ingresos">Ingresos</Link>
        <span className="footer-sep">|</span>
        <Link to="/egresos">Egresos</Link>
        <span className="footer-sep">|</span>
        <Link to="/emails">Emails</Link>
      </div>

      <div className="footer-copy">© 2026 Todos los derechos reservados.</div>
    </footer>
  )
}
