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
              <div className="landing-note landing-note--left landing-float-image" aria-hidden="true">
                <img src="/images/sticky1.png?v=20260318a" alt="" className="landing-float-image__asset" />
              </div>

              <div className="landing-panel landing-panel--left landing-float-image" aria-hidden="true">
                <img src="/images/investigationnotes.png?v=20260318a" alt="" className="landing-float-image__asset" />
              </div>

              <div className="landing-reminder landing-float-image" aria-hidden="true">
                <img src="/images/sticky2.png?v=20260318a" alt="" className="landing-float-image__asset" />
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
              <div className="landing-showcase-badge landing-showcase-badge--left-primary" aria-hidden="true">
                <Image
                  src="/images/tasknode.png"
                  alt=""
                  fill
                  sizes="(max-width: 1280px) 120px, 168px"
                  className="landing-showcase-badge-image"
                />
              </div>

              <div className="landing-showcase-badge landing-showcase-badge--left-secondary" aria-hidden="true">
                <Image
                  src="/images/personnode.png"
                  alt=""
                  fill
                  sizes="(max-width: 1280px) 120px, 168px"
                  className="landing-showcase-badge-image"
                />
              </div>

              <div className="landing-showcase-board">
                <div className="landing-showcase-screen landing-showcase-screen--media">
                  <Image
                    src="/images/canvasexample.png"
                    alt="Example workflow visual"
                    fill
                    sizes="(max-width: 1080px) 100vw, 1460px"
                    quality={100}
                    unoptimized
                    className="landing-showcase-screen-image"
                  />
                </div>
              </div>

              <div className="landing-showcase-badge landing-showcase-badge--right-primary" aria-hidden="true">
                <Image
                  src="/images/evidencenode.png"
                  alt=""
                  fill
                  sizes="(max-width: 1280px) 120px, 168px"
                  className="landing-showcase-badge-image"
                />
              </div>

              <div className="landing-showcase-badge landing-showcase-badge--right-secondary" aria-hidden="true">
                <Image
                  src="/images/factornode.png"
                  alt=""
                  fill
                  sizes="(max-width: 1280px) 120px, 168px"
                  className="landing-showcase-badge-image"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="landing-section landing-section-shell" aria-labelledby="landing-features-title">
          <div className="landing-section-card landing-features-card">
            <div className="landing-section-intro">
              <span className="landing-section-pill">Features</span>
              <h2 id="landing-features-title">Run the investigation, the reporting, and the team handoff from one system</h2>
              <p>
                Built for teams that need to coordinate live investigations, capture defensible detail, and communicate progress without
                rebuilding the story across separate tools.
              </p>
            </div>

            <div className="landing-feature-grid">
              <article className="landing-feature-card">
                <div className="landing-feature-media landing-feature-media--image">
                  <Image
                    src="/images/dashboardexample.png"
                    alt="Dashboard showing investigations and access controls"
                    fill
                    sizes="(max-width: 1080px) 100vw, 700px"
                    quality={100}
                    unoptimized
                    className="landing-feature-media-image"
                  />
                </div>
                <div className="landing-feature-copy">
                  <h3>Keep every investigation visible and under control</h3>
                  <p>
                    See active investigations in one workspace, share maps across account holders, and manage read or edit access without
                    losing oversight of who is contributing.
                  </p>
                </div>
              </article>

              <article className="landing-feature-card">
                <div className="landing-feature-media landing-feature-media--image">
                  <Image
                    src="/images/buildwizard.png"
                    alt="Guided wizard for building an investigation map"
                    fill
                    sizes="(max-width: 1080px) 100vw, 700px"
                    quality={100}
                    unoptimized
                    className="landing-feature-media-image"
                  />
                </div>
                <div className="landing-feature-copy">
                  <h3>Guide new users from blank page to useful map fast</h3>
                  <p>
                    Use the built-in wizard to step through the incident in a logical sequence, helping beginners build confidence and
                    giving experienced teams a faster way to get the first version of the map in front of the room.
                  </p>
                </div>
              </article>

              <article className="landing-feature-card">
                <div className="landing-feature-media landing-feature-media--image">
                  <Image
                    src="/images/investigationreport.png"
                    alt="Structured investigation report generated from the map"
                    fill
                    sizes="(max-width: 1080px) 100vw, 900px"
                    quality={100}
                    unoptimized
                    className="landing-feature-media-image"
                  />
                </div>
                <div className="landing-feature-copy">
                  <h3>Turn visual investigation work into a report people can act on</h3>
                  <p>
                    Convert map content into an organised report grouped by key investigation topics, making it easier to brief leaders,
                    align stakeholders, and communicate findings without manually rebuilding the narrative.
                  </p>
                </div>
              </article>

              <article className="landing-feature-card">
                <div className="landing-feature-media landing-feature-media--image">
                  <Image
                    src="/images/printreport.png"
                    alt="Printable PDF report export for an investigation map"
                    fill
                    sizes="(max-width: 1080px) 100vw, 520px"
                    quality={100}
                    unoptimized
                    className="landing-feature-media-image"
                  />
                </div>
                <div className="landing-feature-copy">
                  <h3>Share the current picture quickly in PDF form</h3>
                  <p>
                    Print the full investigation map or selected sections to PDF so teams can circulate the latest known position quickly
                    for reviews, briefings, and time-critical stakeholder updates.
                  </p>
                </div>
              </article>
            </div>

            <p className="landing-feature-footnote">
              Designed to help teams move from capture, to analysis, to communication without losing momentum.
            </p>
          </div>
        </section>

        <section id="pricing" className="landing-section landing-section-shell" aria-labelledby="landing-pricing-title">
          <div className="landing-section-card landing-pricing-card">
            <div className="landing-section-intro">
              <span className="landing-section-pill">Pricing</span>
              <h2 id="landing-pricing-title">Choose the access model that fits the pace and scale of your investigations</h2>
              <p>
                Start with a focused single-incident access window, move to ongoing monthly coverage when investigation work is continuous,
                or speak with us about a tailored enterprise setup.
              </p>
            </div>

            <div className="landing-pricing-grid">
              <article className="landing-price-card">
                <header className="landing-price-head">
                  <h3>7 Day Trial</h3>
                  <p>Best for testing the workflow on one live map before choosing a paid access option.</p>
                </header>
                <div className="landing-price-value">
                  <strong>Free</strong>
                  <span>7 day access</span>
                </div>
                <p className="landing-price-note">Best for first-time evaluation</p>
                <div className="landing-price-actions">
                  <Link href="/subscribe" className="landing-primary-button landing-price-button">
                    Start 7 day trial
                  </Link>
                </div>
                <p className="landing-price-trial-hint">Trial access stays separate from paid access.</p>
                <ul className="landing-price-list">
                  <li>One writable investigation map</li>
                  <li>Full editing during trial period</li>
                  <li>No export during trial access</li>
                  <li>Use the full mapping workflow</li>
                  <li>Move to paid access when ready</li>
                </ul>
              </article>

              <article className="landing-price-card landing-price-card--featured">
                <div className="landing-price-badge" aria-hidden="true">
                  *
                </div>
                <header className="landing-price-head">
                  <h3>30 Day Access</h3>
                  <p>Best for one live investigation that needs full working access for a defined incident window.</p>
                </header>
                <div className="landing-price-value">
                  <strong>$49</strong>
                  <span>AUD once-off</span>
                </div>
                <p className="landing-price-note">Best for one focused incident</p>
                <div className="landing-price-actions">
                  <Link href="/subscribe" className="landing-secondary-button landing-price-button landing-price-button--featured">
                    Buy 30 day access
                  </Link>
                  <Link href="/subscribe" className="landing-price-link">
                    Or start with the 7 day trial
                  </Link>
                </div>
                <ul className="landing-price-list">
                  <li>One investigation map allocation</li>
                  <li>Full editing for 30 days</li>
                  <li>Share, duplicate, and export</li>
                  <li>PDF reporting and map printing</li>
                  <li>Built for one live investigation</li>
                </ul>
              </article>

              <article className="landing-price-card">
                <header className="landing-price-head">
                  <h3>Monthly Access</h3>
                  <p>Best for teams that need ongoing access without map limits slowing work down.</p>
                </header>
                <div className="landing-price-value">
                  <strong>$99</strong>
                  <span>AUD / month</span>
                </div>
                <p className="landing-price-note">Best for ongoing investigation work</p>
                <div className="landing-price-actions">
                  <Link href="/subscribe" className="landing-primary-button landing-price-button">
                    Start monthly access
                  </Link>
                  <a href="mailto:support@investigationtool.com.au" className="landing-price-link">
                    Need enterprise? Contact us
                  </a>
                </div>
                <ul className="landing-price-list">
                  <li>Unlimited investigation maps</li>
                  <li>Full export, sharing, duplication</li>
                  <li>Ongoing access while active</li>
                  <li>Made for active investigation teams</li>
                  <li>Enterprise options available</li>
                </ul>
              </article>
            </div>
            <p className="landing-price-trial-hint">
              Enterprise options can include custom branding, multi-account setups, and tailored configuration support.
            </p>
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
                  <strong>Company</strong>
                  <Link href="/login">Sign in</Link>
                  <Link href="/terms">Terms</Link>
                  <Link href="/privacy">Privacy</Link>
                </div>
              </div>
            </div>

            <div className="landing-footer-icons" aria-hidden="true">
              <span className="landing-footer-icon-tile landing-footer-icon-tile--amber">
                <span className="landing-footer-node landing-footer-node--sticky" />
              </span>
              <span className="landing-footer-icon-tile landing-footer-icon-tile--sky">
                <span className="landing-footer-node landing-footer-node--text-box">
                  <img src="/icons/texticon.svg" alt="" className="landing-footer-node-text-icon" />
                </span>
              </span>
              <span className="landing-footer-icon-tile landing-footer-icon-tile--mint">
                <span className="landing-footer-node landing-footer-node--mini-doc landing-footer-node--factor">
                  <span className="landing-footer-mini-doc__header" />
                  <span className="landing-footer-mini-doc__body">
                    <span className="landing-footer-mini-doc__line landing-footer-mini-doc__line--strong" />
                    <span className="landing-footer-mini-doc__line" />
                  </span>
                </span>
              </span>
              <span className="landing-footer-icon-tile landing-footer-icon-tile--rose">
                <span className="landing-footer-node landing-footer-node--person">
                  <img src="/icons/account.svg" alt="" className="landing-footer-node-avatar" />
                </span>
              </span>
              <span className="landing-footer-icon-tile landing-footer-icon-tile--violet">
                <span className="landing-footer-node landing-footer-node--table">
                  <span className="landing-footer-table__head" />
                  <span className="landing-footer-table__grid">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </span>
                </span>
              </span>
              <span className="landing-footer-icon-tile landing-footer-icon-tile--teal">
                <span className="landing-footer-node landing-footer-node--mini-doc landing-footer-node--evidence">
                  <span className="landing-footer-mini-doc__header" />
                  <span className="landing-footer-mini-doc__body">
                    <span className="landing-footer-mini-doc__line landing-footer-mini-doc__line--strong" />
                    <span className="landing-footer-mini-doc__line" />
                  </span>
                </span>
              </span>
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
