import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createEntityRepository } from '../services/entityRepository'

const EntitiesContext = createContext(null)
const defaultRepository = supabase ? createEntityRepository(supabase) : null

function sortEntities(entities) {
  return [...entities].sort((left, right) => left.name.localeCompare(right.name, 'es'))
}

export function EntitiesProvider({ children, repository = defaultRepository }) {
  const [entities, setEntities] = useState([])
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
      const nextEntities = await repository.list()
      setEntities(sortEntities(nextEntities))
      setError('')
      return nextEntities
    } catch (requestError) {
      setError(requestError.message || 'No se pudieron cargar las entidades.')
      throw requestError
    } finally {
      if (!silent) setLoading(false)
    }
  }, [repository])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  useEffect(() => {
    const handleFocus = () => refresh({ silent: true }).catch(() => {})
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refresh])

  function replaceEntity(savedEntity) {
    setEntities(current => sortEntities([
      savedEntity,
      ...current.filter(entity => entity.id !== savedEntity.id),
    ]))
    return savedEntity
  }

  async function saveEntity(entity) {
    setError('')
    try {
      return replaceEntity(await repository.save(entity))
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function setEntityStatus(entity, status) {
    setError('')
    try {
      return replaceEntity(await repository.setStatus(entity, status))
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function uploadArcaDocument(entityId, file, expirationDate) {
    setError('')
    try {
      return replaceEntity(await repository.uploadArcaDocument(entityId, file, expirationDate))
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function revokeArcaDocument(entityId, documentId) {
    setError('')
    try {
      return replaceEntity(await repository.revokeArcaDocument(entityId, documentId))
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  const activeEntities = entities.filter(entity => entity.status === 'active')

  return (
    <EntitiesContext.Provider value={{
      entities,
      activeEntities,
      loading,
      error,
      refresh,
      getEntity: id => entities.find(entity => entity.id === Number(id)) || null,
      saveEntity,
      setEntityStatus,
      uploadArcaDocument,
      revokeArcaDocument,
      createDocumentUrl: (...args) => repository.createDocumentUrl(...args),
    }}>
      {children}
    </EntitiesContext.Provider>
  )
}

export function useEntities() {
  const context = useContext(EntitiesContext)
  if (!context) throw new Error('useEntities debe usarse dentro de <EntitiesProvider>')
  return context
}