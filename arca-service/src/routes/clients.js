import { Router } from 'express'

import { withActor } from '../db/pool.js'
import { getClient, listClients } from '../services/clients.js'
import { AppError } from '../middleware/errorHandler.js'

export const clientsRouter = Router()

clientsRouter.get('/', async (req, res, next) => {
  try {
    res.json(await listClients())
  } catch (err) {
    next(err)
  }
})

clientsRouter.get('/:id', async (req, res, next) => {
  try {
    const client = await getClient(Number(req.params.id))
    if (!client) throw new AppError('PGRST116', 'No encontramos el cliente solicitado.', 404)
    res.json(client)
  } catch (err) {
    next(err)
  }
})

clientsRouter.post('/', async (req, res, next) => {
  try {
    const { client, ccEmails, expectedUpdatedAt } = req.body || {}
    const saved = await withActor(req.user.id, async dbClient => {
      const { rows } = await dbClient.query('select * from save_client($1::jsonb, $2::jsonb, $3)', [
        JSON.stringify(client ?? {}),
        JSON.stringify(ccEmails ?? []),
        expectedUpdatedAt ?? null,
      ])
      return rows[0]
    })
    res.status(201).json(await getClient(saved.id))
  } catch (err) {
    next(err)
  }
})

clientsRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, expectedUpdatedAt } = req.body || {}
    const saved = await withActor(req.user.id, async dbClient => {
      const { rows } = await dbClient.query('select * from set_client_status($1, $2, $3)', [
        Number(req.params.id),
        status,
        expectedUpdatedAt ?? null,
      ])
      return rows[0]
    })
    res.json(await getClient(saved.id))
  } catch (err) {
    next(err)
  }
})
