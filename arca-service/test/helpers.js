import request from 'supertest'

import { createApp } from '../src/app.js'

export const app = createApp()

export function agent() {
  return request.agent(app)
}

export async function loginAgent() {
  const client = agent()
  await client.post('/auth/login').send({ username: 'mai', password: 'KyraLocal2026' }).expect(200)
  return client
}

// Mirrors private.is_valid_cuit() (db/migrations/20260902180000_core.sql) so
// tests can mint fresh, always-valid dummy CUITs without a DB round trip.
function isValidCuit(digits) {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const total = weights.reduce((sum, weight, index) => sum + Number(digits[index]) * weight, 0)
  let verifier = 11 - (total % 11)
  if (verifier === 11) verifier = 0
  else if (verifier === 10) verifier = 9
  return verifier === Number(digits[10])
}

let cuitSeed = 0

export function nextValidCuit() {
  for (;;) {
    cuitSeed += 1
    const digits = String(20000000000 + cuitSeed)
    if (isValidCuit(digits)) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
    }
  }
}
