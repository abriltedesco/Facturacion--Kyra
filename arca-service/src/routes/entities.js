import { Router } from 'express'

import { withActor } from '../db/pool.js'
import { getEntity, listEntities } from '../services/entities.js'
import { AppError } from '../middleware/errorHandler.js'

export const entitiesRouter = Router()

entitiesRouter.get('/', async (req, res, next) => {
  try {
    res.json(await listEntities())
  } catch (err) {
    next(err)
  }
})

entitiesRouter.get('/:id', async (req, res, next) => {
  try {
    const entity = await getEntity(Number(req.params.id))
    if (!entity) throw new AppError('PGRST116', 'No encontramos la entidad solicitada.', 404)
    res.json(entity)
  } catch (err) {
    next(err)
  }
})

entitiesRouter.post('/', async (req, res, next) => {
  try {
    const { entity, accounts, expectedUpdatedAt } = req.body || {}
    const saved = await withActor(req.user.id, async client => {
      const { rows } = await client.query('select * from save_billing_entity($1::jsonb, $2::jsonb, $3)', [
        JSON.stringify(entity ?? {}),
        JSON.stringify(accounts ?? []),
        expectedUpdatedAt ?? null,
      ])
      return rows[0]
    })
    res.status(201).json(await getEntity(saved.id))
  } catch (err) {
    next(err)
  }
})

entitiesRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, expectedUpdatedAt } = req.body || {}
    const saved = await withActor(req.user.id, async client => {
      const { rows } = await client.query('select * from set_billing_entity_status($1, $2, $3)', [
        Number(req.params.id),
        status,
        expectedUpdatedAt ?? null,
      ])
      return rows[0]
    })
    res.json(await getEntity(saved.id))
  } catch (err) {
    next(err)
  }
})
