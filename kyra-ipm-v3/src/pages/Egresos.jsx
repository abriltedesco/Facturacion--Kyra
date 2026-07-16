import { useState, useRef, useEffect } from 'react'
import Modal from '../components/Modal'

const PAGE_SIZE = 9
const ESTADOS = ['PENDIENTE', 'APROBADA', 'EMITIDA', 'ERROR']

const EGRESOS_DATA = Array.from({ length: 180 }, (_, i) => ({
  id: i + 1,
  nro: String(i + 1).padStart(5, '0'),
  estado: ESTADOS[i % 4],
  contacto: 'Proveedor',
  emision: '01/07/2026',
  vencimiento: '31/07/2026',
  pago: i % 4 === 2 ? '15/07/2026' : '-',
  concepto: 'Concepto',
  total: '$' + ((i % 10 + 1) * 500),
}))

const TABS = ['Pendientes', 'Historial']
const EMPTY_EGRESO = { contacto: '', concepto: '', total: '', emision: '', vencimiento: '' }

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
        <option value="">Todos</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Pagination({ total, page, setPage }) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)
  const pageNums = Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1)
  return (
    <nav aria-label="Paginacion" className="pagination">
      <span className="pagination-info">{from}-{to} de {total}</span>
      <div className="pagination-pages">
        <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1} aria-label="Primera pagina">«</button>
        <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Pagina anterior">‹</button>
        {pageNums.map(n => (
          <button
            key={n}
            className={'page-btn' + (page === n ? ' active' : '')}
            onClick={() => setPage(n)}
            aria-label={'Pagina ' + n}
            aria-current={page === n ? 'page' : undefined}
          >{n}</button>
        ))}
        {totalPages > 10 && <span className="page-btn" style={{ cursor: 'default', border: 'none' }} aria-hidden="true">…</span>}
        <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Pagina siguiente">›</button>
        <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Ultima pagina">»</button>
      </div>
    </nav>
  )
}

