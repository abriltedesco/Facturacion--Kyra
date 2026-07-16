import { useState, useRef, useEffect } from 'react'
import Modal from '../components/Modal'

const TABS = ['Clientes', 'Proveedores', 'Entidades', 'Servicios']
const PAGE_SIZE = 10

// ── Mock data for each tab ──────────────────────────────────────────────────

const CLIENTES_DATA = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  nombre: ['Maped', 'Edding ARG', 'Edding COL', 'Ayax', 'TechCorp', 'Brandex', 'Luxor', 'Staedtler', 'BIC', 'Pilot'][i],
  estado: i % 3 === 0 ? 'INACTIVO' : 'ACTIVO',
  mail: ['maped', 'edding.arg', 'edding.col', 'ayax', 'techcorp', 'brandex', 'luxor', 'staedtler', 'bic', 'pilot'][i] + '@gmail.com',
  tipoFactura: ['A', 'A', 'LLC', 'B', 'A', 'C', 'LLC', 'A', 'B', 'A'][i],
  impuesto: 'IVA 21%',
  identificacion: '20-' + String(11111111 + i * 3333333) + '-1',
}))

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

const ENTIDADES_DATA = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  nombre: ['Kyra SRL', 'Kyra LLC', 'Kyra Arg', 'Estudio AB', 'Agencia X', 'Estudio Y', 'Corp Z', 'HoldCo', 'SubCo', 'Intl SA'][i],
  estado: i % 4 === 0 ? 'Inactiva' : 'Activa',
  tipo: ['SRL', 'LLC', 'Autónomo', 'SRL', 'SA', 'SRL', 'LLC', 'SA', 'SRL', 'SA'][i],
  cuentaBancaria: 'CBU ' + String(2850590940 + i * 111111111),
  comprobante: ['AFIP', 'IRS', 'AFIP', 'AFIP', 'AFIP', 'AFIP', 'IRS', 'AFIP', 'AFIP', 'IRS'][i],
  identificacion: '30-' + String(61234567 + i * 1234567) + '-8',
}))

const SERVICIOS_DATA = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  nombre: ['Social Media', 'Diseño UX/UI', 'Consultoría', 'Branding', 'SEO', 'SEM', 'Estrategia', 'Contenido', 'Analytics', 'Email Marketing'][i],
  estado: i % 5 === 0 ? 'Inactivo' : 'Activo',
  tipo: ['Mensual', 'Por hora', 'Por hora', 'Proyecto', 'Mensual', 'Mensual', 'Por hora', 'Mensual', 'Mensual', 'Mensual'][i],
  precio: ['$80.000', '$95.000/h', '$120.000/h', '$250.000', '$60.000', '$75.000', '$150.000/h', '$70.000', '$55.000', '$65.000'][i],
}))

// ── Forms ────────────────────────────────────────────────────────────────────

