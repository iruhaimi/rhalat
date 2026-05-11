import { useEffect, useState, useCallback } from 'react';

export type AdminUIPrefs = {
  compactDensity: boolean;       // tighter paddings on admin pages
  reduceMotion: boolean;         // disable framer-motion / animations
  hideStatCards: boolean;        // hide top stat-card grids
  hideRoleBadges: boolean;       // hide owner/admin/agent badges in lists
  hideUrgentBanner: boolean;     // hide urgent-tasks dashboard on /admin
  sidebarCollapsedDefault: boolean; // start sidebar collapsed
  showSidebarBadges: boolean;    // show notification dots in sidebar
};

export const DEFAULT_PREFS: AdminUIPrefs = {
  compactDensity: false,
  reduceMotion: false,
  hideStatCards: false,
  hideRoleBadges: false,
  hideUrgentBanner: false,
  sidebarCollapsedDefault: false,
  showSidebarBadges: true,
};

const STORAGE_KEY = 'admin-ui-prefs:v1';
const EVENT = 'admin-ui-prefs-changed';

function readPrefs(): AdminUIPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<AdminUIPrefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function applyToDocument(prefs: AdminUIPrefs) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('admin-compact', prefs.compactDensity);
  root.classList.toggle('admin-no-motion', prefs.reduceMotion);
  root.classList.toggle('admin-hide-stats', prefs.hideStatCards);
  root.classList.toggle('admin-hide-role-badges', prefs.hideRoleBadges);
  root.classList.toggle('admin-hide-urgent', prefs.hideUrgentBanner);
}

/**
 * Lightweight, localStorage-backed admin UI preferences.
 * Updates broadcast across tabs (storage event) and within the same tab
 * (custom event), so all consumers stay in sync without a global store.
 */
export function useAdminUIPrefs() {
  const [prefs, setPrefs] = useState<AdminUIPrefs>(() => readPrefs());

  useEffect(() => {
    applyToDocument(prefs);
  }, [prefs]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPrefs(readPrefs());
    };
    const onCustom = () => setPrefs(readPrefs());
    window.addEventListener('storage', onStorage);
    window.addEventListener(EVENT, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(EVENT, onCustom);
    };
  }, []);

  const update = useCallback((patch: Partial<AdminUIPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      window.dispatchEvent(new CustomEvent(EVENT));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setPrefs(DEFAULT_PREFS);
    window.dispatchEvent(new CustomEvent(EVENT));
  }, []);

  return { prefs, update, reset };
}

export default useAdminUIPrefs;