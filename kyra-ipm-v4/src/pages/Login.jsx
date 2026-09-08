import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { session, signIn, error, clearError, isConfigured } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    document.title = 'Ingresar — IPM Kyra'
    return clearError
  }, [])

  if (session) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await signIn(username, password)
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch {
      // AuthContext exposes a generic, non-enumerating message.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand" aria-label="Kyra">
        <div className="login-brand-kicker">WE ARE</div>
        <div className="login-brand-name">'Kyra</div>
        <p>IPM · Gestión de facturación</p>
      </section>

      <section className="login-access">
        <div className="login-form-wrap">
          <div className="login-eyebrow">ACCESO INTERNO</div>
          <h1>Ingresar</h1>
          <p className="login-intro">Usá las credenciales asignadas por administración.</p>

          {!isConfigured && (
            <div className="login-config-error" role="alert">
              Falta configurar la conexión con Supabase. Revisá las variables de entorno del proyecto.
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" aria-busy={submitting}>
            <div className="form-group">
              <label htmlFor="login-username">Usuario</label>
              <input
                id="login-username"
                className="form-input login-input"
                value={username}
                onChange={event => { setUsername(event.target.value); clearError() }}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                disabled={!isConfigured || submitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Clave</label>
              <input
                id="login-password"
                className="form-input login-input"
                type="password"
                value={password}
                onChange={event => { setPassword(event.target.value); clearError() }}
                autoComplete="current-password"
                disabled={!isConfigured || submitting}
                required
              />
            </div>

            {error && <div className="login-error" role="alert">{error}</div>}

            <button className="login-submit" type="submit" disabled={!isConfigured || submitting}>
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}