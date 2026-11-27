import { useEffect, useRef } from "react";
import { useLocation } from "@/lib/router-compat";

/**
 * Sends a page_view to Google Ads (gtag) and a `page_view` event to the
 * Tag Manager dataLayer on every in-app navigation, so every route —
 * existing or future — is measured. The first load is already counted by
 * gtag('config'), so it is skipped here to avoid double counting.
 */
export default function PageViewTracker() {
  const location = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const w = window as any;
    const path = location.pathname + (location.search || "");
    const id = window.setTimeout(() => {
      const payload = {
        page_path: path,
        page_location: window.location.href,
        page_title: document.title,
      };
      if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event: "page_view", ...payload });
      if (typeof w.gtag === "function") w.gtag("event", "page_view", { send_to: "AW-18502036693", ...payload });
    }, 0);
    return () => window.clearTimeout(id);
  }, [location.pathname, location.search]);

  return null;
}
