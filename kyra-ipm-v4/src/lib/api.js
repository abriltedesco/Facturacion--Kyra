// Thin fetch wrapper around arca-service, replacing src/lib/supabase.js.
// The session lives in an httpOnly cookie set by POST /auth/login, so every
// request goes with `credentials: 'include'` and there is no token to attach.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Mirrors the shape of a Supabase/PostgREST error ({ code, message }) so the
// existing repositoryError() mappers in entityRepository.js / clientRepository.js
// keep working unchanged — they switch on error.code (SQLSTATE / string codes)
// and fall back to error.message.
export class ApiError extends Error {
  constructor(code, message) {
    super(message || code)
    this.name = 'ApiError'
    this.code = code
  }
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const init = { method, credentials: 'include', headers: {} }
  if (body !== undefined) {
    if (isForm) {
      init.body = body
    } else {
      init.headers['content-type'] = 'application/json'
      init.body = JSON.stringify(body)
    }
  }

  const response = await fetch(`${API_URL}${path}`, init)
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new ApiError(data?.error || String(response.status), data?.message)
  }
  return data
}

export const api = {
  get: path => request(path),
  post: (path, body, options) => request(path, { method: 'POST', body, ...options }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
}
