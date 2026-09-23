import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import EntityFormModal from '../components/Entidades/EntityFormModal'
import EntityStatusDialog from '../components/Entidades/EntityStatusDialog'
import { useEntities } from '../context/EntitiesContext'
import { useClients } from '../context/ClientsContext'
import { useServices } from '../context/ServicesContext'
import { useProveedores } from '../context/ProveedoresContext'
import ClienteFormModal from '../components/Clientes/ClienteFormModal'
import ClienteStatusDialog from '../components/Clientes/ClienteStatusDialog'
import CatalogsModal from '../components/Clientes/CatalogsModal'
import ProveedorFormModal from '../components/Proveedores/ProveedorFormModal'
import ProveedorStatusDialog from '../components/Proveedores/ProveedorStatusDialog'
import ServiceCatalogFormModal from '../components/Servicios/ServiceCatalogFormModal'
import ServiceCatalogStatusDialog from '../components/Servicios/ServiceCatalogStatusDialog'
import { getArcaStatus } from '../domain/arca'

const TABS = ['Clientes', 'Proveedores', 'Entidades', 'Servicios']
const PAGE_SIZE = 10

// ── Mock data para Proveedores en /context/ProveedoresContext.jsx (Módulo 10 sin backend aún) ──

// ── Helpers para Clientes ──────────────────────────────────────────────────────

const CLIENT_STATUS_LABEL = { active: 'Activo', inactive: 'Inactivo', archived: 'Archivado' }
const PROVEEDOR_STATUS_LABEL = { active: 'Activo', inactive: 'Inactivo' }

// ── Helpers para Entidades ───────────────────────────────────────────────────

const ENTITY_TYPE_LABEL = {
  srl: 'SRL',
  monotributista: 'Monotributo personal',
  llc: 'LLC',
}

const ENTITY_VOUCHER_LABEL = {
  A: 'Factura A',
  B_EXEMPT: 'Factura B - Exento en IVA',
  C: 'Factura C',
  LLC: 'Invoice LLC',
}

const ENTITY_ARCA_LABEL = {
  valid: 'Vigente',
  expiring: 'Por vencer',
  expired: 'Vencido',
  missing: 'Sin cargar',
  not_applicable: 'No aplica',
}

const ENTITY_STATUS_LABEL = {
  active: 'Activa',
  inactive: 'Inactiva',
  archived: 'Archivada',
}

function EntityArcaBadge({ entity }) {
  const status = getArcaStatus(entity)
  return <span className={`entity-arca-badge entity-arca-${status}`}>{ENTITY_ARCA_LABEL[status]}</span>
}

const SERVICE_STATUS_LABEL = { active: 'Activo', inactive: 'Inactivo', archived: 'Archivado' }

// ── Sub-components ────────────────────────────────────────────────────────────

function Badge({ estado }) {
  const up = String(estado).toUpperCase()
  if (up === 'ACTIVO' || up === 'ACTIVA') return <span className="badge badge-activo">{estado}</span>
  if (up === 'INACTIVO' || up === 'INACTIVA') return <span className="badge badge-inactivo">{estado}</span>
  if (up === 'ARCHIVADO' || up === 'ARCHIVADA') return <span className="badge badge-archivado">{estado}</span>
  if (up === 'PENDIENTE') return <span className="badge badge-pendiente">{estado}</span>
  return <span className="badge">{estado}</span>
}

function FilterBox({ id, label, options, value, onChange }) {
  const labelId = id + '-label'
  return (
    <div className="filter-box" style={{ minWidth: 200 }}>
      <span id={labelId} className="filter-box-label">{label}</span>
      <select aria-labelledby={labelId} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Filtrar por {label.toLowerCase()}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Paginacion" className="pagination">
      <button className="page-btn" onClick={() => onChange(1)} disabled={page === 1} aria-label="Primera">«</button>
      <button className="page-btn" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Anterior">‹</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button key={p} className={'page-btn' + (p === page ? ' active' : '')}
          onClick={() => onChange(p)} aria-label={'Pagina ' + p} aria-current={p === page ? 'page' : undefined}>{p}</button>
      ))}
      <button className="page-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label="Siguiente">›</button>
      <button className="page-btn" onClick={() => onChange(totalPages)} disabled={page === totalPages} aria-label="Ultima">»</button>
    </nav>
  )
}