const EMPTY_CLIENTE   = { nombre: '', email: '', tipoFactura: '', periodo: '', impuesto: '', identificacion: '', contacto: '', anotaciones: '' }
const EMPTY_PROVEEDOR = { nombre: '', email: '', tipoServicio: '', metodoPago: '', destino: '', cuit: '' }
const EMPTY_ENTIDAD   = { nombre: '', tipo: '', cuentaBancaria: '', comprobante: '', identificacion: '' }
const EMPTY_SERVICIO  = { nombre: '', tipo: '', precio: '' }

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
  const [tab, setTab] = useState(0)
  const [clientes, setClientes] = useState(CLIENTES_DATA)
  const [proveedores, setProveedores] = useState(PROVEEDORES_DATA)
  const [entidades, setEntidades] = useState(ENTIDADES_DATA)
  const [servicios, setServicios] = useState(SERVICIOS_DATA)

  const [openModal, setOpenModal] = useState(null) // 'cliente'|'proveedor'|'entidad'|'servicio'|null
  const [showDropdown, setShowDropdown] = useState(false)
  const [formC, setFormC] = useState(EMPTY_CLIENTE)
  const [formP, setFormP] = useState(EMPTY_PROVEEDOR)
  const [formE, setFormE] = useState(EMPTY_ENTIDAD)
  const [formS, setFormS] = useState(EMPTY_SERVICIO)
  const [submitted, setSubmitted] = useState(false)

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

  const currentData = [clientes, proveedores, entidades, servicios][tab]

  const filtered = currentData.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.nombre.toLowerCase().includes(q) || (r.mail || '').toLowerCase().includes(q)
    const matchEstado = !filtroEstado || String(r.estado).toUpperCase() === filtroEstado.toUpperCase()
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
  const chE = e => setFormE(p => ({ ...p, [e.target.name]: e.target.value }))
  const chS = e => setFormS(p => ({ ...p, [e.target.name]: e.target.value }))

  const isReadyC = formC.nombre && formC.email && formC.tipoFactura
  const isReadyP = formP.nombre && formP.email && formP.destino
  const isReadyE = formE.nombre && formE.cuentaBancaria
  const isReadyS = formS.nombre && formS.tipo && formS.precio

  const guardarC = () => {
    setSubmitted(true)
    if (!isReadyC) return
    setClientes(p => [{ id: Date.now(), nombre: formC.nombre, estado: 'ACTIVO', mail: formC.email, tipoFactura: formC.tipoFactura, impuesto: formC.impuesto || 'IVA 21%', identificacion: formC.identificacion }, ...p])
    setFormC(EMPTY_CLIENTE); setSubmitted(false); setOpenModal(null); setTab(0)
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
    setEntidades(p => [{ id: Date.now(), nombre: formE.nombre, estado: 'Activa', tipo: formE.tipo, cuentaBancaria: formE.cuentaBancaria, comprobante: formE.comprobante, identificacion: formE.identificacion }, ...p])
    setFormE(EMPTY_ENTIDAD); setSubmitted(false); setOpenModal(null); setTab(2)
  }
  const guardarS = () => {
    setSubmitted(true)
    if (!isReadyS) return
    setServicios(p => [{ id: Date.now(), nombre: formS.nombre, estado: 'Activo', tipo: formS.tipo, precio: formS.precio }, ...p])
    setFormS(EMPTY_SERVICIO); setSubmitted(false); setOpenModal(null); setTab(3)
  }

  const footerFor = (isReady, onSave) => (
    <div className="modal-footer-inner">
      <div className="modal-validation">
        {submitted && !isReady && (
          <span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {' '}Faltan llenar datos
          </span>
        )}
      </div>
      <button className={'btn-guardar' + (isReady ? ' ready' : '')} onClick={onSave}>Guardar</button>
    </div>
  )

  const closeModal = () => { setOpenModal(null); setSubmitted(false) }

  // Table columns per tab
  const renderTable = () => {
    if (tab === 0) return (
      <table>
        <thead><tr>
          <th scope="col">CLIENTE</th><th scope="col">ESTADO</th>
          <th scope="col">MAIL</th><th scope="col">TIPO FACTURA</th>
          <th scope="col">IMPUESTO ADICIONAL</th><th scope="col">IDENTIFICACIÓN FISCAL</th>
        </tr></thead>
        <tbody>
          {pageRows.length === 0
            ? <tr><td colSpan={6} className="td-empty">Sin resultados</td></tr>
            : pageRows.map(r => (
              <tr key={r.id}>
                <td>{r.nombre}</td>
                <td><Badge estado={r.estado} /></td>
                <td className="td-muted">{r.mail}</td>
                <td className="td-muted">{r.tipoFactura}</td>
                <td className="td-muted">{r.impuesto}</td>
                <td className="td-muted">{r.identificacion}</td>
              </tr>
            ))
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
                <td><button className="dots-btn" aria-label={'Opciones ' + r.nombre}>⋮</button></td>
              </tr>
            ))
          }
        </tbody>
      </table>
    )

    if (tab === 2) return (
      <table>
        <thead><tr>
          <th scope="col">NOMBRE</th><th scope="col">ESTADO</th>
          <th scope="col">TIPO</th><th scope="col">CUENTA BANCARIA</th>
          <th scope="col">COMPROBANTE</th><th scope="col">IDENTIFICACIÓN FISCAL</th>
        </tr></thead>
        <tbody>
          {pageRows.length === 0
            ? <tr><td colSpan={6} className="td-empty">Sin resultados</td></tr>
            : pageRows.map(r => (
              <tr key={r.id}>
                <td>{r.nombre}</td>
                <td className="td-muted">{r.estado}</td>
                <td className="td-muted">{r.tipo}</td>
                <td className="td-muted">{r.cuentaBancaria}</td>
                <td className="td-muted">{r.comprobante}</td>
                <td className="td-muted">{r.identificacion}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    )

    // tab === 3: Servicios
    return (
      <table>
        <thead><tr>
          <th scope="col">NOMBRE</th><th scope="col">ESTADO</th>
          <th scope="col">TIPO</th><th scope="col">PRECIO</th>
        </tr></thead>
        <tbody>
          {pageRows.length === 0
            ? <tr><td colSpan={4} className="td-empty">Sin resultados</td></tr>
            : pageRows.map(r => (
              <tr key={r.id}>
                <td>{r.nombre}</td>
                <td className="td-muted">{r.estado}</td>
                <td className="td-muted">{r.tipo}</td>
                <td className="td-muted">{r.precio}</td>
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
          options={tab === 0 ? ['ACTIVO', 'INACTIVO'] : tab === 1 ? ['PENDIENTE'] : ['Activa', 'Inactiva']}
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
                  { label: 'Nuevo cliente', action: () => { setTab(0); setOpenModal('cliente'); setFormC(EMPTY_CLIENTE); setSubmitted(false); setShowDropdown(false) } },
                  { label: 'Nuevo proveedor', action: () => { setTab(1); setOpenModal('proveedor'); setFormP(EMPTY_PROVEEDOR); setSubmitted(false); setShowDropdown(false) } },
                  { label: 'Nueva entidad', action: () => { setTab(2); setOpenModal('entidad'); setFormE(EMPTY_ENTIDAD); setSubmitted(false); setShowDropdown(false) } },
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
        {renderTable()}
        <Pagination page={page} totalPages={totalPages} onChange={p => setPage(p)} />
      </div>

      {/* NUEVO CLIENTE modal */}
      <Modal isOpen={openModal === 'cliente'} onClose={closeModal} title="NUEVO CLIENTE" triggerRef={btnNuevoRef}
        footer={footerFor(isReadyC, guardarC)}>
        <div className="form-group">
          <label htmlFor="c-nombre">Nombre del Cliente</label>
          <input id="c-nombre" className="form-input" name="nombre" value={formC.nombre} onChange={chC} />
        </div>
        <div className="form-group">
          <label htmlFor="c-email">Email</label>
          <input id="c-email" className="form-input" name="email" type="email" value={formC.email} onChange={chC} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="c-tipo">Tipo de Factura</label>
            <select id="c-tipo" className="form-select" name="tipoFactura" value={formC.tipoFactura} onChange={chC}>
              <option value=""></option>
              {['A', 'B', 'C', 'LLC'].map(t => <option key={t} value={t}>Factura {t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="c-periodo">Período de Facturación</label>
            <select id="c-periodo" className="form-select" name="periodo" value={formC.periodo} onChange={chC}>
              <option value=""></option>
              {['Mensual', 'Bimestral', 'Trimestral', 'Anual'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="c-impuesto">Impuesto Adicional</label>
          <input id="c-impuesto" className="form-input" name="impuesto" value={formC.impuesto} onChange={chC} />
        </div>
        <div className="form-group">
          <label htmlFor="c-ident">Identificación Fiscal</label>
          <input id="c-ident" className="form-input" name="identificacion" value={formC.identificacion} onChange={chC} />
        </div>
        <div className="form-group">
          <label htmlFor="c-contacto">Nombre de Contacto</label>
          <input id="c-contacto" className="form-input" name="contacto" value={formC.contacto} onChange={chC} />
        </div>
        <div className="form-group">
          <label htmlFor="c-anot">Anotaciones</label>
          <textarea id="c-anot" className="form-textarea" name="anotaciones" value={formC.anotaciones} onChange={chC} />
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

      {/* NUEVA ENTIDAD modal */}
      <Modal isOpen={openModal === 'entidad'} onClose={closeModal} title="NUEVA ENTIDAD" triggerRef={btnNuevoRef}
        footer={footerFor(isReadyE, guardarE)}>
        <div className="form-group">
          <label htmlFor="e-nombre">Nombre de Entidad</label>
          <input id="e-nombre" className="form-input" name="nombre" value={formE.nombre} onChange={chE} />
        </div>
        <div className="form-group">
          <label htmlFor="e-tipo">Tipo</label>
          <input id="e-tipo" className="form-input" name="tipo" value={formE.tipo} onChange={chE} />
        </div>
        <div className="form-group">
          <label htmlFor="e-cuenta">Cuenta Bancaria</label>
          <input id="e-cuenta" className="form-input" name="cuentaBancaria" value={formE.cuentaBancaria} onChange={chE} />
        </div>
        <div className="form-group">
          <label htmlFor="e-comp">Comprobante</label>
          <input id="e-comp" className="form-input" name="comprobante" value={formE.comprobante} onChange={chE} />
        </div>
        <div className="form-group">
          <label htmlFor="e-ident">Identificación Fiscal</label>
          <input id="e-ident" className="form-input" name="identificacion" value={formE.identificacion} onChange={chE} />
        </div>
      </Modal>

      {/* NUEVO SERVICIO modal */}
      <Modal isOpen={openModal === 'servicio'} onClose={closeModal} title="NUEVO SERVICIO" triggerRef={btnNuevoRef}
        footer={footerFor(isReadyS, guardarS)}>
        <div className="form-group">
          <label htmlFor="s-nombre">Nombre</label>
          <input id="s-nombre" className="form-input" name="nombre" value={formS.nombre} onChange={chS} />
        </div>
        <div className="form-group">
          <label htmlFor="s-tipo">Tipo</label>
          <select id="s-tipo" className="form-select" name="tipo" value={formS.tipo} onChange={chS}>
            <option value=""></option>
            {['Mensual', 'Por hora', 'Proyecto'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="s-precio">Precio</label>
          <input id="s-precio" className="form-input" name="precio" value={formS.precio} onChange={chS} placeholder="$0" />
        </div>
      </Modal>
    </div>
  )
}
