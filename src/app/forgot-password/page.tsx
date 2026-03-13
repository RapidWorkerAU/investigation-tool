"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { accessRequiresSelection, fetchAccessState } from "@/lib/access";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import styles from "../login/LoginPage.module.css";

type NoticeType = "error" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: NoticeType; text: string } | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const routeAuthenticatedUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        if (!cancelled) {
          setCheckingSession(false);
        }
        return;
      }

      try {
        const accessState = await fetchAccessState(session.access_token);
        router.replace(accessRequiresSelection(accessState) ? "/subscribe" : "/dashboard");
      } catch {
        router.replace("/dashboard");
      }
    };

    void routeAuthenticatedUser();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      setNotice({ type: "error", text: error.message });
    } else {
      setNotice({ type: "success", text: "Password reset email sent. Check your inbox and spam folder." });
    }

    setLoading(false);
  }

  if (checkingSession) {
    return null;
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
            <h1>Reset your password.</h1>
            <p>
              Enter the email attached to your incident investigation workspace and we will send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={onSubmit} className={styles.form}>
            <label className={styles.field}>
              <span className={styles.visuallyHidden}>Email address</span>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Image src="/icons/email.svg" alt="" aria-hidden="true" width={18} height={18} className={styles.fieldIcon} />
            </label>

            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? "Please wait..." : "Send reset link"}
            </button>
          </form>

          {notice ? (
            <div
              className={`${styles.notice} ${notice.type === "error" ? styles.noticeError : styles.noticeSuccess}`}
            >
              <p className={styles.noticeText}>{notice.text}</p>
            </div>
          ) : null}

          <p className={styles.authPrompt}>
            Remembered your password? <Link href="/login">Back to sign in</Link>
          </p>

          <p className={styles.footnote}>
            By continuing you agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </section>

        <aside className={styles.visualPanel} aria-hidden="true">
          <div className={styles.visualGlow} />
          <div className={styles.visualLines} />
          <div className={styles.visualBadge}>
            Reset access quickly and get back to your investigation workflow.
          </div>
        </aside>
      </div>
    </div>
  );
}
