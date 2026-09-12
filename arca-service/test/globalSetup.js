// Vitest globalSetup: provisions a throwaway `arca_test` database, drops and
// re-runs every migration against it, then seeds it — so the suite always
// starts from the exact same known state, independent of the dev `arca` DB.
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import pg from 'pg'

const ADMIN_URL = 'postgres://postgres:postgres@localhost:5432/postgres'
const TEST_DB = 'arca_test'
const TEST_URL = `postgres://postgres:postgres@localhost:5432/${TEST_DB}`

const ROOT = path.resolve(import.meta.dirname, '..')
const MIGRATE_BIN = path.join(ROOT, 'node_modules', 'node-pg-migrate', 'bin', 'node-pg-migrate.js')

function run(args) {
  execFileSync(process.execPath, args, {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: TEST_URL, NODE_ENV: 'test' },
    stdio: 'inherit',
  })
}

export async function setup() {
  const admin = new pg.Client({ connectionString: ADMIN_URL })
  await admin.connect()
  const { rowCount } = await admin.query('select 1 from pg_database where datname = $1', [TEST_DB])
  if (rowCount === 0) {
    await admin.query(`create database ${TEST_DB}`)
  }
  await admin.end()

  const testDb = new pg.Client({ connectionString: TEST_URL })
  await testDb.connect()
  await testDb.query('drop schema if exists private cascade')
  await testDb.query('drop schema public cascade')
  await testDb.query('create schema public')
  await testDb.end()

  run([MIGRATE_BIN, 'up', '-m', 'db/migrations', '--no-verbose'])
  run([path.join(ROOT, 'db', 'seed.mjs')])
}

export async function teardown() {}
