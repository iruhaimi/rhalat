import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.25.76'
import { getCorsHeaders } from '../_shared/cors.ts'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const amount = z.number().finite().nonnegative()
const dataSchema = z.object({
  applicationNumber: z.string().max(100), fullName: z.string().max(255),
  email: z.string().email(), phone: z.string().max(40),
  countryName: z.string().max(255), visaTypeName: z.string().max(255), travelDate: z.string().max(100),
  travelers: z.object({ adults: z.number().int().nonnegative(), children: z.number().int().nonnegative(), infants: z.number().int().nonnegative() }),
  breakdown: z.object({ adults: amount, children: amount, infants: amount }),
  serviceTotal: amount, governmentTotal: amount, grandTotal: amount,
  visaFeesIncluded: z.boolean(), submissionMethod: z.enum(['online', 'whatsapp']),
  paymentMethod: z.string().max(100), checkedRequirements: z.array(z.string().max(1000)).max(100),
  termsAcceptedAt: z.string().max(100),
})
const schema = z.object({ applicationId: z.string().uuid(), templateData: dataSchema })

Deno.serve(async req => {
  const cors = getCorsHeaders(req)
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try {
    const url = Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !key) throw new Error('Missing server configuration')
    const admin = createClient(url, key)
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return json({ error: 'Unauthorized' }, 401)
    const { data: auth, error: authError } = await admin.auth.getUser(token)
    if (authError || !auth.user?.email) return json({ error: 'Unauthorized' }, 401)
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return json({ error: 'Invalid confirmation data' }, 400)
    const { data: profile, error: profileError } = await admin.from('profiles').select('id').eq('user_id', auth.user.id).single()
    if (profileError || !profile) return json({ error: 'Forbidden' }, 403)
    const { data: app, error: appError } = await admin.from('applications').select('id, display_number, user_id, status, terms_accepted_at').eq('id', parsed.data.applicationId).eq('user_id', profile.id).single()
    if (appError || !app || app.status === 'draft' || !app.terms_accepted_at) return json({ error: 'Submitted application required' }, 403)
    const result = await sendTemplateEmail('application-confirmation', auth.user.email, {
      idempotencyKey: `app-confirm-${app.id}-${parsed.data.templateData.submissionMethod}`,
      templateData: { ...parsed.data.templateData, email: auth.user.email, applicationNumber: app.display_number || app.id, termsAcceptedAt: app.terms_accepted_at },
    })
    return json({ success: result.sent, ...result })
  } catch (error) {
    console.error('Application confirmation failed', { message: error instanceof Error ? error.message : 'Unknown error' })
    return json({ error: 'Failed to send confirmation email' }, 500)
  }
})