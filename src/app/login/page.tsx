"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { accessRequiresSelection, fetchAccessState } from "@/lib/access";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import styles from "./LoginPage.module.css";

type AuthMode = "login" | "signup";
type NoticeType = "error" | "success" | "info";

type NoticeState = {
  type: NoticeType;
  text: string;
  allowResend?: boolean;
  resent?: boolean;
};

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard";
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const passwordMismatch = mode === "signup" && password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword;

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

        if (accessRequiresSelection(accessState)) {
          router.replace("/subscribe");
          return;
        }

        router.replace(returnTo);
      } catch {
        router.replace(returnTo);
      }
    };

    void routeAuthenticatedUser();

    return () => {
      cancelled = true;
    };
  }, [returnTo, router, supabase]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setNotice({ type: "error", text: "Passwords do not match." });
        setLoading(false);
        return;
      }

      const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/confirm-account`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: fullName,
            name: fullName,
          },
        },
      });

      if (error) {
        setNotice({ type: "error", text: error.message });
      } else {
        setSignupComplete(true);
        setNotice(null);
      }

      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const normalized = error.message.toLowerCase();
      const needsConfirmation =
        normalized.includes("email not confirmed") ||
        normalized.includes("not confirmed") ||
        normalized.includes("confirm your email");

      setNotice({
        type: "error",
        text: needsConfirmation
          ? "Your account has not been authorised yet. Please click the confirmation link in your email before signing in."
          : error.message,
        allowResend: needsConfirmation,
      });
      setLoading(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.push(returnTo);
      router.refresh();
      return;
    }

    try {
      const accessState = await fetchAccessState(session.access_token);

      if (accessRequiresSelection(accessState)) {
        router.push("/subscribe");
      } else {
        router.push(returnTo);
      }
    } catch {
      router.push(returnTo);
    }

    router.refresh();
  }

  async function resendConfirmation() {
    if (!email || resending) return;

    setResending(true);
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/confirm-account`;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setNotice({ type: "error", text: error.message, allowResend: true });
    } else {
      setNotice({
        type: "success",
        text: "Confirmation link resent. Check your inbox and spam folder.",
        resent: true,
      });
    }

    setResending(false);
  }

  const submitLabel =
    loading ? "Please wait..." : mode === "login" ? "Login" : "Create account";

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
            <h1>{mode === "login" ? "Welcome back." : "Create your workspace."}</h1>
            <p>
              {mode === "login"
                ? "Sign in to continue your incident investigation workflow, maps, evidence review, and team collaboration."
                : "Start using investigation software built for incident workflow, evidence management, collaborative analysis, and reporting."}
            </p>
          </div>

          {!(mode === "signup" && signupComplete) ? (
            <div className={styles.modeSwitch} role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                className={`${styles.modeButton} ${mode === "login" ? styles.modeButtonActive : ""}`}
                onClick={() => {
                  setMode("login");
                  setNotice(null);
                  setSignupComplete(false);
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signup"}
                className={`${styles.modeButton} ${mode === "signup" ? styles.modeButtonActive : ""}`}
                onClick={() => {
                  setMode("signup");
                  setNotice(null);
                  setSignupComplete(false);
                }}
              >
                Sign up
              </button>
            </div>
          ) : null}

          {mode === "signup" && signupComplete ? (
            <div className={styles.signupSuccess}>
              <div className={styles.signupSuccessIcon} aria-hidden="true">
                <span>✓</span>
              </div>
              <div className={styles.signupSuccessCopy}>
                <h2>Signup Received</h2>
                <p>
                  You will need to confirm your email before logging in. You should receive an email within the next 5 minutes with a
                  link to confirm your email.
                </p>
                <p>
                  Check your spam or junk folders first before resending the link.
                </p>
              </div>
              <button
                type="button"
                className={styles.signupReturnButton}
                onClick={() => {
                  setMode("login");
                  setSignupComplete(false);
                  setNotice(null);
                }}
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className={styles.form}>
              {mode === "signup" ? (
                <label className={styles.field}>
                  <span className={styles.visuallyHidden}>Full name</span>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                  />
                </label>
              ) : null}

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

              <label className={styles.field}>
                <span className={styles.visuallyHidden}>Password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "login" ? "Enter your password" : "Create your password"}
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

              {mode === "signup" ? (
                <label className={`${styles.field} ${passwordMismatch ? styles.fieldError : ""}`}>
                  <span className={styles.visuallyHidden}>Confirm password</span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
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
              ) : null}

              {mode === "login" ? (
                <div className={styles.formMeta}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>

                  <Link href="/forgot-password" className={styles.metaLink}>
                    Forgot Password?
                  </Link>
                </div>
              ) : passwordMismatch ? (
                <p className={styles.validationText}>Passwords do not match.</p>
              ) : null}

              <button type="submit" disabled={loading} className={styles.submitButton}>
                {submitLabel}
              </button>
            </form>
          )}

          {notice ? (
            <div
              className={`${styles.notice} ${
                notice.type === "error" ? styles.noticeError : notice.type === "success" ? styles.noticeSuccess : ""
              }`}
            >
              <p className={styles.noticeText}>{notice.text}</p>
              {notice.allowResend && !notice.resent ? (
                <button type="button" className={styles.noticeAction} onClick={resendConfirmation} disabled={resending}>
                  {resending ? "Resending..." : "Resend link"}
                </button>
              ) : null}
            </div>
          ) : null}

          <p className={styles.authPrompt}>
            {mode === "signup" && signupComplete ? null : mode === "login" ? (
              <>
                Need an account?{" "}
                <button
                  type="button"
                  className={styles.noticeAction}
                  onClick={() => {
                    setMode("signup");
                    setNotice(null);
                  }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className={styles.noticeAction}
                  onClick={() => {
                    setMode("login");
                    setNotice(null);
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className={styles.footnote}>
            By continuing you agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
