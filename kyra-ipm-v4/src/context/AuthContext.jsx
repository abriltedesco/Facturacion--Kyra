import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    api.get('/auth/session')
      .then(data => {
        if (mounted) setUser(data.user)
      })
      .catch(() => {
        if (mounted) setUser(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  async function signIn(email, password) {
    setError('')
    if (!email || !password) {
      const credentialsError = 'Ingresá un email y una clave válidos.'
      setError(credentialsError)
      throw new Error(credentialsError)
    }

    try {
      const data = await api.post('/auth/login', { email, password })
      setUser(data.user)
      return data.user
    } catch {
      const credentialsError = 'Email o clave incorrectos.'
      setError(credentialsError)
      throw new Error(credentialsError)
    }
  }

  async function signOut() {
    setError('')
    try {
      await api.post('/auth/logout')
    } catch {
      setError('No se pudo cerrar la sesión.')
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      signIn,
      signOut,
      clearError: () => setError(''),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return context
}
