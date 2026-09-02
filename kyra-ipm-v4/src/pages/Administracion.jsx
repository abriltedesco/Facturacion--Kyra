import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import EntityFormModal from '../components/Entidades/EntityFormModal'
import { useEntities } from '../context/EntitiesContext'
import { getArcaStatus } from '../domain/arca'
import { CLIENTES_INICIAL } from '../data/clientes'

const TABS = ['Clientes', 'Proveedores', 'Entidades', 'Servicios']
const PAGE_SIZE = 10

// ── Mock data for each tab ──────────────────────────────────────────────────

// ── Helpers para Clientes ──────────────────────────────────────────────────────

const PAISES = ['Argentina', 'Colombia', 'Costa Rica', 'Otro']

const CONDICION_FISCAL_POR_PAIS = {
  Argentina:    ['Responsable Inscripto', 'Monotributista', 'Exento'],
  Colombia:     ['Régimen Común', 'Régimen Simplificado'],
  'Costa Rica': ['Régimen Tradicional', 'Régimen Simplificado'],
}

const LABEL_ID_FISCAL = {
  Argentina:    'CUIT',
  Colombia:     'NIT',
  'Costa Rica': 'Tax ID',
  Otro:         'Tax ID',
}

/**
 * Tipos de factura disponibles según el tipo de entidad emisora.
 * Clave = `legalType` normalizado por el repositorio de entidades.
 */
const TIPOS_FACTURA_BY_ENTIDAD_TIPO = {
  srl:            ['A', 'B (Exento IVA)'],
  monotributista: ['C'],
  llc:            ['Invoice LLC'],
}

/** Normaliza el tipo de comprobante de entidad al código corto que usa el cliente */
function comprobanteToTipo(comprobante) {
  if (!comprobante) return ''
  if (comprobante === 'A') return 'A'
  if (comprobante === 'B_EXEMPT') return 'B (Exento IVA)'
  if (comprobante === 'C') return 'C'
  if (comprobante === 'LLC') return 'Invoice LLC'
  if (comprobante.startsWith('Factura A')) return 'A'
  if (comprobante.startsWith('Factura B')) return 'B (Exento IVA)'
  if (comprobante.startsWith('Factura C')) return 'C'
  if (comprobante.startsWith('Invoice'))   return 'Invoice LLC'
  return comprobante
}

const PROVEEDORES_DATA = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  nombre: ['AWS Services', 'Google Workspace', 'Adobe Inc', 'Slack Corp', 'Figma Inc', 'Notion', 'Vercel', 'GitHub', 'Linear', 'Loom'][i],
  estado: 'PENDIENTE',
  mail: ['aws', 'google.ws', 'adobe', 'slack', 'figma', 'notion', 'vercel', 'github', 'linear', 'loom'][i] + '@empresa.com',
  tipoServicio: ['Cloud', 'SaaS', 'Diseño', 'Comunicación', 'Diseño', 'Productividad', 'Dev', 'Dev', 'Gestión', 'Video'][i],
  medioPago: 'Transferencia',
  destino: 'CBU 123456789',
  cuit: '30-' + String(61234567 + i * 1234567) + '-8',
}))

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

function EntityArcaBadge({ entity }) {
  const status = getArcaStatus(entity)
  return <span className={`entity-arca-badge entity-arca-${status}`}>{ENTITY_ARCA_LABEL[status]}</span>
}

