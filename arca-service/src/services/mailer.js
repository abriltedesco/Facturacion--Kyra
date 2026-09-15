// Real invoice-email delivery via SMTP (nodemailer). Mirrors the DI-seam and
// lazy-construction pattern in services/afip.js: a missing/incomplete SMTP config
// shouldn't prevent the rest of the service from booting, only fail when an email
// is actually requested. No real SMTP account exists in this environment — see
// config.email and docs/phase-2-billing-logic.md's AFIP_NOT_CONFIGURED precedent.
import nodemailer from 'nodemailer'

import { config } from '../config.js'
import { AppError } from '../middleware/errorHandler.js'

let transporter = null

function getTransporter() {
  if (transporter) return transporter

  const { host, port, user, pass, from } = config.email
  if (!host || !user || !pass || !from) {
    throw new AppError(
      'EMAIL_NOT_CONFIGURED',
      'Faltan variables de entorno de email (SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM).',
      500,
    )
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  return transporter
}

function mapMailError(err) {
  return new AppError('EMAIL_SEND_FAILED', err?.message || 'No se pudo enviar el email.', 502)
}

/**
 * Sends an invoice email, with an optional PDF attachment.
 *
 * @param {{ to: string, cc?: string[], subject: string, text: string,
 *   attachmentBase64?: string, attachmentFilename?: string }} params
 *   `attachmentBase64` is the invoice PDF's base64 content (no data-URI prefix);
 *   required together with `attachmentFilename`.
 * @param {{ transporter?: object }} [deps] Test-only seam: pass a fake with a
 *   `sendMail` method to exercise this function without real SMTP credentials.
 *   Defaults to the real, lazily-constructed nodemailer transporter.
 */
export async function sendInvoiceEmail(
  { to, cc, subject, text, attachmentBase64, attachmentFilename } = {},
  deps = {},
) {
  if (!to) throw new AppError('INVALID_RECIPIENT', 'to es requerido.', 400)
  if (!subject) throw new AppError('INVALID_SUBJECT', 'subject es requerido.', 400)
  if (!text) throw new AppError('INVALID_BODY', 'text es requerido.', 400)
  if (attachmentBase64 && !attachmentFilename) {
    throw new AppError('INVALID_ATTACHMENT', 'attachmentFilename es requerido junto con attachmentBase64.', 400)
  }

  const mailer = deps.transporter || getTransporter()

  const attachments = attachmentBase64
    ? [{ filename: attachmentFilename, content: Buffer.from(attachmentBase64, 'base64') }]
    : []

  try {
    const info = await mailer.sendMail({
      from: config.email.from,
      to,
      cc: cc?.length ? cc.join(',') : undefined,
      subject,
      text,
      attachments,
    })
    return { messageId: info.messageId }
  } catch (err) {
    if (err instanceof AppError) throw err
    throw mapMailError(err)
  }
}
