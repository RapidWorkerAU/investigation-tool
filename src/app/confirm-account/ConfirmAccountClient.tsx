"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import styles from "../login/LoginPage.module.css";

type ConfirmStatus = "working" | "success" | "error";

function extractAuthPayload() {
  if (typeof window === "undefined") {
    return { code: null, type: null, accessToken: null, refreshToken: null };
  }

  const query = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith("#")
    ? new URLSearchParams(window.location.hash.slice(1))
    : new URLSearchParams();

  return {
    code: query.get("code"),
    type: hash.get("type") ?? query.get("type"),
    accessToken: hash.get("access_token"),
    refreshToken: hash.get("refresh_token"),
  };
}

export default function ConfirmAccountClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [status, setStatus] = useState<ConfirmStatus>("working");
  const [message, setMessage] = useState("Confirming your account now.");
  const [nextPath, setNextPath] = useState("/subscribe");

  useEffect(() => {
    let active = true;

    async function confirmAccount() {
      const { code, type, accessToken, refreshToken } = extractAuthPayload();

      try {
        const resolvedNextPath = type === "email_change" ? "/account" : "/subscribe";

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session) {
            throw new Error("This confirmation link is missing required auth details or has expired.");
          }
        }

        if (!active) return;

        if (typeof window !== "undefined" && (window.location.hash || window.location.search)) {
          window.history.replaceState({}, document.title, "/confirm-account");
        }

        setStatus("success");
        setNextPath(resolvedNextPath);
        setMessage(
          type === "email_change"
            ? "Your email address has been confirmed. You can continue signing in."
            : "Your account is confirmed. Redirecting you to continue."
        );

        window.setTimeout(() => {
          router.replace(resolvedNextPath);
          router.refresh();
        }, 1200);
      } catch (error) {
        if (!active) return;

        setStatus("error");
        setMessage(error instanceof Error ? error.message : "We could not confirm this account link.");
      }
    }

    void confirmAccount();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.panel}>
          <div className={styles.copyBlock}>
            <h1>
              {status === "working"
                ? "Confirming your account."
                : status === "success"
                  ? "Account confirmed."
                  : "Confirmation failed."}
            </h1>
            <p>{message}</p>
          </div>

          <div
            className={`${styles.notice} ${
              status === "error" ? styles.noticeError : status === "success" ? styles.noticeSuccess : ""
            }`}
          >
            <p className={styles.noticeText}>
              {status === "working"
                ? "Please wait while we finish signing you in."
                : status === "success"
                  ? "If you are not redirected automatically, continue manually."
                  : "Request a fresh confirmation email and open the newest link in your inbox."}
            </p>
          </div>

          <p className={styles.authPrompt}>
            <Link href={status === "success" ? nextPath : "/login"} className={styles.noticeAction}>
              {status === "success" ? "Continue" : "Back to sign in"}
            </Link>
          </p>
        </section>

        <aside className={styles.visualPanel} aria-hidden="true">
          <div className={styles.visualGlow} />
          <div className={styles.visualLines} />
          <div className={styles.visualBadge}>
            Investigation software for evidence, workflow, and team collaboration.
          </div>
        </aside>
      </div>
    </div>
  );
}
