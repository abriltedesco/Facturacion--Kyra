// /src/context/FacturacionContext.jsx
// Estado compartido de líneas de facturación entre FacturacionMes y EmisionPage.
// `lineas`/`setLineas` se mantienen para no romper EmisionPage.jsx (Módulo 6, aún
// simulado); las transiciones propias del Módulo 5 (generar/aprobar/editar/excluir/
// rechazar/marcar emitida/enviada) persisten contra Supabase.

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createBillingLineRepository } from '../services/billingLineRepository'

const FacturacionContext = createContext(null)
const defaultRepository = supabase ? createBillingLineRepository(supabase) : null

export function FacturacionProvider({ children, repository = defaultRepository }) {
  const [lineas, setLineas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Historial de envíos generados en esta sesión — compartido entre todas las páginas
  const [historialEmail, setHistorialEmail] = useState([])

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!repository) {
      setError('Supabase no está configurado.')
      setLoading(false)
      return []
    }
    if (!silent) setLoading(true)
    try {
      const next = await repository.list()
      setLineas(next)
      setError('')
      return next
    } catch (requestError) {
      setError(requestError.message || 'No se pudieron cargar las líneas de facturación.')
      throw requestError
    } finally {
      if (!silent) setLoading(false)
    }
  }, [repository])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  function addHistorialEmail(registro) {
    setHistorialEmail(prev => [registro, ...prev])
  }

  function replaceLinea(savedLinea) {
    setLineas(current => current.map(l => l.id === savedLinea.id ? { ...l, ...savedLinea } : l))
    return savedLinea
  }

  async function generarLineas(periodMonth, periodYear) {
    setError('')
    try {
      await repository.generate(periodMonth, periodYear)
      await refresh({ silent: true })
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function agregarLineaManual(draft) {
    setError('')
    try {
      const created = await repository.createManual(draft)
      setLineas(current => [created, ...current])
      return created
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function editarLinea(linea, cambios) {
    setError('')
    try {
      return replaceLinea(await repository.edit(linea, cambios))
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function aprobarLinea(linea, cambios) {
    setError('')
    try {
      return replaceLinea(await repository.approve(linea, cambios))
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function excluirLinea(linea) {
    setError('')
    try {
      return replaceLinea(await repository.exclude(linea))
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function rechazarLinea(linea) {
    setError('')
    try {
      return replaceLinea(await repository.reject(linea))
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function marcarEmitida(linea, datos) {
    setError('')
    try {
      return replaceLinea(await repository.markIssued(linea, datos))
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function marcarEnviada(linea) {
    setError('')
    try {
      return replaceLinea(await repository.markSent(linea))
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  return (
    <FacturacionContext.Provider value={{
      lineas, setLineas, loading, error, refresh,
      generarLineas, agregarLineaManual, editarLinea, aprobarLinea, excluirLinea, rechazarLinea,
      marcarEmitida, marcarEnviada,
      historialEmail, addHistorialEmail,
    }}>
      {children}
    </FacturacionContext.Provider>
  )
}

export function useFacturacion() {
  const ctx = useContext(FacturacionContext)
  if (!ctx) throw new Error('useFacturacion debe usarse dentro de <FacturacionProvider>')
  return ctx
}

