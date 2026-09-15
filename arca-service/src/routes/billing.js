import { Router } from 'express'

import { generateInvoice } from '../services/afip.js'
import { listInvoices } from '../services/invoices.js'
import { recordManualInvoice, listManualInvoices } from '../services/manualInvoices.js'

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

// POST /billing/manual-invoice { clientId?, billingEntityId, invoiceType, invoiceNumber,
// currency?, netAmount?, vatAmount?, totalAmount } -> the recorded row.
// Record-only: no AFIP/WSFE call, no CAE. For invoice types WSFE never covers
// (LLC, internal S/F — see services/manualInvoices.js) so the frontend-allocated
// number (kyra-ipm-v4/src/data/contadoresFactura.js) has somewhere durable to land.
billingRouter.post('/manual-invoice', async (req, res, next) => {
  try {
    const { clientId, billingEntityId, invoiceType, invoiceNumber, currency, netAmount, vatAmount, totalAmount } = req.body || {}
    const invoice = await recordManualInvoice({
      clientId, billingEntityId, invoiceType, invoiceNumber, currency, netAmount, vatAmount, totalAmount,
      actorId: req.user.id,
    })
    res.status(201).json(invoice)
  } catch (err) {
    next(err)
  }
})

// GET /billing/manual-invoices?clientId=5 -> local record of LLC/S/F invoices.
billingRouter.get('/manual-invoices', async (req, res, next) => {
  try {
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined
    res.json(await listManualInvoices({ clientId }))
  } catch (err) {
    next(err)
  }
})
