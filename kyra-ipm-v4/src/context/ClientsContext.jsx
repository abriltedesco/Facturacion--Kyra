import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createClientRepository } from '../services/clientRepository'

const ClientsContext = createContext(null)
const defaultRepository = supabase ? createClientRepository(supabase) : null

function sortByName(items) {
  return [...items].sort((left, right) => left.name.localeCompare(right.name, 'es'))
}

export function ClientsProvider({ children, repository = defaultRepository }) {
  const [clients, setClients] = useState([])
  const [countries, setCountries] = useState([])
  const [fiscalConditions, setFiscalConditions] = useState([])
  const [taxCategories, setTaxCategories] = useState([])
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
      const [nextClients, nextCountries, nextFiscalConditions, nextTaxCategories] = await Promise.all([
        repository.list(),
        repository.listCountries(),
        repository.listFiscalConditions(),
        repository.listTaxCategories(),
      ])
      setClients(sortByName(nextClients))
      setCountries(sortByName(nextCountries))
      setFiscalConditions(sortByName(nextFiscalConditions))
      setTaxCategories(sortByName(nextTaxCategories))
      setError('')
      return nextClients
    } catch (requestError) {
      setError(requestError.message || 'No se pudieron cargar los clientes.')
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

  function replaceClient(savedClient) {
    setClients(current => sortByName([
      savedClient,
      ...current.filter(client => client.id !== savedClient.id),
    ]))
    return savedClient
  }

  async function saveClient(clientDraft) {
    setError('')
    try {
      return replaceClient(await repository.save(clientDraft))
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function setClientStatus(clientDraft, status) {
    setError('')
    try {
      return replaceClient(await repository.setStatus(clientDraft, status))
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function saveCountry(country) {
    setError('')
    try {
      const savedCountry = await repository.saveCountry(country)
      setCountries(current => sortByName([savedCountry, ...current.filter(item => item.id !== savedCountry.id)]))
      return savedCountry
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function saveFiscalCondition(condition) {
    setError('')
    try {
      const savedCondition = await repository.saveFiscalCondition(condition)
      setFiscalConditions(current => sortByName([savedCondition, ...current.filter(item => item.id !== savedCondition.id)]))
      return savedCondition
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function saveTaxCategory(category) {
    setError('')
    try {
      const savedCategory = await repository.saveTaxCategory(category)
      setTaxCategories(current => sortByName([savedCategory, ...current.filter(item => item.id !== savedCategory.id)]))
      return savedCategory
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  const activeClients = clients.filter(client => client.status === 'active')
  const activeCountries = countries.filter(country => country.active)
  const activeTaxCategories = taxCategories.filter(category => category.active)

  return (
    <ClientsContext.Provider value={{
      clients,
      activeClients,
      countries,
      activeCountries,
      fiscalConditions,
      taxCategories,
      activeTaxCategories,
      loading,
      error,
      refresh,
      getClient: id => clients.find(client => client.id === Number(id)) || null,
      getFiscalConditionsByCountry: countryId => fiscalConditions.filter(
        condition => condition.countryId === Number(countryId) && condition.active,
      ),
      saveClient,
      setClientStatus,
      saveCountry,
      saveFiscalCondition,
      saveTaxCategory,
    }}>
      {children}
    </ClientsContext.Provider>
  )
}

export function useClients() {
  const context = useContext(ClientsContext)
  if (!context) throw new Error('useClients debe usarse dentro de <ClientsProvider>')
  return context
}
