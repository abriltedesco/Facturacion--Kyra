function mapBankAccount(row) {
  return {
    id: row.id,
    entityId: row.entity_id,
    bankName: row.bank_name,
    accountHolder: row.account_holder,
    currency: row.currency,
    accountScope: row.account_scope,
    cbu: row.cbu || '',
    alias: row.alias || '',
    accountNumber: row.account_number || '',
    routingNumber: row.routing_number || '',
    swiftBic: row.swift_bic || '',
    iban: row.iban || '',
    isPrimary: row.is_primary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  }
}

function mapArcaDocument(row) {
  return {
    id: row.id,
    entityId: row.entity_id,
    originalFileName: row.original_file_name,
    storagePath: row.storage_path,
    expirationDate: row.expiration_date,
    uploadedAt: row.uploaded_at,
    supersededAt: row.superseded_at,
    revokedAt: row.revoked_at,
    uploadedBy: row.uploadedByProfile
      ? { username: row.uploadedByProfile.username, displayName: row.uploadedByProfile.display_name }
      : null,
  }
}

export function mapEntityRow(row) {
  const bankAccounts = (row.bankAccounts || [])
    .filter(account => !account.archived_at)
    .map(mapBankAccount)
  const arcaDocuments = (row.arcaDocuments || [])
    .map(mapArcaDocument)
    .sort((left, right) => String(right.uploadedAt).localeCompare(String(left.uploadedAt)))

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    legalType: row.legal_type,
    countryCode: row.country_code,
    fiscalIdType: row.fiscal_id_type,
    fiscalId: row.fiscal_id,
    fiscalAddress: row.fiscal_address,
    grossIncomeNumber: row.gross_income_number || '',
    billingEmail: row.billing_email || '',
    defaultVoucher: row.default_voucher,
    allowsBExempt: row.allows_b_exempt,
    pointOfSale: row.point_of_sale || '',
    invoicePrefix: row.invoice_prefix || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    bankAccounts,
    arcaDocuments,
    currentArcaDocument: arcaDocuments.find(document => !document.supersededAt && !document.revokedAt) || null,
  }
}

const ENTITY_SELECT = `
  *,
  bankAccounts:entity_bank_accounts(*),
  arcaDocuments:entity_arca_documents(
    *,
    uploadedByProfile:profiles!entity_arca_documents_uploaded_by_fkey(username, display_name)
  )
`

export class EntityRepositoryError extends Error {
  constructor(message, code, cause) {
    super(message, { cause })
    this.name = 'EntityRepositoryError'
    this.code = code || 'ENTITY_REQUEST_FAILED'
  }
}

function repositoryError(error) {
  if (!error) return null
  const messages = {
    '23505': 'Ya existe una entidad con esa identificación fiscal.',
    '23514': 'Los datos no cumplen las reglas fiscales de la entidad.',
    '40001': 'La entidad cambió mientras la editabas. Recargá los datos e intentá nuevamente.',
    PGRST116: 'No encontramos la entidad solicitada.',
  }
  return new EntityRepositoryError(messages[error.code] || error.message || 'No se pudo completar la operación.', error.code, error)
}

function entityPayload(entity) {
  const isLlc = entity.legalType === 'llc'
  return {
    id: entity.id || null,
    name: entity.name,
    status: entity.status || 'active',
    legalType: entity.legalType,
    countryCode: isLlc ? 'US' : 'AR',
    fiscalIdType: isLlc ? 'EIN' : 'CUIT',
    fiscalId: entity.fiscalId,
    fiscalAddress: entity.fiscalAddress,
    grossIncomeNumber: entity.grossIncomeNumber || '',
    billingEmail: entity.billingEmail || '',
    defaultVoucher: entity.defaultVoucher,
    allowsBExempt: Boolean(entity.allowsBExempt),
    pointOfSale: isLlc ? '' : entity.pointOfSale,
    invoicePrefix: isLlc ? entity.invoicePrefix : '',
  }
}

function accountsPayload(bankAccounts) {
  return bankAccounts.map(account => ({
    id: account.id || null,
    bankName: account.bankName,
    accountHolder: account.accountHolder,
    currency: account.currency,
    accountScope: account.accountScope,
    cbu: account.accountScope === 'local' ? account.cbu : '',
    alias: account.accountScope === 'local' ? account.alias || '' : '',
    accountNumber: account.accountScope === 'international' ? account.accountNumber : '',
    routingNumber: account.accountScope === 'international' ? account.routingNumber || '' : '',
    swiftBic: account.accountScope === 'international' ? account.swiftBic || '' : '',
    iban: account.accountScope === 'international' ? account.iban || '' : '',
    isPrimary: Boolean(account.isPrimary),
  }))
}

export function createEntityRepository(client) {
  if (!client) throw new EntityRepositoryError('Supabase no está configurado.', 'SUPABASE_NOT_CONFIGURED')

  async function getById(id) {
    const { data, error } = await client
      .from('billing_entities')
      .select(ENTITY_SELECT)
      .eq('id', id)
      .single()
    if (error) throw repositoryError(error)
    return mapEntityRow(data)
  }

  return {
    async list() {
      const { data, error } = await client
        .from('billing_entities')
        .select(ENTITY_SELECT)
        .order('name', { ascending: true })
      if (error) throw repositoryError(error)
      return (data || []).map(mapEntityRow)
    },

    getById,

    async save(entity) {
      const { data, error } = await client.rpc('save_billing_entity', {
        p_entity: entityPayload(entity),
        p_accounts: accountsPayload(entity.bankAccounts || []),
        p_expected_updated_at: entity.id ? entity.updatedAt : null,
      })
      if (error) throw repositoryError(error)
      return getById(data.id)
    },

    async setStatus(entity, status) {
      const { data, error } = await client.rpc('set_billing_entity_status', {
        p_entity_id: entity.id,
        p_status: status,
        p_expected_updated_at: entity.updatedAt,
      })
      if (error) throw repositoryError(error)
      return getById(data.id)
    },

    async uploadArcaDocument(entityId, file, expirationDate) {
      const formData = new FormData()
      formData.set('entityId', String(entityId))
      formData.set('expirationDate', expirationDate)
      formData.set('file', file)
      const { error } = await client.functions.invoke('upload-arca-document', { body: formData })
      if (error) throw repositoryError(error)
      return getById(entityId)
    },

    async revokeArcaDocument(entityId, documentId) {
      const { error } = await client.rpc('revoke_arca_document', { p_document_id: documentId })
      if (error) throw repositoryError(error)
      return getById(entityId)
    },

    async createDocumentUrl(storagePath, expiresIn = 60, download = '') {
      const { data, error } = await client.storage
        .from('arca-documents')
        .createSignedUrl(storagePath, expiresIn, download ? { download } : undefined)
      if (error) throw repositoryError(error)
      return data.signedUrl
    },
  }
}