"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type PreviewCard = {
  key: string;
  title: string;
  subject: string;
  html: string;
  text: string;
};

type EmailPreviewClientProps = {
  previews: PreviewCard[];
};

const PREVIEW_PASSWORD = "ashleighphillips59";

export default function EmailPreviewClient({ previews }: EmailPreviewClientProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.trim().toLowerCase() === PREVIEW_PASSWORD) {
      setUnlocked(true);
      setError("");
      return;
    }

    setError("Incorrect password.");
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
          <Link href="/" className={styles.backLink}>Back to site</Link>
        </div>

        <div className={styles.grid}>
          {previews.map((preview) => (
            <section key={preview.key} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2>{preview.title}</h2>
                  <p>{preview.subject}</p>
                </div>
              </div>

              <div className={styles.previewFrameWrap}>
                <iframe title={preview.title} className={styles.previewFrame} srcDoc={preview.html} />
              </div>

              <details className={styles.details}>
                <summary>Plain text version</summary>
                <pre>{preview.text}</pre>
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
