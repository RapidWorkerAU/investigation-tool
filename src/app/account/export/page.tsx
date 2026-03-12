"use client";

import { useState } from "react";

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
    <div className="mx-auto max-w-md space-y-3 rounded border bg-white p-4">
      <h1 className="text-xl font-semibold">Download User Content</h1>
      <button onClick={download} className="rounded bg-black px-3 py-2 text-white">Download</button>
      {msg ? <p className="text-sm">{msg}</p> : null}
    </div>
  );
}
