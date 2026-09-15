import { createClient } from 'npm:@supabase/supabase-js@2'

const BUCKET = 'arca-documents'
const MAX_FILE_SIZE = 10 * 1024 * 1024

function allowedOrigins() {
  return (Deno.env.get('ALLOWED_ORIGIN') || 'http://127.0.0.1:5173,http://localhost:5173')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
}

function corsHeaders(request: Request) {
  const origin = request.headers.get('origin')
  const allowedOrigin = origin && allowedOrigins().includes(origin) ? origin : allowedOrigins()[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function json(request: Request, body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
  })
}

function hasPdfSignature(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes).startsWith('%PDF-')
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) })
  }
  if (request.method !== 'POST') return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405)

  const requestOrigin = request.headers.get('origin')
  if (requestOrigin && !allowedOrigins().includes(requestOrigin)) {
    return json(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const authorization = request.headers.get('Authorization')

  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    console.error('Missing Supabase function environment variables')
    return json(request, { error: 'SERVER_CONFIGURATION_ERROR' }, 500)
  }
  if (!authorization?.startsWith('Bearer ')) {
    return json(request, { error: 'AUTH_REQUIRED' }, 401)
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return json(request, { error: 'INVALID_SESSION' }, 401)

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return json(request, { error: 'INVALID_FORM_DATA' }, 400)
  }

  const entityId = Number(formData.get('entityId'))
  const expirationDate = String(formData.get('expirationDate') || '')
  const file = formData.get('file')

  if (!Number.isSafeInteger(entityId) || entityId <= 0) {
    return json(request, { error: 'INVALID_ENTITY_ID' }, 400)
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expirationDate) || Number.isNaN(Date.parse(`${expirationDate}T00:00:00Z`))) {
    return json(request, { error: 'INVALID_EXPIRATION_DATE' }, 400)
  }
  if (!(file instanceof File) || file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
    return json(request, { error: 'PDF_REQUIRED' }, 400)
  }
  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    return json(request, { error: 'INVALID_FILE_SIZE' }, 400)
  }

  const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer())
  if (!hasPdfSignature(signature)) return json(request, { error: 'INVALID_PDF_SIGNATURE' }, 400)

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: entity, error: entityError } = await serviceClient
    .from('billing_entities')
    .select('id, legal_type, status')
    .eq('id', entityId)
    .single()

  if (entityError || !entity) return json(request, { error: 'ENTITY_NOT_FOUND' }, 404)
  if (entity.legal_type === 'llc') return json(request, { error: 'ARCA_NOT_APPLICABLE' }, 422)
  if (entity.status === 'archived') return json(request, { error: 'ARCHIVED_ENTITY' }, 422)

  const storagePath = `${entityId}/${crypto.randomUUID()}.pdf`
  const { error: uploadError } = await serviceClient.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    console.error('ARCA document upload failed', uploadError.message)
    return json(request, { error: 'UPLOAD_FAILED' }, 500)
  }

  const originalFileName = file.name.slice(0, 255)
  const { data: document, error: documentError } = await serviceClient.rpc('register_arca_document', {
    p_entity_id: entityId,
    p_original_file_name: originalFileName,
    p_storage_path: storagePath,
    p_expiration_date: expirationDate,
    p_uploaded_by: userData.user.id,
  })

  if (documentError) {
    await serviceClient.storage.from(BUCKET).remove([storagePath])
    console.error('ARCA document metadata failed', documentError.message)
    return json(request, { error: 'DOCUMENT_REGISTRATION_FAILED' }, 500)
  }

  return json(request, { document }, 201)
})