import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { getCorsHeaders } from '../_shared/cors.ts'

// Generate a single recovery code using a CSPRNG (Web Crypto API)
function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const arr = new Uint8Array(8)
  crypto.getRandomValues(arr)
  let code = ''
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-'
    code += chars[arr[i] % chars.length]
  }
  return code
}

function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = []
  const used = new Set<string>()
  while (codes.length < count) {
    const c = generateRecoveryCode()
    if (!used.has(c)) {
      used.add(c)
      codes.push(c)
    }
  }
  return codes
}

async function hashRecoveryCode(code: string): Promise<string> {
  const normalized = code.replace(/-/g, '').toUpperCase()
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Verify caller is staff (admin, agent, or tour_operator) — only staff get recovery codes
    const { data: isAdmin } = await adminClient.rpc('is_admin', { _user_id: user.id })
    const { data: isAgent } = await adminClient.rpc('is_agent', { _user_id: user.id })
    const { data: isTourOperator } = await adminClient.rpc('is_tour_operator', { _user_id: user.id })
    if (!isAdmin && !isAgent && !isTourOperator) {
      return new Response(JSON.stringify({ error: 'Forbidden: staff only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Refuse to overwrite — recovery codes can only be issued once per account
    const { data: existing, error: existErr } = await adminClient
      .from('staff_recovery_codes')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
    if (existErr) {
      console.error('check existing failed:', existErr)
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (existing && existing.length > 0) {
      // Already issued — not an error; the client continues the normal login.
      return new Response(JSON.stringify({ success: true, codes: [], alreadyExists: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate, hash and insert codes
    const plaintextCodes = generateRecoveryCodes(8)
    const rows = await Promise.all(
      plaintextCodes.map(async (code, i) => ({
        user_id: user.id,
        code_hash: await hashRecoveryCode(code),
        code_index: i,
      }))
    )

    const { error: insertErr } = await adminClient.from('staff_recovery_codes').insert(rows)
    if (insertErr) {
      console.error('insert recovery codes failed:', insertErr)
      return new Response(JSON.stringify({ error: 'Failed to save recovery codes' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ success: true, codes: plaintextCodes }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})