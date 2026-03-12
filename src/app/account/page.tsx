"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function AccountPage() {
  const supabase = createSupabaseBrowser();
  const [fullName, setFullName] = useState("");
  const [msg, setMsg] = useState("");

  async function save() {
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
    setMsg(error ? error.message : "Account updated.");
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="mx-auto max-w-md space-y-3 rounded border bg-white p-4">
      <h1 className="text-xl font-semibold">Edit Account</h1>
      <input className="w-full rounded border p-2" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <button onClick={save} className="rounded bg-black px-3 py-2 text-white">Save</button>
      <button onClick={logout} className="rounded border px-3 py-2">Logout</button>
      {msg ? <p className="text-sm">{msg}</p> : null}
    </div>
  );
}
