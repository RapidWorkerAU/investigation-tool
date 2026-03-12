"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else router.push("/dashboard");
    } else {
      const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/confirm-account`;
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
      if (error) setMsg(error.message);
      else setMsg("Account created. Check email to confirm.");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded border bg-white p-4">
      <h1 className="text-xl font-semibold">{mode === "login" ? "Login" : "Create Account"}</h1>
      <div className="flex gap-2">
        <button className={`rounded border px-3 py-1 ${mode === "login" ? "bg-slate-100" : ""}`} onClick={() => setMode("login")}>Login</button>
        <button className={`rounded border px-3 py-1 ${mode === "signup" ? "bg-slate-100" : ""}`} onClick={() => setMode("signup")}>Create account</button>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full rounded border p-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded border p-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button disabled={loading} className="w-full rounded bg-black px-3 py-2 text-white">{loading ? "Please wait..." : (mode === "login" ? "Login" : "Create account")}</button>
      </form>
      <Link href="/forgot-password" className="text-sm underline">Forgot password?</Link>
      {msg ? <p className="text-sm">{msg}</p> : null}
    </div>
  );
}
