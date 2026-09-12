import { Router } from 'express'

import { generateInvoice } from '../services/afip.js'

export const billingRouter = Router()

// POST /billing/invoice { clientId, totalAmount } -> { cae, caeExpirationDate, ... }
// Errors (AppError from afip.js, or a mapped AFIP/relay failure) flow through the
// shared errorHandler.js exactly like every other route in this service.
billingRouter.post('/invoice', async (req, res, next) => {
  try {
    const { clientId, totalAmount } = req.body || {}
    const invoice = await generateInvoice({ clientId, totalAmount })
    res.status(201).json(invoice)
  } catch (err) {
    next(err)
  }
})
