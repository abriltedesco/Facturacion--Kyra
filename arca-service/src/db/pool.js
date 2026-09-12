import pg from 'pg'

import { config } from '../config.js'

// pg returns bigint (int8) and numeric as strings by default to avoid precision
// loss. The frontend mappers expect numbers for ids / tax_rate, but they already
// call Number(...) where it matters, and ids fit safely in JS numbers here.
// We parse int8 -> Number so JSON responses carry numeric ids like Supabase did.
pg.types.setTypeParser(pg.types.builtins.INT8, value => (value === null ? null : Number(value)))

// pg's default timestamptz parser builds a JS Date, which only has millisecond
// precision. Postgres stores microseconds, and the optimistic-lock RPCs
// (save_billing_entity, set_client_status, ...) compare `updated_at` for exact
// equality — round-tripping through Date silently truncates it and every save
// would look like a stale-version conflict. So: force every connection's session
// to UTC (via the libpq startup option below, not a follow-up query — a
// pool.on('connect') query races the first real query on that same client) and
// parse timestamptz as a plain ISO-8601 *string* (like PostgREST/Supabase did),
// keeping full precision, no Date involved.
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, value => {
  if (value === null) return null
  const match = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}(?:\.\d+)?)\+00$/.exec(value)
  return match ? `${match[1]}T${match[2]}Z` : value
})

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  // Sets the session's TimeZone as part of the connection handshake itself,
  // so it's guaranteed to be in effect before any query runs on the client.
  options: '-c TimeZone=UTC',
})

pool.on('error', err => {
  console.error('Unexpected error on idle pg client', err)
})

export function query(text, params) {
  return pool.query(text, params)
}

// Run `fn(client)` inside a transaction. Commits on success, rolls back on throw.
export async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackErr) {
      console.error('Rollback failed', rollbackErr)
    }
    throw err
  } finally {
    client.release()
  }
}

// Transaction that also sets `app.user_id` for the duration, so the ported
// SECURITY DEFINER functions can read it via private.current_actor()
// (the replacement for Supabase's auth.uid()).
export function withActor(userId, fn) {
  return withTransaction(async client => {
    await client.query("select set_config('app.user_id', $1, true)", [userId ?? ''])
    return fn(client)
  })
}

export async function closePool() {
  await pool.end()
}
