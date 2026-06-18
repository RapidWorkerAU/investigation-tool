"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { accessRequiresSelection, fetchAccessState } from "@/lib/access";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import styles from "./FeaturesPage.module.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const FEATURE_TILES = [
  {
    num: "01",
    category: "Visual mapping",
    title: "Investigation canvas",
    summary: "Build the investigation in one visual workspace where everything stays connected.",
    color: "#2563eb",
    darkColor: "#1e3a5f",
    backBg: "#eef4ff",
    backColor: "#2563eb",
    points: [
      "Map the incident story as it develops instead of rebuilding it across documents.",
      "Connect related nodes so the sequence and contributing detail are easier to review.",
      "Move, arrange, zoom and inspect canvas content as the investigation grows.",
      "Use a shared map as the working record for briefings and review conversations.",
    ],
  },
  {
    num: "02",
    category: "Purpose built nodes",
    title: "Node system",
    summary: "Use dedicated nodes so every part of the map has a clear purpose and consistent structure.",
    color: "#a855f7",
    darkColor: "#4a1d96",
    backBg: "#f5f0ff",
    backColor: "#a855f7",
    points: [
      "Sequence nodes capture what happened in order.",
      "Factor nodes capture contributing conditions and system issues.",
      "Outcome nodes capture injuries, damage, loss and near miss results.",
      "Recommendation and finding nodes turn the map into practical output.",
    ],
  },
  {
    num: "03",
    category: "Guided setup",
    title: "Build wizard",
    summary: "Start faster with a guided flow that captures the right information before the map expands.",
    color: "#22c55e",
    darkColor: "#0c4a2e",
    backBg: "#f0fdf4",
    backColor: "#22c55e",
    points: [
      "Prompted steps reduce the blank canvas problem.",
      "Wizard entries create useful starting nodes for the investigation.",
      "Teams can add sequence, factor, outcome, recommendation and evidence items.",
      "Experienced users can keep working directly on the canvas.",
    ],
  },
  {
    num: "04",
    category: "Evidence handling",
    title: "Evidence and records",
    summary: "Keep evidence visible in the investigation record and carry it through to the report.",
    color: "#f97316",
    darkColor: "#7c2d12",
    backBg: "#fff7ed",
    backColor: "#f97316",
    points: [
      "Create evidence items with type, source and description fields.",
      "Attach evidence to the investigation so it can be reviewed in context.",
      "Filter and inspect evidence from the investigation record view.",
      "Choose which evidence items appear in the final report.",
    ],
  },
  {
    num: "05",
    category: "Report output",
    title: "Structured reports",
    summary: "Generate an organised report from the investigation data, then export it for stakeholders.",
    color: "#f43f5e",
    darkColor: "#881337",
    backBg: "#fff1f2",
    backColor: "#f43f5e",
    points: [
      "Reports generate from the canvas so findings are already structured.",
      "Review and edit report content before sharing with stakeholders.",
      "Export to PDF for distribution, filing and regulatory submission.",
      "Export selected sections for interim briefings and updates.",
    ],
  },
  {
    num: "06",
    category: "Repeatable work",
    title: "Templates and duplication",
    summary: "Reuse investigation structures with templates and duplication during free launch access.",
    color: "#ca8a04",
    darkColor: "#713f12",
    backBg: "#fefce8",
    backColor: "#ca8a04",
    points: [
      "Duplicate investigation maps to reuse structure across similar incidents.",
      "Save starting templates for investigation types your team runs repeatedly.",
      "Manage multiple active maps from the dashboard without losing context.",
      "Available during the free launch period.",
    ],
  },
  {
    num: "07",
    category: "Launch access",
    title: "Free access",
    summary: "Subscription barriers are disabled during launch so teams can test the full workflow.",
    color: "#0ea5e9",
    darkColor: "#0c4a6e",
    backBg: "#f0f9ff",
    backColor: "#0ea5e9",
    points: [
      "Create maps with full canvas editing and wizard support.",
      "Use export, sharing, duplication, templates and reporting during launch.",
      "Paid checkout is disabled while free launch access is active.",
      "Subscription controls remain preserved for later reinstatement.",
    ],
  },
  {
    num: "08",
    category: "Team access",
    title: "Organisation workspaces",
    summary: "Shared investigation work with membership, roles and managed account setup.",
    color: "#ec4899",
    darkColor: "#831843",
    backBg: "#fdf2f8",
    backColor: "#ec4899",
    points: [
      "Invite team members and assign roles across the organisation account.",
      "Members access investigations based on their assigned role and permissions.",
      "Manage multiple active investigations across the team from one workspace.",
      "Organisation setup is handled on request with dedicated account support.",
    ],
  },
];

const proofItems = [
  ["One canvas", "Map the incident, evidence and investigation outputs together."],
  ["Guided setup", "Use the wizard to create a structured starting point."],
  ["Report ready", "Move from mapped investigation to reviewable report output."],
  ["Free launch", "Full workflow access is open during the launch period."],
];

