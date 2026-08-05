import { useState, useRef, useEffect } from 'react'
import Modal from '../components/Modal'

const PAGE_SIZE = 9
const ESTADOS = ['PENDIENTE', 'APROBADA', 'EMITIDA', 'ERROR']
const PROVEEDORES_NOMBRES = ['AWS Services', 'Google Workspace', 'Adobe Inc', 'Slack Corp', 'Figma Inc', 'Notion', 'Vercel', 'GitHub', 'Linear', 'Loom']
const CONCEPTOS = ['Software', 'Marketing', 'Diseño', 'Consultoría', 'Licencias']

const EGRESOS_DATA = Array.from({ length: 180 }, (_, i) => ({
  id: i + 1,
  nro: i + 1,
  estado: ESTADOS[i % 4],
  contacto: PROVEEDORES_NOMBRES[i % PROVEEDORES_NOMBRES.length],
  emision: '02/07/26',
  vencimiento: '20/07/26',
  pago: i % 4 === 2 ? '15/07/26' : '-',
  concepto: CONCEPTOS[i % CONCEPTOS.length] + ' del egreso',
  total: '$' + ((i % 10 + 1) * 500).toLocaleString('es-AR') + ',00',
}))

const TABS = ['Pendientes', 'Historial']
const EMPTY = {
  contacto: '', concepto: '', total: '', emision: '', vencimiento: '', pago: '',
  comprobante: { nombre: null, preview: null }, clienteAsociado: '', servicioAsociado: '',
}

const CLIENTES_OPCIONES = ['Maped', 'Edding ARG', 'Edding COL', 'Ayax', 'TechCorp']
const SERVICIOS_OPCIONES = ['Social Media', 'Diseño UX/UI', 'Consultoría', 'Branding', 'SEO']

function Badge({ estado }) {
  const cls = {
    PENDIENTE: 'badge badge-pendiente',
    APROBADA:  'badge badge-aprobada',
    EMITIDA:   'badge badge-emitida',
    ERROR:     'badge badge-error',
  }[estado] || 'badge'
  return <span className={cls}>{estado}</span>
}

