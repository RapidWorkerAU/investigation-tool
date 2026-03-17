"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import type { PreviewCard } from "@/lib/email/preview";
import styles from "./page.module.css";

type EmailPreviewClientProps = {
  previews: PreviewCard[];
};

const PREVIEW_PASSWORD = "ashleighphillips59";

export default function EmailPreviewClient({ previews }: EmailPreviewClientProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendingKey, setSendingKey] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<Record<string, string>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.trim().toLowerCase() === PREVIEW_PASSWORD) {
      setUnlocked(true);
      setError("");
      return;
    }

    setError("Incorrect password.");
  }

  async function sendPreviewEmail(templateKey: string) {
    if (!recipientEmail.trim()) {
      setSendStatus((current) => ({ ...current, [templateKey]: "Enter an email address first." }));
      return;
    }

    setSendingKey(templateKey);
    setSendStatus((current) => ({ ...current, [templateKey]: "" }));

    try {
      const response = await fetch("/api/email-preview/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: recipientEmail.trim(),
          templateKey,
          password,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Unable to send preview email.");
      }

      setSendStatus((current) => ({ ...current, [templateKey]: `Sent to ${recipientEmail.trim()}.` }));
    } catch (sendError) {
      setSendStatus((current) => ({
        ...current,
        [templateKey]: sendError instanceof Error ? sendError.message : "Unable to send preview email.",
      }));
    } finally {
      setSendingKey(null);
    }
  }

  return (
    <>
      <main className={styles.page} aria-hidden={!unlocked}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Internal Preview</p>
            <h1>Email templates</h1>
            <p className={styles.copy}>Review the branded email templates used for auth, billing, and access lifecycle notifications.</p>
          </div>
          <div className={styles.headerActions}>
            <label className={styles.sendField}>
              <span>Send preview to</span>
              <input
                type="email"
                value={recipientEmail}
                onChange={(event) => setRecipientEmail(event.target.value)}
                placeholder="Enter email address"
              />
            </label>
            <Link href="/" className={styles.backLink}>Back to site</Link>
          </div>
        </div>

        <div className={styles.grid}>
          {previews.map((preview) => (
            <section key={preview.key} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2>{preview.title}</h2>
                  <p>{preview.subject}</p>
                </div>
                <div className={styles.sendActions}>
                  <button
                    type="button"
                    className={styles.sendButton}
                    onClick={() => void sendPreviewEmail(preview.key)}
                    disabled={sendingKey === preview.key}
                  >
                    {sendingKey === preview.key ? "Sending..." : "Trigger test email"}
                  </button>
                  {sendStatus[preview.key] ? <p className={styles.sendStatus}>{sendStatus[preview.key]}</p> : null}
                </div>
              </div>

              <div className={styles.previewFrameWrap}>
                <iframe title={preview.title} className={styles.previewFrame} srcDoc={preview.html} />
              </div>

              <details className={styles.details}>
                <summary>Copy and paste</summary>
                <div className={styles.copyBlock}>
                  <h3>Subject</h3>
                  <pre>{preview.subject}</pre>
                </div>
                <div className={styles.copyBlock}>
                  <h3>HTML body</h3>
                  <pre>{preview.copyHtml}</pre>
                </div>
                <div className={styles.copyBlock}>
                  <h3>Plain text body</h3>
                  <pre>{preview.text}</pre>
                </div>
                {preview.supabaseSubject || preview.supabaseBody ? (
                  <div className={styles.supabaseBlock}>
                    <h3>Supabase-ready version</h3>
                    {preview.supabaseSubject ? (
                      <div className={styles.copyBlock}>
                        <h4>Subject</h4>
                        <pre>{preview.supabaseSubject}</pre>
                      </div>
                    ) : null}
                    {preview.supabaseBody ? (
                      <div className={styles.copyBlock}>
                        <h4>Body</h4>
                        <pre>{preview.supabaseBody}</pre>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </details>
            </section>
          ))}
        </div>
      </main>

      {!unlocked ? (
        <div className={styles.passwordOverlay} role="dialog" aria-modal="true" aria-label="Email preview access">
          <div className={styles.passwordCard}>
            <p className={styles.eyebrow}>Internal Preview</p>
            <h1 className={styles.passwordTitle}>Email preview locked</h1>
            <p className={styles.passwordCopy}>
              Enter the preview password to view internal email templates.
            </p>

            <form className={styles.passwordForm} onSubmit={handleSubmit}>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className={styles.passwordInput}
                autoFocus
              />
              <button type="submit" className={styles.passwordButton}>Unlock preview</button>
            </form>

            {error ? <p className={styles.passwordError}>{error}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
