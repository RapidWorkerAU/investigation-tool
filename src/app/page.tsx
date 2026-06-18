"use client";

import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { accessRequiresSelection, fetchAccessState } from "@/lib/access";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import styles from "./LandingPage.module.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const stats = [
  ["Free", "Full access during the launch period"],
  ["Shared", "One workspace for the whole investigation team"],
  ["Structured", "Reports generated directly from the investigation canvas"],
];

const workflowSteps = [
  {
    label: "Step 01",
    title: "Create the map",
    text: "Give the investigation a clear working title and short description so your team can identify the purpose straight away.",
  },
  {
    label: "Step 02",
    title: "Build the sequence",
    text: "Add sequence steps so the timeline is visible and everyone can understand what happened first.",
  },
  {
    label: "Step 03",
    title: "Develop the detail",
    text: "Build out the investigation with factor nodes, outcome nodes, finding nodes and recommendation nodes.",
  },
  {
    label: "Step 04",
    title: "Prepare the report",
    text: "Use the mapped investigation to create a structured record for review, briefings and final communication.",
  },
];

const pathNodes = [
  styles.pathNodeOne,
  styles.pathNodeTwo,
  styles.pathNodeThree,
  styles.pathNodeFour,
];

const featureTabs = [
  {
    title: "Investigation canvas",
    text: "Map the sequence, people, evidence, contributing factors and recommendations in one shared visual workspace.",
    action: "Explore canvas",
    placeholder: "Canvas image placeholder",
    image: "/images/website/canvas-example.png?v=20260608b",
    imageAlt: "Investigation canvas example",
  },
  {
    title: "Guided build wizard",
    text: "Walk through the first investigation setup with prompts that help teams create a useful map quickly.",
    action: "Explore wizard",
    placeholder: "Wizard image placeholder",
    image: "/images/website/wizard-example.png?v=20260608b",
    imageAlt: "Guided build wizard example",
  },
  {
    title: "Team workspace",
    text: "Keep active health and safety investigations visible with status, ownership and next actions.",
    action: "Explore workspace",
    placeholder: "Workspace image placeholder",
    image: "/images/website/org-layout.png?v=20260608b",
    imageAlt: "Organisation workspace layout example",
  },
  {
    title: "Structured reporting",
    text: "Turn map content into organised report sections for briefings, reviews and final records.",
    action: "Explore reports",
    placeholder: "Report image placeholder",
    image: "/images/website/stuctured-report.png?v=20260608b",
    imageAlt: "Structured report example",
  },
  {
    title: "PDF export",
    text: "Prepare selected investigation content for review packs, stakeholder updates and formal records.",
    action: "Explore export",
    placeholder: "Export image placeholder",
    image: "/images/website/pdf-report.png?v=20260608b",
    imageAlt: "PDF report example",
  },
];

const plans = [
  {
    name: "Free launch access",
    price: "Free",
    priceSub: "",
    desc: "Create an account and use the full investigation workspace during the launch period.",
    features: [
      ["Create and edit investigations", true],
      ["Full canvas editing", true],
      ["PDF export and reporting", true],
      ["Sharing, duplication and templates", true],
    ],
    cta: "Create free account",
    href: "/login?mode=signup&returnTo=%2Fdashboard",
    featured: true,
  },
];

const footerIcons = [
  ["Sticky note", styles.footerIconSticky],
  ["Text box", styles.footerIconText],
  ["Document", styles.footerIconDocument],
  ["Person", styles.footerIconPerson],
  ["Table", styles.footerIconTable],
  ["Record", styles.footerIconRecord],
];

function LogoMark({ framed = false }: { framed?: boolean }) {
  return (
    <span className={framed ? styles.footerLogoMark : styles.logoFrame}>
      <Image
        src="/images/investigation-tool.png"
        alt=""
        aria-hidden="true"
        width={framed ? 84 : 28}
        height={framed ? 84 : 28}
        className={framed ? styles.footerLogoImage : styles.logoImage}
      />
    </span>
  );
}

