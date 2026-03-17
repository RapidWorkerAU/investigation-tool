"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import styles from "../../login/LoginPage.module.css";

type NoticeType = "error" | "success" | "info";

type NoticeState = {
  type: NoticeType;
  text: string;
};

export default function SetPasswordPage() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingRecovery, setCheckingRecovery] = useState(true);
  const [ready, setReady] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const passwordMismatch =
    password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    let mounted = true;

    async function checkRecoveryState() {
      const hashParams =
        typeof window !== "undefined" ? new URLSearchParams(window.location.hash.slice(1)) : null;
      const recoveryInHash = hashParams?.get("type") === "recovery";

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (recoveryInHash || session) {
        setReady(true);
        setNotice(null);
      } else {
        setReady(false);
        setNotice({
          type: "info",
          text: "This password reset link is missing or has expired. Request a new reset email to continue.",
        });
      }

      setCheckingRecovery(false);
    }

    void checkRecoveryState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setCheckingRecovery(false);
        setNotice(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setNotice({ type: "error", text: "Passwords do not match." });
      return;
    }

    setLoading(true);
    setNotice(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setNotice({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setResetComplete(true);
    setReady(false);
    setPassword("");
    setConfirmPassword("");
    setNotice({
      type: "success",
      text: "Password reset complete. Use your new password to sign in.",
    });
    setLoading(false);
  }

  if (checkingRecovery) {
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
            <h1>Set your new password.</h1>
            <p>
              Choose a new password for your investigation workspace. After saving it, sign in again using the new password.
            </p>
          </div>

          {resetComplete ? (
            <div className={styles.signupSuccess}>
              <div className={styles.signupSuccessIcon} aria-hidden="true">
                <span>✓</span>
              </div>
              <div className={styles.signupSuccessCopy}>
                <h2>Password reset complete</h2>
                <p>Your password has been updated successfully.</p>
                <p>You have not been signed in. Continue to login and enter your new password.</p>
              </div>
              <Link href="/login" className={styles.signupReturnButton}>
                Back to sign in
              </Link>
            </div>
          ) : ready ? (
            <form onSubmit={onSubmit} className={styles.form}>
              <label className={styles.field}>
                <span className={styles.visuallyHidden}>New password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Image
                    src={showPassword ? "/icons/visible.svg" : "/icons/hidden.svg"}
                    alt=""
                    aria-hidden="true"
                    width={18}
                    height={18}
                  />
                </button>
              </label>

              <label className={`${styles.field} ${passwordMismatch ? styles.fieldError : ""}`}>
                <span className={styles.visuallyHidden}>Confirm new password</span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                >
                  <Image
                    src={showConfirmPassword ? "/icons/visible.svg" : "/icons/hidden.svg"}
                    alt=""
                    aria-hidden="true"
                    width={18}
                    height={18}
                  />
                </button>
              </label>

              {passwordMismatch ? (
                <p className={styles.validationText}>Passwords do not match.</p>
              ) : null}

              <button type="submit" disabled={loading} className={styles.submitButton}>
                {loading ? "Please wait..." : "Reset password"}
              </button>
            </form>
          ) : (
            <div className={styles.notice}>
              <p className={styles.noticeText}>
                Request a new password reset email and open the latest link from your inbox.
              </p>
            </div>
          )}

          {notice ? (
            <div
              className={`${styles.notice} ${
                notice.type === "error" ? styles.noticeError : notice.type === "success" ? styles.noticeSuccess : ""
              }`}
            >
              <p className={styles.noticeText}>{notice.text}</p>
            </div>
          ) : null}

          <p className={styles.authPrompt}>
            Need another reset link? <Link href="/forgot-password">Reset by email</Link>
          </p>

          <p className={styles.footnote}>
            By continuing you agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </section>

        <aside className={styles.visualPanel} aria-hidden="true">
          <div className={styles.visualGlow} />
          <div className={styles.visualLines} />
          <div className={styles.visualBadge}>
            Reset access securely and return to your investigation workflow with your new password.
          </div>
        </aside>
      </div>
    </div>
  );
}
