// Vitest setupFiles: runs before each test file's module graph is evaluated,
// so src/config.js picks these up instead of the dev .env. Mirrors .env.test.
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/arca_test'
process.env.CORS_ORIGIN = 'http://localhost:5173'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.JWT_EXPIRES_IN = '1h'
process.env.COOKIE_NAME = 'arca_session'
process.env.COOKIE_SECURE = 'false'
process.env.STORAGE_DIR = './test/.tmp-storage'
process.env.SIGNED_LINK_SECRET = 'test-signed-link-secret'
