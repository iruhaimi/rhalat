import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.3.1'
import { recordEmailEvent } from '../_shared/email-event-audit.ts'

const apiKey = Deno.env.get('LOVABLE_API_KEY')
if (!apiKey) throw new Error('Missing email webhook configuration')

const handler = createEmailWebhookHandler({
  apiKey,
  on: {
    'email.bounced': async (event) => {
      await recordEmailEvent(event, 'bounce')
    },
    'email.complaint': async (event) => {
      await recordEmailEvent(event, 'complaint')
    },
    'email.unsubscribed': async (event) => {
      await recordEmailEvent(event, 'unsubscribe')
    },
  },
})

Deno.serve((req) => handler(req))
