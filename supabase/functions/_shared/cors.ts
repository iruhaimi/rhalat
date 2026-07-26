// Allowlist of trusted origins for the app (web + native WebView shells).
// Individual edge functions still authenticate via Bearer JWT — CORS is a
// browser-side second layer, not the primary access gate.
const ALLOWED_ORIGINS = new Set<string>([
  'https://visafaster.com',
  'https://www.visafaster.com',
  'https://visafaster.lovable.app',
  'https://id-preview--616b2e7f-7e45-4cdc-90ea-1c048e4da3b0.lovable.app',
  'capacitor://localhost',
  'https://localhost',
  'http://localhost',
  'http://localhost:5173',
  'http://localhost:8080',
  'ionic://localhost',
])

function pickOrigin(origin: string | null): string {
  if (origin && ALLOWED_ORIGINS.has(origin)) return origin
  // Fall back to the canonical production origin (safe default: the browser
  // will simply block the response for a non-allowlisted caller).
  return 'https://visafaster.com'
}

export function getCorsHeaders(originOrReq: string | Request | null): Record<string, string> {
  const origin =
    typeof originOrReq === 'string' || originOrReq === null
      ? originOrReq
      : originOrReq.headers.get('origin')
  return {
    'Access-Control-Allow-Origin': pickOrigin(origin),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

// Backwards-compatible constant: retains the previous surface for callers that
// still spread `...corsHeaders`. New/edited functions should call
// `getCorsHeaders(req)` to echo the actual request origin from the allowlist.
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': 'https://visafaster.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin',
}
