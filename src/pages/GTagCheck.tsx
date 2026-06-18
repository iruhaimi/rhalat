import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { runGTagChecks } from "@/components/analytics/GTagMonitor";

export default function GTagCheck() {
  const [results, setResults] = useState(() => runGTagChecks());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setResults(runGTagChecks());
      setTick((t) => t + 1);
    }, 1500);
    return () => window.clearInterval(id);
  }, []);

  const dl = (window as any).dataLayer ?? [];
  const allOk = results.every((r) => r.ok);

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