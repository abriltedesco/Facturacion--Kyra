function FieldError({ children }) {
  return children ? <span className="field-error">{children}</span> : null
}

export function emptyBankAccount(legalType = 'srl') {
  return {
    bankName: '',
    accountHolder: '',
    currency: legalType === 'llc' ? 'USD' : 'ARS',
    accountScope: legalType === 'llc' ? 'international' : 'local',
    cbu: '',
    alias: '',
    accountNumber: '',
    routingNumber: '',
    swiftBic: '',
    iban: '',
    isPrimary: true,
  }
}

export default function BankAccountsFields({ accounts, errors, onChange }) {
  function updateAccount(index, field, value) {
    const next = accounts.map((account, accountIndex) => {
      if (accountIndex !== index) {
        if (field === 'isPrimary' && value && account.currency === accounts[index].currency) {
          return { ...account, isPrimary: false }
        }
        return account
      }

      if (field === 'accountScope') {
        return {
          ...account,
          accountScope: value,
          cbu: '',
          alias: '',
          accountNumber: '',
          routingNumber: '',
          swiftBic: '',
          iban: '',
        }
      }
      return { ...account, [field]: value }
    })
    onChange(next)
  }

  function addAccount() {
    onChange([...accounts, { ...emptyBankAccount(), isPrimary: false }])
  }

  function removeAccount(index) {
    onChange(accounts.filter((_, accountIndex) => accountIndex !== index))
  }

  return (
    <div className="entity-accounts">
      {accounts.map((account, index) => {
        const accountErrors = Array.isArray(errors) ? errors[index] || {} : {}
        return (
          <fieldset className="entity-account" key={account.id || index}>
            <legend>Cuenta {index + 1}</legend>
            <div className="entity-form-grid entity-form-grid-2">
              <div className="form-group">
                <label htmlFor={`account-bank-${index}`}>Banco <span className="label-req">*</span></label>
                <input id={`account-bank-${index}`} className={`form-input${accountErrors.bankName ? ' input-error' : ''}`}
                  value={account.bankName} onChange={event => updateAccount(index, 'bankName', event.target.value)} />
                <FieldError>{accountErrors.bankName}</FieldError>
              </div>
              <div className="form-group">
                <label htmlFor={`account-holder-${index}`}>Titular <span className="label-req">*</span></label>
                <input id={`account-holder-${index}`} className={`form-input${accountErrors.accountHolder ? ' input-error' : ''}`}
                  value={account.accountHolder} onChange={event => updateAccount(index, 'accountHolder', event.target.value)} />
                <FieldError>{accountErrors.accountHolder}</FieldError>
              </div>
              <div className="form-group">
                <label htmlFor={`account-currency-${index}`}>Moneda <span className="label-req">*</span></label>
                <select id={`account-currency-${index}`} className="form-select" value={account.currency}
                  onChange={event => updateAccount(index, 'currency', event.target.value)}>
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor={`account-scope-${index}`}>Alcance <span className="label-req">*</span></label>
                <select id={`account-scope-${index}`} className="form-select" value={account.accountScope}
                  onChange={event => updateAccount(index, 'accountScope', event.target.value)}>
                  <option value="local">Argentina</option>
                  <option value="international">Internacional</option>
                </select>
              </div>
            </div>

            {account.accountScope === 'local' ? (
              <div className="entity-form-grid entity-form-grid-2">
                <div className="form-group">
                  <label htmlFor={`account-cbu-${index}`}>CBU <span className="label-req">*</span></label>
                  <input id={`account-cbu-${index}`} className={`form-input${accountErrors.cbu ? ' input-error' : ''}`}
                    inputMode="numeric" value={account.cbu} onChange={event => updateAccount(index, 'cbu', event.target.value)} />
                  <FieldError>{accountErrors.cbu}</FieldError>
                </div>
                <div className="form-group">
                  <label htmlFor={`account-alias-${index}`}>Alias</label>
                  <input id={`account-alias-${index}`} className="form-input" value={account.alias}
                    onChange={event => updateAccount(index, 'alias', event.target.value)} />
                </div>
              </div>
            ) : (
              <div className="entity-form-grid entity-form-grid-2">
                <div className="form-group">
                  <label htmlFor={`account-number-${index}`}>Número de cuenta <span className="label-req">*</span></label>
                  <input id={`account-number-${index}`} className={`form-input${accountErrors.accountNumber ? ' input-error' : ''}`}
                    value={account.accountNumber} onChange={event => updateAccount(index, 'accountNumber', event.target.value)} />
                  <FieldError>{accountErrors.accountNumber}</FieldError>
                </div>
                <div className="form-group">
                  <label htmlFor={`account-routing-${index}`}>Routing</label>
                  <input id={`account-routing-${index}`} className="form-input" value={account.routingNumber}
                    onChange={event => updateAccount(index, 'routingNumber', event.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor={`account-swift-${index}`}>SWIFT / BIC</label>
                  <input id={`account-swift-${index}`} className="form-input" value={account.swiftBic}
                    onChange={event => updateAccount(index, 'swiftBic', event.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor={`account-iban-${index}`}>IBAN</label>
                  <input id={`account-iban-${index}`} className="form-input" value={account.iban}
                    onChange={event => updateAccount(index, 'iban', event.target.value)} />
                </div>
                <FieldError>{accountErrors.internationalCode}</FieldError>
              </div>
            )}

            <div className="entity-account-footer">
              <label className="entity-check">
                <input type="checkbox" checked={account.isPrimary}
                  onChange={event => updateAccount(index, 'isPrimary', event.target.checked)} />
                Cuenta principal para {account.currency}
              </label>
              {accounts.length > 1 && (
                <button type="button" className="entity-account-remove" onClick={() => removeAccount(index)}>
                  Quitar cuenta
                </button>
              )}
            </div>
          </fieldset>
        )
      })}
      <button type="button" className="entity-add-account" onClick={addAccount}>+ Agregar cuenta</button>
      {typeof errors === 'string' && <FieldError>{errors}</FieldError>}
    </div>
  )
}