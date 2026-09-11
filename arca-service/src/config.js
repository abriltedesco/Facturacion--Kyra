// Centralised environment configuration. Import this instead of reading process.env directly.

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function optional(name, fallback) {
  const value = process.env[name]
  return value === undefined || value === '' ? fallback : value
}

export const config = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: Number(optional('PORT', '3001')),
  corsOrigin: optional('CORS_ORIGIN', 'http://localhost:5173')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
  databaseUrl: optional('DATABASE_URL', 'postgres://postgres:postgres@localhost:5432/arca'),
  jwt: {
    secret: optional('JWT_SECRET', 'dev-insecure-jwt-secret-change-me'),
    expiresIn: optional('JWT_EXPIRES_IN', '12h'),
  },
  cookie: {
    name: optional('COOKIE_NAME', 'arca_session'),
    secure: optional('COOKIE_SECURE', 'false') === 'true',
  },
  storageDir: optional('STORAGE_DIR', './storage'),
  signedLinkSecret: optional('SIGNED_LINK_SECRET', 'dev-insecure-signed-link-secret-change-me'),
}

export function assertProductionSecrets() {
  if (config.nodeEnv !== 'production') return
  required('JWT_SECRET')
  required('SIGNED_LINK_SECRET')
  required('DATABASE_URL')
}
