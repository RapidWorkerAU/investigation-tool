"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function CheckoutPage() {
  const params = useSearchParams();
  const plan = params.get("plan") || "basic";
  const [msg, setMsg] = useState("");

  async function startCheckout() {
    setMsg("");
    const res = await fetch("/api/stripe/checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data?.error || "Unable to start checkout.");
    window.location.href = data.url;
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded border bg-white p-4">
      <h1 className="text-xl font-semibold">Payment</h1>
      <p>Selected plan: <span className="font-semibold">{plan}</span></p>
      <button onClick={startCheckout} className="rounded bg-black px-4 py-2 text-white">Continue to Stripe</button>
      {msg ? <p className="text-sm">{msg}</p> : null}
    </div>
  );
}
