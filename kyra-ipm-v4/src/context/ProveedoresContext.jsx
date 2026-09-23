import { createContext, useContext, useState } from 'react'

const ProveedoresContext = createContext(null)

const PROVEEDORES_DATA = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  nombre: ['AWS Services', 'Google Workspace', 'Adobe Inc', 'Slack Corp', 'Figma Inc', 'Notion', 'Vercel', 'GitHub', 'Linear', 'Loom'][i],
  status: 'active',
  mail: ['aws', 'google.ws', 'adobe', 'slack', 'figma', 'notion', 'vercel', 'github', 'linear', 'loom'][i] + '@empresa.com',
  tipoServicio: ['Cloud', 'SaaS', 'Diseño', 'Comunicación', 'Diseño', 'Productividad', 'Dev', 'Dev', 'Gestión', 'Video'][i],
  medioPago: 'Transferencia',
  destino: 'CBU 123456789',
  cuit: '30-' + String(61234567 + i * 1234567) + '-8',
}))

// Módulo 10 (Compras y proveedores) todavía no tiene backend: estado 100% local en memoria.
export function ProveedoresProvider({ children }) {
  const [proveedores, setProveedores] = useState(PROVEEDORES_DATA)

  function saveProveedor(draft) {
    if (draft.id) {
      setProveedores(prev => prev.map(p => p.id === draft.id ? { ...p, ...draft } : p))
      return { ...draft }
    }
    const created = { ...draft, id: Date.now(), status: 'active' }
    setProveedores(prev => [created, ...prev])
    return created
  }

  function setProveedorStatus(proveedor, status) {
    setProveedores(prev => prev.map(p => p.id === proveedor.id ? { ...p, status } : p))
  }

  function deleteProveedor(proveedor) {
    setProveedores(prev => prev.filter(p => p.id !== proveedor.id))
  }

  return (
    <ProveedoresContext.Provider value={{
      proveedores,
      getProveedor: id => proveedores.find(p => p.id === Number(id)) || null,
      saveProveedor,
      setProveedorStatus,
      deleteProveedor,
    }}>
      {children}
    </ProveedoresContext.Provider>
  )
}

export function useProveedores() {
  const context = useContext(ProveedoresContext)
  if (!context) throw new Error('useProveedores debe usarse dentro de <ProveedoresProvider>')
  return context
}
