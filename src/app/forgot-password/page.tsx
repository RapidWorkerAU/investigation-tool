"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createSupabaseBrowser();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setMsg(error ? error.message : "Password reset email sent.");
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded border bg-white p-4">
      <h1 className="text-xl font-semibold">Forgot Password</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full rounded border p-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button className="w-full rounded bg-black px-3 py-2 text-white">Send reset email</button>
      </form>
      {msg ? <p className="text-sm">{msg}</p> : null}
    </div>
  );
}
