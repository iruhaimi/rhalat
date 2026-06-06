const STORAGE_KEY = 'pending_post_auth_redirect';

/**
 * Returns true only for safe same-origin internal paths.
 * Rejects: empty, missing leading slash, protocol-relative `//evil.com`,
 * absolute URLs, and the public /auth + /portal-* paths (to avoid loops).
 */
export function isSafeInternalPath(path: unknown): path is string {
  if (typeof path !== 'string' || path.length === 0) return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  if (path.startsWith('/\\')) return false;
  // Block redirecting back to auth pages
  if (path.startsWith('/auth')) return false;
  if (path.startsWith('/portal-')) return false;
  // Disallow embedded protocol just in case
  if (/^\/+https?:/i.test(path)) return false;
  return true;
}

export function sanitizeRedirect(path: unknown, fallback = '/profile'): string {
  return isSafeInternalPath(path) ? (path as string) : fallback;
}

export function stashPendingRedirect(path: string): void {
  if (!isSafeInternalPath(path)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    // ignore (private mode / quota)
  }
}

export function readPendingRedirect(): string | null {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    return isSafeInternalPath(v) ? (v as string) : null;
  } catch {
    return null;
  }
}

export function consumePendingRedirect(): string | null {
  const v = readPendingRedirect();
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return v;
}

/**
 * Read the post-auth redirect target from URL `?redirect=` then sessionStorage.
 * Always validated; returns `null` if nothing safe was found.
 */
export function resolvePostAuthRedirect(search?: URLSearchParams): string | null {
  const params = search ?? new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const fromUrl = params.get('redirect');
  if (isSafeInternalPath(fromUrl)) return fromUrl as string;
  return readPendingRedirect();
}