const SERVICIOS_DATA = [
  { id: 1,  nombre: 'Social Media',     tipo: 'Fijo',     precioBase: '$85,000',  moneda: 'ARS', clientesActivos: 6, estado: 'Activo',
    historialPrecios: [
      { fecha: '2026-08-01', precio: 85000, motivo: 'Ajuste IPC' },
      { fecha: '2026-02-01', precio: 74000, motivo: 'Ajuste IPC' },
      { fecha: '2025-08-01', precio: 64000, motivo: 'Ajuste IPC' },
      { fecha: '2025-02-01', precio: 56000, motivo: 'Ajuste IPC' },
      { fecha: '2024-08-01', precio: 48000, motivo: 'Ajuste IPC' },
      { fecha: '2024-02-01', precio: 40000, motivo: 'Precio inicial' },
    ] },
  { id: 2,  nombre: 'Diseño UX/UI',     tipo: 'Fijo',     precioBase: '$120,000', moneda: 'ARS', clientesActivos: 3, estado: 'Activo',
    historialPrecios: [
      { fecha: '2026-08-01', precio: 120000, motivo: 'Ajuste IPC' },
      { fecha: '2026-02-01', precio: 104000, motivo: 'Ajuste IPC' },
      { fecha: '2025-08-01', precio: 90000,  motivo: 'Ajuste IPC' },
      { fecha: '2025-02-01', precio: 78000,  motivo: 'Ajuste IPC' },
      { fecha: '2024-08-01', precio: 67000,  motivo: 'Ajuste IPC' },
      { fecha: '2024-02-01', precio: 58000,  motivo: 'Precio inicial' },
    ] },
  { id: 3,  nombre: 'Dev a medida',     tipo: 'Por hora',  precioBase: '—',        moneda: 'ARS', clientesActivos: 2, estado: 'Activo',   historialPrecios: [] },
  { id: 4,  nombre: 'Reporting',        tipo: 'Fijo',     precioBase: '$4,500',   moneda: 'USD', clientesActivos: 1, estado: 'Activo',
    historialPrecios: [
      { fecha: '2026-06-01', precio: 4500, motivo: 'Ajuste tarifario' },
      { fecha: '2025-01-01', precio: 4000, motivo: 'Precio inicial' },
    ] },
  { id: 5,  nombre: 'Consultoría',      tipo: 'Por hora',  precioBase: '—',        moneda: 'ARS', clientesActivos: 2, estado: 'Activo',   historialPrecios: [] },
  { id: 6,  nombre: 'SEO',             tipo: 'Fijo',     precioBase: '$60,000',  moneda: 'ARS', clientesActivos: 4, estado: 'Activo',
    historialPrecios: [
      { fecha: '2026-08-01', precio: 60000, motivo: 'Ajuste IPC' },
      { fecha: '2026-02-01', precio: 52000, motivo: 'Ajuste IPC' },
      { fecha: '2025-08-01', precio: 45000, motivo: 'Ajuste IPC' },
      { fecha: '2025-02-01', precio: 39000, motivo: 'Ajuste IPC' },
      { fecha: '2024-08-01', precio: 33000, motivo: 'Ajuste IPC' },
      { fecha: '2024-02-01', precio: 28000, motivo: 'Precio inicial' },
    ] },
  { id: 7,  nombre: 'Branding',        tipo: 'Fijo',     precioBase: '$250,000', moneda: 'ARS', clientesActivos: 1, estado: 'Activo',
    historialPrecios: [
      { fecha: '2026-08-01', precio: 250000, motivo: 'Ajuste IPC' },
      { fecha: '2026-02-01', precio: 217000, motivo: 'Ajuste IPC' },
      { fecha: '2025-08-01', precio: 188000, motivo: 'Ajuste IPC' },
    ] },
  { id: 8,  nombre: 'Email Marketing', tipo: 'Fijo',     precioBase: '$65,000',  moneda: 'ARS', clientesActivos: 3, estado: 'Activo',
    historialPrecios: [
      { fecha: '2026-08-01', precio: 65000, motivo: 'Ajuste IPC' },
      { fecha: '2026-02-01', precio: 56000, motivo: 'Ajuste IPC' },
      { fecha: '2025-08-01', precio: 49000, motivo: 'Precio inicial' },
    ] },
  { id: 9,  nombre: 'SEM',             tipo: 'Fijo',     precioBase: '$75,000',  moneda: 'ARS', clientesActivos: 2, estado: 'Inactivo',
    historialPrecios: [
      { fecha: '2026-04-01', precio: 75000, motivo: 'Último ajuste' },
      { fecha: '2025-10-01', precio: 65000, motivo: 'Ajuste IPC' },
    ] },
  { id: 10, nombre: 'Contenido',       tipo: 'Fijo',     precioBase: '$70,000',  moneda: 'ARS', clientesActivos: 5, estado: 'Activo',
    historialPrecios: [
      { fecha: '2026-08-01', precio: 70000, motivo: 'Ajuste IPC' },
      { fecha: '2026-02-01', precio: 61000, motivo: 'Ajuste IPC' },
      { fecha: '2025-08-01', precio: 53000, motivo: 'Ajuste IPC' },
      { fecha: '2025-02-01', precio: 46000, motivo: 'Precio inicial' },
    ] },
]

// ── Forms ────────────────────────────────────────────────────────────────────

const EMPTY_CLIENTE = {
  nombre: '', email: '', pais: '', condicionFiscal: '',
  identificacionFiscal: '', entidadEmisoraId: '', tipoFactura: '',
  periodoCierreMes: true, impuestoAdicional: '',
  actualizacionIPC: false, carpetaDrive: '', contacto: '', notas: '',
}
const EMPTY_PROVEEDOR = { nombre: '', email: '', tipoServicio: '', metodoPago: '', destino: '', cuit: '' }
const EMPTY_SERVICIO  = { nombre: '', tipoSvc: 'Fijo', precioBase: '', moneda: 'ARS', estadoInicial: true }

// ── Sub-components ────────────────────────────────────────────────────────────

