import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createIpcAdjustmentRepository } from '../services/ipcAdjustmentRepository'

const IpcAdjustmentsContext = createContext(null)
const defaultRepository = supabase ? createIpcAdjustmentRepository(supabase) : null

export function IpcAdjustmentsProvider({ children, repository = defaultRepository }) {
  const [adjustments, setAdjustments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!repository) {
      setError('Supabase no está configurado.')
      setLoading(false)
      return []
    }
    if (!silent) setLoading(true)
    try {
      const next = await repository.list()
      setAdjustments(next)
      setError('')
      return next
    } catch (requestError) {
      setError(requestError.message || 'No se pudieron cargar los ajustes de IPC.')
      throw requestError
    } finally {
      if (!silent) setLoading(false)
    }
  }, [repository])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  function replaceAdjustment(saved) {
    setAdjustments(current => [saved, ...current.filter(a => a.id !== saved.id)])
    return saved
  }

  async function generateAdjustments(draft) {
    setError('')
    try {
      const generated = await repository.generate(draft)
      await refresh({ silent: true })
      return generated
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function saveAdjustment(adjustmentDraft) {
    setError('')
    try {
      return replaceAdjustment(await repository.save(adjustmentDraft))
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function approveAdjustment(adjustmentDraft, reason) {
    setError('')
    try {
      return replaceAdjustment(await repository.approve(adjustmentDraft, reason))
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function rejectAdjustment(adjustmentDraft) {
    setError('')
    try {
      return replaceAdjustment(await repository.reject(adjustmentDraft))
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  return (
    <IpcAdjustmentsContext.Provider value={{
      adjustments,
      loading,
      error,
      refresh,
      generateAdjustments,
      saveAdjustment,
      approveAdjustment,
      rejectAdjustment,
    }}>
      {children}
    </IpcAdjustmentsContext.Provider>
  )
}

export function useIpcAdjustments() {
  const context = useContext(IpcAdjustmentsContext)
  if (!context) throw new Error('useIpcAdjustments debe usarse dentro de <IpcAdjustmentsProvider>')
  return context
}
