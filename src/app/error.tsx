"use client";

import { useEffect } from "react";
import { reportSiteIssue } from "@/lib/siteIssues/client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportSiteIssue({
      action: "loading page",
      error,
      metadata: {
        digest: error.digest,
      },
      source: "application",
    });
  }, [error]);

  return (
    <section style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, background: "#fcfaf7" }}>
      <div style={{ width: "min(480px, 100%)", display: "grid", gap: 14, color: "#181d27" }}>
        <h1 style={{ margin: 0, fontSize: "1.6rem", lineHeight: 1.2 }}>Something went wrong</h1>
        <p style={{ margin: 0, color: "#667085", lineHeight: 1.6 }}>
          We could not complete that page request. Please try again later.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            justifySelf: "start",
            minHeight: 42,
            padding: "0 16px",
            border: "1px solid #2e69d6",
            borderRadius: 8,
            background: "#2e69d6",
            color: "#ffffff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    </section>
  );
}
