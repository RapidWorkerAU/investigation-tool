"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { accessRequiresSelection, fetchAccessState } from "@/lib/access";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import base from "../use-cases/UseCasesPage.module.css";
import styles from "./PricingPage.module.css";

type Plan = {
  id: string;
  name: string;
  price: string;
  priceMeta: string;
  description: string;
  cta: string;
  href: string;
  featured?: boolean;
  note?: string;
};

type CellValue = string | boolean;

const plans: Plan[] = [
  {
    id: "free",
    name: "Free account",
    price: "Free",
    priceMeta: "Ongoing",
    description: "One active investigation map with editing access and clear account barriers.",
    cta: "Create free account",
    href: "/subscribe",
  },
  {
    id: "pass30",
    name: "30 day access",
    price: "$19.95",
    priceMeta: "AUD once",
    description: "One active investigation map for a focused 30 day investigation window.",
    cta: "Buy 30 day access",
    href: "/subscribe",
    featured: true,
    note: "Most popular",
  },
  {
    id: "monthly",
    name: "Monthly access",
    price: "$44.95",
    priceMeta: "AUD per month",
    description: "Ongoing access for users who need multiple maps and full workflow access.",
    cta: "Start monthly access",
    href: "/subscribe",
  },
  {
    id: "organisation",
    name: "Organisation access",
    price: "Custom",
    priceMeta: "By arrangement",
    description: "Managed access for teams that need membership, roles and organisation setup.",
    cta: "Contact us",
    href: "mailto:support@investigationtool.com.au",
  },
];

const comparisonGroups: Array<{
  title: string;
  rows: Array<{ label: string; cells: CellValue[] }>;
}> = [
  {
    title: "Investigation maps",
    rows: [
      { label: "Active editable maps", cells: ["1 map", "1 map", "Unlimited", "Team based"] },
      { label: "Access duration", cells: ["Ongoing", "30 days", "While active", "While active"] },
      { label: "Older maps after downgrade", cells: ["Read only", "Read only", "Editable", "Managed by role"] },
      { label: "Create another active map", cells: ["After deleting active map", "With replacement warning", true, "Managed by role"] },
    ],
  },
  {
    title: "Canvas workflow",
    rows: [
      { label: "Full canvas editing on active map", cells: [true, true, true, true] },
      { label: "Investigation node types", cells: [true, true, true, true] },
      { label: "Guided build wizard", cells: [true, true, true, true] },
      { label: "Evidence records", cells: [true, true, true, true] },
    ],
  },
  {
    title: "Sharing and reuse",
    rows: [
      { label: "Share maps", cells: [false, true, true, true] },
      { label: "Duplicate maps", cells: [false, false, true, true] },
      { label: "Save investigation templates", cells: [false, false, true, true] },
      { label: "Browse available templates", cells: [false, false, true, true] },
    ],
  },
  {
    title: "Reports and export",
    rows: [
      { label: "Report generation", cells: [false, true, true, true] },
      { label: "PDF export", cells: [false, true, true, true] },
      { label: "Report email workflow", cells: [false, true, true, true] },
      { label: "Canvas image export", cells: [false, true, true, true] },
    ],
  },
  {
    title: "Account controls",
    rows: [
      { label: "Account barriers by access type", cells: [true, true, true, true] },
      { label: "Organisation membership", cells: [false, false, false, true] },
      { label: "Organisation admin roles", cells: [false, false, false, true] },
      { label: "Managed team setup", cells: [false, false, false, true] },
    ],
  },
];

const proofItems = [
  ["Free", "One active map with no time limit."],
  ["30 day", "One active investigation window."],
  ["Monthly", "Full access across ongoing work."],
  ["Organisation", "Managed access for teams."],
];

const proofColors = ["#f97316", "#facc15", "#f43f5e", "#22c55e"];

function LogoMark() {
  return (
    <span className={base.logoFrame}>
      <Image
        src="/images/investigation-tool.png"
        alt=""
        aria-hidden="true"
        width={28}
        height={28}
        className={base.logoImage}
      />
    </span>
  );
}

