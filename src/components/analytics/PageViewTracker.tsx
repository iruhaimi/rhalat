import { useEffect, useRef } from "react";
import { useLocation } from "@/lib/router-compat";
import { GOOGLE_ANALYTICS_ID } from "@/lib/headScripts";

/**
 * GA4 uses explicit page views; Ads receives its linked GA4 signals without
 * a second event. Without GA4, fall back to Ads. GTM keeps its navigation event.
 * This tracker lives in the root layout so future routes are included too.
 */
export default function PageViewTracker() {
  const location = useLocation();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (/despia-iphone|despia-ipad/i.test(navigator.userAgent)) return;
    const w = window as unknown as {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
    };
    const search = (location.search || "").replace(/^\?+/, "");
    const path = location.pathname + (search ? `?${search}` : "");
    if (previousPath.current === path) return;
    const id = window.setTimeout(() => {
      const isInitial = previousPath.current === null;
      previousPath.current = path;
      const payload = {
        page_path: path,
        page_location: window.location.href,
        page_title: document.title,
      };
      if (!isInitial && Array.isArray(w.dataLayer)) w.dataLayer.push({ event: "page_view", ...payload });
      if (typeof w.gtag === "function") {
        if (GOOGLE_ANALYTICS_ID) w.gtag("event", "page_view", { send_to: GOOGLE_ANALYTICS_ID, ...payload });
        else w.gtag("event", "page_view", { send_to: "AW-18502036693", ...payload });
      }
    }, 200);
    return () => window.clearTimeout(id);
  }, [location.pathname, location.search]);

  return null;
}
