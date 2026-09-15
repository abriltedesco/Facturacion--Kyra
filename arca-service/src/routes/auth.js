import { Router } from 'express'
import bcrypt from 'bcryptjs'

import { config } from '../config.js'
import { pool } from '../db/pool.js'
import { signSession } from '../lib/jwt.js'
import { normalizeUsername } from '../lib/username.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { AppError } from '../middleware/errorHandler.js'

export const authRouter = Router()

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookie.secure,
    maxAge: 12 * 60 * 60 * 1000, // 12h, matches the default JWT_EXPIRES_IN
  }
}

function publicUser(row) {
  return { id: row.id, username: row.username, displayName: row.display_name, role: row.role }
}

authRouter.post('/login', async (req, res, next) => {
  try {
    const username = normalizeUsername(req.body?.username)
    const password = String(req.body?.password || '')
    if (!username || !password) {
      throw new AppError('INVALID_CREDENTIALS', 'Ingresá un usuario y una clave válidos.', 401)
    }

    const { rows } = await pool.query('select * from public.users where lower(username) = $1', [username])
    const user = rows[0]
    const passwordOk = user ? await bcrypt.compare(password, user.password_hash) : false
    if (!user || !passwordOk) {
      throw new AppError('INVALID_CREDENTIALS', 'Usuario o clave incorrectos.', 401)
    }

    const token = signSession(user)
    res.cookie(config.cookie.name, token, cookieOptions())
    res.json({ user: publicUser(user) })
  } catch (err) {
    next(err)
  }
})

authRouter.post('/logout', (req, res) => {
  res.clearCookie(config.cookie.name, { httpOnly: true, sameSite: 'lax', secure: config.cookie.secure })
  res.status(204).end()
})

authRouter.get('/session', authMiddleware, (req, res) => {
  res.json({ user: { id: req.user.id, username: req.user.username, displayName: req.user.displayName, role: req.user.role } })
})
