"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { accessRequiresSelection, fetchAccessState } from "@/lib/access";
import styles from "./SubscribePage.module.css";

function SubscribePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [processingTrial, setProcessingTrial] = useState(false);
  const [processingPaid, setProcessingPaid] = useState<"pass_30d" | "subscription_monthly" | null>(null);

  useEffect(() => {
    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push("/login?returnTo=%2Fsubscribe");
        return;
      }

      try {
        const state = await fetchAccessState(session.access_token);

        if (!accessRequiresSelection(state) && state.currentAccessStatus === "active") {
          router.push("/dashboard");
          return;
        }

        if (searchParams.get("checkout") === "success") {
          setNotice("Payment received. Your access is being activated now.");
        } else if (searchParams.get("checkout") === "cancel") {
          setNotice("Checkout cancelled. Choose an access type when you are ready.");
        }
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Unable to load access options.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [router, searchParams, supabase]);

  async function startTrial() {
    setProcessingTrial(true);
    setNotice(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.push("/login?returnTo=%2Fsubscribe");
      return;
    }

    const response = await fetch("/api/access/trial", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await response.json();
    setProcessingTrial(false);

    if (!response.ok) {
      setNotice(data?.error || "Unable to activate the trial.");
      return;
    }

    router.push("/dashboard");
  }

  async function startPaidCheckout(plan: "pass_30d" | "subscription_monthly") {
    setProcessingPaid(plan);
    setNotice(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.push("/login?returnTo=%2Fsubscribe");
      return;
    }

    const response = await fetch("/api/stripe/checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ plan }),
    });

    const data = await response.json();
    setProcessingPaid(null);

    if (!response.ok) {
      setNotice(data?.error || "Unable to start checkout.");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.panel}>
          <p className={styles.eyebrow}>Choose access type</p>
          <h1 className={styles.title}>Select the access model that fits this investigation.</h1>
          <p className={styles.copy}>
            Start with a 7 day trial, buy a 30 day investigation pass for one full investigation, or enable ongoing monthly access
            for unrestricted investigation workflow, collaboration, and export.
          </p>

          {notice ? <div className={styles.notice}>{notice}</div> : null}

          <div className={styles.grid}>
            <article className={styles.tile}>
              <div className={styles.tileHead}>
                <h2>7 Day Trial</h2>
                <p>One map, no export, full editing for 7 days so the user can test the workflow.</p>
              </div>
              <div className={styles.price}>
                <strong>Free</strong>
                <span>for 7 days</span>
              </div>
              <ul className={styles.list}>
                <li>One investigation map</li>
                <li>Write access during the trial</li>
                <li>No export</li>
                <li>Expires automatically after 7 days</li>
              </ul>
              <div className={styles.actions}>
                <button type="button" className={styles.secondaryButton} onClick={startTrial} disabled={processingTrial || loading}>
                  {processingTrial ? "Activating..." : "Start free trial"}
                </button>
              </div>
            </article>

            <article className={`${styles.tile} ${styles.tileFeatured}`}>
              <div className={styles.tileHead}>
                <h2>30 Days Access</h2>
                <p>One full investigation with write access for 30 days, then read-only retention after expiry.</p>
              </div>
              <div className={styles.price}>
                <strong>$49</strong>
                <span>AUD once-off</span>
              </div>
              <ul className={styles.list}>
                <li>One new writable map per purchase</li>
                <li>Export enabled during the access window</li>
                <li>Old pass maps remain visible as read-only</li>
                <li>Ideal for one-off investigations</li>
              </ul>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => void startPaidCheckout("pass_30d")}
                  disabled={processingPaid !== null || loading}
                >
                  {processingPaid === "pass_30d" ? "Redirecting..." : "Buy 30 day access"}
                </button>
              </div>
            </article>

            <article className={styles.tile}>
              <div className={styles.tileHead}>
                <h2>Ongoing Subscription</h2>
                <p>Full access for teams that need continuous investigation software, collaboration, and reporting.</p>
              </div>
              <div className={styles.price}>
                <strong>$99</strong>
                <span>AUD / month</span>
              </div>
              <ul className={styles.list}>
                <li>Unlimited maps while active</li>
                <li>Full export, share, duplicate, and editing</li>
                <li>Read-only restriction if payment fails</li>
                <li>Best for recurring investigations</li>
              </ul>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => void startPaidCheckout("subscription_monthly")}
                  disabled={processingPaid !== null || loading}
                >
                  {processingPaid === "subscription_monthly" ? "Redirecting..." : "Start monthly access"}
                </button>
              </div>
            </article>
          </div>
        </section>

        <aside className={styles.aside} aria-hidden="true">
          <div className={styles.asideBlock}>
            <h3>Access controls drive the workflow.</h3>
            <p>
              Trial, pass, and subscription access are tracked directly against the account so the app can switch between full access,
              selection required, and read-only states automatically.
            </p>
          </div>

          <div className={styles.statusCard}>
            <strong>What happens next</strong>
            <span>Free trial activates immediately in Supabase.</span>
            <span>Paid access activates from Stripe webhook events.</span>
            <span>Expired or failed billing moves maps into read-only mode.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={null}>
      <SubscribePageContent />
    </Suspense>
  );
}
