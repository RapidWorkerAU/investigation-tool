"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { accessRequiresSelection, fetchAccessState } from "@/lib/access";

export default function HomePage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [isAuthed, setIsAuthed] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link href="/" className="landing-brand" aria-label="Investigation Tool home">
            <Image
              src="/images/investigation-tool.png"
              alt=""
              aria-hidden="true"
              width={36}
              height={36}
              className="landing-brand-image"
            />
            <span>Investigation Tool</span>
          </Link>

          <nav className="landing-nav" aria-label="Primary">
            <a href="#workflow">Solutions</a>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
          </nav>

          <div className="landing-header-actions">
            {isAuthed ? (
              <>
                <button
                  type="button"
                  className="landing-ghost-button landing-auth-action landing-auth-action--primary"
                  onClick={() => void goToWorkspace()}
                  disabled={dashboardLoading}
                >
                  <Image src="/icons/account.svg" alt="" aria-hidden="true" width={16} height={16} className="landing-auth-icon" />
                  {dashboardLoading ? "Checking access..." : "Go to dashboard"}
                </button>
                <button
                  type="button"
                  className="landing-text-link landing-text-button landing-auth-action landing-auth-action--secondary"
                  onClick={() => void handleLogout()}
                  disabled={dashboardLoading}
                >
                  <Image src="/icons/logout.svg" alt="" aria-hidden="true" width={16} height={16} className="landing-auth-icon" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="landing-text-link">
                  Sign in
                </Link>
                <Link href="/subscribe" className="landing-ghost-button">
                  Start free trial
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="landing-menu-button"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
          >
            <span
              aria-hidden="true"
              className="landing-menu-button-icon"
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
      </header>

      {mobileMenuOpen ? (
        <div className="landing-mobile-menu" role="dialog" aria-modal="true" aria-label="Mobile menu">
          <div className="landing-mobile-menu-header">
            <Link
              href="/"
              className="landing-brand"
              aria-label="Investigation Tool home"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Image
                src="/images/investigation-tool.png"
                alt=""
                aria-hidden="true"
                width={36}
                height={36}
                className="landing-brand-image"
              />
              <span>Investigation Tool</span>
            </Link>

            <button
              type="button"
              className="landing-mobile-menu-close"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span
                aria-hidden="true"
                className="landing-mobile-menu-close-icon"
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

          <nav className="landing-mobile-menu-nav" aria-label="Mobile primary">
            <a href="#workflow" onClick={() => setMobileMenuOpen(false)}>
              Solutions
            </a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>
              Features
            </a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>
              Pricing
            </a>
          </nav>

          <div className="landing-mobile-menu-actions">
            {isAuthed ? (
              <>
                <button
                  type="button"
                  className="landing-ghost-button landing-auth-action landing-auth-action--primary"
                  onClick={() => void goToWorkspace()}
                  disabled={dashboardLoading}
                >
                  <Image src="/icons/account.svg" alt="" aria-hidden="true" width={16} height={16} className="landing-auth-icon" />
                  {dashboardLoading ? "Checking access..." : "Go to dashboard"}
                </button>
                <button
                  type="button"
                  className="landing-text-link landing-text-button landing-auth-action landing-auth-action--secondary"
                  onClick={() => void handleLogout()}
                  disabled={dashboardLoading}
                >
                  <Image src="/icons/logout.svg" alt="" aria-hidden="true" width={16} height={16} className="landing-auth-icon" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/subscribe" className="landing-primary-button" onClick={() => setMobileMenuOpen(false)}>
                  Start free trial
                </Link>
                <Link href="/login" className="landing-secondary-button" onClick={() => setMobileMenuOpen(false)}>
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}

      <main className="landing-main">
        <section className="landing-section landing-hero-shell" aria-labelledby="landing-hero-title">
          <div className="landing-hero">
            <div className="landing-hero-pattern" aria-hidden="true" />
            <div className="landing-hero-inner">
              <div className="landing-note landing-note--left" aria-hidden="true">
                <strong>Investigation map</strong>
                <p>Capture evidence, sequence, factors, and recommendations in one visual workflow.</p>
              </div>

              <div className="landing-panel landing-panel--left" aria-hidden="true">
                <div className="landing-panel-badge">Workflow</div>
                <div className="landing-panel-lines">
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className="landing-reminder" aria-hidden="true">
                <strong>Collaboration</strong>
                <p>Assign owners, track actions, and keep the investigation moving.</p>
              </div>

              <div className="landing-panel landing-panel--right" aria-hidden="true">
                <div className="landing-panel-badge">Investigation software</div>
                <div className="landing-tool-chips">
                  <span>Mind map</span>
                  <span>Brainstorm</span>
                  <span>Data management</span>
                </div>
              </div>

              <div className="landing-hero-content">
                <p className="landing-kicker">Incident investigation software for modern teams</p>
                <h1 id="landing-hero-title">
                  Think through incidents,
                  <span> map the workflow, and act with clarity</span>
                </h1>
                <p className="landing-hero-copy">
                  Investigation Tool is a collaborative investigation platform for incident investigation workflow, investigation maps,
                  structured brainstorming, evidence management, action tracking, and curiosity-led analysis across your team.
                </p>

                <div className="landing-hero-actions">
                  {isAuthed ? (
                    <>
                      <button
                        type="button"
                        className="landing-primary-button landing-auth-action landing-auth-action--primary"
                        onClick={() => void goToWorkspace()}
                        disabled={dashboardLoading}
                      >
                        <Image src="/icons/account.svg" alt="" aria-hidden="true" width={16} height={16} className="landing-auth-icon" />
                        {dashboardLoading ? "Checking access..." : "Go to dashboard"}
                      </button>
                      <button
                        type="button"
                        className="landing-secondary-button landing-secondary-action landing-auth-action landing-auth-action--secondary"
                        onClick={() => void handleLogout()}
                        disabled={dashboardLoading}
                      >
                        <Image src="/icons/logout.svg" alt="" aria-hidden="true" width={16} height={16} className="landing-auth-icon" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/subscribe" className="landing-primary-button">
                        Start free trial
                      </Link>
                      <Link href="/login" className="landing-secondary-button">
                        Sign in to your workspace
                      </Link>
                    </>
                  )}
                </div>

                <p className="landing-hero-meta">
                  Built for investigation software use cases including incident mapping, mind mapping, data management, and team
                  collaboration.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="landing-section landing-section-shell" aria-labelledby="landing-solutions-title">
          <div className="landing-section-card landing-solutions-card">
            <div className="landing-section-intro">
              <span className="landing-section-pill">Solutions</span>
              <h2 id="landing-solutions-title">Solve the investigation workflow bottlenecks slowing your team down</h2>
              <p>
                Replace scattered notes, disconnected files, and unclear ownership with incident investigation software that keeps the
                sequence, evidence, factors, actions, and recommendations in one investigation map.
              </p>
            </div>

            <div className="landing-solution-points">
              <article className="landing-solution-point">
                <span className="landing-solution-icon" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <h3>Keep every incident record connected</h3>
                <p>Bring investigation maps, brainstorm notes, evidence, actions, and decisions into one shared workflow.</p>
              </article>

              <article className="landing-solution-point">
                <span className="landing-solution-icon" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <h3>Prioritise what matters first</h3>
                <p>Move from curiosity to clear findings faster with structured sequence reviews, factor analysis, and recommendation tracking.</p>
              </article>

              <article className="landing-solution-point">
                <span className="landing-solution-icon" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <h3>Make collaboration visible</h3>
                <p>Give investigators, leaders, and contributors one current source of truth without constant status meetings.</p>
              </article>
            </div>

            <div className="landing-solutions-showcase">
              <div className="landing-showcase-badge landing-showcase-badge--left" aria-hidden="true">
                Placeholder image
              </div>

              <div className="landing-showcase-board">
                <div className="landing-showcase-screen">
                  <div className="landing-showcase-sidebar">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className="landing-showcase-main">
                    <div className="landing-showcase-header">
                      <div className="landing-showcase-heading">
                        <strong>Example workflow visual</strong>
                        <span>Replace with product image or annotated screenshot</span>
                      </div>
                      <div className="landing-showcase-chips">
                        <span>Incident map</span>
                        <span>Evidence</span>
                        <span>Actions</span>
                      </div>
                    </div>

                    <div className="landing-showcase-grid">
                      <div className="landing-showcase-card">
                        <strong>Sequence</strong>
                        <span>Placeholder panel</span>
                      </div>
                      <div className="landing-showcase-card">
                        <strong>Factors</strong>
                        <span>Placeholder panel</span>
                      </div>
                      <div className="landing-showcase-card landing-showcase-card--tall">
                        <strong>Evidence register</strong>
                        <span>Placeholder panel</span>
                      </div>
                      <div className="landing-showcase-card landing-showcase-card--wide">
                        <strong>Recommendation workflow</strong>
                        <span>Placeholder image / UI capture</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="landing-showcase-badge landing-showcase-badge--right" aria-hidden="true">
                Placeholder image
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="landing-section landing-section-shell" aria-labelledby="landing-features-title">
          <div className="landing-section-card landing-features-card">
            <div className="landing-section-intro">
              <span className="landing-section-pill">Features</span>
              <h2 id="landing-features-title">Keep investigation software, data management, and collaboration in one place</h2>
              <p>
                Built for incident investigation teams that need flexible investigation maps, structured brainstorming, evidence handling,
                and action management without juggling multiple disconnected tools.
              </p>
            </div>

            <div className="landing-feature-grid">
              <article className="landing-feature-card">
                <div className="landing-feature-media">Placeholder image: collaboration workspace</div>
                <h3>Seamless collaboration</h3>
                <p>Share investigation updates, assign owners, and keep the whole workflow visible in real time.</p>
              </article>

              <article className="landing-feature-card">
                <div className="landing-feature-media">Placeholder image: schedule / planning tools</div>
                <h3>Workflow and time visibility</h3>
                <p>Coordinate investigation tasks, review cadence, and response deadlines without losing momentum.</p>
              </article>

              <article className="landing-feature-card landing-feature-card--wide">
                <div className="landing-feature-media">Placeholder image: map + task board composite</div>
                <h3>Advanced investigation tracking</h3>
                <p>
                  Move from early curiosity and brainstorming into a defensible incident investigation workflow with linked evidence,
                  factor analysis, and recommendation tracking.
                </p>
              </article>

              <article className="landing-feature-card landing-feature-card--narrow">
                <div className="landing-feature-media landing-feature-media--dashed">Placeholder image: customizable widgets</div>
                <h3>Customisable workspaces</h3>
                <p>Shape your incident investigation software around your method, templates, and reporting needs.</p>
              </article>
            </div>

            <p className="landing-feature-footnote">
              Plus investigation reporting, evidence review, recommendation follow-up, and more.
            </p>
          </div>
        </section>

        <section id="pricing" className="landing-section landing-section-shell" aria-labelledby="landing-pricing-title">
          <div className="landing-section-card landing-pricing-card">
            <div className="landing-section-intro">
              <span className="landing-section-pill">Pricing</span>
              <h2 id="landing-pricing-title">Simple pricing for investigation teams that need clarity fast</h2>
              <p>
                Choose the investigation software plan that fits your workflow, from solo incident reviews to multi-user collaboration,
                evidence management, investigation mapping, and recommendation tracking.
              </p>
            </div>

            <div className="landing-pricing-grid">
              <article className="landing-price-card">
                <header className="landing-price-head">
                  <h3>Starter</h3>
                  <p>Best for single investigators and small internal reviews.</p>
                </header>
                <div className="landing-price-value">
                  <strong>$29</strong>
                  <span>/month</span>
                </div>
                <Link href="/subscribe" className="landing-primary-button landing-price-button">
                  Start free trial
                </Link>
                <ul className="landing-price-list">
                  <li>Incident investigation maps</li>
                  <li>Evidence and sequence capture</li>
                  <li>Mind map and brainstorm workflow</li>
                  <li>Single workspace</li>
                  <li>Email support</li>
                </ul>
              </article>

              <article className="landing-price-card landing-price-card--featured">
                <div className="landing-price-badge" aria-hidden="true">
                  *
                </div>
                <header className="landing-price-head">
                  <h3>Team</h3>
                  <p>Best for investigation teams coordinating workflow, data, and actions together.</p>
                </header>
                <div className="landing-price-value">
                  <strong>$79</strong>
                  <span>/month</span>
                </div>
                <p className="landing-price-note">Most popular</p>
                <Link href="/subscribe" className="landing-secondary-button landing-price-button landing-price-button--featured">
                  Start free trial
                </Link>
                <ul className="landing-price-list">
                  <li>Everything in Starter</li>
                  <li>Multi-user collaboration</li>
                  <li>Recommendation and action tracking</li>
                  <li>Structured report tabs</li>
                  <li>Priority support</li>
                </ul>
              </article>

              <article className="landing-price-card">
                <header className="landing-price-head">
                  <h3>Enterprise</h3>
                  <p>For large operations, governance requirements, and organisation-wide adoption.</p>
                </header>
                <div className="landing-price-value">
                  <strong>Custom</strong>
                  <span>pricing</span>
                </div>
                <Link href="/subscribe" className="landing-primary-button landing-price-button">
                  Book a demo
                </Link>
                <ul className="landing-price-list">
                  <li>Advanced workspace rollout</li>
                  <li>Implementation support</li>
                  <li>Custom templates and onboarding</li>
                  <li>Enterprise collaboration workflows</li>
                  <li>Dedicated success support</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section-shell" aria-labelledby="landing-footer-title">
          <div className="landing-footer-card">
            <div className="landing-footer-pattern" aria-hidden="true" />
            <div className="landing-footer-top">
              <div className="landing-footer-brand">
                <Link href="/" className="landing-brand" aria-label="Investigation Tool home">
                  <Image
                    src="/images/investigation-tool.png"
                    alt=""
                    aria-hidden="true"
                    width={36}
                    height={36}
                    className="landing-brand-image"
                  />
                  <span>Investigation Tool</span>
                </Link>

                <div className="landing-footer-copy">
                  <h2 id="landing-footer-title">Turn investigation workflow into clear action</h2>
                  <p>
                    Investigation software for teams that need incident maps, evidence management, collaboration, and reporting in one
                    place.
                  </p>
                </div>
              </div>

              <div className="landing-footer-links">
                <div>
                  <strong>Platform</strong>
                  <Link href="#features">Features</Link>
                  <Link href="#workflow">Workflow</Link>
                  <Link href="#pricing">Pricing</Link>
                </div>
                <div>
                  <strong>Use cases</strong>
                  <a href="#hero">Incident investigation tool</a>
                  <a href="#features">Investigation map</a>
                  <a href="#workflow">Collaboration</a>
                </div>
                <div>
                  <strong>Company</strong>
                  <Link href="/login">Sign in</Link>
                  <Link href="/terms">Terms</Link>
                  <Link href="/privacy">Privacy</Link>
                </div>
              </div>
            </div>

            <div className="landing-footer-icons" aria-hidden="true">
              <span>Placeholder icon</span>
              <span>Placeholder icon</span>
              <span>Placeholder icon</span>
              <span>Placeholder icon</span>
              <span>Placeholder icon</span>
              <span>Placeholder icon</span>
            </div>

            <div className="landing-footer-bottom">
              <span>* 2026 Investigation Tool. All rights reserved.</span>
              <div>
                <Link href="/privacy">Privacy Policy</Link>
                <Link href="/terms">Terms of Service</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
