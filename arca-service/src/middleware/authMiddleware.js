import { config } from '../config.js'
import { verifySession } from '../lib/jwt.js'
import { AppError } from './errorHandler.js'

export function authMiddleware(req, res, next) {
  const token = req.cookies?.[config.cookie.name]
  const payload = verifySession(token)
  if (!payload) {
    return next(new AppError('AUTH_REQUIRED', 'Necesitás iniciar sesión.', 401))
  }
  req.user = {
    id: payload.sub,
    username: payload.username,
    displayName: payload.displayName,
    role: payload.role,
  }
  next()
}
