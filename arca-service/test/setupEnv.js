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
// Deliberately NOT setting CUIT/CERT_PATH/KEY_PATH: no real AFIP credentials exist
// in this environment, so src/services/afip.js's real getAfip() must keep failing
// with AFIP_NOT_CONFIGURED (see test/billing.test.js). WSFE_PUNTO_VENTA *is* set
// so generateInvoice() can be exercised past that one checkpoint when a fake
// `afip` is injected directly (see test/invoice-emission.test.js) — a sales point
// number isn't a secret, unlike the cert/key.
process.env.WSFE_PUNTO_VENTA = '1'
