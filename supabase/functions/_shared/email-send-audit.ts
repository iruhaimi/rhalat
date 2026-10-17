import { createClient } from 'npm:@supabase/supabase-js@2'

/** Kept application log is observational: it must never decide delivery. */
export async function recordEmailOutcome(
  templateName: string,
  recipient: string,
  status: 'sent' | 'suppressed' | 'failed',
  errorMessage?: string,
) {
  try {
    const url = Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !key) throw new Error('Missing email audit configuration')
    const { error } = await createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }).from('email_send_log').insert({
      template_name: templateName,
      recipient_email: recipient,
      status,
      message_id: null,
      error_message: errorMessage?.slice(0, 1000) ?? null,
    })
    if (error) console.error('Email audit write failed', { code: error.code, message: error.message })
  } catch (error) {
    console.error('Email audit write failed', { message: error instanceof Error ? error.message : 'Unknown error' })
  }
}