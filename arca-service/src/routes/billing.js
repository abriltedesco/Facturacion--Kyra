import { Router } from 'express'

import { generateInvoice } from '../services/afip.js'
import { listInvoices } from '../services/invoices.js'
import { sendInvoiceEmail } from '../services/mailer.js'

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

// POST /billing/send-email { to, cc?, subject, text, attachmentBase64?, attachmentFilename? }
// -> { messageId }. Real SMTP delivery for invoice emails (any tipoFactura — this
// route has no AFIP/WSFE dependency). Errors (AppError from mailer.js) flow through
// the shared errorHandler.js exactly like every other route in this service.
billingRouter.post('/send-email', async (req, res, next) => {
  try {
    const { to, cc, subject, text, attachmentBase64, attachmentFilename } = req.body || {}
    const result = await sendInvoiceEmail({ to, cc, subject, text, attachmentBase64, attachmentFilename })
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})
