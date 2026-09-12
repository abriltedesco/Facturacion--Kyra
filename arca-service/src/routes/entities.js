import { Router } from 'express'
import multer from 'multer'

import { pool, withActor } from '../db/pool.js'
import { getEntity, listEntities } from '../services/entities.js'
import { putPdf, removePdf } from '../services/storage.js'
import { createDownloadToken } from '../lib/signedLink.js'
import { AppError } from '../middleware/errorHandler.js'

export const entitiesRouter = Router()

const MAX_FILE_SIZE = 10 * 1024 * 1024
// A little headroom over MAX_FILE_SIZE so we can reject with our own
// INVALID_FILE_SIZE code/message instead of a raw Multer error.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE + 1024 } })

entitiesRouter.get('/', async (req, res, next) => {
  try {
    res.json(await listEntities())
  } catch (err) {
    next(err)
  }
})

entitiesRouter.get('/:id', async (req, res, next) => {
  try {
    const entity = await getEntity(Number(req.params.id))
    if (!entity) throw new AppError('PGRST116', 'No encontramos la entidad solicitada.', 404)
    res.json(entity)
  } catch (err) {
    next(err)
  }
})

entitiesRouter.post('/', async (req, res, next) => {
  try {
    const { entity, accounts, expectedUpdatedAt } = req.body || {}
    const saved = await withActor(req.user.id, async client => {
      const { rows } = await client.query('select * from save_billing_entity($1::jsonb, $2::jsonb, $3)', [
        JSON.stringify(entity ?? {}),
        JSON.stringify(accounts ?? []),
        expectedUpdatedAt ?? null,
      ])
      return rows[0]
    })
    res.status(201).json(await getEntity(saved.id))
  } catch (err) {
    next(err)
  }
})

entitiesRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, expectedUpdatedAt } = req.body || {}
    const saved = await withActor(req.user.id, async client => {
      const { rows } = await client.query('select * from set_billing_entity_status($1, $2, $3)', [
        Number(req.params.id),
        status,
        expectedUpdatedAt ?? null,
      ])
      return rows[0]
    })
    res.json(await getEntity(saved.id))
  } catch (err) {
    next(err)
  }
})

// Port of kyra-ipm-v4/supabase/functions/upload-arca-document/index.ts — same
// validations and error codes, backed by local-filesystem storage instead of a
// Supabase Storage bucket.
entitiesRouter.post('/:id/arca-document', upload.single('file'), async (req, res, next) => {
  try {
    const entityId = Number(req.params.id)
    const expirationDate = String(req.body?.expirationDate || '')
    const file = req.file

    if (!Number.isSafeInteger(entityId) || entityId <= 0) {
      throw new AppError('INVALID_ENTITY_ID', 'Entidad inválida.', 400)
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expirationDate) || Number.isNaN(Date.parse(`${expirationDate}T00:00:00Z`))) {
      throw new AppError('INVALID_EXPIRATION_DATE', 'La fecha de vencimiento no es válida.', 400)
    }
    if (!file || file.mimetype !== 'application/pdf' || !file.originalname.toLowerCase().endsWith('.pdf')) {
      throw new AppError('PDF_REQUIRED', 'El archivo debe ser un PDF.', 400)
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      throw new AppError('INVALID_FILE_SIZE', 'El archivo debe pesar entre 1 byte y 10 MB.', 400)
    }
    if (!file.buffer.subarray(0, 5).toString('utf8').startsWith('%PDF-')) {
      throw new AppError('INVALID_PDF_SIGNATURE', 'El archivo no parece ser un PDF válido.', 400)
    }

    const { rows: entityRows } = await pool.query('select id, legal_type, status from billing_entities where id = $1', [entityId])
    const entity = entityRows[0]
    if (!entity) throw new AppError('ENTITY_NOT_FOUND', 'No encontramos la entidad solicitada.', 404)
    if (entity.legal_type === 'llc') throw new AppError('ARCA_NOT_APPLICABLE', 'ARCA no aplica para esta entidad.', 422)
    if (entity.status === 'archived') throw new AppError('ARCHIVED_ENTITY', 'La entidad está archivada.', 422)

    const storagePath = await putPdf(entityId, file.buffer)
    let document
    try {
      const { rows } = await pool.query('select * from register_arca_document($1, $2, $3, $4, $5)', [
        entityId,
        file.originalname.slice(0, 255),
        storagePath,
        expirationDate,
        req.user.id,
      ])
      document = rows[0]
    } catch (err) {
      await removePdf(storagePath)
      throw new AppError('DOCUMENT_REGISTRATION_FAILED', 'No se pudo registrar el documento.', 500)
    }

    res.status(201).json({ document })
  } catch (err) {
    next(err)
  }
})

entitiesRouter.post('/:id/arca-document/:docId/revoke', async (req, res, next) => {
  try {
    await withActor(req.user.id, async client => {
      await client.query('select * from revoke_arca_document($1)', [Number(req.params.docId)])
    })
    res.json(await getEntity(Number(req.params.id)))
  } catch (err) {
    next(err)
  }
})

// Replaces supabase.storage.from('arca-documents').createSignedUrl(...): mints a
// short-lived capability token; GET /files/:token (unauthenticated, see
// src/routes/files.js) streams the PDF back.
entitiesRouter.get('/:id/arca-document/:docId/link', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'select storage_path, original_file_name from entity_arca_documents where id = $1 and entity_id = $2',
      [Number(req.params.docId), Number(req.params.id)],
    )
    const doc = rows[0]
    if (!doc) throw new AppError('PGRST116', 'No encontramos el documento solicitado.', 404)

    const download = req.query.download === '1' || req.query.download === 'true'
    const token = createDownloadToken(
      { storagePath: doc.storage_path, originalFileName: doc.original_file_name, download },
      60,
    )
    res.json({ url: `/files/${token}` })
  } catch (err) {
    next(err)
  }
})
