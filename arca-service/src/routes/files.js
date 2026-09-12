import { Router } from 'express'

import { verifyDownloadToken } from '../lib/signedLink.js'
import { readPdf } from '../services/storage.js'
import { AppError } from '../middleware/errorHandler.js'

// Intentionally unauthenticated: the token itself is the capability, same trust
// model as a Supabase Storage signed URL.
export const filesRouter = Router()

filesRouter.get('/:token', async (req, res, next) => {
  try {
    const payload = verifyDownloadToken(req.params.token)
    if (!payload) throw new AppError('LINK_EXPIRED', 'El enlace expiró o no es válido.', 410)

    const buffer = await readPdf(payload.storagePath)
    res.setHeader('Content-Type', 'application/pdf')
    if (payload.download) {
      const filename = (payload.originalFileName || 'documento.pdf').replace(/"/g, '')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    } else {
      res.setHeader('Content-Disposition', 'inline')
    }
    res.send(buffer)
  } catch (err) {
    next(err)
  }
})
