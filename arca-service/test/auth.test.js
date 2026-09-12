import { describe, expect, it } from 'vitest'
import request from 'supertest'

import { app, loginAgent } from './helpers.js'

describe('POST /auth/login', () => {
  it('rejects a wrong password', async () => {
    const res = await request(app).post('/auth/login').send({ username: 'mai', password: 'wrong' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('INVALID_CREDENTIALS')
  })

  it('accepts the seeded user and sets a session cookie', async () => {
    const res = await request(app).post('/auth/login').send({ username: 'mai', password: 'KyraLocal2026' })
    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({ username: 'mai', displayName: 'Mai Brandao', role: 'admin' })
    expect(res.headers['set-cookie'][0]).toMatch(/^arca_session=.+HttpOnly/)
  })
})

describe('GET /auth/session', () => {
  it('requires auth', async () => {
    const res = await request(app).get('/auth/session')
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('AUTH_REQUIRED')
  })

  it('returns the logged-in user', async () => {
    const client = await loginAgent()
    const res = await client.get('/auth/session')
    expect(res.status).toBe(200)
    expect(res.body.user.username).toBe('mai')
  })
})

describe('POST /auth/logout', () => {
  it('clears the session', async () => {
    const client = await loginAgent()
    await client.post('/auth/logout').expect(204)
    const res = await client.get('/auth/session')
    expect(res.status).toBe(401)
  })
})
