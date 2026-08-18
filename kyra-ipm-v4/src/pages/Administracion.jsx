import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import { ENTIDADES_INICIAL } from '../data/entidades'
import { CLIENTES_INICIAL } from '../data/clientes'
import { SERVICIOS_INICIAL } from '../data/servicios'

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
 * Clave = tipo de entidad (campo `tipo` en ENTIDADES_INICIAL).
 */
const TIPOS_FACTURA_BY_ENTIDAD_TIPO = {
  SRL:            ['A', 'B (Exento IVA)'],
  Monotributista: ['C'],
  LLC:            ['Invoice LLC'],
}

/** Normaliza el tipo de comprobante de entidad al código corto que usa el cliente */
function comprobanteToTipo(comprobante) {
  if (!comprobante) return ''
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

// Entidades reales importadas desde /data/entidades.js
// (el array original se usa como estado inicial en useState)

// ── Helpers para Entidades ───────────────────────────────────────────────────

const TIPOS_ENTIDAD = ['SRL', 'Monotributista', 'LLC']
const TIPOS_COMPROBANTE = ['Factura A', 'Factura B (Exento IVA)', 'Factura C', 'Invoice LLC']
const COMPROBANTE_DEFAULT_BY_TIPO = {
  SRL: 'Factura A',
  Monotributista: 'Factura C',
  LLC: 'Invoice LLC',
}

/** Entidades argentinas: ARCA aplica solo para SRL y Monotributistas */
const esArgentina = (tipo) => ['SRL', 'Monotributista'].includes(tipo)

/**
 * Retorna el estado del certificado ARCA.
 * @param {object|null} arca  — { archivoSubido, vencimiento: 'YYYY-MM-DD' } | null
 * @returns {'vigente'|'por-vencer'|'vencido'|'no-cargado'|'no-aplica'}
 */
function arcaStatus(arca) {
  if (!arca) return 'no-aplica'
  if (!arca.archivoSubido) return 'no-cargado'
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const vence = new Date(arca.vencimiento + 'T00:00:00')
  const diffMs = vence - hoy
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDias < 0) return 'vencido'
  if (diffDias <= 30) return 'por-vencer'
  return 'vigente'
}

const ARCA_LABEL = {
  vigente:    'Vigente',
  'por-vencer': 'Por vencer',
  vencido:    'Vencido',
  'no-cargado': 'Sin cargar',
  'no-aplica':  '—',
}
const ARCA_COLOR = {
  vigente:    '#1a9e5c',
  'por-vencer': '#d97706',
  vencido:    '#dc2626',
  'no-cargado': '#9ca3af',
  'no-aplica':  '#d1d5db',
}
const ARCA_BG = {
  vigente:    '#d1fae5',
  'por-vencer': '#fef3c7',
  vencido:    '#fee2e2',
  'no-cargado': '#f3f4f6',
  'no-aplica':  '#f3f4f6',
}

function ArcaBadge({ arca }) {
  const st = arcaStatus(arca)
  if (st === 'no-aplica') return <span className="td-muted">—</span>
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
      color: ARCA_COLOR[st], background: ARCA_BG[st],
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: ARCA_COLOR[st], display: 'inline-block' }} />
      {ARCA_LABEL[st]}
    </span>
  )
}

// ── Helpers para Servicios ───────────────────────────────────────────────────

const CATALOGO_SERVICIOS = [
  'Google Ads', 'Social Ads', 'Social Media', 'SEO', 'Email MKT',
  'Diseño', 'Mantenimiento UX/UI', 'Hosting Mensual', 'Moderación', 'Otro',
]
const PERIODICIDADES = ['mensual', 'quincenal', 'anual', 'único']
const ESTADOS_SERVICIO = ['activo', 'pausado', 'finalizado']

function formatPrecioServicio(svc) {
  if (svc.tipo === 'fijo') {
    if (!svc.montoBase && svc.montoBase !== 0) return '—'
    return svc.moneda === 'USD'
      ? 'USD ' + Number(svc.montoBase).toLocaleString('es-AR')
      : '$ ' + Number(svc.montoBase).toLocaleString('es-AR')
  }
  if (svc.tipo === 'por_hora') {
    if (!svc.tarifaHora && svc.tarifaHora !== 0) return '—'
    return (svc.moneda === 'USD'
      ? 'USD ' + Number(svc.tarifaHora).toLocaleString('es-AR')
      : '$ ' + Number(svc.tarifaHora).toLocaleString('es-AR')) + '/h'
  }
  return '—'
}

