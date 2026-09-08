import { useState } from 'react'
import Modal from '../Modal'

function CatalogSection({ title, hint, items, empty, label, renderInputs, onSave }) {
  const [draft, setDraft] = useState(empty())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    setError('')
    setSaving(true)
    try {
      await onSave(draft)
      setDraft(empty())
    } catch (requestError) {
      setError(requestError.message || 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(item) {
    setError('')
    try {
      await onSave({ ...item, active: !item.active })
    } catch (requestError) {
      setError(requestError.message || 'No se pudo actualizar.')
    }
  }

  return (
    <section className="entity-form-section">
      <div className="entity-form-section-heading"><h3>{title}</h3></div>
      {hint && <span className="field-hint">{hint}</span>}
      <ul className="catalog-list">
        {items.length === 0 && <li className="catalog-list-empty">Sin elementos cargados.</li>}
        {items.map(item => (
          <li key={item.id} className="catalog-list-item">
            <span className={item.active ? '' : 'catalog-list-item-inactive'}>{label(item)}</span>
            <button type="button" className="btn-arca-secondary" onClick={() => handleToggle(item)}>
              {item.active ? 'Desactivar' : 'Activar'}
            </button>
          </li>
        ))}
      </ul>
      <div className="catalog-add-row">
        {renderInputs(draft, setDraft)}
        <button type="button" className="btn-add-cc-form" disabled={saving} onClick={handleAdd}>
          {saving ? 'Guardando…' : '+ Agregar'}
        </button>
      </div>
      {error && <span className="field-error">{error}</span>}
    </section>
  )
}

export default function CatalogsModal({
  isOpen, onClose, countries, fiscalConditions, taxCategories,
  onSaveCountry, onSaveFiscalCondition, onSaveTaxCategory,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="CATÁLOGOS DE CLIENTES" className="modal-box-wide">
      <div className="entity-form">
        <CatalogSection
          title="Países"
          items={countries}
          onSave={onSaveCountry}
          empty={() => ({ code: '', name: '', active: true })}
          label={item => `${item.name} (${item.code})`}
          renderInputs={(draft, setDraft) => (
            <>
              <input className="form-input" style={{ maxWidth: 90 }} placeholder="Código (AR)" value={draft.code}
                onChange={event => setDraft({ ...draft, code: event.target.value.toUpperCase() })} />
              <input className="form-input" placeholder="Nombre" value={draft.name}
                onChange={event => setDraft({ ...draft, name: event.target.value })} />
            </>
          )}
        />

        <CatalogSection
          title="Condiciones fiscales"
          hint="Cada condición pertenece a un país."
          items={fiscalConditions}
          onSave={onSaveFiscalCondition}
          empty={() => ({ countryId: countries[0]?.id || '', name: '', active: true })}
          label={item => `${item.name} — ${countries.find(country => country.id === item.countryId)?.name || 'sin país'}`}
          renderInputs={(draft, setDraft) => (
            <>
              <select className="form-select" value={draft.countryId}
                onChange={event => setDraft({ ...draft, countryId: Number(event.target.value) })}>
                {countries.map(country => <option key={country.id} value={country.id}>{country.name}</option>)}
              </select>
              <input className="form-input" placeholder="Nombre" value={draft.name}
                onChange={event => setDraft({ ...draft, name: event.target.value })} />
            </>
          )}
        />

        <CatalogSection
          title="Categorías de impuesto adicional"
          hint="Ej: Colombia 12.5%, Costa Rica 0%. Se asignan opcionalmente a cada cliente."
          items={taxCategories}
          onSave={onSaveTaxCategory}
          empty={() => ({ name: '', taxRate: '', active: true })}
          label={item => `${item.name} (${item.taxRate}%)`}
          renderInputs={(draft, setDraft) => (
            <>
              <input className="form-input" placeholder="Nombre (ej: Colombia)" value={draft.name}
                onChange={event => setDraft({ ...draft, name: event.target.value })} />
              <input className="form-input" style={{ maxWidth: 100 }} type="number" step="0.01" min="0" max="100"
                placeholder="%" value={draft.taxRate}
                onChange={event => setDraft({ ...draft, taxRate: event.target.value })} />
            </>
          )}
        />
      </div>
    </Modal>
  )
}
