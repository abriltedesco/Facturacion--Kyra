// Mirrors kyra-ipm-v4/src/domain/authIdentity.js normalizeUsername — same rule as the
// `users.username` check constraint (db/migrations/20260902180000_core.sql).
export function normalizeUsername(value) {
  const username = String(value || '').trim().toLowerCase()
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(username) ? username : null
}
