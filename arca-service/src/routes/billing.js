import { Router } from 'express'

import { generateInvoice } from '../services/afip.js'
import { listInvoices } from '../services/invoices.js'

export const billingRouter = Router()

// POST /billing/invoice { clientId, totalAmount } -> { cae, caeExpirationDate, ... }
// Errors (AppError from afip.js, or a mapped AFIP/relay failure) flow through the
// shared errorHandler.js exactly like every other route in this service.
billingRouter.post('/invoice', async (req, res, next) => {
  try {
    const { clientId, totalAmount } = req.body || {}
    const invoice = await generateInvoice({ clientId, totalAmount, actorId: req.user.id })
    res.status(201).json(invoice)
  } catch (err) {
    next(err)
  }
})

// GET /billing/invoices?clientId=5 -> local audit trail of emitted CAEs.
billingRouter.get('/invoices', async (req, res, next) => {
  try {
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined
    res.json(await listInvoices({ clientId }))
  } catch (err) {
    next(err)
  }
})
