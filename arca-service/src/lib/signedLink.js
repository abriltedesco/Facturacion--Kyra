// Short-lived HMAC-signed download tokens for ARCA PDFs (replaces
// supabase.storage.createSignedUrl). The token itself is the capability —
// GET /files/:token is intentionally unauthenticated, same trust model as a
// Supabase signed URL.
import { createHmac, timingSafeEqual } from 'node:crypto'

import { config } from '../config.js'

function sign(body) {
  return createHmac('sha256', config.signedLinkSecret).update(body).digest('base64url')
}

export function createDownloadToken({ storagePath, originalFileName, download }, ttlSeconds = 60) {
  const payload = {
    p: storagePath,
    n: originalFileName || null,
    d: Boolean(download),
    exp: Date.now() + ttlSeconds * 1000,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

export function verifyDownloadToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null
  const [body, mac] = token.split('.')
  if (!body || !mac) return null

  const expectedMac = sign(body)
  const macBuf = Buffer.from(mac)
  const expectedBuf = Buffer.from(expectedMac)
  if (macBuf.length !== expectedBuf.length || !timingSafeEqual(macBuf, expectedBuf)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null
    return { storagePath: payload.p, originalFileName: payload.n, download: payload.d }
  } catch {
    return null
  }
}
