"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { accessRequiresSelection, fetchAccessState } from "@/lib/access";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import styles from "./UseCasesPage.module.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

type UseCase = {
  id: string;
  label: string;
  title: string;
  audience: string;
  summary: string;
  investigatedLabel: string;
  investigated: string[];
  fitLabel: string;
  fit: string[];
};

const useCases: UseCase[] = [
  {
    id: "safety",
    label: "Safety",
    title: "Health and safety investigations",
    audience: "For HSE teams, safety managers and operational leaders",
    summary:
      "Map the event sequence, record evidence, identify contributing factors and prepare a clear report for internal review.",
    investigatedLabel: "Common investigations",
    investigated: [
      "Workplace injuries and near misses",
      "Plant and equipment incidents",
      "Manual handling events",
      "Hazardous substance exposures",
      "High potential events",
    ],
    fitLabel: "Why it fits",
    fit: [
      "Sequence nodes show how the event unfolded.",
      "Factor and outcome nodes separate causes from consequences.",
      "Evidence records keep photos, files and notes connected to the map.",
      "Report output helps leaders review findings and recommendations.",
    ],
  },
  {
    id: "operations",
    label: "Operations",
    title: "Operational incident reviews",
    audience: "For operations managers, supervisors and quality teams",
    summary:
      "Turn a service disruption, process failure or handover issue into a structured investigation record that the team can inspect together.",
    investigatedLabel: "Common investigations",
    investigated: [
      "Process failures",
      "Production interruptions",
      "Quality escapes",
      "Shift handover gaps",
      "Contractor interface issues",
    ],
    fitLabel: "Why it fits",
    fit: [
      "The canvas keeps people, timeline, evidence and factors in one view.",
      "Templates help teams reuse a proven investigation structure.",
      "Recommendations can be mapped next to the factors that led to them.",
      "Reports create a cleaner record for team review and follow up.",
    ],
  },
  {
    id: "security",
    label: "Security",
    title: "Security and asset incidents",
    audience: "For security managers, facility teams and risk teams",
    summary:
      "Build a clear picture of what happened when there has been theft, damage, unauthorised access or a physical security event.",
    investigatedLabel: "Common investigations",
    investigated: [
      "Theft and asset loss",
      "Property damage",
      "Unauthorised access events",
      "Threats or aggressive behaviour",
      "Physical security control failures",
    ],
    fitLabel: "Why it fits",
    fit: [
      "A timeline helps separate reported events from confirmed events.",
      "Evidence items can be kept visible in the investigation context.",
      "Access controls help restrict sensitive maps to the right users.",
      "A structured report gives the review team a consistent record.",
    ],
  },
  {
    id: "environment",
    label: "Environment",
    title: "Environmental and compliance events",
    audience: "For environment, compliance and site leadership teams",
    summary:
      "Capture what happened, what was affected and what needs to change after a spill, release, exceedance or procedure breach.",
    investigatedLabel: "Common investigations",
    investigated: [
      "Spills and releases",
      "Environmental exceedances",
      "Waste handling incidents",
      "Licence or procedure breaches",
      "Community impact events",
    ],
    fitLabel: "Why it fits",
    fit: [
      "Outcome nodes help capture impact without losing the event sequence.",
      "Evidence records keep observations and supporting files connected.",
      "Factor nodes make it easier to explain the conditions behind the event.",
      "Recommendations can be reviewed beside the investigation findings.",
    ],
  },
  {
    id: "people",
    label: "People",
    title: "People and workplace matters",
    audience: "For teams that need a careful factual record",
    summary:
      "When a workplace matter needs structured fact mapping, the canvas can help organise the sequence, records, findings and review output.",
    investigatedLabel: "Common investigations",
    investigated: [
      "Behaviour complaints",
      "Policy concerns",
      "Workplace conflict",
      "Contractor conduct concerns",
      "Internal review matters",
    ],
    fitLabel: "Why it fits",
    fit: [
      "A shared structure helps reviewers separate facts, evidence and findings.",
      "Map access can be managed through account and organisation controls.",
      "Evidence records help keep supporting material linked to the matter.",
      "Reports provide a consistent starting point for review discussions.",
    ],
  },
  {
    id: "general",
    label: "General",
    title: "Any structured investigation",
    audience: "For any team that needs a clear investigation record",
    summary:
      "Use the same canvas, node types and reporting workflow wherever a team needs to understand what happened and decide what comes next.",
    investigatedLabel: "Useful for",
    investigated: [
      "Events with multiple people involved",
      "Investigations with scattered evidence",
      "Issues that need findings and recommendations",
      "Reviews that need a clean report",
      "Teams replacing notes and spreadsheets",
    ],
    fitLabel: "What stays consistent",
    fit: [
      "The canvas gives every investigation a shared visual record.",
      "Node types keep the investigation structure clear.",
      "Free launch access currently opens editing, export, duplication and templates.",
      "The report workflow turns mapped work into a reviewable output.",
    ],
  },
];

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