const proofColors = ["#f97316", "#facc15", "#f43f5e", "#22c55e"];

function LogoMark() {
  return (
    <span className={styles.logoFrame}>
      <Image
        src="/images/investigation-tool.png"
        alt=""
        aria-hidden="true"
        width={28}
        height={28}
        className={styles.logoImage}
      />
    </span>
  );
}

export default function FeaturesPageClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [isAuthed, setIsAuthed] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  const toggleFlip = (index: number) => {
    setFlipped((previous) => ({ ...previous, [index]: !previous[index] }));
  };

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
          <Link href="/features" className={styles.activeLink}>Features</Link>
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
            <Link href="/" className={styles.mobileBrand} aria-label="Investigation Tool home" onClick={() => setMobileMenuOpen(false)}>
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
          <div className={styles.heroGrid} />
          <div className={styles.heroGlowOne} />
          <div className={styles.heroGlowTwo} />
          <div className={styles.heroInner}>
            <span className={styles.chip}>Platform features</span>
            <h1>The features that carry an investigation from first map to final report.</h1>
            <p>
              The canvas, guided setup, evidence records and report output are built to work together. Teams run the full investigation from one shared workspace without losing context between steps.
            </p>
            <div className={styles.heroProofStrip}>
              {proofItems.map(([title, text], index) => (
                <div key={title} className={styles.heroProofItem} style={{ borderLeftColor: proofColors[index] }}>
                  <div className={styles.heroProofTitle}>
                    {title}
                  </div>
                  <div className={styles.heroProofText}>
                    {text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.featureSection}>
          <div className={styles.sectionIntro}>
            <span className={styles.chip}>Core capability</span>
            <h2>Built around the real shape of an investigation</h2>
            <p>
              These are the features that matter most when a team needs to understand what happened and prepare a record that can stand up to review.
            </p>
          </div>
          <div className={styles.featureGrid}>
            {FEATURE_TILES.map((tile, index) => (
              <div className={styles.tileWrap} key={tile.num}>
                <div className={`${styles.tileInner} ${flipped[index] ? styles.flipped : ""}`}>
                  <div
                    className={styles.tileFront}
                    style={{ background: `linear-gradient(135deg, ${tile.darkColor}, ${tile.color})` }}
                  >
                    <div className={styles.tileMeta}>
                      {tile.num} - {tile.category}
                    </div>
                    <div className={styles.tileTitle}>
                      {tile.title}
                    </div>
                    <div className={styles.tileSummary}>
                      {tile.summary}
                    </div>
                    <button type="button" className={styles.flipBtn} onClick={() => toggleFlip(index)}>
                      View detail
                      <Image src="/icons/back.svg" alt="" aria-hidden="true" width={12} height={12} className={styles.flipIconForward} />
                    </button>
                  </div>

                  <div className={styles.tileBack} style={{ background: "#fff", border: "1px solid #dbe4f3" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: tile.backColor, letterSpacing: ".06em", marginBottom: 8 }}>
                      {tile.num} - {tile.title}
                    </div>
                    <div className={styles.tilePoints}>
                      {tile.points.map((point) => (
                        <div key={point} className={styles.tilePoint}>
                          <span style={{ background: tile.color }} />
                          {point}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className={styles.backClose}
                      style={{ background: tile.backBg, color: tile.backColor }}
                      onClick={() => toggleFlip(index)}
                    >
                      <Image src="/icons/back.svg" alt="" aria-hidden="true" width={12} height={12} className={styles.flipIconBack} />
                      Back
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.whySection}>
          <div className={styles.whyInner}>
            <div className={styles.whyHeading}>
              <div className={styles.whyEyebrow}>
                Why it works
              </div>
              <h2>
                It keeps the investigation thinking visible.
              </h2>
            </div>
            <div>
              <p className={styles.whyCopy}>
                The strongest investigations are rarely built in a straight line. They move from sequence to evidence, from factors to outcomes, from findings to recommendations. Investigation Tool keeps that thinking on the canvas so the team can see how the record was built.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.ctaBanner}>
          <div className={styles.ctaGrid} />
          <div>
            <h2>Start with one investigation map.</h2>
            <p>Create a free account and run a real investigation from blank canvas to structured report. No credit card required during the launch period.</p>
            <Link href="/login?mode=signup&returnTo=%2Fdashboard">Create a free account</Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerGrid} />
        <div className={styles.footerInner}>
          <div>
            <Link href="/" className={styles.footerBrand} aria-label="Investigation Tool home">
              <Image
                src="/images/investigation-tool.png"
                alt=""
                aria-hidden="true"
                width={84}
                height={84}
                className={styles.footerLogoImage}
              />
              <span>Investigation Tool</span>
            </Link>
            <p>Incident investigation software for teams that need to work clearly and act with confidence.</p>
          </div>
          <div className={styles.footerLinks}>
            <div>
              <strong>Platform</strong>
              <Link href="/features">Features</Link>
              <Link href="/#how-it-works">How it works</Link>
              <Link href="/#pricing">Free access</Link>
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
