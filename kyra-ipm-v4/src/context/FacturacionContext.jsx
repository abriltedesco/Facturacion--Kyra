// /src/context/FacturacionContext.jsx
// Estado compartido de líneas de facturación entre FacturacionMes y EmisionPage.

import { createContext, useContext, useState } from 'react'
import { LINEAS_INICIAL } from '../data/lineasFacturacion'

const FacturacionContext = createContext(null)

export function FacturacionProvider({ children }) {
  const [lineas, setLineas] = useState(LINEAS_INICIAL)
  // Historial de envíos generados en esta sesión — compartido entre todas las páginas
  const [historialEmail, setHistorialEmail] = useState([])

  function addHistorialEmail(registro) {
    setHistorialEmail(prev => [registro, ...prev])
  }

  return (
    <FacturacionContext.Provider value={{ lineas, setLineas, historialEmail, addHistorialEmail }}>
      {children}
    </FacturacionContext.Provider>
  )
}

export function useFacturacion() {
  const ctx = useContext(FacturacionContext)
  if (!ctx) throw new Error('useFacturacion debe usarse dentro de <FacturacionProvider>')
  return ctx
}
