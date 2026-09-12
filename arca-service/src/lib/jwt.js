import jwt from 'jsonwebtoken'

import { config } from '../config.js'

export function signSession(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, displayName: user.display_name, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  )
}

// Returns the decoded payload, or null if the token is missing/invalid/expired.
export function verifySession(token) {
  if (!token) return null
  try {
    return jwt.verify(token, config.jwt.secret)
  } catch {
    return null
  }
}
