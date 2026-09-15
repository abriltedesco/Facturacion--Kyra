// Tests for src/services/mailer.js against a fake transporter, since no real SMTP
// account exists in this environment. See test/billing.test.js for the route-level
// EMAIL_NOT_CONFIGURED checkpoint reached via the real, lazily-built transporter.
import { describe, expect, it } from 'vitest'

import { sendInvoiceEmail } from '../src/services/mailer.js'

function fakeTransporter({ onSendMail } = {}) {
  return {
    async sendMail(mail) {
      if (onSendMail) return onSendMail(mail)
      return { messageId: 'fake-message-id' }
    },
  }
}

describe('sendInvoiceEmail (fake transporter)', () => {
  it('rejects a missing recipient', async () => {
    await expect(sendInvoiceEmail({ subject: 'x', text: 'x' }, { transporter: fakeTransporter() }))
      .rejects.toMatchObject({ code: 'INVALID_RECIPIENT', status: 400 })
  })

  it('rejects a missing subject', async () => {
    await expect(sendInvoiceEmail({ to: 'a@b.com', text: 'x' }, { transporter: fakeTransporter() }))
      .rejects.toMatchObject({ code: 'INVALID_SUBJECT', status: 400 })
  })

  it('rejects a missing body', async () => {
    await expect(sendInvoiceEmail({ to: 'a@b.com', subject: 'x' }, { transporter: fakeTransporter() }))
      .rejects.toMatchObject({ code: 'INVALID_BODY', status: 400 })
  })

  it('rejects an attachment without a filename', async () => {
    await expect(sendInvoiceEmail(
      { to: 'a@b.com', subject: 'x', text: 'x', attachmentBase64: 'aGVsbG8=' },
      { transporter: fakeTransporter() },
    )).rejects.toMatchObject({ code: 'INVALID_ATTACHMENT', status: 400 })
  })

  it('sends a plain-text email with no attachment', async () => {
    let received
    const transporter = fakeTransporter({ onSendMail: mail => { received = mail; return { messageId: 'msg-1' } } })

    const result = await sendInvoiceEmail(
      { to: 'client@example.com', cc: ['cc1@example.com', 'cc2@example.com'], subject: 'Factura Agosto', text: 'Hola, te adjuntamos la factura.' },
      { transporter },
    )

    expect(result).toEqual({ messageId: 'msg-1' })
    expect(received.to).toBe('client@example.com')
    expect(received.cc).toBe('cc1@example.com,cc2@example.com')
    expect(received.subject).toBe('Factura Agosto')
    expect(received.text).toBe('Hola, te adjuntamos la factura.')
    expect(received.attachments).toEqual([])
  })

  it('attaches the decoded PDF when attachmentBase64/attachmentFilename are given', async () => {
    let received
    const transporter = fakeTransporter({ onSendMail: mail => { received = mail; return { messageId: 'msg-2' } } })

    await sendInvoiceEmail(
      {
        to: 'client@example.com',
        subject: 'Invoice',
        text: 'Please find attached.',
        attachmentBase64: Buffer.from('pdf-bytes').toString('base64'),
        attachmentFilename: 'Invoice_Client_Aug_2026.pdf',
      },
      { transporter },
    )

    expect(received.attachments).toHaveLength(1)
    expect(received.attachments[0].filename).toBe('Invoice_Client_Aug_2026.pdf')
    expect(received.attachments[0].content.toString()).toBe('pdf-bytes')
  })

  it('maps a transporter failure to a 502 EMAIL_SEND_FAILED AppError', async () => {
    const transporter = fakeTransporter({ onSendMail: () => { throw new Error('Connection refused') } })

    await expect(sendInvoiceEmail(
      { to: 'client@example.com', subject: 'x', text: 'x' },
      { transporter },
    )).rejects.toMatchObject({ code: 'EMAIL_SEND_FAILED', status: 502, message: 'Connection refused' })
  })
})
