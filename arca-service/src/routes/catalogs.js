import { Router } from 'express'

import { pool, withActor } from '../db/pool.js'

export const catalogsRouter = Router()

catalogsRouter.get('/countries', async (req, res, next) => {
  try {
    const { rows } = await pool.query('select * from countries order by name asc')
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

catalogsRouter.post('/countries', async (req, res, next) => {
  try {
    const { id, code, name, active } = req.body || {}
    const saved = await withActor(req.user.id, async client => {
      const { rows } = await client.query('select * from save_country($1, $2, $3, $4)', [
        id ?? null,
        code,
        name,
        active ?? true,
      ])
      return rows[0]
    })
    res.json(saved)
  } catch (err) {
    next(err)
  }
})

catalogsRouter.get('/fiscal-conditions', async (req, res, next) => {
  try {
    const { rows } = await pool.query('select * from fiscal_conditions order by name asc')
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

catalogsRouter.post('/fiscal-conditions', async (req, res, next) => {
  try {
    const { id, countryId, name, active } = req.body || {}
    const saved = await withActor(req.user.id, async client => {
      const { rows } = await client.query('select * from save_fiscal_condition($1, $2, $3, $4)', [
        id ?? null,
        countryId,
        name,
        active ?? true,
      ])
      return rows[0]
    })
    res.json(saved)
  } catch (err) {
    next(err)
  }
})

catalogsRouter.get('/tax-categories', async (req, res, next) => {
  try {
    const { rows } = await pool.query('select * from tax_categories order by name asc')
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

catalogsRouter.post('/tax-categories', async (req, res, next) => {
  try {
    const { id, name, taxRate, active } = req.body || {}
    const saved = await withActor(req.user.id, async client => {
      const { rows } = await client.query('select * from save_tax_category($1, $2, $3, $4)', [
        id ?? null,
        name,
        taxRate,
        active ?? true,
      ])
      return rows[0]
    })
    res.json(saved)
  } catch (err) {
    next(err)
  }
})