const SVG_EXPORT = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const SVG_IMPORT = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

// ── Main component ────────────────────────────────────────────────────────────

export default function Administracion() {
  const navigate = useNavigate()
  const {
    entities: managedEntities,
    loading: entitiesLoading,
    error: entitiesError,
    saveEntity,
    setEntityStatus,
  } = useEntities()
  const {
    clients: managedClients,
    countries,
    activeCountries,
    fiscalConditions,
    taxCategories,
    activeTaxCategories,
    loading: clientsLoading,
    error: clientsError,
    getFiscalConditionsByCountry,
    saveClient,
    setClientStatus,
    saveCountry,
    saveFiscalCondition,
    saveTaxCategory,
  } = useClients()
  const {
    catalog: servicios,
    loading: servicesLoading,
    error: servicesError,
    saveCatalog,
    setCatalogStatus,
  } = useServices()
  const { proveedores, saveProveedor, setProveedorStatus, deleteProveedor } = useProveedores()
  const [tab, setTab] = useState(0)
  const [editingServicio, setEditingServicio] = useState(null)
  const [editingManagedEntity, setEditingManagedEntity] = useState(null)
  const [entityStatusAction, setEntityStatusAction] = useState(null)
  const [changingEntityStatus, setChangingEntityStatus] = useState(false)
  const [editingCliente, setEditingCliente] = useState(null) // null = crear, objeto = editar
  const [clientStatusAction, setClientStatusAction] = useState(null)
  const [changingClientStatus, setChangingClientStatus] = useState(false)
  const [editingProveedor, setEditingProveedor] = useState(null)
  const [proveedorStatusAction, setProveedorStatusAction] = useState(null)
  const [serviceStatusAction, setServiceStatusAction] = useState(null)
  const [changingServiceStatus, setChangingServiceStatus] = useState(false)

  const [openModal, setOpenModal] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const [rowMenuOpen, setRowMenuOpen] = useState(null)
  const rowMenuRef = useRef(null)

  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [page, setPage] = useState(1)

  const btnNuevoRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => { document.title = 'Administración — IPM Kyra' }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return
    const close = e => {
      if (!dropdownRef.current?.contains(e.target) && !btnNuevoRef.current?.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showDropdown])

  // Close row menu on outside click
  useEffect(() => {
    const handler = e => {
      if (rowMenuRef.current && !rowMenuRef.current.contains(e.target)) setRowMenuOpen(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function openProveedorStatusAction(proveedor, action) {
    setProveedorStatusAction({ proveedor, action })
    setRowMenuOpen(null)
  }

  function confirmProveedorStatusAction() {
    const { proveedor, action } = proveedorStatusAction
    if (action === 'delete') {
      deleteProveedor(proveedor)
    } else {
      setProveedorStatus(proveedor, action === 'activate' ? 'active' : 'inactive')
    }
    setProveedorStatusAction(null)
  }

  function openClienteForm(client = null) {
    setEditingCliente(client)
    setOpenModal('cliente')
  }

  async function changeClientStatus(client, nextStatus) {
    setChangingClientStatus(true)
    try {
      await setClientStatus(client, nextStatus)
      setClientStatusAction(null)
      setRowMenuOpen(null)
    } finally {
      setChangingClientStatus(false)
    }
  }

  function openManagedEntityForm(entity = null) {
    setEditingManagedEntity(entity)
    setOpenModal('managed-entity')
  }

  async function changeManagedEntityStatus(entity, nextStatus) {
    setChangingEntityStatus(true)
    try {
      await setEntityStatus(entity, nextStatus)
      setEntityStatusAction(null)
      setRowMenuOpen(null)
    } finally {
      setChangingEntityStatus(false)
    }
  }

  const currentData = [managedClients, proveedores, managedEntities, servicios][tab]
  const STATUS_LABEL_BY_TAB = { 0: CLIENT_STATUS_LABEL, 1: PROVEEDOR_STATUS_LABEL, 2: ENTITY_STATUS_LABEL, 3: SERVICE_STATUS_LABEL }

  const filtered = currentData.filter(r => {
    const q = search.toLowerCase()
    const rowName = r.name || r.nombre || ''
    const rowEmail = r.primaryEmail || r.billingEmail || r.mail || r.email || ''
    const rowFiscalId = r.fiscalId || r.identificacionFiscal || r.identificacion || ''
    const accounts = r.bankAccounts || r.cuentas
    const cuentasStr = Array.isArray(accounts) ? accounts.map(c => c.bankName || c.banco || '').join(' ') : (r.cuentaBancaria || '')
    const matchSearch = !q
      || rowName.toLowerCase().includes(q)
      || rowEmail.toLowerCase().includes(q)
      || rowFiscalId.toLowerCase().includes(q)
      || cuentasStr.toLowerCase().includes(q)
    const status = r.status ? ((STATUS_LABEL_BY_TAB[tab] || {})[r.status] || r.status) : r.estado
    const matchEstado = !filtroEstado || String(status).toUpperCase() === filtroEstado.toUpperCase()
    return matchSearch && matchEstado
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleTabKey = (e, idx) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); const n = (idx + 1) % TABS.length; setTab(n); setPage(1); document.getElementById('atab-' + n)?.focus() }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); const n = (idx - 1 + TABS.length) % TABS.length; setTab(n); setPage(1); document.getElementById('atab-' + n)?.focus() }
    else if (e.key === 'Home') { e.preventDefault(); setTab(0); setPage(1); document.getElementById('atab-0')?.focus() }
    else if (e.key === 'End') { e.preventDefault(); const l = TABS.length - 1; setTab(l); setPage(1); document.getElementById('atab-' + l)?.focus() }
  }

  // Guardar handlers

  async function changeServiceCatalogStatus(service, nextStatus) {
    setChangingServiceStatus(true)
    try {
      await setCatalogStatus(service, nextStatus)
      setServiceStatusAction(null)
      setRowMenuOpen(null)
    } finally {
      setChangingServiceStatus(false)
    }
  }

  const closeModal = () => {
    setOpenModal(null)
    setEditingCliente(null)
    setEditingServicio(null)
    setEditingProveedor(null)
  }

  // Table columns per tab
  const renderTable = () => {
    if (tab === 0) return (
      <table>
        <thead><tr>
          <th scope="col">CLIENTE</th>
          <th scope="col">ESTADO</th>
          <th scope="col">MAIL</th>
          <th scope="col">TIPO FACTURA</th>
          <th scope="col">IMPUESTO ADICIONAL</th>
          <th scope="col">IDENTIFICACIÓN FISCAL</th>
          <th scope="col" style={{ width: 36 }}><span className="sr-only">Acciones</span></th>
        </tr></thead>
        <tbody>
          {pageRows.length === 0
            ? <tr><td colSpan={7} className="td-empty">{clientsLoading ? 'Cargando clientes…' : 'Sin resultados'}</td></tr>
            : pageRows.map(r => {
                const tipoLabel = r.billingEntity
                  ? (ENTITY_VOUCHER_LABEL[r.billingEntity.defaultVoucher] || '—') + ' — ' + r.billingEntity.name
                  : '—'
                return (
                  <tr key={r.id} className="tr-clickable" onClick={() => navigate(`/administracion/cliente/${r.id}`)}>
                    <td>
                      <span className="link-nro">{r.name}</span>
                      {r.ipcAdjustable && (
                        <span title="Actualización por IPC" style={{
                          marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#6366f1',
                          background: '#eef2ff', borderRadius: 4, padding: '1px 5px', verticalAlign: 'middle',
                        }}>IPC</span>
                      )}
                    </td>
                    <td><Badge estado={CLIENT_STATUS_LABEL[r.status] || r.status} /></td>
                    <td className="td-muted">{r.primaryEmail || '—'}</td>
                    <td className="td-muted" style={{ whiteSpace: 'nowrap' }}>{tipoLabel}</td>
                    <td>
                      {r.taxCategory
                        ? <span style={{
                            display: 'inline-block', padding: '2px 7px', borderRadius: 6,
                            fontSize: 11, fontWeight: 700, color: '#b45309', background: '#fef3c7',
                          }}>{r.taxCategory.taxRate}%</span>
                        : <span className="td-muted">—</span>
                      }
                    </td>
                    <td className="td-muted">{r.fiscalId || '—'}</td>
                    <td className="row-menu-cell" onClick={e => e.stopPropagation()}>
                      <button className="dots-btn" aria-label={'Opciones ' + r.name} aria-expanded={rowMenuOpen === r.id}
                        onClick={() => setRowMenuOpen(prev => prev === r.id ? null : r.id)}>⋮</button>
                      {rowMenuOpen === r.id && (
                        <div className="row-menu" ref={rowMenuRef} role="menu">
                          {r.status !== 'archived' && (
                            <button className="row-menu-item" role="menuitem" onClick={() => { openClienteForm(r); setRowMenuOpen(null) }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Editar
                            </button>
                          )}
                          {r.status === 'archived' ? (
                            <button className="row-menu-item" role="menuitem" onClick={() => { setClientStatusAction({ client: r, action: 'restore' }); setRowMenuOpen(null) }}>
                              Restaurar
                            </button>
                          ) : (
                            <>
                              <button className="row-menu-item" role="menuitem" onClick={() => { setClientStatusAction({ client: r, action: r.status === 'active' ? 'deactivate' : 'activate' }); setRowMenuOpen(null) }}>
                                {r.status === 'active' ? 'Desactivar' : 'Activar'}
                              </button>
                              <button className="row-menu-item row-menu-item-danger" role="menuitem" onClick={() => { setClientStatusAction({ client: r, action: 'archive' }); setRowMenuOpen(null) }}>
                                Archivar
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
          }
        </tbody>
      </table>
    )

    if (tab === 1) return (
      <table>
        <thead><tr>
          <th scope="col">NOMBRE</th><th scope="col">ESTADO</th>
          <th scope="col">MAIL</th><th scope="col">TIPO SERVICIO</th>
          <th scope="col">MEDIO DE PAGO</th><th scope="col">DESTINO</th>
          <th scope="col">CUIT</th><th scope="col" style={{ width: 36 }}><span className="sr-only">Acciones</span></th>
        </tr></thead>
        <tbody>
          {pageRows.length === 0
            ? <tr><td colSpan={8} className="td-empty">Sin resultados</td></tr>
            : pageRows.map(r => (
              <tr key={r.id} className="tr-clickable" onClick={() => navigate(`/administracion/proveedor/${r.id}`)}>
                <td><span className="link-nro">{r.nombre}</span></td>
                <td><Badge estado={PROVEEDOR_STATUS_LABEL[r.status] || r.status} /></td>
                <td className="td-muted">{r.mail}</td>
                <td className="td-muted">{r.tipoServicio}</td>
                <td className="td-muted">{r.medioPago}</td>
                <td className="td-muted">{r.destino}</td>
                <td className="td-muted">{r.cuit}</td>
                <td className="row-menu-cell" onClick={e => e.stopPropagation()}>
                  <button className="dots-btn" aria-label={'Opciones '+r.nombre} aria-expanded={rowMenuOpen===r.id}
                    onClick={() => setRowMenuOpen(prev => prev===r.id?null:r.id)}>⋮</button>
                  {rowMenuOpen === r.id && (
                    <div className="row-menu" ref={rowMenuRef} role="menu">
                      <button className="row-menu-item" role="menuitem" onClick={() => { setEditingProveedor(r); setOpenModal('proveedor'); setRowMenuOpen(null) }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Editar
                      </button>
                      <button className="row-menu-item" role="menuitem" onClick={() => openProveedorStatusAction(r, r.status === 'active' ? 'deactivate' : 'activate')}>
                        {r.status === 'active'
                          ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Desactivar</>
                          : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Activar</>
                        }
                      </button>
                      <button className="row-menu-item row-menu-item-danger" role="menuitem" onClick={() => openProveedorStatusAction(r, 'delete')}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    )

    if (tab === 2) return (
      <table>
        <thead><tr>
          <th scope="col">NOMBRE</th>
          <th scope="col">ESTADO</th>
          <th scope="col">TIPO</th>
          <th scope="col">CUENTA/S BANCARIA/S</th>
          <th scope="col">COMPROBANTE</th>
          <th scope="col">IDENTIFICACIÓN FISCAL</th>
          <th scope="col">ARCA</th>
          <th scope="col" style={{ width:36 }}><span className="sr-only">Acciones</span></th>
        </tr></thead>
        <tbody>
          {pageRows.length === 0
            ? <tr><td colSpan={8} className="td-empty">{entitiesLoading ? 'Cargando entidades…' : 'Sin resultados'}</td></tr>
            : pageRows.map(r => (
              <tr key={r.id} className="tr-clickable" onClick={() => navigate(`/administracion/entidad/${r.id}`)}>
                <td><span className="link-nro">{r.name}</span></td>
                <td><Badge estado={ENTITY_STATUS_LABEL[r.status] || r.status} /></td>
                <td className="td-muted">{ENTITY_TYPE_LABEL[r.legalType]}</td>
                <td className="td-muted">
                  {r.bankAccounts.length > 0
                    ? r.bankAccounts.map(account => (
                        <span key={account.id} style={{ display: 'block', lineHeight: 1.4 }}>
                          {account.bankName} <span style={{ fontSize: 10, opacity: 0.65 }}>({account.currency})</span>
                        </span>
                      ))
                    : '—'
                  }
                </td>
                <td className="td-muted">{ENTITY_VOUCHER_LABEL[r.defaultVoucher] || '—'}</td>
                <td className="td-muted">{r.fiscalId}</td>
                <td><EntityArcaBadge entity={r} /></td>
                <td className="row-menu-cell" onClick={e => e.stopPropagation()}>
                  <button className="dots-btn" aria-label={'Opciones '+r.name} aria-expanded={rowMenuOpen===r.id}
                    onClick={() => setRowMenuOpen(prev => prev===r.id?null:r.id)}>⋮</button>
                  {rowMenuOpen === r.id && (
                    <div className="row-menu" ref={rowMenuRef} role="menu">
                      {r.status !== 'archived' && (
                        <button className="row-menu-item" role="menuitem" onClick={() => { openManagedEntityForm(r); setRowMenuOpen(null) }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Editar
                        </button>
                      )}
                      {r.status === 'archived' ? (
                        <button className="row-menu-item" role="menuitem" onClick={() => { setEntityStatusAction({ entity: r, action: 'restore' }); setRowMenuOpen(null) }}>
                          Restaurar
                        </button>
                      ) : (
                        <>
                          <button className="row-menu-item" role="menuitem" onClick={() => { setEntityStatusAction({ entity: r, action: r.status === 'active' ? 'deactivate' : 'activate' }); setRowMenuOpen(null) }}>
                            {r.status === 'active' ? 'Desactivar' : 'Activar'}
                          </button>
                          <button className="row-menu-item row-menu-item-danger" role="menuitem" onClick={() => { setEntityStatusAction({ entity: r, action: 'archive' }); setRowMenuOpen(null) }}>
                            Archivar
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    )

    // tab === 3: Servicios (catálogo global — T13)
    return (
      <table>
        <thead><tr>
          <th scope="col">NOMBRE</th>
          <th scope="col">TIPO</th>
          <th scope="col">PRECIO BASE</th>
          <th scope="col">MONEDA</th>
          <th scope="col">CLIENTES ACTIVOS</th>
          <th scope="col">ESTADO</th>
          <th scope="col" style={{ width:36 }}><span className="sr-only">Acciones</span></th>
        </tr></thead>
        <tbody>
          {pageRows.length === 0
            ? <tr><td colSpan={7} className="td-empty">{servicesLoading ? 'Cargando servicios…' : 'Sin resultados'}</td></tr>
            : pageRows.map(r => (
              <tr key={r.id} className="tr-clickable" onClick={() => navigate(`/administracion/servicio/${r.id}`)}>
                <td><span className="link-nro">{r.name}</span></td>
                <td className="td-muted">{r.type === 'hourly' ? 'Por hora' : 'Fijo'}</td>
                <td>{r.basePrice === null ? '—' : r.basePrice.toLocaleString('es-AR')}</td>
                <td><span className="moneda-badge">{r.currency}</span></td>
                <td className="td-muted">{r.activeClientsCount ?? 0}</td>
                <td><Badge estado={SERVICE_STATUS_LABEL[r.status] || r.status} /></td>
                <td className="row-menu-cell" onClick={e => e.stopPropagation()}>
                  <button className="dots-btn" aria-label={'Opciones '+r.name} aria-expanded={rowMenuOpen===r.id}
                    onClick={() => setRowMenuOpen(prev => prev===r.id?null:r.id)}>⋮</button>
                  {rowMenuOpen === r.id && (
                    <div className="row-menu" ref={rowMenuRef} role="menu">
                      {r.status !== 'archived' && (
                        <button className="row-menu-item" role="menuitem" onClick={() => { setEditingServicio(r); setOpenModal('servicio'); setRowMenuOpen(null) }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Editar
                        </button>
                      )}
                      {r.status === 'archived' ? (
                        <button className="row-menu-item" role="menuitem" onClick={() => { setServiceStatusAction({ service: r, action: 'restore' }); setRowMenuOpen(null) }}>
                          Restaurar
                        </button>
                      ) : (
                        <>
                          <button className="row-menu-item" role="menuitem" onClick={() => { setServiceStatusAction({ service: r, action: r.status === 'active' ? 'deactivate' : 'activate' }); setRowMenuOpen(null) }}>
                            {r.status === 'active'
                              ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Desactivar</>
                              : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Activar</>
                            }
                          </button>
                          <button className="row-menu-item row-menu-item-danger" role="menuitem" onClick={() => { setServiceStatusAction({ service: r, action: 'archive' }); setRowMenuOpen(null) }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                            </svg>
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    )
  }

  return (
    <div>
      <h1 className="page-title">Administración</h1>

      {/* Single toolbar row: filter + search + export + import + NUEVO dropdown */}
      <div className="admin-toolbar">
        <FilterBox id="admin-estado" label="Estado"
          options={tab === 0 ? ['Activo', 'Inactivo', 'Archivado'] : tab === 1 ? ['Activo', 'Inactivo'] : tab === 2 ? ['Activa', 'Inactiva', 'Archivada'] : ['Activo', 'Inactivo', 'Archivado']}
          value={filtroEstado} onChange={v => { setFiltroEstado(v); setPage(1) }} />

        <div className="search-wrap">
          <label htmlFor="admin-search" className="sr-only">Buscar</label>
          <input id="admin-search" className="search-input" placeholder="Buscar"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          <span className="search-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
        </div>

        <div className="admin-toolbar-right">
          {tab === 0 && (
            <button className="btn-arca-secondary" onClick={() => setOpenModal('catalogos')}>Catálogos</button>
          )}
          <button className="icon-btn" aria-label="Exportar">{SVG_EXPORT}</button>
          <button className="icon-btn" aria-label="Importar">{SVG_IMPORT}</button>

          {/* NUEVO dropdown */}
          <div className="nuevo-dropdown-wrap" ref={dropdownRef}>
            <button
              ref={btnNuevoRef}
              className="btn-cta"
              aria-haspopup="true"
              aria-expanded={showDropdown}
              onClick={() => setShowDropdown(v => !v)}
            >
              NUEVO
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            {showDropdown && (
              <div className="nuevo-dropdown" role="menu">
                {[
                  { label: 'Nuevo cliente', action: () => { setTab(0); openClienteForm(null); setShowDropdown(false) } },
                  { label: 'Nuevo proveedor', action: () => { setTab(1); setEditingProveedor(null); setOpenModal('proveedor'); setShowDropdown(false) } },
                  { label: 'Nueva entidad', action: () => { setTab(2); openManagedEntityForm(); setShowDropdown(false) } },
                  { label: 'Nuevo servicio', action: () => { setTab(3); setEditingServicio(null); setOpenModal('servicio'); setShowDropdown(false) } },
                ].map(item => (
                  <button key={item.label} role="menuitem" className="nuevo-dropdown-item" onClick={item.action}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Secciones de administracion" className="subtabs">
        {TABS.map((t, idx) => (
          <button
            key={t}
            id={'atab-' + idx}
            role="tab"
            aria-selected={tab === idx}
            aria-controls="atab-panel"
            tabIndex={tab === idx ? 0 : -1}
            className={'subtab' + (tab === idx ? ' active' : '')}
            onClick={() => { setTab(idx); setPage(1); setFiltroEstado(''); setSearch('') }}
            onKeyDown={e => handleTabKey(e, idx)}
          >{t}</button>
        ))}
      </div>

      {/* Table panel */}
      <div id="atab-panel" role="tabpanel" aria-labelledby={'atab-' + tab} className="table-container">
        {tab === 0 && clientsError && <div className="admin-data-error" role="alert">{clientsError}</div>}
        {tab === 2 && entitiesError && <div className="admin-data-error" role="alert">{entitiesError}</div>}
        {tab === 3 && servicesError && <div className="admin-data-error" role="alert">{servicesError}</div>}
        {renderTable()}
        <Pagination page={page} totalPages={totalPages} onChange={p => setPage(p)} />
      </div>

      <ClienteFormModal
        isOpen={openModal === 'cliente'}
        client={editingCliente}
        onClose={closeModal}
        onSave={saveClient}
        onSaved={() => { setOpenModal(null); setEditingCliente(null); setTab(0) }}
        triggerRef={btnNuevoRef}
        billingEntities={managedEntities.filter(e => e.status === 'active')}
        countries={activeCountries}
        getFiscalConditionsByCountry={getFiscalConditionsByCountry}
        taxCategories={activeTaxCategories}
      />

      <ProveedorFormModal
        isOpen={openModal === 'proveedor'}
        proveedor={editingProveedor}
        onClose={closeModal}
        onSave={saveProveedor}
        onSaved={() => { setOpenModal(null); setEditingProveedor(null); setTab(1) }}
        triggerRef={btnNuevoRef}
      />

      <EntityFormModal
        isOpen={openModal === 'managed-entity'}
        entity={editingManagedEntity}
        onClose={closeModal}
        onSave={saveEntity}
        onSaved={() => { setOpenModal(null); setEditingManagedEntity(null); setTab(2) }}
        triggerRef={btnNuevoRef}
      />

      <EntityStatusDialog
        entity={entityStatusAction?.entity || null}
        action={entityStatusAction?.action || null}
        busy={changingEntityStatus}
        onCancel={() => setEntityStatusAction(null)}
        onConfirm={nextStatus => changeManagedEntityStatus(entityStatusAction.entity, nextStatus).catch(() => {})}
      />

      <ClienteStatusDialog
        client={clientStatusAction?.client || null}
        action={clientStatusAction?.action || null}
        busy={changingClientStatus}
        onCancel={() => setClientStatusAction(null)}
        onConfirm={nextStatus => changeClientStatus(clientStatusAction.client, nextStatus).catch(() => {})}
      />

      <ProveedorStatusDialog
        proveedor={proveedorStatusAction?.proveedor || null}
        action={proveedorStatusAction?.action || null}
        onCancel={() => setProveedorStatusAction(null)}
        onConfirm={confirmProveedorStatusAction}
      />

      <ServiceCatalogStatusDialog
        service={serviceStatusAction?.service || null}
        action={serviceStatusAction?.action || null}
        busy={changingServiceStatus}
        onCancel={() => setServiceStatusAction(null)}
        onConfirm={nextStatus => changeServiceCatalogStatus(serviceStatusAction.service, nextStatus).catch(() => {})}
      />

      <CatalogsModal
        isOpen={openModal === 'catalogos'}
        onClose={closeModal}
        countries={countries}
        fiscalConditions={fiscalConditions}
        taxCategories={taxCategories}
        onSaveCountry={saveCountry}
        onSaveFiscalCondition={saveFiscalCondition}
        onSaveTaxCategory={saveTaxCategory}
      />

      <ServiceCatalogFormModal
        isOpen={openModal === 'servicio'}
        service={editingServicio}
        onClose={closeModal}
        onSave={saveCatalog}
        onSaved={() => { setOpenModal(null); setEditingServicio(null); setTab(3) }}
        triggerRef={btnNuevoRef}
      />
    </div>
  )
}
