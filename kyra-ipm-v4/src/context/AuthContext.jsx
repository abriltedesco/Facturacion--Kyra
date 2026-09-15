import { createContext, useContext, useEffect, useState } from 'react'
import { usernameToTechnicalEmail } from '../domain/authIdentity'
import { authEmailDomain, isSupabaseConfigured, supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return undefined
    }

    let mounted = true
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return
      if (sessionError) setError('No se pudo restaurar la sesión.')
      setSession(data.session)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  async function signIn(username, password) {
    setError('')
    if (!supabase) {
      const configurationError = 'Supabase no está configurado.'
      setError(configurationError)
      throw new Error(configurationError)
    }

    const email = usernameToTechnicalEmail(username, authEmailDomain)
    if (!email || !password) {
      const credentialsError = 'Ingresá un usuario y una clave válidos.'
      setError(credentialsError)
      throw new Error(credentialsError)
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !data.session) {
      const credentialsError = 'Usuario o clave incorrectos.'
      setError(credentialsError)
      throw new Error(credentialsError)
    }

    setSession(data.session)
    return data.session
  }

  async function signOut() {
    setError('')
    if (!supabase) return
    const { error: authError } = await supabase.auth.signOut()
    if (authError) {
      setError('No se pudo cerrar la sesión.')
      throw authError
    }
    setSession(null)
  }

  const metadata = session?.user?.user_metadata || {}
  const user = session?.user
    ? {
        id: session.user.id,
        username: metadata.username || session.user.email?.split('@')[0] || '',
        displayName: metadata.display_name || metadata.username || session.user.email?.split('@')[0] || '',
      }
    : null

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      error,
      isConfigured: isSupabaseConfigured,
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