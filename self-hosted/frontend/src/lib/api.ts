const BASE = (import.meta as any).env.VITE_API_URL || '/api';
export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
  if (!res.ok) throw Object.assign(new Error('api_error'), { status: res.status });
  return res.json();
}