// ── Forms ────────────────────────────────────────────────────────────────────

const EMPTY_CLIENTE = {
  nombre: '', email: '', pais: '', condicionFiscal: '',
  identificacionFiscal: '', entidadEmisoraId: '', tipoFactura: '',
  periodoCierreMes: true, impuestoAdicional: '',
  actualizacionIPC: false, carpetaDrive: '', contacto: '', notas: '',
}
const EMPTY_PROVEEDOR = { nombre: '', email: '', tipoServicio: '', metodoPago: '', destino: '', cuit: '' }
const EMPTY_ENTIDAD   = { nombre: '', tipo: '', identificacion: '', comprobanteDefault: '' }
const EMPTY_SERVICIO  = {
  clienteId: '', nombre: '', descripcion: '',
  tipo: 'fijo', montoBase: '', tarifaHora: '',
  moneda: 'ARS', periodicidad: 'mensual',
}

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
  const [tab, setTab] = useState(0)
  const [clientes, setClientes] = useState(CLIENTES_INICIAL)
  const [proveedores, setProveedores] = useState(PROVEEDORES_DATA)
  const [entidades, setEntidades] = useState(ENTIDADES_INICIAL)
  const [servicios, setServicios] = useState(SERVICIOS_INICIAL)

  const [openModal, setOpenModal] = useState(null) // 'cliente'|'proveedor'|'entidad'|'servicio'|null
  const [showDropdown, setShowDropdown] = useState(false)
  const [formC, setFormC] = useState(EMPTY_CLIENTE)
  const [formP, setFormP] = useState(EMPTY_PROVEEDOR)
  const [formE, setFormE] = useState(EMPTY_ENTIDAD)
  const [formS, setFormS] = useState(EMPTY_SERVICIO)
  const [submitted, setSubmitted] = useState(false)

  // Estado extra para el modal de Clientes
  const [editingCliente, setEditingCliente] = useState(null) // null = crear, objeto = editar

  // Estado extra para el modal de Entidades
  const [editingEntidad, setEditingEntidad] = useState(null) // null = crear, objeto = editar

  // Estado extra para el modal de Servicios
  const [editingServicio, setEditingServicio] = useState(null) // null = crear, objeto = editar
  const [filtroCliente, setFiltroCliente] = useState('')
  const [cuentasList, setCuentasList] = useState([{ banco: '', moneda: 'ARS' }])
  const [arcaArchivo, setArcaArchivo] = useState(false)
  const [arcaVencimiento, setArcaVencimiento] = useState('')
  const [ccList, setCcList] = useState([])
  const [ccInput, setCcInput] = useState('')
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

  function handleToggleEntidad(id) {
    setEntidades(prev => prev.map(e =>
      e.id === id ? { ...e, estado: e.estado === 'Activa' ? 'Inactiva' : 'Activa' } : e
    ))
    setRowMenuOpen(null)
  }

  function openEditServicio(svc) {
    setEditingServicio(svc)
    setFormS({
      clienteId: String(svc.clienteId),
      nombre: svc.nombre || '',
      descripcion: svc.descripcion || '',
      tipo: svc.tipo || 'fijo',
      montoBase: svc.montoBase !== null && svc.montoBase !== undefined ? String(svc.montoBase) : '',
      tarifaHora: svc.tarifaHora !== null && svc.tarifaHora !== undefined ? String(svc.tarifaHora) : '',
      moneda: svc.moneda || 'ARS',
      periodicidad: svc.periodicidad || 'mensual',
    })
    setSubmitted(false)
    setOpenModal('servicio')
  }

  function handleToggleEstadoServicio(id) {
    setServicios(prev => prev.map(s => {
      if (s.id !== id) return s
      const next = s.estado === 'activo' ? 'pausado' : 'activo'
      return { ...s, estado: next }
    }))
    setRowMenuOpen(null)
  }

  function openEditEntidad(entidad) {
    setEditingEntidad(entidad)
    setFormE({ nombre: entidad.nombre, tipo: entidad.tipo, identificacion: entidad.identificacion, comprobanteDefault: entidad.comprobanteDefault })
    setCuentasList(entidad.cuentas.length > 0 ? entidad.cuentas.map(c => ({ ...c })) : [{ banco: '', moneda: 'ARS' }])
    setArcaArchivo(entidad.arca?.archivoSubido ?? false)
    setArcaVencimiento(entidad.arca?.vencimiento ?? '')
    setSubmitted(false)
    setOpenModal('entidad')
  }

  const currentData = [clientes, proveedores, entidades, servicios][tab]

  const filtered = currentData.filter(r => {
    const q = search.toLowerCase()
    const cuentasStr = Array.isArray(r.cuentas) ? r.cuentas.map(c => c.banco).join(' ') : (r.cuentaBancaria || '')
    // Para servicios, también buscar por nombre del cliente
    const clienteNombre = tab === 3 ? (clientes.find(c => c.id === r.clienteId)?.nombre || '') : ''
    const matchSearch = !q
      || r.nombre.toLowerCase().includes(q)
      || (r.mail || r.email || '').toLowerCase().includes(q)
      || (r.identificacionFiscal || r.identificacion || '').toLowerCase().includes(q)
      || cuentasStr.toLowerCase().includes(q)
      || clienteNombre.toLowerCase().includes(q)
    const matchEstado = !filtroEstado || String(r.estado).toLowerCase() === filtroEstado.toLowerCase()
    const matchCliente = tab !== 3 || !filtroCliente || String(r.clienteId) === filtroCliente
    return matchSearch && matchEstado && matchCliente
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
  const chE = e => setFormE(p => ({ ...p, [e.target.name]: e.target.value }))
  const chS = e => setFormS(p => ({ ...p, [e.target.name]: e.target.value }))

  // Al seleccionar cliente en el form de servicio, sugerir moneda según su entidad
  const chClienteServicio = e => {
    const clienteId = e.target.value
    const cliente = clientes.find(c => String(c.id) === clienteId)
    const entidad = cliente ? entidades.find(en => en.id === cliente.entidadEmisoraId) : null
    const monedaSugerida = entidad?.tipo === 'LLC' ? 'USD' : 'ARS'
    setFormS(p => ({ ...p, clienteId, moneda: monedaSugerida }))
  }

  // Al cambiar tipo de entidad, pre-seleccionar comprobante por defecto
  const chETipo = e => {
    const tipo = e.target.value
    setFormE(p => ({ ...p, tipo, comprobanteDefault: COMPROBANTE_DEFAULT_BY_TIPO[tipo] || '' }))
    if (!esArgentina(tipo)) { setArcaArchivo(false); setArcaVencimiento('') }
  }

  // Handlers para cuentas bancarias dinámicas
  const addCuenta = () => setCuentasList(prev => [...prev, { banco: '', moneda: 'ARS' }])
  const removeCuenta = idx => setCuentasList(prev => prev.filter((_, i) => i !== idx))
  const chCuenta = (idx, field, val) => setCuentasList(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c))

  // Entidad emisora condiciona el tipo de factura por defecto
  const chEntidadCliente = e => {
    const id = e.target.value
    const ent = entidades.find(en => String(en.id) === id)
    const tiposDisponibles = ent ? (TIPOS_FACTURA_BY_ENTIDAD_TIPO[ent.tipo] || []) : []
    const defecto = ent ? comprobanteToTipo(ent.comprobanteDefault) : ''
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
  const isReadyE = formE.nombre && formE.tipo && cuentasList.some(c => c.banco.trim())
  const isReadyS = formS.clienteId && formS.nombre && formS.tipo && formS.moneda && formS.periodicidad

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
  const guardarE = () => {
    setSubmitted(true)
    if (!isReadyE) return
    const cuentasLimpias = cuentasList.filter(c => c.banco.trim())
    const arcaData = esArgentina(formE.tipo)
      ? { archivoSubido: arcaArchivo, vencimiento: arcaVencimiento }
      : null

    if (editingEntidad) {
      // Modo edición
      setEntidades(prev => prev.map(e =>
        e.id === editingEntidad.id
          ? { ...e, nombre: formE.nombre, tipo: formE.tipo, identificacion: formE.identificacion,
              comprobanteDefault: formE.comprobanteDefault || COMPROBANTE_DEFAULT_BY_TIPO[formE.tipo] || '',
              cuentas: cuentasLimpias, arca: arcaData }
          : e
      ))
    } else {
      // Modo creación
      setEntidades(prev => [{
        id: Date.now(),
        nombre: formE.nombre,
        estado: 'Activa',
        tipo: formE.tipo,
        identificacion: formE.identificacion,
        tipoIdentificacion: formE.tipo === 'LLC' ? 'EIN' : 'CUIT',
        comprobanteDefault: formE.comprobanteDefault || COMPROBANTE_DEFAULT_BY_TIPO[formE.tipo] || '',
        cuentas: cuentasLimpias,
        arca: arcaData,
      }, ...prev])
    }

    setFormE(EMPTY_ENTIDAD)
    setCuentasList([{ banco: '', moneda: 'ARS' }])
    setArcaArchivo(false)
    setArcaVencimiento('')
    setEditingEntidad(null)
    setSubmitted(false)
    setOpenModal(null)
    setTab(2)
  }
  const guardarS = () => {
    setSubmitted(true)
    if (!isReadyS) return

    const montoBase = formS.tipo === 'fijo' && formS.montoBase !== '' ? parseFloat(formS.montoBase) : null
    const tarifaHora = formS.tipo === 'por_hora' && formS.tarifaHora !== '' ? parseFloat(formS.tarifaHora) : null
    const hoy = new Date().toISOString().slice(0, 10)

    if (editingServicio) {
      setServicios(prev => prev.map(s => {
        if (s.id !== editingServicio.id) return s
        // Detectar cambio de precio para historial
        const historial = [...(s.historialPrecios || [])]
        const precioAnterior = s.tipo === 'fijo' ? s.montoBase : s.tarifaHora
        const precioNuevo = formS.tipo === 'fijo' ? montoBase : tarifaHora
        if (precioNuevo !== null && precioNuevo !== precioAnterior) {
          historial.unshift({
            fecha: hoy,
            valorAnterior: precioAnterior,
            valorNuevo: precioNuevo,
            motivo: 'Actualización manual',
          })
        }
        return {
          ...s,
          clienteId: Number(formS.clienteId),
          nombre: formS.nombre,
          descripcion: formS.descripcion,
          tipo: formS.tipo,
          montoBase,
          tarifaHora,
          moneda: formS.moneda,
          periodicidad: formS.periodicidad,
          estado: editingServicio.estado,
          historialPrecios: historial,
        }
      }))
    } else {
      const historial = []
      const precioInicial = formS.tipo === 'fijo' ? montoBase : tarifaHora
      if (precioInicial !== null) {
        historial.push({ fecha: hoy, valorAnterior: null, valorNuevo: precioInicial, motivo: 'Precio inicial' })
      }
      setServicios(prev => [{
        id: Date.now(),
        clienteId: Number(formS.clienteId),
        nombre: formS.nombre,
        descripcion: formS.descripcion,
        tipo: formS.tipo,
        montoBase,
        tarifaHora,
        moneda: formS.moneda,
        periodicidad: formS.periodicidad,
        estado: 'activo',
        historialPrecios: historial,
      }, ...prev])
    }

    setFormS(EMPTY_SERVICIO)
    setEditingServicio(null)
    setSubmitted(false)
    setOpenModal(null)
    setTab(3)
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
    setEditingEntidad(null)
    setEditingServicio(null)
    setCuentasList([{ banco: '', moneda: 'ARS' }])
    setArcaArchivo(false)
    setArcaVencimiento('')
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
                const entidad = entidades.find(e => e.id === r.entidadEmisoraId)
                const tipoLabel = r.tipoFactura
                  ? (r.tipoFactura + (entidad ? ' — ' + entidad.nombre : ''))
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
            ? <tr><td colSpan={8} className="td-empty">Sin resultados</td></tr>
            : pageRows.map(r => (
              <tr key={r.id} className="tr-clickable" onClick={() => openEditEntidad(r)}>
                <td><span className="link-nro">{r.nombre}</span></td>
                <td><Badge estado={r.estado} /></td>
                <td className="td-muted">{r.tipo}</td>
                <td className="td-muted">
                  {r.cuentas && r.cuentas.length > 0
                    ? r.cuentas.map((c, i) => (
                        <span key={i} style={{ display: 'block', lineHeight: 1.4 }}>
                          {c.banco} <span style={{ fontSize: 10, opacity: 0.65 }}>({c.moneda})</span>
                        </span>
                      ))
                    : '—'
                  }
                </td>
                <td className="td-muted">{r.comprobanteDefault || '—'}</td>
                <td className="td-muted">{r.identificacion}</td>
                <td><ArcaBadge arca={r.arca} /></td>
                <td className="row-menu-cell" onClick={e => e.stopPropagation()}>
                  <button className="dots-btn" aria-label={'Opciones '+r.nombre} aria-expanded={rowMenuOpen===r.id}
                    onClick={() => setRowMenuOpen(prev => prev===r.id?null:r.id)}>⋮</button>
                  {rowMenuOpen === r.id && (
                    <div className="row-menu" ref={rowMenuRef} role="menu">
                      <button className="row-menu-item" role="menuitem" onClick={() => { openEditEntidad(r); setRowMenuOpen(null) }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Editar
                      </button>
                      <button className="row-menu-item" role="menuitem" onClick={() => handleToggleEntidad(r.id)}>
                        {r.estado === 'Activa'
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

    // tab === 3: Servicios por cliente
    return (
      <table>
        <thead><tr>
          <th scope="col">CLIENTE</th>
          <th scope="col">SERVICIO</th>
          <th scope="col">TIPO</th>
          <th scope="col">PRECIO</th>
          <th scope="col">MONEDA</th>
          <th scope="col">PERIODICIDAD</th>
          <th scope="col">ESTADO</th>
          <th scope="col" style={{ width:36 }}><span className="sr-only">Acciones</span></th>
        </tr></thead>
        <tbody>
          {pageRows.length === 0
            ? <tr><td colSpan={8} className="td-empty">Sin resultados</td></tr>
            : pageRows.map(r => {
                const clienteNombre = clientes.find(c => c.id === r.clienteId)?.nombre || '—'
                return (
                  <tr key={r.id} className="tr-clickable" onClick={() => openEditServicio(r)}>
                    <td><span className="link-nro">{clienteNombre}</span></td>
                    <td>
                      <strong>{r.nombre}</strong>
                      {r.descripcion && <span className="td-muted" style={{ marginLeft: 6, fontSize: 12 }}>({r.descripcion})</span>}
                    </td>
                    <td className="td-muted">{r.tipo === 'fijo' ? 'Fijo' : 'Por hora'}</td>
                    <td>{formatPrecioServicio(r)}</td>
                    <td><span className="moneda-badge">{r.moneda}</span></td>
                    <td className="td-muted" style={{ textTransform: 'capitalize' }}>{r.periodicidad}</td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 10,
                        fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                        color: r.estado === 'activo' ? '#1a9e5c' : r.estado === 'pausado' ? '#d97706' : '#6b7280',
                        background: r.estado === 'activo' ? '#d1fae5' : r.estado === 'pausado' ? '#fef3c7' : '#f3f4f6',
                      }}>{r.estado}</span>
                    </td>
                    <td className="row-menu-cell" onClick={e => e.stopPropagation()}>
                      <button className="dots-btn" aria-label={'Opciones ' + r.nombre} aria-expanded={rowMenuOpen === r.id}
                        onClick={() => setRowMenuOpen(prev => prev === r.id ? null : r.id)}>⋮</button>
                      {rowMenuOpen === r.id && (
                        <div className="row-menu" ref={rowMenuRef} role="menu">
                          <button className="row-menu-item" role="menuitem" onClick={() => { openEditServicio(r); setRowMenuOpen(null) }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Editar
                          </button>
                          <button className="row-menu-item" role="menuitem" onClick={() => handleToggleEstadoServicio(r.id)}>
                            {r.estado === 'activo'
                              ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Pausar</>
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
  }

  return (
    <div>
      <h1 className="page-title">Administración</h1>

      {/* Single toolbar row: filter + search + export + import + NUEVO dropdown */}
      <div className="admin-toolbar">
        <FilterBox id="admin-estado" label="Estado"
          options={tab === 0 ? ['Activo', 'Inactivo'] : tab === 1 ? ['PENDIENTE'] : tab === 2 ? ['Activa', 'Inactiva'] : ['activo', 'pausado', 'finalizado']}
          value={filtroEstado} onChange={v => { setFiltroEstado(v); setPage(1) }} />
        {tab === 3 && (
          <FilterBox id="admin-cliente" label="Cliente"
            options={clientes.map(c => ({ value: String(c.id), label: c.nombre })).map(o => o.label)}
            value={filtroCliente ? (clientes.find(c => String(c.id) === filtroCliente)?.nombre || '') : ''}
            onChange={v => {
              const found = clientes.find(c => c.nombre === v)
              setFiltroCliente(found ? String(found.id) : '')
              setPage(1)
            }}
          />
        )}

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
                  { label: 'Nueva entidad', action: () => { setTab(2); setOpenModal('entidad'); setFormE(EMPTY_ENTIDAD); setEditingEntidad(null); setCuentasList([{ banco: '', moneda: 'ARS' }]); setArcaArchivo(false); setArcaVencimiento(''); setSubmitted(false); setShowDropdown(false) } },
                  { label: 'Nuevo servicio', action: () => { setTab(3); setOpenModal('servicio'); setFormS(EMPTY_SERVICIO); setEditingServicio(null); setSubmitted(false); setShowDropdown(false) } },
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
            {entidades.filter(e => e.estado === 'Activa').map(e => (
              <option key={e.id} value={String(e.id)}>{e.nombre}</option>
            ))}
          </select>
          {submitted && !formC.entidadEmisoraId && <span className="field-error">Campo obligatorio</span>}
        </div>

        {/* Tipo de factura */}
        <div className="form-group">
          <label htmlFor="c-tipo">Tipo de Factura <span className="label-req">*</span></label>
          {(() => {
            const ent = entidades.find(e => String(e.id) === String(formC.entidadEmisoraId))
            const tipos = ent ? (TIPOS_FACTURA_BY_ENTIDAD_TIPO[ent.tipo] || []) : []
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
              { val: true,  label: 'Cierre de mes' },
              { val: false, label: 'Pack / esporádico' },
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

      {/* NUEVA / EDITAR ENTIDAD modal */}
      <Modal
        isOpen={openModal === 'entidad'}
        onClose={closeModal}
        title={editingEntidad ? 'EDITAR ENTIDAD' : 'NUEVA ENTIDAD'}
        triggerRef={btnNuevoRef}
        footer={footerFor(isReadyE, guardarE)}
      >
        {/* Nombre */}
        <div className="form-group">
          <label htmlFor="e-nombre">Nombre de Entidad <span className="label-req">*</span></label>
          <input
            id="e-nombre" className={'form-input' + (submitted && !formE.nombre ? ' input-error' : '')}
            name="nombre" value={formE.nombre} onChange={chE}
            placeholder="ej: Kyra SRL"
          />
          {submitted && !formE.nombre && <span className="field-error">Campo obligatorio</span>}
        </div>

        {/* Tipo */}
        <div className="form-group">
          <label htmlFor="e-tipo">Tipo de entidad <span className="label-req">*</span></label>
          <select
            id="e-tipo" className={'form-select' + (submitted && !formE.tipo ? ' input-error' : '')}
            name="tipo" value={formE.tipo} onChange={chETipo}
          >
            <option value=""></option>
            {TIPOS_ENTIDAD.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {submitted && !formE.tipo && <span className="field-error">Campo obligatorio</span>}
        </div>

        {/* Identificación fiscal */}
        <div className="form-group">
          <label htmlFor="e-ident">
            {formE.tipo === 'LLC' ? 'EIN' : 'CUIT'}
            {!formE.tipo && ' / Identificación Fiscal'}
          </label>
          <input
            id="e-ident" className="form-input"
            name="identificacion" value={formE.identificacion} onChange={chE}
            placeholder={formE.tipo === 'LLC' ? 'ej: 90-0388092-8' : 'ej: 30-70901901-1'}
          />
        </div>

        {/* Tipo de comprobante por defecto */}
        <div className="form-group">
          <label htmlFor="e-compdef">Tipo de comprobante por defecto</label>
          <select id="e-compdef" className="form-select" name="comprobanteDefault" value={formE.comprobanteDefault} onChange={chE}>
            <option value=""></option>
            {TIPOS_COMPROBANTE.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {formE.tipo && (
            <span className="field-hint">
              Valor sugerido para {formE.tipo}: <strong>{COMPROBANTE_DEFAULT_BY_TIPO[formE.tipo] || '—'}</strong>
            </span>
          )}
        </div>

        {/* Cuentas bancarias (dinámicas) */}
        <div className="form-group">
          <label>Cuentas bancarias <span className="label-req">*</span></label>
          {cuentasList.map((cuenta, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <input
                className={'form-input' + (submitted && idx === 0 && !cuenta.banco.trim() ? ' input-error' : '')}
                placeholder="Nombre del banco"
                value={cuenta.banco}
                onChange={e => chCuenta(idx, 'banco', e.target.value)}
                style={{ flex: 2 }}
              />
              <select
                className="form-select"
                value={cuenta.moneda}
                onChange={e => chCuenta(idx, 'moneda', e.target.value)}
                style={{ flex: 1, minWidth: 70 }}
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
              {cuentasList.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCuenta(idx)}
                  aria-label="Quitar cuenta"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18, lineHeight: 1, padding: '0 4px' }}
                >×</button>
              )}
            </div>
          ))}
          {submitted && !cuentasList.some(c => c.banco.trim()) && (
            <span className="field-error">Agregá al menos una cuenta bancaria</span>
          )}
          <button type="button" className="btn-add-cc-form" onClick={addCuenta} style={{ marginTop: 4 }}>
            + Agregar otra cuenta
          </button>
        </div>

        {/* Certificado ARCA — solo para entidades argentinas */}
        {esArgentina(formE.tipo) && (
          <div className="form-group" style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', border: '1px solid #e5e7eb' }}>
            <label style={{ fontWeight: 600, marginBottom: 10, display: 'block' }}>
              Certificado ARCA
              {(() => {
                const st = arcaStatus(arcaArchivo ? { archivoSubido: true, vencimiento: arcaVencimiento } : null)
                if (st === 'no-cargado') return null
                return <ArcaBadge arca={arcaArchivo ? { archivoSubido: true, vencimiento: arcaVencimiento } : null} />
              })()}
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: arcaArchivo ? 10 : 0 }}>
              <input
                id="e-arca-archivo"
                type="checkbox"
                checked={arcaArchivo}
                onChange={e => setArcaArchivo(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="e-arca-archivo" style={{ cursor: 'pointer', margin: 0 }}>
                Certificado subido
              </label>
            </div>

            {arcaArchivo && (
              <div style={{ marginTop: 6 }}>
                <label htmlFor="e-arca-venc" style={{ fontSize: 13, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                  Fecha de vencimiento
                </label>
                <input
                  id="e-arca-venc"
                  type="date"
                  className="form-input"
                  value={arcaVencimiento}
                  onChange={e => setArcaVencimiento(e.target.value)}
                  style={{ maxWidth: 200 }}
                />
                {arcaVencimiento && (
                  <span style={{ marginLeft: 10, fontSize: 12 }}>
                    <ArcaBadge arca={{ archivoSubido: true, vencimiento: arcaVencimiento }} />
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* NUEVO / EDITAR SERVICIO modal */}
      <Modal
        isOpen={openModal === 'servicio'}
        onClose={closeModal}
        title={editingServicio ? 'EDITAR SERVICIO' : 'NUEVO SERVICIO'}
        triggerRef={btnNuevoRef}
        footer={footerFor(isReadyS, guardarS)}
      >
        {/* Cliente */}
        <div className="form-group form-group-destacado">
          <label htmlFor="s-cliente">Cliente <span className="label-req">*</span></label>
          <select
            id="s-cliente"
            className={'form-select' + (submitted && !formS.clienteId ? ' input-error' : '')}
            value={formS.clienteId}
            onChange={chClienteServicio}
            disabled={!!editingServicio}
          >
            <option value=""></option>
            {clientes.filter(c => c.estado === 'Activo').map(c => (
              <option key={c.id} value={String(c.id)}>{c.nombre}</option>
            ))}
          </select>
          {editingServicio && <span className="field-hint">El cliente no se puede cambiar al editar</span>}
          {submitted && !formS.clienteId && <span className="field-error">Campo obligatorio</span>}
        </div>

        {/* Nombre del servicio */}
        <div className="form-group">
          <label htmlFor="s-nombre">Servicio <span className="label-req">*</span></label>
          <select
            id="s-nombre"
            className={'form-select' + (submitted && !formS.nombre ? ' input-error' : '')}
            name="nombre"
            value={formS.nombre}
            onChange={chS}
          >
            <option value=""></option>
            {CATALOGO_SERVICIOS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {submitted && !formS.nombre && <span className="field-error">Campo obligatorio</span>}
        </div>

        {/* Descripción / notas del servicio */}
        <div className="form-group">
          <label htmlFor="s-desc">Descripción / aclaración</label>
          <input id="s-desc" className="form-input" name="descripcion"
            value={formS.descripcion} onChange={chS}
            placeholder="ej: Mes 2/3, Pack 10 hs mensuales…" />
        </div>

        {/* Tipo: fijo / por hora */}
        <div className="form-group">
          <label>Tipo <span className="label-req">*</span></label>
          <div className="svc-tipo-group">
            {[{ val: 'fijo', label: 'Precio fijo' }, { val: 'por_hora', label: 'Por hora' }].map(opt => (
              <label key={opt.val} className={'svc-tipo-option' + (formS.tipo === opt.val ? ' svc-tipo-active' : '')}>
                <input type="radio" name="tipo" value={opt.val} checked={formS.tipo === opt.val}
                  onChange={chS} style={{ display: 'none' }} />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Precio condicional */}
        {formS.tipo === 'fijo' && (
          <div className="form-group">
            <label htmlFor="s-monto">Monto mensual</label>
            <input id="s-monto" className="form-input" name="montoBase" type="number" min="0" step="100"
              value={formS.montoBase} onChange={chS} placeholder="0"
              style={{ maxWidth: 200 }} />
          </div>
        )}
        {formS.tipo === 'por_hora' && (
          <div className="form-group">
            <label htmlFor="s-tarifa">Tarifa por hora</label>
            <input id="s-tarifa" className="form-input" name="tarifaHora" type="number" min="0" step="100"
              value={formS.tarifaHora} onChange={chS} placeholder="0"
              style={{ maxWidth: 200 }} />
          </div>
        )}

        {/* Moneda */}
        <div className="form-group">
          <label htmlFor="s-moneda">Moneda <span className="label-req">*</span></label>
          <select id="s-moneda" className="form-select" name="moneda" value={formS.moneda} onChange={chS}
            style={{ maxWidth: 120 }}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
          {formS.clienteId && <span className="field-hint">Sugerida según la entidad del cliente</span>}
        </div>

        {/* Periodicidad */}
        <div className="form-group">
          <label htmlFor="s-period">Periodicidad <span className="label-req">*</span></label>
          <select id="s-period" className="form-select" name="periodicidad" value={formS.periodicidad} onChange={chS}
            style={{ maxWidth: 160 }}>
            {PERIODICIDADES.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>

        {/* Estado — solo en edición */}
        {editingServicio && (
          <div className="form-group">
            <label htmlFor="s-estado">Estado</label>
            <select id="s-estado" className="form-select" name="estado" value={editingServicio.estado}
              onChange={e => setEditingServicio(prev => ({ ...prev, estado: e.target.value }))}
              style={{ maxWidth: 160, textTransform: 'capitalize' }}>
              {ESTADOS_SERVICIO.map(est => (
                <option key={est} value={est} style={{ textTransform: 'capitalize' }}>
                  {est.charAt(0).toUpperCase() + est.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Historial de precios — solo en edición, si tiene entradas */}
        {editingServicio && editingServicio.historialPrecios && editingServicio.historialPrecios.length > 0 && (
          <div className="form-group" style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', border: '1px solid #e5e7eb' }}>
            <label style={{ fontWeight: 600, marginBottom: 10, display: 'block', fontSize: 13 }}>
              Historial de precios
            </label>
            {editingServicio.historialPrecios.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 6, fontSize: 13 }}>
                <span className="td-muted" style={{ minWidth: 90 }}>{h.fecha}</span>
                <span>
                  {h.valorAnterior !== null && h.valorAnterior !== undefined
                    ? <><span className="td-muted" style={{ textDecoration: 'line-through' }}>{h.valorAnterior}</span>{' → '}</>
                    : null
                  }
                  <strong>{h.valorNuevo}</strong>
                </span>
                {h.motivo && <span className="td-muted">— {h.motivo}</span>}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}