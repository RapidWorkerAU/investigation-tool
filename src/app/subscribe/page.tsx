"use client";

import Image from "next/image";
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
  const [userEmail, setUserEmail] = useState<string>("");
  const [accessState, setAccessState] = useState<Awaited<ReturnType<typeof fetchAccessState>> | null>(null);
  const [processingTrial, setProcessingTrial] = useState(false);
  const [processingPaid, setProcessingPaid] = useState<"pass_30d" | "subscription_monthly" | null>(null);
  const [routingToWorkspace, setRoutingToWorkspace] = useState(false);
  const checkoutState = searchParams.get("checkout");

  useEffect(() => {
    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push("/login?returnTo=%2Fsubscribe");
        return;
      }

      setUserEmail(session.user.email || "");

      try {
        const state = await fetchAccessState(session.access_token);
        setAccessState(state);

        const keepSubscribeOpenForPassRenewal =
          state.currentAccessType === "pass_30d" && state.currentAccessStatus === "active";

        if (!keepSubscribeOpenForPassRenewal && !accessRequiresSelection(state) && state.currentAccessStatus === "active") {
          router.push("/dashboard");
          return;
        }

        if (checkoutState === "success") {
          setNotice(null);
        } else if (checkoutState === "failed") {
          setNotice(null);
        }
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Unable to load access options.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [checkoutState, router, searchParams, supabase]);

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

  async function goToWorkspace() {
    if (routingToWorkspace) return;

    setRoutingToWorkspace(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setRoutingToWorkspace(false);
      router.push("/login?returnTo=%2Fdashboard");
      return;
    }

    try {
      const accessState = await fetchAccessState(session.access_token);
      router.push(accessRequiresSelection(accessState) ? "/subscribe" : "/dashboard");
      router.refresh();
    } catch {
      router.push("/dashboard");
      router.refresh();
    } finally {
      setRoutingToWorkspace(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.panel}>
          <div className={styles.brandRow}>
            <Image
              src="/images/investigation-tool.png"
              alt=""
              aria-hidden="true"
              width={34}
              height={34}
              className={styles.brandImage}
            />
            <span className={styles.brandText}>Investigation Tool</span>
          </div>

          <div className={styles.copyBlock}>
            {checkoutState === "success" ? null : (
              <>
                <h1>
                  {checkoutState === "failed"
                    ? "Payment failed."
                    : userEmail
                      ? `Choose your access for ${userEmail}.`
                      : "Choose your access."}
                </h1>
                <p>
                  {checkoutState === "failed"
                    ? "We could not complete your payment. Choose an access type and try again when you are ready."
                    : "Start with a free trial, buy a single 30 day investigation pass, or enable ongoing monthly access for unrestricted incident investigation workflow, mapping, collaboration, and reporting."}
                </p>
              </>
            )}
          </div>

          {checkoutState === "success" ? (
            <div className={styles.checkoutState}>
              <div className={styles.checkoutStateIcon} aria-hidden="true">
                <span>✓</span>
              </div>
              <div className={styles.checkoutStateCopy}>
                <h2>Payment Successful</h2>
                <p>Your access purchase has been received and your account is being activated now. You can continue to your dashboard and begin working as soon as activation completes.</p>
              </div>
              <button type="button" className={styles.checkoutStateButton} onClick={() => void goToWorkspace()} disabled={routingToWorkspace}>
                {routingToWorkspace ? "Checking access..." : "Go to dashboard"}
              </button>
            </div>
          ) : checkoutState === "failed" ? (
            <div className={styles.checkoutState}>
              <div className={`${styles.checkoutStateIcon} ${styles.checkoutStateIconMuted}`} aria-hidden="true">
                <span>!</span>
              </div>
              <div className={styles.checkoutStateCopy}>
                <h2>Payment Failed</h2>
                <p>Your payment did not complete, so access has not been activated yet.</p>
                <p>Return to the access options below and try again when you are ready.</p>
              </div>
              <button
                type="button"
                className={styles.checkoutStateButton}
                onClick={() => router.replace("/subscribe")}
              >
                Back to access options
              </button>
            </div>
          ) : notice ? (
            <div className={styles.notice}>{notice}</div>
          ) : null}

          {checkoutState === null &&
          accessState?.currentAccessType === "pass_30d" &&
          accessState.currentAccessStatus === "active" ? (
            <div className={styles.renewalNotice}>
              <span className={styles.renewalNoticeEyebrow}>30 Day Access Renewal</span>
              <strong>Your current pass is still active.</strong>
              <span>
                Renewal becomes available after your first reminder email is sent. If you renew then, the next 30 day period is queued to start when your current pass ends so you receive the full additional 30 days.
              </span>
            </div>
          ) : null}

          {checkoutState ? null : <div className={styles.stack}>
            <article className={styles.tile}>
              <div className={styles.tileHead}>
                <div>
                  <h2>Free Trial</h2>
                  <p>7 days access to one investigation map with write access and no export.</p>
                </div>
                <div className={styles.priceBlock}>
                  <span className={styles.price}>Free</span>
                  <span className={styles.priceMeta}>7 day access</span>
                </div>
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.secondaryButton} onClick={startTrial} disabled={processingTrial || loading}>
                  {processingTrial ? "Activating..." : "Start free trial"}
                </button>
              </div>
            </article>

            <article className={`${styles.tile} ${styles.tileFeatured}`}>
              <div className={styles.tileHead}>
                <div>
                  <h2>30 Day Access</h2>
                  <p>One new writable map with full investigation access for a single incident window.</p>
                </div>
                <div className={styles.priceBlock}>
                  <span className={styles.price}>$49</span>
                  <span className={styles.priceMeta}>AUD once-off</span>
                </div>
              </div>
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
                <div>
                  <h2>Ongoing Subscription</h2>
                  <p>Unlimited investigation maps with full export, sharing, duplication, and reporting.</p>
                </div>
                <div className={styles.priceBlock}>
                  <span className={styles.price}>$99</span>
                  <span className={styles.priceMeta}>AUD / month</span>
                </div>
              </div>
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
          </div>}
        </section>

        <aside className={styles.visualPanel} aria-hidden="true">
          <div className={styles.visualGlow} />
          <div className={styles.visualLines} />
          <div className={styles.visualBadge}>
            Start instantly with a free trial, choose a single investigation pass when you need focused access, or enable ongoing coverage
            for your team.
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
