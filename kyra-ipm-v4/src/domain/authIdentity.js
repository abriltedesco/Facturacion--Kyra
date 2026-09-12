export function normalizeUsername(value) {
  const username = String(value || '').trim().toLowerCase()
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(username) ? username : null
}
