"use client";

import Image from "next/image";
import styles from "./LeadAccessForm.module.css";
import { useState } from "react";

type LeadAccessFormProps = {
  slug: string;
  title: string;
  description: string | null;
};

export function LeadAccessForm({ slug, title, description }: LeadAccessFormProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/lead-access/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          email,
          code,
        }),
      });

      const data = (await response.json()) as { error?: string; redirectPath?: string };
      if (!response.ok || !data.redirectPath) {
        setError(data.error || "Unable to validate that access code.");
        return;
      }

      window.location.assign(data.redirectPath);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to validate that access code.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
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
            <h1>{title}</h1>
            <p>
              {description ||
                "Review a controlled, read-only map experience designed to show the investigation workflow without exposing the rest of the platform."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Email address</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Access code</span>
              <input
                type="text"
                autoCapitalize="characters"
                placeholder="Enter your access code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className={styles.codeInput}
                required
              />
            </label>

            {error ? (
              <div className={styles.notice}>
                <p className={styles.noticeText}>{error}</p>
              </div>
            ) : null}

            <button type="submit" disabled={submitting} className={styles.submitButton}>
              {submitting ? "Checking access..." : "Open read-only map"}
            </button>
          </form>

          <p className={styles.footnote}>
            Use the same email address the code was issued to. If your access does not open, contact
            ashleigh.phillips@hses.com.au.
          </p>
        </section>

        <aside className={styles.visualPanel} aria-hidden="true">
          <div className={styles.visualGlow} />
          <div className={styles.visualLines} />
        </aside>
      </div>
    </main>
  );
}
