import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { runGTagChecks } from "@/components/analytics/GTagMonitor";

export default function GTagCheck() {
  const [results, setResults] = useState(() => runGTagChecks());
  const [tick, setTick] = useState(0);
  const [taDebug, setTaDebug] = useState<boolean>(() => {
    try { return localStorage.getItem("ta_debug") === "1"; } catch { return false; }
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setResults(runGTagChecks());
      setTick((t) => t + 1);
    }, 1500);
    return () => window.clearInterval(id);
  }, []);

  const dl = (window as any).dataLayer ?? [];
  const allOk = results.every((r) => r.ok);
  const debugUrl = "https://visafaster.com/?ta_debug=1";

  const toggleTaDebug = () => {
    try {
      if (taDebug) {
        localStorage.removeItem("ta_debug");
      } else {
        localStorage.setItem("ta_debug", "1");
      }
      window.location.reload();
    } catch {}
  };

  const copyDebugUrl = async () => {
    try {
      await navigator.clipboard.writeText(debugUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div dir="ltr" style={{ maxWidth: 760, margin: "40px auto", padding: 16, fontFamily: "ui-sans-serif, system-ui" }}>
      <Helmet>
        <title>Google Ads Tag Diagnostic</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Google Ads Tag Diagnostic
      </h1>
      <p style={{ color: "#555", marginBottom: 16 }}>
        AW-16509107883 — auto-refreshing ({tick})
      </p>

      <div
        style={{
          padding: 12,
          borderRadius: 8,
          background: allOk ? "#ecfdf5" : "#fef2f2",
          border: `1px solid ${allOk ? "#10b981" : "#ef4444"}`,
          marginBottom: 16,
        }}
      >
        <strong>{allOk ? "✅ All checks passing" : "❌ Some checks failing"}</strong>
      </div>

      <div
        style={{
          padding: 12,
          borderRadius: 8,
          background: taDebug ? "#fffbeb" : "#f8fafc",
          border: `1px solid ${taDebug ? "#f59e0b" : "#cbd5e1"}`,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          Tag Assistant debug mode: {taDebug ? "ON (consent granted)" : "OFF (consent denied)"}
        </div>
        <div style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>
          When ON, Consent Mode defaults are set to <code>granted</code> so Google Tag
          Assistant can detect AW-16509107883 reliably. Turn OFF for normal browsing.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={toggleTaDebug}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #334155",
              background: taDebug ? "#ef4444" : "#10b981",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {taDebug ? "Turn OFF & reload" : "Turn ON & reload"}
          </button>
          <button
            onClick={copyDebugUrl}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              background: "white",
              cursor: "pointer",
            }}
          >
            {copied ? "Copied ✓" : `Copy ${debugUrl}`}
          </button>
        </div>
      </div>

      <ul style={{ listStyle: "none", padding: 0, marginBottom: 24 }}>
        {results.map((r) => (
          <li
            key={r.name}
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <span>
              {r.ok ? "✅" : "❌"} {r.name}
            </span>
            {r.detail && <span style={{ color: "#888", fontSize: 12 }}>{r.detail}</span>}
          </li>
        ))}
      </ul>

      <details>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          dataLayer snapshot ({dl.length})
        </summary>
        <pre
          style={{
            background: "#0f172a",
            color: "#e2e8f0",
            padding: 12,
            borderRadius: 6,
            overflow: "auto",
            fontSize: 12,
            marginTop: 8,
          }}
        >
          {JSON.stringify(
            dl.map((e: any) => (Array.isArray(e) ? e : Array.from(e as ArrayLike<unknown>))),
            null,
            2
          )}
        </pre>
      </details>
    </div>
  );
}