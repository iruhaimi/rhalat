import { sendTemplateEmail } from './transactional-email-templates/send-email.ts'
import { recordEmailEvent } from './email-event-audit.ts'

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

for (const outcome of ['sent', 'suppressed', 'failed'] as const) {
  Deno.test(`Managed ${outcome} preserves the exact application audit status`, async () => {
    const originalFetch = globalThis.fetch
    const rows: Record<string, unknown>[] = []
    const saved = new Map<string, string | undefined>()
    for (const [key, value] of Object.entries({ LOVABLE_API_KEY: 'test-only', LOVABLE_SEND_URL: 'https://email.test/send', SUPABASE_URL: 'https://database.test', SUPABASE_SERVICE_ROLE_KEY: 'test-only' })) {
      saved.set(key, Deno.env.get(key)); Deno.env.set(key, value)
    }
    globalThis.fetch = async (input, init) => {
      const options = init as { body?: unknown }
      const url = input instanceof Request ? input.url : String(input)
      if (url.includes('email_send_log')) {
        rows.push(JSON.parse(String(options?.body)))
        return new Response(null, { status: 201 })
      }
      assert(url === 'https://email.test/send', 'No legacy transport may be called')
      const payload = JSON.parse(String(options?.body))
      assert(payload.sender_domain === 'notify.visafaster.com', 'Verified sender domain must be preserved')
      assert(payload.idempotency_key === 'test-event-1', 'Trigger deduplication key must survive')
      if (outcome === 'sent') return Response.json({ success: true })
      return Response.json({ type: outcome === 'suppressed' ? 'recipient_suppressed' : 'send_failed', message: 'Test refusal' }, { status: outcome === 'suppressed' ? 403 : 500 })
    }
    try {
      let threw = false
      let result
      try { result = await sendTemplateEmail('staff-2fa', 'test@example.test', { templateData: { code: '123456' }, idempotencyKey: 'test-event-1' }) } catch { threw = true }
      assert(threw === (outcome === 'failed'), 'Only delivery failures should throw')
      if (outcome === 'suppressed') assert(result?.sent === false, 'Suppression must remain an expected result')
      assert(rows.length === 1 && rows[0].status === outcome, 'Audit must store the exact supported status')
    } finally {
      globalThis.fetch = originalFetch
      for (const [key, value] of saved) { if (value === undefined) Deno.env.delete(key); else Deno.env.set(key, value) }
    }
  })
}

Deno.test('Bounce events store bounce reason and bounced status and deduplicate redelivery', async () => {
  const originalFetch = globalThis.fetch
  const savedUrl = Deno.env.get('SUPABASE_URL'), savedKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  Deno.env.set('SUPABASE_URL', 'https://database.test'); Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-only')
  let log: Record<string, unknown> | undefined
  let writes = 0
  globalThis.fetch = async (input, init) => {
    const options = init as { body?: unknown; method?: string }
    const request = input instanceof Request ? input : undefined
    const url = request?.url ?? String(input)
    const method = options?.method ?? request?.method ?? 'GET'
    if (method === 'GET') return Response.json(log ? { id: log.id } : null)
    const row = JSON.parse(String(options?.body))
    if (url.includes('suppressed_emails')) assert(row.reason === 'bounce' && row.metadata === null, 'Legacy CHECK accepts bounce, not bounced')
    else { assert(row.status === 'bounced' && row.template_name === 'system', 'Preserve event log contract'); log = row }
    writes++
    return new Response(null, { status: 201 })
  }
  try {
    const event = { event_id: 'test-bounce-1', data: { recipient: 'test@example.test', message_id: 'provider-message' } }
    await recordEmailEvent(event, 'bounce'); await recordEmailEvent(event, 'bounce')
    assert(writes === 2, 'Redelivery must not append another log or overwrite suppression')
  } finally {
    globalThis.fetch = originalFetch
    if (savedUrl === undefined) Deno.env.delete('SUPABASE_URL'); else Deno.env.set('SUPABASE_URL', savedUrl)
    if (savedKey === undefined) Deno.env.delete('SUPABASE_SERVICE_ROLE_KEY'); else Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', savedKey)
  }
})