function FilterBox({ id, label, options, value, onChange }) {
  const labelId = id + '-label'
  return (
    <div className="filter-box">
      <span id={labelId} className="filter-box-label">{label}</span>
      <select aria-labelledby={labelId} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Filtrar por {label.toLowerCase()}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Pagination({ total, page, setPage }) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)
  const show = totalPages <= 7
    ? Array.from({ length: totalPages }, (_, i) => i + 1)
    : [1, 2, 3, 4, 5, '…', totalPages]
  return (
    <nav aria-label="Paginacion" className="pagination">
      <span className="pagination-info">{from} - {to} de {total}</span>
      <div className="pagination-pages">
        <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1} aria-label="Primera pagina">«</button>
        <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Pagina anterior">‹</button>
        {show.map((n, i) => n === '…'
          ? <span key={'e' + i} className="page-btn page-ellipsis" aria-hidden="true">…</span>
          : <button key={n} className={'page-btn' + (page === n ? ' active' : '')} onClick={() => setPage(n)} aria-label={'Pagina ' + n} aria-current={page === n ? 'page' : undefined}>{n}</button>
        )}
        <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Pagina siguiente">›</button>
        <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Ultima pagina">»</button>
      </div>
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

export default function Egresos() {
  const [data, setData] = useState(EGRESOS_DATA)
  const [tabIdx, setTabIdx] = useState(0)
  const [page, setPage] = useState(1)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroContacto, setFiltroContacto] = useState('')
  const [filtroConcepto, setFiltroConcepto] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [submitted, setSubmitted] = useState(false)
  const [editId, setEditId] = useState(null)
  const [rowMenuOpen, setRowMenuOpen] = useState(null)
  const btnNuevoRef = useRef(null)
  const rowMenuRef = useRef(null)

  useEffect(() => { document.title = 'Egresos — IPM Kyra' }, [])

  useEffect(() => {
    const handler = e => {
      if (rowMenuRef.current && !rowMenuRef.current.contains(e.target)) setRowMenuOpen(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pendientes = data.filter(r => r.estado === 'PENDIENTE')
  const historial  = data.filter(r => r.estado !== 'PENDIENTE')
  const base = tabIdx === 0 ? pendientes : historial

  const filtered = base.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || String(r.nro).includes(q) || r.contacto.toLowerCase().includes(q)
    const matchEstado = !filtroEstado || r.estado === filtroEstado
    const matchContacto = !filtroContacto || r.contacto === filtroContacto
    const matchConcepto = !filtroConcepto || r.concepto.includes(filtroConcepto)
    return matchSearch && matchEstado && matchContacto && matchConcepto
  })

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleAll = () => {
    if (selected.size === pageRows.length) setSelected(new Set())
    else setSelected(new Set(pageRows.map(r => r.id)))
  }
  const toggleOne = id => {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }

  const change = e => {
    const { name, value } = e.target
    setForm(p => {
      const next = { ...p, [name]: value }
      if (name === 'clienteAsociado' && !value) next.servicioAsociado = ''
      return next
    })
  }

  const handleFile = e => {
    const f = e.target.files?.[0]
    if (f) {
      const isImg = f.type.startsWith('image/')
      const preview = isImg ? URL.createObjectURL(f) : null
      setForm(p => ({ ...p, comprobante: { nombre: f.name, preview } }))
    }
  }
  const quitarComprobante = () => setForm(p => ({ ...p, comprobante: { nombre: null, preview: null } }))

  const isReady = !!(form.contacto && form.concepto && form.total && form.emision)

  function handleEditRow(row) {
    setEditId(row.id)
    setForm({
      contacto: row.contacto,
      concepto: row.concepto,
      total: row.total,
      emision: '',
      vencimiento: '',
      pago: '',
      comprobante: { nombre: null, preview: null },
      clienteAsociado: '',
      servicioAsociado: '',
    })
    setSubmitted(false)
    setOpen(true)
  }

  function handleDeleteRow(id) {
    setData(prev => prev.filter(r => r.id !== id))
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  const guardar = () => {
    setSubmitted(true)
    if (!isReady) return
    if (editId) {
      setData(prev => prev.map(r => r.id === editId
        ? { ...r, contacto: form.contacto, concepto: form.concepto, total: form.total,
            emision: form.emision, vencimiento: form.vencimiento || '-', pago: form.pago || '-' }
        : r))
      setEditId(null)
    } else {
      const newItem = {
        id: Date.now(), nro: data.length + 1, estado: 'PENDIENTE',
        contacto: form.contacto, emision: form.emision,
        vencimiento: form.vencimiento || '-', pago: '-',
        concepto: form.concepto, total: form.total,
      }
      setData(prev => [newItem, ...prev])
    }
    setForm(EMPTY); setSubmitted(false); setOpen(false)
  }

  const handleTabKey = (e, idx) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); const next = (idx+1)%TABS.length; setTabIdx(next); setPage(1); document.getElementById('egr-tab-'+next)?.focus() }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); const prev = (idx-1+TABS.length)%TABS.length; setTabIdx(prev); setPage(1); document.getElementById('egr-tab-'+prev)?.focus() }
  }

  const allSelected = pageRows.length > 0 && selected.size === pageRows.length
  const closeModal = () => { setOpen(false); setForm(EMPTY); setSubmitted(false); setEditId(null) }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Egresos</h1>
        <div className="page-header-actions">
          <button className="icon-btn" aria-label="Exportar">{SVG_EXPORT}</button>
          <button className="icon-btn" aria-label="Importar">{SVG_IMPORT}</button>
          <button ref={btnNuevoRef} className="btn-cta"
            onClick={() => { setSubmitted(false); setEditId(null); setForm(EMPTY); setOpen(true) }}>
            NUEVO EGRESO
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="filter-row">
        <FilterBox id="egr-estado" label="Estado" options={ESTADOS} value={filtroEstado}
          onChange={v => { setFiltroEstado(v); setPage(1) }} />
        <FilterBox id="egr-proveedor" label="Proveedor" options={PROVEEDORES_NOMBRES} value={filtroContacto}
          onChange={v => { setFiltroContacto(v); setPage(1) }} />
        <FilterBox id="egr-concepto" label="Concepto" options={CONCEPTOS} value={filtroConcepto}
          onChange={v => { setFiltroConcepto(v); setPage(1) }} />
        <div className="search-wrap">
          <label htmlFor="egr-search" className="sr-only">Buscar egresos</label>
          <input id="egr-search" className="search-input" placeholder="Buscar"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          <span className="search-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
        </div>
      </div>

      <div role="tablist" aria-label="Secciones de egresos" className="subtabs">
        {TABS.map((t, idx) => (
          <button key={t} id={'egr-tab-'+idx} role="tab"
            aria-selected={tabIdx===idx} aria-controls="egr-tabpanel"
            tabIndex={tabIdx===idx ? 0 : -1}
            className={'subtab'+(tabIdx===idx?' active':'')}
            onClick={() => { setTabIdx(idx); setPage(1) }}
            onKeyDown={e => handleTabKey(e, idx)}>{t}</button>
        ))}
      </div>

      <div id="egr-tabpanel" role="tabpanel" aria-labelledby={'egr-tab-'+tabIdx} className="table-container">
        <table>
          <thead>
            <tr>
              <th scope="col" style={{ width:36 }}>
                <input type="checkbox" className="row-check" checked={allSelected} onChange={toggleAll}
                  aria-label={allSelected?'Deseleccionar todos':'Seleccionar todos'} />
              </th>
              <th scope="col">NRO</th>
              <th scope="col">ESTADO</th>
              <th scope="col">PROVEEDOR</th>
              <th scope="col">EMISIÓN</th>
              <th scope="col">VENCIMIENTO</th>
              <th scope="col">PAGO</th>
              <th scope="col">CONCEPTO</th>
              <th scope="col">TOTAL</th>
              <th scope="col" style={{ width:36 }}><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={10} className="td-empty">Sin resultados</td></tr>
            ) : pageRows.map(r => (
              <tr key={r.id}>
                <td>
                  <input type="checkbox" className="row-check" checked={selected.has(r.id)}
                    onChange={() => toggleOne(r.id)} aria-label={'Seleccionar egreso #'+r.nro} />
                </td>
                <td><span className="link-nro">{r.nro}</span></td>
                <td><Badge estado={r.estado} /></td>
                <td>{r.contacto}</td>
                <td className="td-muted">{r.emision}</td>
                <td className="td-muted">{r.vencimiento}</td>
                <td className="td-muted">{r.pago}</td>
                <td className="td-muted">{r.concepto}</td>
                <td className="td-muted">{r.total}</td>
                <td className="row-menu-cell">
                  <button className="dots-btn" aria-label={'Opciones egreso #'+r.nro}
                    aria-expanded={rowMenuOpen===r.id} aria-haspopup="menu"
                    onClick={() => setRowMenuOpen(prev => prev===r.id ? null : r.id)}>⋮</button>
                  {rowMenuOpen === r.id && (
                    <div className="row-menu" ref={rowMenuRef} role="menu">
                      <button className="row-menu-item" role="menuitem"
                        onClick={() => { handleEditRow(r); setRowMenuOpen(null) }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Editar
                      </button>
                      <button className="row-menu-item row-menu-item-danger" role="menuitem"
                        onClick={() => { handleDeleteRow(r.id); setRowMenuOpen(null) }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14H6L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                          <path d="M9 6V4h6v2"/>
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination total={filtered.length} page={page} setPage={setPage} />

      <Modal
        isOpen={open}
        onClose={closeModal}
        title={editId ? 'EDITAR EGRESO' : 'NUEVO EGRESO'}
        triggerRef={btnNuevoRef}
        footer={
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
            <button className={'btn-guardar'+(isReady?' ready':'')} onClick={guardar} disabled={!isReady}>
              {editId ? 'Guardar cambios' : 'Guardar'}
            </button>
          </div>
        }
      >
        <div className="form-group">
          <label htmlFor="egr-contacto-inp">Contacto / Proveedor <span className="label-req">*</span></label>
          <select id="egr-contacto-inp" className="form-select" name="contacto" value={form.contacto} onChange={change}>
            <option value="">Seleccioná un proveedor</option>
            {PROVEEDORES_NOMBRES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="egr-concepto-inp">Concepto <span className="label-req">*</span></label>
          <input id="egr-concepto-inp" className="form-input" name="concepto" value={form.concepto} onChange={change} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="egr-emision">Fecha de Emisión <span className="label-req">*</span></label>
            <input id="egr-emision" className="form-input" name="emision" type="date" value={form.emision} onChange={change} />
          </div>
          <div className="form-group">
            <label htmlFor="egr-vencimiento">Vencimiento</label>
            <input id="egr-vencimiento" className="form-input" name="vencimiento" type="date" value={form.vencimiento} onChange={change} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="egr-pago">Fecha de Pago</label>
            <input id="egr-pago" className="form-input" name="pago" type="date" value={form.pago} onChange={change} />
          </div>
          <div className="form-group">
            <label htmlFor="egr-total">Total <span className="label-req">*</span></label>
            <input id="egr-total" className="form-input" name="total" value={form.total} onChange={change} placeholder="$0,00" />
          </div>
        </div>
        <div className="form-group">
          <label>Comprobante</label>
          {form.comprobante.nombre ? (
            <div className="file-attached">
              {form.comprobante.preview
                ? <img src={form.comprobante.preview} alt="Vista previa" className="file-preview-img" />
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
              }
              <span className="file-attached-name">{form.comprobante.nombre}</span>
              <button type="button" className="file-remove" aria-label="Quitar comprobante" onClick={quitarComprobante}>×</button>
            </div>
          ) : (
            <label className="file-upload-box" htmlFor="egr-comprobante">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>Subir archivo (PDF o imagen)</span>
              <input id="egr-comprobante" type="file" accept=".pdf,image/*" className="sr-only" onChange={handleFile} />
            </label>
          )}
          <span className="field-hint">Al guardar, el comprobante se sube automáticamente a Google Drive</span>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="egr-cliente-asoc">Asociar a cliente <span className="label-opcional">(Opcional)</span></label>
            <select id="egr-cliente-asoc" className="form-select" name="clienteAsociado" value={form.clienteAsociado} onChange={change}>
              <option value=""></option>
              {CLIENTES_OPCIONES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="egr-servicio-asoc">Asociar a servicio <span className="label-opcional">(Opcional)</span></label>
            <select id="egr-servicio-asoc" className="form-select" name="servicioAsociado" value={form.servicioAsociado} onChange={change}
              disabled={!form.clienteAsociado}>
              <option value=""></option>
              {SERVICIOS_OPCIONES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {!form.clienteAsociado && <span className="field-hint">Seleccioná primero un cliente</span>}
          </div>
        </div>
      </Modal>
    </div>
  )
}
