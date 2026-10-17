import { createClient } from 'npm:@supabase/supabase-js@2'

const messages = {
  bounce: 'Permanent bounce — email address is invalid or rejected',
  complaint: 'Spam complaint — recipient marked email as spam',
  unsubscribe: 'Recipient unsubscribed',
} as const

export async function recordEmailEvent(event: {
  event_id: string; data: { recipient: string; message_id?: string }
}, reason: keyof typeof messages) {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('Missing event audit configuration')
  const admin = createClient(url, key)
  // Stable UUID keyed by event ID makes append-only logging retry-safe without a new table.
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(event.event_id)))
  digest[6] = (digest[6] & 15) | 80
  digest[8] = (digest[8] & 63) | 128
  const hex = Array.from(digest.slice(0, 16), byte => byte.toString(16).padStart(2, '0')).join('')
  const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  const check = (error: { code: string; message: string } | null) => {
    if (!error) return
    console.error('Email event audit failed', { code: error.code, message: error.message, event_id: event.event_id })
    throw new Error('Failed to record email event')
  }
  const { data: existing, error: lookupError } = await admin.from('email_send_log').select('id').eq('id', id).maybeSingle()
  check(lookupError)
  if (existing) return
  const recipient = event.data.recipient.toLowerCase()
  const { error: suppressError } = await admin.from('suppressed_emails').upsert({
    email: recipient, reason, metadata: null,
  }, { onConflict: 'email' })
  check(suppressError)
  const { error: insertError } = await admin.from('email_send_log').insert({
    id, message_id: event.data.message_id ?? null, template_name: 'system',
    recipient_email: recipient, metadata: null,
    status: reason === 'bounce' ? 'bounced' : reason === 'complaint' ? 'complained' : 'suppressed',
    error_message: messages[reason],
  })
  if (insertError?.code !== '23505') check(insertError)
}