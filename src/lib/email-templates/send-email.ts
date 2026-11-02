import * as React from 'react'
import { render } from '@react-email/render'
import { TEMPLATES } from './registry'

// Server only. Sends through Resend (https://resend.com) when RESEND_API_KEY and
// EMAIL_FROM are set; otherwise sending is skipped and { sent: false } is returned.

export type SendTemplateEmailResult =
  | { sent: true }
  | { sent: false; reason: 'not_configured' }

export interface SendTemplateEmailOptions {
  templateData?: Record<string, unknown>
  /** Dedupes retries of the same logical send. */
  idempotencyKey?: string
  replyTo?: string
}

/** Renders a registered template and sends it. Throws if the provider rejects the email. */
export async function sendTemplateEmail(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {},
): Promise<SendTemplateEmailResult> {
  const apiKey = process.env['RESEND_API_KEY']
  const from = process.env['EMAIL_FROM']
  if (!apiKey || !from) return { sent: false, reason: 'not_configured' }

  const template = TEMPLATES[templateName]
  if (!template) {
    throw new Error(`Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`)
  }

  const recipient = template.to || to
  if (!recipient) throw new Error('Recipient is required')

  const templateData = options.templateData ?? {}
  const element = React.createElement(template.component, templateData)
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject = typeof template.subject === 'function' ? template.subject(templateData) : template.subject

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from,
      to: recipient,
      subject,
      html,
      text,
      ...(options.replyTo ? { reply_to: options.replyTo } : {}),
    }),
  })
  if (!res.ok) throw new Error(`Email failed [${res.status}]: ${(await res.text()).slice(0, 300)}`)
  return { sent: true }
}
