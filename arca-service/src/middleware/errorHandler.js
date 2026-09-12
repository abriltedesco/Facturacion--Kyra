// Central error handler. Turns thrown errors into a stable JSON contract:
//   { error: <CODE>, message: <human string> }
// The frontend repositories key on `error` (SQLSTATE codes like 23505/40001, or
// string codes like INVALID_FISCAL_ID / PGRST116), so that value must be preserved.

import { isPgError, pgErrorStatus } from '../lib/pgError.js'

export class AppError extends Error {
  constructor(code, message, status = 400) {
    super(message || code)
    this.name = 'AppError'
    this.code = code
    this.status = status
  }
}

// eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.code, message: err.message })
  }

  // Raw errors bubbled up from `pg` (the ported RPCs, or a raw query) — SQLSTATE-coded.
  if (isPgError(err)) {
    return res.status(pgErrorStatus(err.code)).json({ error: err.code, message: err.message })
  }

  // Multer / body parsing errors
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'PAYLOAD_TOO_LARGE', message: 'El archivo supera el tamaño permitido.' })
  }
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ error: 'INVALID_FILE_SIZE', message: 'El archivo debe pesar entre 1 byte y 10 MB.' })
  }

  console.error('Unhandled error:', err)
  return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado.' })
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'NOT_FOUND', message: `No existe la ruta ${req.method} ${req.path}.` })
}