function FooterGlyph({ index }: { index: number }) {
  if (index === 0) {
    return <span className={`${styles.tileGlyph} ${styles.tileSticky}`} aria-hidden="true" />;
  }

  if (index === 1) {
    return (
      <span className={`${styles.tileGlyph} ${styles.tileText}`} aria-hidden="true">
        <i />
        <b />
        <b />
        <b />
      </span>
    );
  }

  if (index === 2) {
    return (
      <span className={`${styles.tileGlyph} ${styles.tileDocument}`} aria-hidden="true">
        <i />
        <b />
        <b />
      </span>
    );
  }

  if (index === 3) {
    return (
      <span className={`${styles.tileGlyph} ${styles.tilePerson}`} aria-hidden="true">
        <i />
      </span>
    );
  }

  if (index === 4) {
    return (
      <span className={`${styles.tileGlyph} ${styles.tileTable}`} aria-hidden="true">
        {Array.from({ length: 9 }).map((_, cellIndex) => (
          <b key={cellIndex} />
        ))}
      </span>
    );
  }

  return (
    <span className={`${styles.tileGlyph} ${styles.tileRecord}`} aria-hidden="true">
      <b />
      <b />
    </span>
  );
}

function WorkflowGraphic({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className={styles.createInvestigationGraphic}>
        <Image
          src="/images/website/get-started-node.png?v=20260608a"
          alt=""
          width={360}
          height={244}
          unoptimized
        />
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className={styles.sequenceNodeGraphic}>
        <Image
          src="/images/website/sequence_node.png?v=20260608a"
          alt=""
          width={220}
          height={132}
          unoptimized
        />
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className={styles.nodeClusterGraphic}>
        <Image src="/images/website/factor_node.png?v=20260608a" alt="" width={220} height={132} unoptimized />
      </div>
    );
  }

  return (
    <div className={styles.reportNodeGraphic}>
      <Image
        src="/images/website/report-node.png?v=20260608a"
        alt=""
        width={360}
        height={244}
        unoptimized
      />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [isAuthed, setIsAuthed] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const activeFeature = featureTabs[activeFeatureIndex];

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setIsAuthed(Boolean(session?.access_token));
      }
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session?.access_token));
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
      setIsAuthed(false);
      setMobileMenuOpen(false);
      router.push("/login?returnTo=%2Fdashboard");
      router.refresh();
    } finally {
      setDashboardLoading(false);
    }
  }

  const authActions = isAuthed ? (
    <>
      <button type="button" className={styles.btnWorkspace} onClick={() => void goToWorkspace()} disabled={dashboardLoading}>
        {dashboardLoading ? "Checking access" : "Go to workspace"}
      </button>
      <button type="button" className={styles.btnLogout} onClick={() => void handleLogout()} disabled={dashboardLoading}>
        Logout
      </button>
    </>
  ) : (
    <>
      <Link href="/login" className={styles.btnGhost}>Sign in</Link>
      <Link href="/login?mode=signup&returnTo=%2Fdashboard" className={styles.btnPrimary}>Create free account</Link>
    </>
  );

  return (
    <div className={`${styles.page} ${inter.variable}`}>
      <nav className={styles.navShell}>
        <Link href="/" className={styles.navBrand} aria-label="Investigation Tool home">
          <LogoMark />
          <span>Investigation Tool</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/features">Features</Link>
          <Link href="/use-cases">Use cases</Link>
        </div>
        <div className={styles.navActions}>{authActions}</div>
        <button type="button" className={styles.menuButton} aria-label="Open menu" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(true)}>
          <span />
          <span />
          <span />
        </button>
      </nav>

      {mobileMenuOpen ? (
        <div className={styles.mobileMenu} role="dialog" aria-modal="true" aria-label="Mobile menu">
          <div className={styles.mobileMenuHeader}>
            <Link href="/" className={styles.navBrand} aria-label="Investigation Tool home" onClick={() => setMobileMenuOpen(false)}>
              <LogoMark />
              <span>Investigation Tool</span>
            </Link>
            <button type="button" className={styles.closeButton} aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}>x</button>
          </div>
          <div className={styles.mobileLinks}>
            <Link href="/features" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <Link href="/use-cases" onClick={() => setMobileMenuOpen(false)}>Use cases</Link>
          </div>
          <div className={styles.mobileActions}>{authActions}</div>
        </div>
      ) : null}

      <main>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>Incident investigation software for safety and operations teams</p>
            <h1>
              One place to run your <span>workplace incident investigation.</span>
            </h1>
            <p className={styles.heroIntro}>
              Map the sequence of events, work through contributing factors and produce a structured report your team can stand behind. The whole investigation stays in one shared workspace from the first notification to the final record.
            </p>
            <div className={styles.heroCtas}>
              {isAuthed ? (
                <button type="button" className={styles.ctaPrimary} onClick={() => void goToWorkspace()} disabled={dashboardLoading}>
                  {dashboardLoading ? "Checking access" : "Go to workspace"}
                </button>
              ) : (
                <Link href="/login?mode=signup&returnTo=%2Fdashboard" className={styles.ctaPrimary}>Start your first investigation</Link>
              )}
              <a href="#how-it-works" className={styles.ctaSecondary}>See how it works</a>
            </div>

            <div className={styles.browserFrame} aria-label="Investigation canvas preview">
              <div className={styles.browserChrome}>
                <div className={styles.browserTab}>
                  <span />
                  Investigation map
                </div>
                <div className={styles.addressBar}>investigationtool.com.au</div>
                <div className={styles.windowControls} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <Image
                src="/images/website/canvas-example.png"
                alt="Investigation map canvas preview"
                width={1914}
                height={908}
                quality={100}
                priority
                unoptimized
              />
            </div>

            <div className={styles.phoneFrame} aria-label="Investigation Tool mobile preview">
              <div className={styles.phoneSpeaker} aria-hidden="true" />
              <Image
                src="/images/mobile-mockup.png"
                alt="Investigation Tool mobile preview"
                width={680}
                height={1370}
                priority
                unoptimized
              />
            </div>
          </div>
        </section>

        <section className={styles.statsRow} aria-label="Platform statistics">
          {stats.map(([num, label]) => (
            <div key={label} className={styles.statCell}>
              <strong>{num}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>

        <section id="how-it-works" className={styles.section}>
          <div className={styles.sectionBlob} />
          <div className={styles.sectionInner}>
            <span className={styles.chip}>How it works</span>
            <h2>Four steps from blank canvas to final record.</h2>
            <p className={styles.sectionSub}>
              Map the incident in one shared workspace so the sequence, evidence, contributing factors and findings stay connected. When you are ready to report, the structure is already there.
            </p>
            <div className={styles.workflowPanel}>
              <div className={styles.workflowVisual} aria-hidden="true">
                <svg className={styles.workflowPath} viewBox="0 0 1000 250" preserveAspectRatio="none">
                  <path d="M70 132 C170 56 250 58 330 128 S500 206 585 128 S755 52 930 122" />
                </svg>
                {workflowSteps.map((step, index) => (
                  <div key={step.title} className={`${styles.workflowNodeGraphic} ${pathNodes[index]}`}>
                    <WorkflowGraphic index={index} />
                  </div>
                ))}
              </div>

              <div className={styles.workflowStepGrid}>
                {workflowSteps.map((step, index) => (
                  <article key={step.title} className={styles.workflowStep}>
                    <div className={styles.workflowStepMobileGraphic} aria-hidden="true">
                      <WorkflowGraphic index={index} />
                    </div>
                    <span>{step.label}</span>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className={`${styles.section} ${styles.whiteSection}`}>
          <div className={styles.sectionBlobAlt} />
          <div className={styles.sectionInner}>
            <span className={styles.chip}>Features</span>
            <h2>The structure that holds up when investigations get complex.</h2>
            <p className={styles.sectionSub}>
              The canvas, the guided setup, the evidence records and the report output all connect so the work stays coherent as the investigation grows.
            </p>
            <div className={styles.featureTabsShell}>
              <div className={styles.featureTabsList} role="tablist" aria-label="Investigation Tool features">
                {featureTabs.map((feature, index) => {
                  const active = index === activeFeatureIndex;

                  return (
                    <button
                      key={feature.title}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={`${styles.featureTab} ${active ? styles.featureTabActive : ""}`}
                      onClick={() => setActiveFeatureIndex(index)}
                    >
                      <span>{feature.title}</span>
                      {active ? (
                        <>
                          <p>{feature.text}</p>
                          <em>{feature.action}</em>
                          <div className={styles.featureTabMobileVisual}>
                            <Image
                              src={feature.image}
                              alt={feature.imageAlt}
                              width={980}
                              height={620}
                              className={styles.featureTabImage}
                              unoptimized
                            />
                          </div>
                        </>
                      ) : null}
                      <i aria-hidden="true" />
                    </button>
                  );
                })}
              </div>

              <div className={styles.featureTabVisual} role="tabpanel" aria-live="polite">
                <div className={styles.featurePlaceholder}>
                  <Image
                    src={activeFeature.image}
                    alt={activeFeature.imageAlt}
                    width={980}
                    height={620}
                    className={styles.featureTabImage}
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className={`${styles.section} ${styles.pricingSection}`}>
          <div className={styles.sectionBlob} />
          <div className={styles.sectionBlobLower} />
          <div className={styles.sectionInner}>
            <span className={styles.chip}>Free access</span>
            <h2>Full access is free during launch</h2>
            <p className={styles.sectionSub}>
              We have disabled paid access tiers for now so teams can use the platform, test real investigation workflows, and give feedback before subscriptions return.
            </p>
            <div className={styles.pricingGrid}>
              {plans.map((plan) => (
                <article key={plan.name} className={`${styles.priceCard} ${plan.featured ? styles.priceCardFeatured : ""}`}>
                  {null}
                  <h3>{plan.name}</h3>
                  <strong>{plan.price}</strong>
                  {plan.priceSub ? <em>{plan.priceSub}</em> : null}
                  <p>{plan.desc}</p>
                  <ul>
                    {plan.features.map(([feature, included]) => (
                      <li key={String(feature)} className={included ? "" : styles.notIncluded}>
                        <span>{included ? "✓" : "○"}</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href} className={plan.featured ? styles.planBtnDark : styles.planBtn}>{plan.cta}</Link>
                </article>
              ))}
            </div>
            <p className={styles.pricingNote}>
              No credit card is required during the launch period. <a href="mailto:support@investigationtool.com.au">Contact us</a> if you need help setting up a team.
            </p>
          </div>
        </section>

        <section className={styles.ctaBanner}>
          <div className={styles.ctaGrid} />
          <div>
            <h2>Run your first investigation on a workspace built for it.</h2>
            <p>Create a free account and start mapping. No credit card required during the launch period.</p>
            <Link href="/login?mode=signup&returnTo=%2Fdashboard">Start your first investigation</Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerGrid} />
        <div className={styles.footerInner}>
          <div>
            <Link href="/" className={styles.footerBrand} aria-label="Investigation Tool home">
              <LogoMark framed />
              <span>Investigation Tool</span>
            </Link>
            <p>Incident investigation software for teams that need to work clearly and act with confidence.</p>
          </div>
          <div className={styles.footerLinks}>
            <div>
              <strong>Platform</strong>
              <Link href="/features">Features</Link>
              <a href="#how-it-works">How it works</a>
              <a href="#pricing">Free access</a>
            </div>
            <div>
              <strong>Use cases</strong>
              <Link href="/use-cases">Safety teams</Link>
              <Link href="/use-cases">Operational incidents</Link>
              <Link href="/use-cases">Security events</Link>
            </div>
            <div>
              <strong>Company</strong>
              <Link href="/login">Sign in</Link>
              <Link href="/privacy">Privacy policy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
        </div>

        <div className={styles.footerIconRow}>
          {footerIcons.map(([label, className], index) => (
            <div key={label} className={styles.footerIconWrap}>
              <div className={`${styles.footerIcon} ${className}`}>
                <FooterGlyph index={index} />
              </div>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className={styles.footerBottom}>
          <span>© 2026 Investigation Tool. All rights reserved.</span>
          <div>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
