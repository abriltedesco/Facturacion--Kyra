export function normalizeUsername(value) {
  const username = String(value || '').trim().toLowerCase()
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(username) ? username : null
}

export function usernameToTechnicalEmail(value, domain) {
  const username = normalizeUsername(value)
  const technicalDomain = String(domain || '').trim().toLowerCase()
  if (!username || !/^[a-z0-9][a-z0-9.-]+$/.test(technicalDomain)) return null
  return `${username}@${technicalDomain}`
}