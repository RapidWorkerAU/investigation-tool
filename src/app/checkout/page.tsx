"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

const PLAN_LABELS: Record<string, string> = {
  pass_30d: "30 Days Access",
  subscription_monthly: "Ongoing Subscription",
};

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [plan, setPlan] = useState("pass_30d");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const p = searchParams.get("plan");
    setPlan(p || "pass_30d");
  }, [searchParams]);

  async function startCheckout() {
    setMsg("");
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.push(`/login?returnTo=${encodeURIComponent(`/checkout?plan=${plan}`)}`);
      return;
    }

    const res = await fetch("/api/stripe/checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) return setMsg(data?.error || "Unable to start checkout.");
    window.location.href = data.url;
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 border bg-white p-4">
      <h1 className="text-xl font-semibold">Checkout</h1>
      <p>
        Selected access type: <span className="font-semibold">{PLAN_LABELS[plan] ?? plan}</span>
      </p>
      <button onClick={startCheckout} className="bg-black px-4 py-2 text-white" disabled={loading}>
        {loading ? "Redirecting..." : "Continue to Stripe"}
      </button>
      {msg ? <p className="text-sm">{msg}</p> : null}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg space-y-4 border bg-white p-4">Loading checkout...</div>}>
      <CheckoutPageContent />
    </Suspense>
  );
}
