import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createServiceRepository } from '../services/serviceRepository'

const ServicesContext = createContext(null)
const defaultRepository = supabase ? createServiceRepository(supabase) : null

function sortByName(items) {
  return [...items].sort((left, right) => left.name.localeCompare(right.name, 'es'))
}

export function ServicesProvider({ children, repository = defaultRepository }) {
  const [catalog, setCatalog] = useState([])
  const [clientServices, setClientServices] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshCatalog = useCallback(async ({ silent = false } = {}) => {
    if (!repository) {
      setError('Supabase no está configurado.')
      setLoading(false)
      return []
    }
    if (!silent) setLoading(true)
    try {
      const nextCatalog = await repository.listCatalog()
      setCatalog(sortByName(nextCatalog))
      setError('')
      return nextCatalog
    } catch (requestError) {
      setError(requestError.message || 'No se pudo cargar el catálogo de servicios.')
      throw requestError
    } finally {
      if (!silent) setLoading(false)
    }
  }, [repository])

  useEffect(() => {
    refreshCatalog().catch(() => {})
  }, [refreshCatalog])

  const loadClientServices = useCallback(async (clientId, { silent = false } = {}) => {
    if (!repository || !clientId) return []
    try {
      const services = await repository.listByClient(clientId)
      setClientServices(current => ({ ...current, [clientId]: sortByName(services) }))
      if (!silent) setError('')
      return services
    } catch (requestError) {
      setError(requestError.message || 'No se pudieron cargar los servicios del cliente.')
      throw requestError
    }
  }, [repository])

  async function saveCatalog(catalogDraft, reason) {
    setError('')
    try {
      const savedCatalog = await repository.saveCatalog(catalogDraft, reason)
      await refreshCatalog({ silent: true })
      return savedCatalog
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function setCatalogStatus(catalogDraft, status) {
    setError('')
    try {
      const savedCatalog = await repository.setCatalogStatus(catalogDraft, status)
      await refreshCatalog({ silent: true })
      return savedCatalog
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  function replaceClientService(clientId, savedService) {
    setClientServices(current => ({
      ...current,
      [clientId]: sortByName([
        savedService,
        ...(current[clientId] || []).filter(service => service.id !== savedService.id),
      ]),
    }))
    return savedService
  }

  async function saveClientService(serviceDraft, reason) {
    setError('')
    try {
      const savedService = await repository.saveClientService(serviceDraft, reason)
      return replaceClientService(savedService.clientId, savedService)
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function setClientServiceStatus(serviceDraft, status) {
    setError('')
    try {
      const savedService = await repository.setClientServiceStatus(serviceDraft, status)
      return replaceClientService(savedService.clientId, savedService)
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  const activeCatalog = catalog.filter(service => service.status === 'active')

  return (
    <ServicesContext.Provider value={{
      catalog,
      activeCatalog,
      loading,
      error,
      refreshCatalog,
      loadClientServices,
      getClientServices: clientId => clientServices[clientId] || [],
      saveCatalog,
      setCatalogStatus,
      saveClientService,
      setClientServiceStatus,
      listCatalogPriceHistory: catalogId => repository.listCatalogPriceHistory(catalogId),
    }}>
      {children}
    </ServicesContext.Provider>
  )
}

export function useServices() {
  const context = useContext(ServicesContext)
  if (!context) throw new Error('useServices debe usarse dentro de <ServicesProvider>')
  return context
}