function Cell({ value, featured }: { value: CellValue; featured?: boolean }) {
  if (typeof value === "boolean") {
    return (
      <td className={featured ? styles.featuredCell : undefined}>
        {value ? (
          <span className={styles.included} aria-label="Included">✓</span>
        ) : (
          <span className={styles.notIncluded} aria-label="Not included">×</span>
        )}
      </td>
    );
  }

  return (
    <td className={featured ? styles.featuredCell : undefined}>
      <span className={styles.valuePill}>{value}</span>
    </td>
  );
}

export default function PricingPageClient() {
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

      if (mounted) setIsAuthed(Boolean(session?.access_token));
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
      <button type="button" className={base.btnPrimary} onClick={() => void goToWorkspace()} disabled={dashboardLoading}>
        {dashboardLoading ? "Checking access" : "Go to dashboard"}
      </button>
      <button type="button" className={base.btnGhost} onClick={() => void handleLogout()} disabled={dashboardLoading}>
        Logout
      </button>
    </>
  ) : (
    <>
      <Link href="/login" className={base.btnGhost}>Sign in</Link>
      <Link href="/subscribe" className={base.btnPrimary}>Create free account</Link>
    </>
  );

  return (
    <div className={base.page}>
      <nav className={base.navShell}>
        <Link href="/" className={base.navBrand} aria-label="Investigation Tool home">
          <LogoMark />
          <span>Investigation Tool</span>
        </Link>
        <div className={base.navLinks}>
          <Link href="/features">Features</Link>
          <Link href="/use-cases">Use cases</Link>
          <Link href="/pricing" className={base.activeLink}>Pricing</Link>
        </div>
        <div className={base.navActions}>{authActions}</div>
        <button type="button" className={base.menuButton} aria-label="Open menu" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(true)}>
          <span />
          <span />
          <span />
        </button>
      </nav>

      {mobileMenuOpen ? (
        <div className={base.mobileMenu} role="dialog" aria-modal="true" aria-label="Mobile menu">
          <div className={base.mobileMenuHeader}>
            <Link href="/" className={base.mobileBrand} aria-label="Investigation Tool home" onClick={() => setMobileMenuOpen(false)}>
              <LogoMark />
              <span>Investigation Tool</span>
            </Link>
            <button type="button" className={base.closeButton} aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}>x</button>
          </div>
          <div className={base.mobileLinks}>
            <Link href="/features" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <Link href="/use-cases" onClick={() => setMobileMenuOpen(false)}>Use cases</Link>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
          </div>
          <div className={base.mobileActions}>{authActions}</div>
        </div>
      ) : null}

      <main>
        <section className={base.hero}>
          <div className={base.heroGrid} />
          <div className={base.heroGlowOne} />
          <div className={base.heroGlowTwo} />
          <div className={base.heroInner}>
            <span className={base.chip}>Pricing</span>
            <h1>Choose the access level that matches the investigation.</h1>
            <p>
              Start free with one active map. Move to 30 day access for a focused investigation window, or monthly access when you need every map available while your subscription is active.
            </p>
            <div className={base.heroProofStrip}>
              {proofItems.map(([title, text], index) => (
                <div key={title} className={base.heroProofItem} style={{ borderLeftColor: proofColors[index] }}>
                  <div className={base.heroProofTitle}>
                    {title}
                  </div>
                  <div className={base.heroProofText}>
                    {text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.planSection}>
          <div className={styles.planStrip}>
            {[
              {
                label: "Free account",
                labelColor: "#f97316",
                desc: "One active map with full canvas editing and the guided build wizard.",
                price: "Free",
                priceSub: "Ongoing",
                cta: "Create free account",
                href: "/register",
                featured: false,
              },
              {
                label: "30-day access",
                labelColor: "#2563eb",
                desc: "One map with full access including PDF export, sharing and structured reporting.",
                price: "$19.95",
                priceSub: "AUD once-off",
                cta: "Buy 30-day access",
                href: "/subscribe?plan=30day",
                featured: true,
                badge: "POPULAR",
              },
              {
                label: "Monthly access",
                labelColor: "#a855f7",
                desc: "Unlimited maps with full access for teams running investigations continuously.",
                price: "$44.95",
                priceSub: "AUD per month",
                cta: "Start monthly access",
                href: "/subscribe?plan=monthly",
                featured: false,
              },
              {
                label: "Organisation access",
                labelColor: "#22c55e",
                desc: "Managed access for teams that need membership, roles and organisation setup.",
                price: "Custom",
                priceSub: "By arrangement",
                cta: "Contact us",
                href: "mailto:support@investigationtool.com.au",
                featured: false,
              },
            ].map((plan) => (
              <div key={plan.label} className={styles.planStripItem}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: plan.labelColor,
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                  }}>
                    {plan.label}
                  </div>
                  {plan.badge && (
                    <span style={{
                      background: plan.labelColor,
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 20,
                      letterSpacing: ".04em",
                    }}>
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: 13,
                  color: "#64708a",
                  lineHeight: 1.6,
                  marginBottom: 24,
                  minHeight: 52,
                }}>
                  {plan.desc}
                </div>
                <div style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#12172f",
                  letterSpacing: "-1px",
                  marginBottom: 2,
                }}>
                  {plan.price}
                </div>
                <div style={{ fontSize: 12, color: "#64708a", marginBottom: 24 }}>
                  {plan.priceSub}
                </div>
                <a href={plan.href} style={{
                  display: "block",
                  textAlign: "center",
                  padding: "10px 0",
                  fontSize: 13,
                  fontWeight: plan.featured ? 700 : 600,
                  background: plan.featured ? "#2563eb" : "transparent",
                  color: plan.featured ? "#fff" : "#64708a",
                  border: plan.featured ? "none" : "1.5px solid #dbe4f3",
                  borderRadius: 8,
                  textDecoration: "none",
                }}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
          <p className={styles.planStripNote}>
            Prices in AUD. Free account has no time limit. 30-day access begins from date of purchase. Monthly access remains active while subscription is current.
          </p>
        </section>

        <section className={styles.compareSection}>
          <div className={base.sectionIntro}>
            <span className={base.chip}>Compare access</span>
            <h2>What each account type actually unlocks</h2>
            <p>
              These rows match the current access rules for map editing, export, sharing, duplication, templates and organisation access.
            </p>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.compareTable}>
              <thead>
                <tr>
                  <th>Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className={plan.featured ? styles.featuredCell : undefined}>
                      <span className={styles.planHeaderFull}>{plan.name}</span>
                      <span className={styles.planHeaderShort}>{plan.id === "organisation" ? "Org access" : plan.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonGroups.map((group) => (
                  <FragmentGroup key={group.title} title={group.title} rows={group.rows} />
                ))}
              </tbody>
            </table>
          </div>

          <p className={styles.footnote}>
            Prices are shown in AUD. The free account has no time limit. The 30 day access period starts from purchase. Monthly access remains available while the subscription is active. Organisation access is arranged directly with the Investigation Tool team.
          </p>
        </section>

        <section className={base.ctaBanner}>
          <div className={base.ctaGrid} />
          <div>
            <h2>Start with one map, then upgrade when the work grows.</h2>
            <p>Create a free account and choose a paid access type when you need export, sharing, duplication or more active maps.</p>
            <Link href="/subscribe">Create a free account</Link>
          </div>
        </section>
      </main>

      <footer className={base.footer}>
        <div className={base.footerGrid} />
        <div className={base.footerInner}>
          <div>
            <Link href="/" className={base.footerBrand} aria-label="Investigation Tool home">
              <Image
                src="/images/investigation-tool.png"
                alt=""
                aria-hidden="true"
                width={84}
                height={84}
                className={base.footerLogoImage}
              />
              <span>Investigation Tool</span>
            </Link>
            <p>Incident investigation software for teams that need to work clearly and act with confidence.</p>
          </div>
          <div className={base.footerLinks}>
            <div>
              <strong>Platform</strong>
              <Link href="/features">Features</Link>
              <Link href="/#how-it-works">How it works</Link>
              <Link href="/pricing">Pricing</Link>
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
        <div className={base.footerBottom}>
          <span>(c) 2026 Investigation Tool. All rights reserved.</span>
          <div>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FragmentGroup({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; cells: CellValue[] }>;
}) {
  return (
    <>
      <tr className={styles.groupRow}>
        <td colSpan={plans.length + 1}>{title}</td>
      </tr>
      {rows.map((row) => (
        <tr key={row.label}>
          <td>{row.label}</td>
          {plans.map((plan, index) => (
            <Cell key={plan.id} value={row.cells[index] ?? false} featured={plan.featured} />
          ))}
        </tr>
      ))}
    </>
  );
}
