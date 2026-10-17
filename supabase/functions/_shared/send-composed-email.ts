import { EmailAPIError, sendLovableEmail } from 'npm:@lovable.dev/email-js@0.3.1'
import { recordEmailOutcome } from './email-send-audit.ts'

/** Existing operational senders assemble escaped HTML at send time. */
export async function sendComposedEmail(email: {
  to: string; subject: string; html: string; text: string; label: string; idempotencyKey: string
}): Promise<{ sent: boolean }> {
  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) throw new Error('Email sending is not configured')
    const dispatch = () => sendLovableEmail({
      to: email.to,
      from: 'عطلات رحلاتكم <noreply@visafaster.com>',
      sender_domain: 'notify.visafaster.com',
      subject: email.subject, html: email.html, text: email.text,
      purpose: 'transactional', label: email.label, idempotency_key: email.idempotencyKey,
    }, { apiKey, sendUrl: Deno.env.get('LOVABLE_SEND_URL') })
    try {
      await dispatch()
    } catch (error) {
      if (!(error instanceof EmailAPIError) || error.status !== 429) throw error
      await new Promise(resolve => setTimeout(resolve, (error.retryAfterSeconds ?? 60) * 1000))
      await dispatch()
    }
    await recordEmailOutcome(email.label, email.to, 'sent')
    return { sent: true }
  } catch (error) {
    if (error instanceof EmailAPIError && error.code === 'recipient_suppressed') {
      await recordEmailOutcome(email.label, email.to, 'suppressed')
      return { sent: false }
    }
    await recordEmailOutcome(email.label, email.to, 'failed', error instanceof Error ? error.message : String(error))
    throw error
  }
}