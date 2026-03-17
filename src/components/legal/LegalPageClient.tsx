"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { accessRequiresSelection, fetchAccessState } from "@/lib/access";
import { createSupabaseBrowser } from "@/lib/supabase/client";
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
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const sectionIds = useMemo(() => sections.map((section) => section.id), [sections]);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setIsAuthed(Boolean(session));
      }
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

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
    setMobileMenuOpen(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    router.push("/login");
    router.refresh();
  }

  async function goToWorkspace() {
    if (dashboardLoading) return;

    setDashboardLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setDashboardLoading(false);
      setMobileMenuOpen(false);
      router.push("/login?returnTo=%2Fdashboard");
      return;
    }

    try {
      const accessState = await fetchAccessState(session.access_token);
      setMobileMenuOpen(false);
      router.push(accessRequiresSelection(accessState) ? "/subscribe" : "/dashboard");
      router.refresh();
    } catch {
      setMobileMenuOpen(false);
      router.push("/dashboard");
      router.refresh();
    } finally {
      setDashboardLoading(false);
    }
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
            <Link href="/#workflow">Solutions</Link>
            <Link href="/#features">Features</Link>
            <Link href="/#pricing">Pricing</Link>
          </nav>

          <div className={styles.headerActions}>
            {isAuthed ? (
              <>
                <button type="button" className={`${styles.authAction} ${styles.authActionPrimary}`} onClick={() => void goToWorkspace()} disabled={dashboardLoading}>
                  <Image src="/icons/account.svg" alt="" aria-hidden="true" width={16} height={16} className={styles.authIcon} />
                  {dashboardLoading ? "Checking access..." : "Go to dashboard"}
                </button>
                <button type="button" className={`${styles.authAction} ${styles.authActionSecondary}`} onClick={() => void handleLogout()} disabled={dashboardLoading}>
                  <Image src="/icons/logout.svg" alt="" aria-hidden="true" width={16} height={16} className={styles.authIcon} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={styles.secondaryButton}>
                  Sign in
                </Link>
                <Link href="/subscribe" className={styles.primaryButton}>
                  Start free trial
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className={styles.menuButton}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
          >
            <span
              aria-hidden="true"
              className={styles.menuButtonIcon}
              style={{
                WebkitMaskImage: "url('/icons/menu.svg')",
                maskImage: "url('/icons/menu.svg')",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
              }}
            />
          </button>
        </div>

        <div className={styles.headerCurve}>
          <div className={styles.headerCurveInner}>
            <h1>{pageTitle}</h1>
            <p className={styles.effectiveDate}>Effective {effectiveDate}</p>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className={styles.mobileMenu} role="dialog" aria-modal="true" aria-label="Mobile menu">
          <div className={styles.mobileMenuHeader}>
            <Link href="/" className={styles.brand} aria-label="Investigation Tool home" onClick={() => setMobileMenuOpen(false)}>
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

            <button
              type="button"
              className={styles.mobileMenuClose}
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span
                aria-hidden="true"
                className={styles.mobileMenuCloseIcon}
                style={{
                  WebkitMaskImage: "url('/icons/close.svg')",
                  maskImage: "url('/icons/close.svg')",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                }}
              />
            </button>
          </div>

          <nav className={styles.mobileMenuNav} aria-label="Mobile primary">
            <Link href="/#workflow" onClick={() => setMobileMenuOpen(false)}>
              Solutions
            </Link>
            <Link href="/#features" onClick={() => setMobileMenuOpen(false)}>
              Features
            </Link>
            <Link href="/#pricing" onClick={() => setMobileMenuOpen(false)}>
              Pricing
            </Link>
            <Link href="/privacy" onClick={() => setMobileMenuOpen(false)}>
              Privacy Policy
            </Link>
            <Link href="/terms" onClick={() => setMobileMenuOpen(false)}>
              Terms & Conditions
            </Link>
          </nav>

          <div className={styles.mobileMenuActions}>
            {isAuthed ? (
              <>
                <button type="button" className={`${styles.authAction} ${styles.authActionPrimary}`} onClick={() => void goToWorkspace()} disabled={dashboardLoading}>
                  <Image src="/icons/account.svg" alt="" aria-hidden="true" width={16} height={16} className={styles.authIcon} />
                  {dashboardLoading ? "Checking access..." : "Go to dashboard"}
                </button>
                <button type="button" className={`${styles.authAction} ${styles.authActionSecondary}`} onClick={() => void handleLogout()} disabled={dashboardLoading}>
                  <Image src="/icons/logout.svg" alt="" aria-hidden="true" width={16} height={16} className={styles.authIcon} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/subscribe" className={styles.primaryButton} onClick={() => setMobileMenuOpen(false)}>
                  Start free trial
                </Link>
                <Link href="/login" className={styles.secondaryButton} onClick={() => setMobileMenuOpen(false)}>
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}

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