export default function Egresos() {
  const [tabIdx, setTabIdx] = useState(0)
  const [page, setPage] = useState(1)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroContacto, setFiltroContacto] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_EGRESO)
  const btnNuevoRef = useRef(null)

  useEffect(() => { document.title = 'Egresos — IPM Kyra' }, [])

  const pendientes = EGRESOS_DATA.filter(r => r.estado === 'PENDIENTE')
  const historial  = EGRESOS_DATA.filter(r => r.estado !== 'PENDIENTE')
  const base = tabIdx === 0 ? pendientes : historial

  const filtered = base.filter(r => {
    const matchEstado = !filtroEstado || r.estado === filtroEstado
    const matchContacto = !filtroContacto || r.contacto === filtroContacto
    return matchEstado && matchContacto
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

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  const isReady = form.contacto && form.concepto && form.total

  const guardar = () => {
    if (!isReady) return
    setOpen(false); setForm(EMPTY_EGRESO)
  }

  const handleTabKey = (e, idx) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = (idx + 1) % TABS.length
      setTabIdx(next); setPage(1)
      document.getElementById('egr-tab-' + next)?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = (idx - 1 + TABS.length) % TABS.length
      setTabIdx(prev); setPage(1)
      document.getElementById('egr-tab-' + prev)?.focus()
    }
  }

  const allSelected = pageRows.length > 0 && selected.size === pageRows.length

  return (
    <div>
      <h1 className="page-title">Egresos</h1>

      <div className="toolbar">
        <FilterBox id="egr-estado" label="Estado" options={ESTADOS} value={filtroEstado}
          onChange={v => { setFiltroEstado(v); setPage(1) }} />
        <FilterBox id="egr-contacto" label="Contacto" options={['Proveedor']} value={filtroContacto}
          onChange={v => { setFiltroContacto(v); setPage(1) }} />
        <FilterBox id="egr-concepto" label="Concepto" options={['Concepto']} value="" onChange={() => {}} />
        <div className="toolbar-right">
          <button className="icon-btn" aria-label="Exportar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
          <button className="icon-btn" aria-label="Importar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button ref={btnNuevoRef} className="btn-cta" onClick={() => setOpen(true)}>
            NUEVO EGRESO
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      <div role="tablist" aria-label="Secciones de egresos" className="subtabs">
        {TABS.map((t, idx) => (
          <button
            key={t}
            id={'egr-tab-' + idx}
            role="tab"
            aria-selected={tabIdx === idx}
            aria-controls="egr-tabpanel"
            tabIndex={tabIdx === idx ? 0 : -1}
            className={'subtab' + (tabIdx === idx ? ' active' : '')}
            onClick={() => { setTabIdx(idx); setPage(1) }}
            onKeyDown={e => handleTabKey(e, idx)}
          >{t}</button>
        ))}
      </div>

      <div id="egr-tabpanel" role="tabpanel" aria-labelledby={'egr-tab-' + tabIdx} className="table-container">
        <table>
          <thead>
            <tr>
              <th scope="col" style={{ width: 32 }}>
                <input type="checkbox" className="row-check" checked={allSelected} onChange={toggleAll}
                  aria-label={allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'} />
              </th>
              <th scope="col">Nro</th>
              <th scope="col">Estado</th>
              <th scope="col">Contacto</th>
              <th scope="col">Emision</th>
              <th scope="col">Vencimiento</th>
              <th scope="col">Pago</th>
              <th scope="col">Concepto</th>
              <th scope="col">Total</th>
              <th scope="col" style={{ width: 32 }}><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map(r => (
              <tr key={r.id}>
                <td>
                  <input type="checkbox" className="row-check" checked={selected.has(r.id)}
                    onChange={() => toggleOne(r.id)} aria-label={'Seleccionar egreso #' + r.nro} />
                </td>
                <td><button className="link-nro" onClick={() => {}}>#{r.nro}</button></td>
                <td><Badge estado={r.estado} /></td>
                <td>{r.contacto}</td>
                <td className="td-muted">{r.emision}</td>
                <td className="td-muted">{r.vencimiento}</td>
                <td className="td-muted">{r.pago}</td>
                <td className="td-muted">{r.concepto}</td>
                <td className="td-muted">{r.total}</td>
                <td><button className="dots-btn" aria-label={'Opciones egreso #' + r.nro}>+</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination total={filtered.length} page={page} setPage={setPage} />

      <Modal
        isOpen={open}
        onClose={() => { setOpen(false); setForm(EMPTY_EGRESO) }}
        title="Nuevo Egreso"
        triggerRef={btnNuevoRef}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div className="modal-validation">
              {!isReady && (
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  {' '}Faltan llenar datos
                </span>
              )}
            </div>
            <button className={'btn-guardar' + (isReady ? ' ready' : '')} onClick={guardar}>Guardar</button>
          </div>
        }
      >
        <div className="form-group">
          <label htmlFor="egr-contacto-inp">Contacto / Proveedor</label>
          <input id="egr-contacto-inp" className="form-input" name="contacto" value={form.contacto} onChange={change} />
        </div>
        <div className="form-group">
          <label htmlFor="egr-concepto-inp">Concepto</label>
          <input id="egr-concepto-inp" className="form-input" name="concepto" value={form.concepto} onChange={change} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="egr-emision">Fecha de Emision</label>
            <input id="egr-emision" className="form-input" name="emision" type="date" value={form.emision} onChange={change} />
          </div>
          <div className="form-group">
            <label htmlFor="egr-vencimiento">Vencimiento</label>
            <input id="egr-vencimiento" className="form-input" name="vencimiento" type="date" value={form.vencimiento} onChange={change} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="egr-total">Total</label>
          <input id="egr-total" className="form-input" name="total" value={form.total} onChange={change} placeholder="$0" />
        </div>
      </Modal>
    </div>
  )
}