export default function UseCasesPageClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [isAuthed, setIsAuthed] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const activeCase = useCases[activeCaseIndex] ?? useCases[0]!;

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
          <Link href="/use-cases" className={styles.activeLink}>Use cases</Link>
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
            <span className={styles.chip}>Use cases</span>
            <h1>One investigation workspace for every kind of workplace incident.</h1>
            <p>
              Safety teams, operations managers, security leads and compliance officers all run investigations. The structure they need is the same: a clear sequence, connected evidence, visible factors and a report that holds up when it matters.
            </p>
            <div className={styles.heroProofStrip}>
              {[
                { label: "Sequence", desc: "Build the timeline before the detail gets scattered.", color: "#f97316" },
                { label: "Evidence", desc: "Keep supporting records connected to the investigation.", color: "#facc15" },
                { label: "Factors", desc: "Separate conditions, outcomes, findings and recommendations.", color: "#f43f5e" },
                { label: "Report", desc: "Prepare a structured output for review and communication.", color: "#22c55e" },
              ].map((item) => (
                <div key={item.label} className={styles.heroProofItem} style={{ borderLeftColor: item.color }}>
                  <div className={styles.heroProofTitle}>
                    {item.label}
                  </div>
                  <div className={styles.heroProofText}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.useCaseSection}>
          <div className={styles.sectionIntro}>
            <span className={styles.chip}>Where it fits</span>
            <h2>Choose the investigation type and see how the structure supports it</h2>
            <p>
              The examples below are deliberately practical. Investigation Tool gives teams a structured workspace. Your team brings the subject matter knowledge.
            </p>
          </div>

          <div className={styles.caseLayout}>
            <div className={styles.caseTabs} aria-label="Use case selector">
              <span className={styles.caseTabsLabel}>Select a use case</span>
              {useCases.map((useCase, index) => (
                <button
                  key={useCase.id}
                  type="button"
                  className={`${styles.caseTab} ${activeCase.id === useCase.id ? styles.caseTabActive : ""}`}
                  onClick={() => setActiveCaseIndex(index)}
                >
                  <span>{useCase.label}</span>
                  <strong>{useCase.title}</strong>
                </button>
              ))}
            </div>

            <article className={styles.casePanel}>
              <div className={styles.casePanelHeader}>
                <span>{activeCase.title}</span>
                <h3>{activeCase.audience}</h3>
                <p>{activeCase.summary}</p>
              </div>
              <div className={styles.casePanelBody}>
                <div>
                  <h4>{activeCase.investigatedLabel}</h4>
                  <ul>
                    {activeCase.investigated.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>{activeCase.fitLabel}</h4>
                  <ul>
                    {activeCase.fit.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.ctaBanner}>
          <div className={styles.ctaGrid} />
          <div>
            <h2>Start with the investigation in front of you.</h2>
            <p>Create a free account and map it using the same canvas structure used across every investigation type. No credit card required.</p>
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