function Badge({ estado }) {
  const up = String(estado).toUpperCase()
  if (up === 'ACTIVO' || up === 'ACTIVA') return <span className="badge badge-activo">{estado}</span>
  if (up === 'INACTIVO' || up === 'INACTIVA') return <span className="badge badge-inactivo">{estado}</span>
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
  const [tab, setTab] = useState(0)
  const [clientes, setClientes] = useState(CLIENTES_INICIAL)
  const [proveedores, setProveedores] = useState(PROVEEDORES_DATA)
  const [servicios, setServicios] = useState(SERVICIOS_DATA)
  const [editingServicio, setEditingServicio] = useState(null)
  const [editingManagedEntity, setEditingManagedEntity] = useState(null)
  const [deactivationTarget, setDeactivationTarget] = useState(null)
  const [changingEntityStatus, setChangingEntityStatus] = useState(false)

  const [openModal, setOpenModal] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [formC, setFormC] = useState(EMPTY_CLIENTE)
  const [formP, setFormP] = useState(EMPTY_PROVEEDOR)
  const [formS, setFormS] = useState(EMPTY_SERVICIO)
  const [submitted, setSubmitted] = useState(false)

  // Estado extra para el modal de Clientes
  const [editingCliente, setEditingCliente] = useState(null) // null = crear, objeto = editar

  const [ccList, setCcList] = useState([])
  const [ccInput, setCcInput] = useState('')
  const [rowMenuOpen, setRowMenuOpen] = useState(null)
  const [expandedServicio, setExpandedServicio] = useState(null)
  const [historialAnio, setHistorialAnio] = useState(String(new Date().getFullYear()))
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

  function handleDeleteRow(id) {
    const setters = [setClientes, setProveedores, null, setServicios]
    const setter = setters[tab]
    if (setter) setter(prev => prev.filter(r => r.id !== id))
    setRowMenuOpen(null)
  }

  function handleToggleCliente(id) {
    setClientes(prev => prev.map(c =>
      c.id === id ? { ...c, estado: c.estado === 'Activo' ? 'Inactivo' : 'Activo' } : c
    ))
    setRowMenuOpen(null)
  }

  function openEditCliente(cliente) {
    setEditingCliente(cliente)
    setFormC({
      nombre: cliente.nombre || '',
      email: cliente.email || '',
      pais: cliente.pais || '',
      condicionFiscal: cliente.condicionFiscal || '',
      identificacionFiscal: cliente.identificacionFiscal || '',
      entidadEmisoraId: String(cliente.entidadEmisoraId || ''),
      tipoFactura: cliente.tipoFactura || '',
      periodoCierreMes: cliente.periodoCierreMes ?? true,
      impuestoAdicional: String(cliente.impuestoAdicional ?? ''),
      actualizacionIPC: cliente.actualizacionIPC || false,
      carpetaDrive: cliente.carpetaDrive || '',
      contacto: cliente.contacto || '',
      notas: cliente.notas || '',
    })
    setCcList(cliente.emailsCopia || [])
    setCcInput('')
    setSubmitted(false)
    setOpenModal('cliente')
  }

  function openManagedEntityForm(entity = null) {
    setEditingManagedEntity(entity)
    setOpenModal('managed-entity')
  }

  async function changeManagedEntityStatus(entity, nextStatus) {
    setChangingEntityStatus(true)
    try {
      await setEntityStatus(entity, nextStatus)
      setDeactivationTarget(null)
      setRowMenuOpen(null)
    } finally {
      setChangingEntityStatus(false)
    }
  }

  const currentData = [clientes, proveedores, managedEntities, servicios][tab]

  const filtered = currentData.filter(r => {
    const q = search.toLowerCase()
    const rowName = r.name || r.nombre || ''
    const rowEmail = r.billingEmail || r.mail || r.email || ''
    const rowFiscalId = r.fiscalId || r.identificacionFiscal || r.identificacion || ''
    const accounts = r.bankAccounts || r.cuentas
    const cuentasStr = Array.isArray(accounts) ? accounts.map(c => c.bankName || c.banco || '').join(' ') : (r.cuentaBancaria || '')
    const matchSearch = !q
      || rowName.toLowerCase().includes(q)
      || rowEmail.toLowerCase().includes(q)
      || rowFiscalId.toLowerCase().includes(q)
      || cuentasStr.toLowerCase().includes(q)
    const status = r.status === 'active' ? 'Activa' : r.status === 'inactive' ? 'Inactiva' : r.estado
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
  const chC = e => setFormC(p => ({ ...p, [e.target.name]: e.target.value }))
  const chP = e => setFormP(p => ({ ...p, [e.target.name]: e.target.value }))
  const chS = e => setFormS(p => ({ ...p, [e.target.name]: e.target.value }))

  // Entidad emisora condiciona el tipo de factura por defecto
  const chEntidadCliente = e => {
    const id = e.target.value
    const ent = managedEntities.find(en => String(en.id) === id)
    const tiposDisponibles = ent ? (TIPOS_FACTURA_BY_ENTIDAD_TIPO[ent.legalType] || []) : []
    const defecto = ent ? comprobanteToTipo(ent.defaultVoucher) : ''
    setFormC(p => ({
      ...p,
      entidadEmisoraId: id,
      tipoFactura: tiposDisponibles.length === 1 ? tiposDisponibles[0] : (tiposDisponibles.includes(defecto) ? defecto : ''),
    }))
  }

  // País condiciona condición fiscal
  const chPais = e => {
    setFormC(p => ({ ...p, pais: e.target.value, condicionFiscal: '' }))
  }

  // CC emails chips
  const addCc = () => {
    const v = ccInput.trim()
    if (v && !ccList.includes(v)) setCcList(p => [...p, v])
    setCcInput('')
  }
  const removeCc = m => setCcList(p => p.filter(x => x !== m))

  const isReadyC = formC.nombre && formC.entidadEmisoraId && formC.tipoFactura && formC.pais && formC.impuestoAdicional !== ''
  const isReadyP = formP.nombre && formP.email && formP.destino
  const isReadyS = formS.nombre && formS.tipoSvc

  const guardarC = () => {
    setSubmitted(true)
    if (!isReadyC) return

    const base = {
      nombre: formC.nombre,
      email: formC.email,
      emailsCopia: [...ccList],
      pais: formC.pais,
      condicionFiscal: formC.condicionFiscal,
      identificacionFiscal: formC.identificacionFiscal,
      entidadEmisoraId: Number(formC.entidadEmisoraId),
      tipoFactura: formC.tipoFactura,
      periodoCierreMes: formC.periodoCierreMes,
      impuestoAdicional: parseFloat(formC.impuestoAdicional) || 0,
      actualizacionIPC: formC.actualizacionIPC,
      carpetaDrive: formC.carpetaDrive,
      contacto: formC.contacto,
      notas: formC.notas,
    }

    if (editingCliente) {
      setClientes(prev => prev.map(c => c.id === editingCliente.id ? { ...c, ...base } : c))
    } else {
      setClientes(prev => [{ id: Date.now(), estado: 'Activo', ...base }, ...prev])
    }

    setFormC(EMPTY_CLIENTE)
    setCcList([])
    setCcInput('')
    setEditingCliente(null)
    setSubmitted(false)
    setOpenModal(null)
    setTab(0)
  }
  const guardarP = () => {
    setSubmitted(true)
    if (!isReadyP) return
    setProveedores(p => [{ id: Date.now(), nombre: formP.nombre, estado: 'PENDIENTE', mail: formP.email, tipoServicio: formP.tipoServicio, medioPago: formP.metodoPago, destino: formP.destino, cuit: formP.cuit }, ...p])
    setFormP(EMPTY_PROVEEDOR); setSubmitted(false); setOpenModal(null); setTab(1)
  }
  function handleToggleServicio(id) {
    setServicios(prev => prev.map(s =>
      s.id === id ? { ...s, estado: s.estado === 'Activo' ? 'Inactivo' : 'Activo' } : s
    ))
    setRowMenuOpen(null)
  }

  function openEditServicio(servicio) {
    setEditingServicio(servicio)
    setFormS({
      nombre: servicio.nombre || '',
      tipoSvc: servicio.tipo || 'Fijo',
      precioBase: servicio.precioBase !== '—' ? servicio.precioBase : '',
      moneda: servicio.moneda || 'ARS',
      estadoInicial: servicio.estado === 'Activo',
    })
    setSubmitted(false)
    setOpenModal('servicio')
  }

  const guardarS = () => {
    setSubmitted(true)
    if (!isReadyS) return
    if (editingServicio) {
      setServicios(prev => prev.map(s => s.id === editingServicio.id
        ? { ...s, nombre: formS.nombre, tipo: formS.tipoSvc, precioBase: formS.tipoSvc === 'Fijo' ? formS.precioBase : '—', moneda: formS.moneda, estado: formS.estadoInicial ? 'Activo' : 'Inactivo' }
        : s
      ))
    } else {
      setServicios(p => [{ id: Date.now(), nombre: formS.nombre, estado: formS.estadoInicial ? 'Activo' : 'Inactivo', tipo: formS.tipoSvc, precioBase: formS.tipoSvc === 'Fijo' ? formS.precioBase : '—', moneda: formS.moneda, clientesActivos: 0 }, ...p])
    }
    setFormS(EMPTY_SERVICIO); setEditingServicio(null); setSubmitted(false); setOpenModal(null); setTab(3)
  }

  const footerFor = (isReady, onSave) => (
    <div className="modal-footer-inner">
      <div className="modal-validation">
        {!isReady && (
          <span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {' '}Completá los campos obligatorios (*)
          </span>
        )}
      </div>
      <button className={'btn-guardar' + (isReady ? ' ready' : '')} onClick={onSave} disabled={!isReady}>Guardar</button>
    </div>
  )

  const closeModal = () => {
    setOpenModal(null)
    setSubmitted(false)
    setEditingCliente(null)
    setEditingServicio(null)
    setCcList([])
    setCcInput('')
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
            ? <tr><td colSpan={7} className="td-empty">Sin resultados</td></tr>
            : pageRows.map(r => {
                const entidad = managedEntities.find(e => String(e.id) === String(r.entidadEmisoraId))
                const tipoLabel = r.tipoFactura
                  ? (r.tipoFactura + (entidad ? ' — ' + entidad.name : ''))
                  : '—'
                return (
                  <tr key={r.id} className="tr-clickable" onClick={() => openEditCliente(r)}>
                    <td>
                      <span className="link-nro">{r.nombre}</span>
                      {r.actualizacionIPC && (
                        <span title="Actualización por IPC" style={{
                          marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#6366f1',
                          background: '#eef2ff', borderRadius: 4, padding: '1px 5px', verticalAlign: 'middle',
                        }}>IPC</span>
                      )}
                      {!r.periodoCierreMes && (
                        <span title="Pack / esporádico" style={{
                          marginLeft: 4, fontSize: 10, fontWeight: 700, color: '#d97706',
                          background: '#fef3c7', borderRadius: 4, padding: '1px 5px', verticalAlign: 'middle',
                        }}>PACK</span>
                      )}
                    </td>
                    <td><Badge estado={r.estado} /></td>
                    <td className="td-muted">{r.email || '—'}</td>
                    <td className="td-muted" style={{ whiteSpace: 'nowrap' }}>{tipoLabel}</td>
                    <td>
                      {r.impuestoAdicional > 0
                        ? <span style={{
                            display: 'inline-block', padding: '2px 7px', borderRadius: 6,
                            fontSize: 11, fontWeight: 700, color: '#b45309', background: '#fef3c7',
                          }}>{r.impuestoAdicional}%</span>
                        : <span className="td-muted">—</span>
                      }
                    </td>
                    <td className="td-muted">{r.identificacionFiscal || r.identificacion || '—'}</td>
                    <td className="row-menu-cell" onClick={e => e.stopPropagation()}>
                      <button className="dots-btn" aria-label={'Opciones ' + r.nombre} aria-expanded={rowMenuOpen === r.id}
                        onClick={() => setRowMenuOpen(prev => prev === r.id ? null : r.id)}>⋮</button>
                      {rowMenuOpen === r.id && (
                        <div className="row-menu" ref={rowMenuRef} role="menu">
                          <button className="row-menu-item" role="menuitem" onClick={() => { openEditCliente(r); setRowMenuOpen(null) }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Editar
                          </button>
                          <button className="row-menu-item" role="menuitem" onClick={() => handleToggleCliente(r.id)}>
                            {r.estado === 'Activo'
                              ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Desactivar</>
                              : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Activar</>
                            }
                          </button>
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
              <tr key={r.id}>
                <td>{r.nombre}</td>
                <td><Badge estado={r.estado} /></td>
                <td className="td-muted">{r.mail}</td>
                <td className="td-muted">{r.tipoServicio}</td>
                <td className="td-muted">{r.medioPago}</td>
                <td className="td-muted">{r.destino}</td>
                <td className="td-muted">{r.cuit}</td>
                <td className="row-menu-cell">
                  <button className="dots-btn" aria-label={'Opciones '+r.nombre} aria-expanded={rowMenuOpen===r.id}
                    onClick={() => setRowMenuOpen(prev => prev===r.id?null:r.id)}>⋮</button>
                  {rowMenuOpen === r.id && (
                    <div className="row-menu" ref={rowMenuRef} role="menu">
                      <button className="row-menu-item row-menu-item-danger" role="menuitem" onClick={() => handleDeleteRow(r.id)}>
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
              <tr key={r.id} className="tr-clickable" onClick={() => navigate(`/administracion/entidades/${r.id}`)}>
                <td><span className="link-nro">{r.name}</span></td>
                <td><Badge estado={r.status === 'active' ? 'Activa' : 'Inactiva'} /></td>
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
                      <button className="row-menu-item" role="menuitem" onClick={() => { openManagedEntityForm(r); setRowMenuOpen(null) }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Editar
                      </button>
                      <button className="row-menu-item" role="menuitem" onClick={() => {
                        if (r.status === 'active') setDeactivationTarget(r)
                        else changeManagedEntityStatus(r, 'active').catch(() => {})
                      }}>
                        {r.status === 'active'
                          ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Desactivar</>
                          : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Activar</>
                        }
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

    // tab === 3: Servicios (catálogo global — T13)
    return (
      <>
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
              ? <tr><td colSpan={7} className="td-empty">Sin resultados</td></tr>
              : pageRows.map(r => {
                const isExpanded = expandedServicio === r.id
                const historial  = r.historialPrecios ?? []
                const aniosDisp  = [...new Set(historial.map(h => h.fecha.slice(0,4)))].sort((a,b) => b-a)
                const anioFiltro = historialAnio
                const histFiltrado = historial.filter(h => h.fecha.startsWith(anioFiltro))

                function fmtPrecioH(p, mon) {
                  if (!p) return '—'
                  return mon === 'USD'
                    ? 'US$ ' + Number(p).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '$ '  + Number(p).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                }
                function fmtFechaH(iso) {
                  if (!iso) return '—'
                  const [y, m] = iso.split('-')
                  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
                  return `${meses[parseInt(m,10)-1]} ${y}`
                }

                return (
                  <>
                    <tr key={r.id} style={{ cursor: historial.length ? 'pointer' : 'default' }}
                      onClick={() => {
                        if (!historial.length) return
                        setExpandedServicio(prev => prev === r.id ? null : r.id)
                      }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {historial.length > 0 && (
                            <span style={{ fontSize: 10, opacity: .4, transition: 'transform .15s', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                          )}
                          <strong>{r.nombre}</strong>
                        </div>
                      </td>
                      <td className="td-muted">{r.tipo}</td>
                      <td>{r.precioBase}</td>
                      <td><span className="moneda-badge">{r.moneda}</span></td>
                      <td className="td-muted">{r.clientesActivos}</td>
                      <td><Badge estado={r.estado} /></td>
                      <td className="row-menu-cell" onClick={e => e.stopPropagation()}>
                        <button className="dots-btn" aria-label={'Opciones '+r.nombre} aria-expanded={rowMenuOpen===r.id}
                          onClick={() => setRowMenuOpen(prev => prev===r.id?null:r.id)}>⋮</button>
                        {rowMenuOpen === r.id && (
                          <div className="row-menu" ref={rowMenuRef} role="menu">
                            <button className="row-menu-item" role="menuitem" onClick={() => { openEditServicio(r); setRowMenuOpen(null) }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Editar
                            </button>
                            <button className="row-menu-item" role="menuitem" onClick={() => handleToggleServicio(r.id)}>
                              {r.estado === 'Activo'
                                ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Desactivar</>
                                : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Activar</>
                              }
                            </button>
                            <button className="row-menu-item row-menu-item-danger" role="menuitem" onClick={() => handleDeleteRow(r.id)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                              </svg>
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={r.id + '-hist'}>
                        <td colSpan={7} style={{ padding: 0, background: 'var(--bg-page, #f5f6fa)' }}>
                          <div style={{ padding: '14px 20px 16px' }}>
                            {/* Header historial + filtro año */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', opacity: .5 }}>
                                Historial de precios
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 12, opacity: .5 }}>Año:</span>
                                <select
                                  value={anioFiltro}
                                  onChange={e => setHistorialAnio(e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  style={{ fontSize: 12, border: '1px solid #d1d5db', borderRadius: 6, padding: '3px 8px', background: '#fff', cursor: 'pointer' }}
                                >
                                  {aniosDisp.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                              </div>
                            </div>
                            {/* Filas de historial */}
                            {histFiltrado.length === 0 ? (
                              <div style={{ fontSize: 13, opacity: .4, textAlign: 'center', padding: '12px 0' }}>
                                Sin ajustes registrados en {anioFiltro}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {histFiltrado.map((h, i) => (
                                  <div key={i} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    background: '#fff', borderRadius: 8, padding: '8px 14px',
                                    border: '1px solid #e5e7eb', fontSize: 13,
                                  }}>
                                    <span style={{ opacity: .55, minWidth: 70 }}>{fmtFechaH(h.fecha)}</span>
                                    <span style={{ flex: 1, paddingLeft: 16, opacity: .7 }}>{h.motivo || '—'}</span>
                                    <span style={{ fontWeight: 700 }}>{fmtPrecioH(h.precio, r.moneda)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })
            }
          </tbody>
        </table>
        <p className="servicios-nota">Los precios y condiciones por cliente se configuran en el perfil de cada cliente.</p>
      </>
    )
  }

  return (
    <div>
      <h1 className="page-title">Administración</h1>

      {/* Single toolbar row: filter + search + export + import + NUEVO dropdown */}
      <div className="admin-toolbar">
        <FilterBox id="admin-estado" label="Estado"
          options={tab === 0 ? ['Activo', 'Inactivo'] : tab === 1 ? ['PENDIENTE'] : tab === 2 ? ['Activa', 'Inactiva'] : ['Activo', 'Inactivo']}
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
                  { label: 'Nuevo cliente', action: () => { setTab(0); setOpenModal('cliente'); setFormC(EMPTY_CLIENTE); setEditingCliente(null); setCcList([]); setCcInput(''); setSubmitted(false); setShowDropdown(false) } },
                  { label: 'Nuevo proveedor', action: () => { setTab(1); setOpenModal('proveedor'); setFormP(EMPTY_PROVEEDOR); setSubmitted(false); setShowDropdown(false) } },
                  { label: 'Nueva entidad', action: () => { setTab(2); openManagedEntityForm(); setShowDropdown(false) } },
                  { label: 'Nuevo servicio', action: () => { setTab(3); setOpenModal('servicio'); setFormS(EMPTY_SERVICIO); setSubmitted(false); setShowDropdown(false) } },
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
        {tab === 2 && entitiesError && <div className="admin-data-error" role="alert">{entitiesError}</div>}
        {renderTable()}
        <Pagination page={page} totalPages={totalPages} onChange={p => setPage(p)} />
      </div>

      {/* NUEVO / EDITAR CLIENTE modal */}
      <Modal
        isOpen={openModal === 'cliente'}
        onClose={closeModal}
        title={editingCliente ? 'EDITAR CLIENTE' : 'NUEVO CLIENTE'}
        triggerRef={btnNuevoRef}
        footer={footerFor(isReadyC, guardarC)}
      >
        {/* Nombre */}
        <div className="form-group">
          <label htmlFor="c-nombre">Nombre del Cliente <span className="label-req">*</span></label>
          <input
            id="c-nombre"
            className={'form-input' + (submitted && !formC.nombre ? ' input-error' : '')}
            name="nombre" value={formC.nombre} onChange={chC}
            placeholder="ej: Ayax"
          />
          {submitted && !formC.nombre && <span className="field-error">Campo obligatorio</span>}
        </div>

        {/* Email principal */}
        <div className="form-group">
          <label htmlFor="c-email">Email de facturación</label>
          <input id="c-email" className="form-input" name="email" type="email"
            value={formC.email} onChange={chC} placeholder="contacto@empresa.com" />
        </div>

        {/* Emails en copia */}
        <div className="form-group">
          <label htmlFor="c-cc">Emails en copia (CC)</label>
          {ccList.length > 0 && (
            <div className="cc-chips">
              {ccList.map(m => (
                <span key={m} className="cc-chip">
                  {m}
                  <button type="button" className="cc-chip-remove" aria-label={'Quitar ' + m} onClick={() => removeCc(m)}>×</button>
                </span>
              ))}
            </div>
          )}
          <div className="cc-add-row">
            <input id="c-cc" className="form-input" type="email" placeholder="email@ejemplo.com"
              value={ccInput} onChange={e => setCcInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCc() } }} />
            <button type="button" className="btn-add-cc-form" onClick={addCc}>+ Agregar email</button>
          </div>
        </div>

        {/* Entidad emisora */}
        <div className="form-group form-group-destacado">
          <label htmlFor="c-entidad">Entidad emisora <span className="label-req">*</span></label>
          <select
            id="c-entidad"
            className={'form-select' + (submitted && !formC.entidadEmisoraId ? ' input-error' : '')}
            value={formC.entidadEmisoraId} onChange={chEntidadCliente}
          >
            <option value=""></option>
            {managedEntities.filter(e => e.status === 'active').map(e => (
              <option key={e.id} value={String(e.id)}>{e.name}</option>
            ))}
          </select>
          {submitted && !formC.entidadEmisoraId && <span className="field-error">Campo obligatorio</span>}
        </div>

        {/* Tipo de factura */}
        <div className="form-group">
          <label htmlFor="c-tipo">Tipo de Factura <span className="label-req">*</span></label>
          {(() => {
            const ent = managedEntities.find(e => String(e.id) === String(formC.entidadEmisoraId))
            const tipos = ent ? (TIPOS_FACTURA_BY_ENTIDAD_TIPO[ent.legalType] || []) : []
            const bloqueado = tipos.length === 1
            return (
              <>
                <select
                  id="c-tipo"
                  className={'form-select' + (submitted && !formC.tipoFactura ? ' input-error' : '')}
                  name="tipoFactura" value={formC.tipoFactura} onChange={chC}
                  disabled={bloqueado}
                >
                  <option value=""></option>
                  {tipos.map(t => <option key={t} value={t}>{t === 'Invoice LLC' ? 'Invoice LLC' : 'Factura ' + t}</option>)}
                </select>
                {!formC.entidadEmisoraId && <span className="field-hint">Seleccioná primero la entidad emisora</span>}
                {bloqueado && <span className="field-hint">Definido por la entidad emisora</span>}
              </>
            )
          })()}
          {submitted && !formC.tipoFactura && <span className="field-error">Campo obligatorio</span>}
        </div>

        {/* País */}
        <div className="form-group">
          <label htmlFor="c-pais">País <span className="label-req">*</span></label>
          <select
            id="c-pais"
            className={'form-select' + (submitted && !formC.pais ? ' input-error' : '')}
            value={formC.pais} onChange={chPais}
          >
            <option value=""></option>
            {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {submitted && !formC.pais && <span className="field-error">Campo obligatorio</span>}
        </div>

        {/* Condición fiscal — condicional según país */}
        {formC.pais && (
          <div className="form-group">
            <label htmlFor="c-condicion">Condición Fiscal</label>
            {CONDICION_FISCAL_POR_PAIS[formC.pais] ? (
              <select id="c-condicion" className="form-select" name="condicionFiscal" value={formC.condicionFiscal} onChange={chC}>
                <option value=""></option>
                {CONDICION_FISCAL_POR_PAIS[formC.pais].map(cf => <option key={cf} value={cf}>{cf}</option>)}
              </select>
            ) : (
              <input id="c-condicion" className="form-input" name="condicionFiscal"
                value={formC.condicionFiscal} onChange={chC} placeholder="Condición fiscal del país" />
            )}
          </div>
        )}

        {/* Identificación fiscal */}
        <div className="form-group">
          <label htmlFor="c-ident">{LABEL_ID_FISCAL[formC.pais] || 'Identificación Fiscal'}</label>
          <input id="c-ident" className="form-input" name="identificacionFiscal"
            value={formC.identificacionFiscal} onChange={chC}
            placeholder={formC.pais === 'Argentina' ? 'ej: 20-12345678-1' : formC.pais === 'Colombia' ? 'ej: 900.123.456-7' : ''} />
        </div>

        {/* Período de facturación */}
        <div className="form-group">
          <label>Período de Facturación</label>
          <div className="svc-tipo-group">
            {[
              { val: true,    label: 'Cierre de mes' },
              { val: 'curso', label: 'Mes en curso' },
              { val: false,   label: 'Pack / esporádico' },
            ].map(opt => (
              <label key={String(opt.val)} className={'svc-tipo-option' + (formC.periodoCierreMes === opt.val ? ' svc-tipo-active' : '')}>
                <input type="radio" name="periodoCierreMes" checked={formC.periodoCierreMes === opt.val}
                  onChange={() => setFormC(p => ({ ...p, periodoCierreMes: opt.val }))}
                  style={{ display: 'none' }} />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Impuesto adicional */}
        <div className="form-group">
          <label htmlFor="c-impuesto">Impuesto Adicional (%) <span className="label-req">*</span></label>
          <input
            id="c-impuesto"
            className={'form-input' + (submitted && formC.impuestoAdicional === '' ? ' input-error' : '')}
            name="impuestoAdicional" type="number" min="0" max="100" step="0.5"
            value={formC.impuestoAdicional} onChange={chC}
            placeholder="0"
            style={{ maxWidth: 120 }}
          />
          <span className="field-hint">Ingresá 0 si no aplica impuesto adicional</span>
          {submitted && formC.impuestoAdicional === '' && <span className="field-error">Campo obligatorio (0 si no aplica)</span>}
        </div>

        {/* Actualización por IPC */}
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 'normal' }}>
            <input
              type="checkbox"
              checked={formC.actualizacionIPC}
              onChange={e => setFormC(p => ({ ...p, actualizacionIPC: e.target.checked }))}
              style={{ width: 16, height: 16 }}
            />
            Actualización automática por IPC
          </label>
        </div>

        {/* Contacto */}
        <div className="form-group">
          <label htmlFor="c-contacto">Nombre de Contacto</label>
          <input id="c-contacto" className="form-input" name="contacto" value={formC.contacto} onChange={chC} />
        </div>

        {/* Carpeta Drive */}
        <div className="form-group">
          <label htmlFor="c-drive">Carpeta Drive (URL)</label>
          <input id="c-drive" className="form-input" name="carpetaDrive" value={formC.carpetaDrive} onChange={chC}
            placeholder="https://drive.google.com/..." />
        </div>

        {/* Notas internas */}
        <div className="form-group">
          <label htmlFor="c-notas">Notas internas</label>
          <textarea id="c-notas" className="form-textarea" name="notas" value={formC.notas} onChange={chC}
            placeholder="Instrucciones especiales, aclaraciones para la factura…" rows={3} />
        </div>
      </Modal>

      {/* NUEVO PROVEEDOR modal */}
      <Modal isOpen={openModal === 'proveedor'} onClose={closeModal} title="NUEVO PROVEEDOR" triggerRef={btnNuevoRef}
        footer={footerFor(isReadyP, guardarP)}>
        <div className="form-group">
          <label htmlFor="p-nombre">Nombre del Proveedor</label>
          <input id="p-nombre" className="form-input" name="nombre" value={formP.nombre} onChange={chP} />
        </div>
        <div className="form-group">
          <label htmlFor="p-email">Email</label>
          <input id="p-email" className="form-input" name="email" type="email" value={formP.email} onChange={chP} />
        </div>
        <div className="form-group">
          <label htmlFor="p-tipo">Tipo de Servicio</label>
          <select id="p-tipo" className="form-select" name="tipoServicio" value={formP.tipoServicio} onChange={chP}>
            <option value=""></option>
            {['Cloud', 'SaaS', 'Diseño', 'Comunicación', 'Productividad', 'Dev', 'Gestión'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="p-pago">Método de Pago</label>
          <select id="p-pago" className="form-select" name="metodoPago" value={formP.metodoPago} onChange={chP}>
            <option value=""></option>
            {['Transferencia', 'Débito automático', 'Tarjeta'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="p-destino">Destino</label>
          <input id="p-destino" className="form-input" name="destino" value={formP.destino} onChange={chP} />
        </div>
        <div className="form-group">
          <label htmlFor="p-cuit">CUIT</label>
          <input id="p-cuit" className="form-input" name="cuit" value={formP.cuit} onChange={chP} />
        </div>
      </Modal>

      <EntityFormModal
        isOpen={openModal === 'managed-entity'}
        entity={editingManagedEntity}
        onClose={closeModal}
        onSave={saveEntity}
        onSaved={() => { setOpenModal(null); setEditingManagedEntity(null); setTab(2) }}
        triggerRef={btnNuevoRef}
      />

      <Modal
        isOpen={Boolean(deactivationTarget)}
        onClose={changingEntityStatus ? () => {} : () => setDeactivationTarget(null)}
        title="DESACTIVAR ENTIDAD"
        dialogRole="alertdialog"
        descriptionId="deactivate-entity-description"
        footer={(
          <div className="entity-confirm-actions">
            <button type="button" className="btn-arca-secondary" onClick={() => setDeactivationTarget(null)} disabled={changingEntityStatus}>Cancelar</button>
            <button type="button" className="btn-guardar ready" disabled={changingEntityStatus}
              onClick={() => changeManagedEntityStatus(deactivationTarget, 'inactive').catch(() => {})}>
              {changingEntityStatus ? 'Desactivando…' : 'Desactivar'}
            </button>
          </div>
        )}
      >
        <p id="deactivate-entity-description" className="entity-confirm-copy">
          <strong>{deactivationTarget?.name}</strong> dejará de estar disponible para nuevas facturas. Su historial se conservará.
        </p>
      </Modal>

      {/* NUEVO SERVICIO modal — catálogo global (T13) */}
      <Modal isOpen={openModal === 'servicio'} onClose={closeModal} title={editingServicio ? 'EDITAR SERVICIO' : 'NUEVO SERVICIO'} triggerRef={btnNuevoRef}
        footer={footerFor(isReadyS, guardarS)}>
        <div className="form-group">
          <label htmlFor="s-nombre">Nombre del servicio <span className="label-req">*</span></label>
          <input id="s-nombre" className="form-input" name="nombre" value={formS.nombre} onChange={chS} placeholder="ej: Social Media" />
        </div>
        <div className="form-group">
          <label>Tipo <span className="label-req">*</span></label>
          <div className="svc-tipo-group">
            {['Fijo', 'Por hora'].map(t => (
              <label key={t} className={'svc-tipo-option' + (formS.tipoSvc === t ? ' svc-tipo-active' : '')}>
                <input type="radio" name="tipoSvc" value={t} checked={formS.tipoSvc === t}
                  onChange={chS} style={{ display: 'none' }} />
                {t === 'Fijo' ? 'Precio fijo' : 'Por hora'}
              </label>
            ))}
          </div>
        </div>
        {formS.tipoSvc === 'Fijo' && (
          <div className="form-group">
            <label htmlFor="s-precio">Precio base</label>
            <input id="s-precio" className="form-input" name="precioBase" value={formS.precioBase} onChange={chS} placeholder="0.00" />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="s-moneda">Moneda</label>
          <select id="s-moneda" className="form-select" name="moneda" value={formS.moneda} onChange={chS}>
            <option>ARS</option><option>USD</option>
          </select>
        </div>
        <p className="servicios-nota" style={{ marginTop: 8 }}>Los precios específicos por cliente se configuran en el perfil de cada cliente.</p>
      </Modal>
    </div>
  )
}
