import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GTAG_ID = "AW-16509107883";
const SCRIPT_MATCH = `googletagmanager.com/gtag/js?id=${GTAG_ID}`;

type CheckResult = { name: string; ok: boolean; detail?: string };

export function runGTagChecks(): CheckResult[] {
  const results: CheckResult[] = [];

  const dl = (window as any).dataLayer;
  results.push({
    name: "dataLayer present",
    ok: Array.isArray(dl),
    detail: Array.isArray(dl) ? `${dl.length} entries` : "missing",
  });

  const hasConfig =
    Array.isArray(dl) &&
    dl.some(
      (e: any) =>
        e &&
        ((Array.isArray(e) && e[0] === "config" && e[1] === GTAG_ID) ||
          (e["0"] === "config" && e["1"] === GTAG_ID))
    );
  results.push({
    name: `config '${GTAG_ID}' in dataLayer`,
    ok: hasConfig,
  });

  const scriptEl = Array.from(document.scripts).find((s) =>
    (s.src || "").includes(SCRIPT_MATCH)
  );
  results.push({
    name: "<script gtag.js> in DOM",
    ok: !!scriptEl,
    detail: scriptEl?.src,
  });

  let fetchedOk = false;
  try {
    const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const entry = entries.find((e) => e.name.includes(SCRIPT_MATCH));
    // transferSize === 0 usually means cached or blocked; encodedBodySize > 0 means it actually loaded
    fetchedOk = !!entry && (entry.encodedBodySize > 0 || entry.transferSize > 0 || entry.duration > 0);
    results.push({
      name: "gtag.js network fetch",
      ok: fetchedOk,
      detail: entry ? `${Math.round(entry.duration)}ms` : "no resource entry yet",
    });
  } catch {
    results.push({ name: "gtag.js network fetch", ok: false, detail: "perf API unavailable" });
  }

  return results;
}

/**
 * Passive runtime monitor for the Google Ads tag.
 * Renders nothing. Logs a single grouped console.error when checks fail on a route.
 */
export default function GTagMonitor() {
  const location = useLocation();

  useEffect(() => {
    // Defer until after paint so gtag.js has a chance to load on the first route
    const t = window.setTimeout(() => {
      const results = runGTagChecks();
      const failures = results.filter((r) => !r.ok);
      if (failures.length > 0) {
        // eslint-disable-next-line no-console
        console.groupCollapsed(
          `[gtag-monitor] ${failures.length} check(s) failed on ${location.pathname}`
        );
        for (const f of failures) {
          // eslint-disable-next-line no-console
          console.error(`${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
        }
        // eslint-disable-next-line no-console
        console.groupEnd();
      }
    }, 2500);

    return () => window.clearTimeout(t);
  }, [location.pathname]);

  return null;
}