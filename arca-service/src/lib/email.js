// Mirrors kyra-ipm-v4/src/domain/authIdentity.js normalizeEmail — same rule as the
// `users.email` format check (db/migrations/20260915150000_users_email_login.sql)
// and public.clients.primary_email.
export function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}
