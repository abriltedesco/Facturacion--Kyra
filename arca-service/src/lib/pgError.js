// Maps a raw Postgres SQLSTATE (as thrown by the ported RPCs, e.g. `raise exception
// using errcode = '40001'`) to an HTTP status. The `error` field in the JSON response
// stays the SQLSTATE / message string itself — the frontend repositories key on that
// (see EntityRepositoryError / ClientRepositoryError `repositoryError()`), so it must
// be passed through unchanged, not translated here.
const STATUS_BY_CODE = {
  '40001': 409, // *_VERSION_CONFLICT (optimistic lock)
  '23505': 422, // unique_violation
  '23514': 422, // check_violation
  '23503': 422, // foreign_key_violation
  '42501': 401, // AUTH_REQUIRED / insufficient_privilege
  P0002: 404, // *_NOT_FOUND (raised by the RPCs themselves)
}

export function isPgError(err) {
  return typeof err?.code === 'string' && /^[0-9A-Z]{5}$/.test(err.code)
}

export function pgErrorStatus(code) {
  return STATUS_BY_CODE[code] || 500
}
