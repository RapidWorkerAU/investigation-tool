"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./LegalPage.module.css";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

type LegalPageClientProps = {
  pageTitle: string;
  effectiveDate: string;
  sections: LegalSection[];
};

export function LegalPageClient({
  pageTitle,
  effectiveDate,
  sections,
}: LegalPageClientProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");

  const sectionIds = useMemo(() => sections.map((section) => section.id), [sections]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveSection(visible.target.id);
        }
      },
      {
        root,
        threshold: [0.45, 0.6, 0.75],
        rootMargin: "-10% 0px -35% 0px",
      },
    );

    for (const sectionId of sectionIds) {
      const element = root.querySelector<HTMLElement>(`#${sectionId}`);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [sectionIds]);

  function jumpToSection(sectionId: string) {
    const root = containerRef.current;
    const target = root?.querySelector<HTMLElement>(`#${sectionId}`);
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="Investigation Tool home">
            <Image
              src="/images/investigation-tool.png"
              alt=""
              aria-hidden="true"
              width={34}
              height={34}
              className={styles.brandImage}
            />
            <span>Investigation Tool</span>
          </Link>

          <nav className={styles.nav} aria-label="Primary">
            <Link href="/#features">Features</Link>
            <Link href="/#workflow">Workflow</Link>
            <Link href="/#pricing">Pricing</Link>
          </nav>

          <div className={styles.headerActions}>
            <Link href="/login" className={styles.textLink}>
              Sign in
            </Link>
            <Link href="/subscribe" className={styles.ctaButton}>
              Start free trial
            </Link>
          </div>
        </div>

        <div className={styles.headerCurve}>
          <div className={styles.headerCurveInner}>
            <h1>{pageTitle}</h1>
            <p className={styles.effectiveDate}>Effective {effectiveDate}</p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.mainInner}>
          <aside className={styles.menu} aria-label={`${pageTitle} sections`}>
            <nav className={styles.menuList}>
              {sections.map((section) => {
                const active = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => jumpToSection(section.id)}
                    className={`${styles.menuItem} ${active ? styles.menuItemActive : ""}`}
                  >
                    <span className={styles.menuLabel}>{section.title}</span>
                    <span className={styles.menuUnderline} aria-hidden="true" />
                  </button>
                );
              })}
            </nav>
          </aside>

          <div ref={containerRef} className={styles.viewport}>
            {sections.map((section) => (
              <section key={section.id} id={section.id} className={styles.section}>
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p key={`${section.id}-${index}`}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <Link href="/" className={styles.footerBrand} aria-label="Investigation Tool home">
              <Image
                src="/images/investigation-tool.png"
                alt=""
                aria-hidden="true"
                width={30}
                height={30}
                className={styles.brandImage}
              />
              <span>Investigation Tool</span>
            </Link>

            <div className={styles.footerLinks}>
              <Link href="/#features">Features</Link>
              <Link href="/#workflow">Workflow</Link>
              <Link href="/#pricing">Pricing</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>

            <p className={styles.footerCopy}>(c) 2026 Investigation Tool. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

