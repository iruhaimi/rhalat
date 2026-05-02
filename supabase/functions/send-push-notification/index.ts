import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error('OneSignal credentials not configured')
    }

    // Authenticate caller. Two accepted modes:
    //   1. Internal service-to-service: header `x-internal-secret` matches PUSH_INTERNAL_SECRET env var.
    //   2. Authenticated staff user (admin or agent) with a valid Supabase JWT.
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const internalSecret = Deno.env.get('PUSH_INTERNAL_SECRET')

    const providedSecret = req.headers.get('x-internal-secret')
    const isInternalCall = !!internalSecret && providedSecret === internalSecret

    if (!isInternalCall) {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const { data: userData, error: userErr } = await userClient.auth.getUser()
      if (userErr || !userData?.user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const adminCheck = createClient(supabaseUrl, supabaseServiceKey)
      const [{ data: isAdmin }, { data: isAgent }] = await Promise.all([
        adminCheck.rpc('is_admin', { _user_id: userData.user.id }),
        adminCheck.rpc('is_agent', { _user_id: userData.user.id }),
      ])
      if (!isAdmin && !isAgent) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: staff only' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const { user_id, title, message, url, data } = await req.json()

    if (!user_id || !title || !message) {
      return new Response(
        JSON.stringify({ error: 'user_id, title, and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's OneSignal player IDs from profiles
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: devices } = await supabase
      .from('user_push_devices')
      .select('onesignal_player_id')
      .eq('user_id', user_id)

    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ success: false, reason: 'no_devices' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const playerIds = devices.map((d: any) => d.onesignal_player_id)

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { ar: title, en: title },
        contents: { ar: message, en: message },
        url: url || undefined,
        data: data || undefined,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(`OneSignal API error [${response.status}]: ${JSON.stringify(result)}`)
    }

    return new Response(
      JSON.stringify({ success: true, onesignal_id: result.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Push notification error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
