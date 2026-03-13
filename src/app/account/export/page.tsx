"use client";

import { useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import styles from "@/components/dashboard/DashboardShell.module.css";

export default function ExportPage() {
  const [msg, setMsg] = useState("");

  async function download() {
    const res = await fetch("/api/account/export");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "investigation-tool-export.json";
    a.click();
    URL.revokeObjectURL(url);
    setMsg("Downloaded.");
  }

  return (
    <DashboardShell
      activeNav="export"
      eyebrow="Account"
      title="Download User Content"
      subtitle="Export your account data without leaving the dashboard shell."
    >
      <section className={`${styles.contentCard} ${styles.contentCardCompact}`}>
        <div className={styles.fieldStack}>
          <div className={styles.actions}>
            <button onClick={download} className={styles.button}>Download</button>
          </div>
          {msg ? <p className={styles.message}>{msg}</p> : null}
        </div>
      </section>
    </DashboardShell>
  );
}
