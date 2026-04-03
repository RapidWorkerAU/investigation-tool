"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import styles from "./DashboardShell.module.css";

type NavKey = "dashboard" | "templates" | "account" | "export";

type DashboardShellProps = {
  activeNav?: NavKey;
  eyebrow: string;
  title: string;
  subtitle?: string;
  headerLead?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
};

const sidebarLinks = [
  { key: "dashboard" as const, href: "/dashboard", label: "Dashboard", icon: "/icons/house.svg" },
  { key: "templates" as const, href: "/templates", label: "Templates", icon: "/icons/template.svg" },
  { key: "account" as const, href: "/account", label: "Edit Account", icon: "/icons/account.svg" },
];

const DESKTOP_SIDEBAR_STATE_KEY = "investigation_tool_dashboard_sidebar_collapsed";

const getInitialDesktopSidebarCollapsed = () => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DESKTOP_SIDEBAR_STATE_KEY) === "true";
};

export default function DashboardShell({
  activeNav = "dashboard",
  eyebrow,
  title,
  subtitle,
  headerLead,
  headerRight,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [logoutConfirmArmed, setLogoutConfirmArmed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(getInitialDesktopSidebarCollapsed);

  useEffect(() => {
    const body = document.body;
    const header = document.querySelector("body > header");
    const main = document.querySelector("body > main");

    body.classList.add(styles.bodyChrome);
    header?.classList.add(styles.headerChrome);
    main?.classList.add(styles.mainChrome);

    return () => {
      body.classList.remove(styles.bodyChrome);
      header?.classList.remove(styles.headerChrome);
      main?.classList.remove(styles.mainChrome);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    window.localStorage.setItem(DESKTOP_SIDEBAR_STATE_KEY, String(desktopSidebarCollapsed));
  }, [desktopSidebarCollapsed]);

  const handleLogout = async () => {
    if (!logoutConfirmArmed) {
      setLogoutConfirmArmed(true);
      return;
    }

    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      setMobileMenuOpen(false);
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
      setLogoutConfirmArmed(false);
    }
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.deviceShell}>
        <div className={styles.deviceBezel}>
          <header className={styles.mobileHeader}>
            <Link href="/" className={styles.mobileHeaderBrand} aria-label="Investigation Tool home">
              <Image
                src="/images/investigation-tool.png"
                alt="Investigation Tool"
                width={52}
                height={52}
                className={styles.mobileHeaderBrandImage}
              />
              <span className={styles.mobileHeaderBrandText}>Investigation Tool</span>
            </Link>

            <button
              type="button"
              className={styles.mobileHeaderMenuButton}
              title="Open menu"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
            >
              <span
                aria-hidden="true"
                className={styles.mobileHeaderMenuIcon}
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
          </header>

          <aside className={`${styles.sidebar} ${desktopSidebarCollapsed ? styles.sidebarCollapsed : ""}`}>
            <div className={styles.sidebarTop}>
              <Link href="/" className={styles.brand} aria-label="Investigation Tool home">
                <Image
                  src="/images/investigation-tool.png"
                  alt="Investigation Tool"
                  width={52}
                  height={52}
                  className={styles.brandImage}
                />
                <span className={styles.brandText}>Investigation Tool</span>
              </Link>

              <button
                type="button"
                className={styles.sidebarCollapseButton}
                aria-label={desktopSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
                aria-pressed={desktopSidebarCollapsed}
                onClick={() => setDesktopSidebarCollapsed((current) => !current)}
              >
                <span className={styles.sidebarCollapseIcon} aria-hidden="true" />
              </button>
            </div>

            <nav className={styles.sidebarNav} aria-label="Dashboard shortcuts">
              {sidebarLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.sidebarLink} ${activeNav === link.key ? styles.sidebarLinkActive : ""}`}
                  title={link.label}
                  aria-label={link.label}
                >
                  <Image
                    src={link.icon}
                    alt=""
                    width={22}
                    height={22}
                    className={styles.sidebarIcon}
                  />
                  <span className={styles.sidebarLinkLabel}>{link.label}</span>
                </Link>
              ))}
            </nav>

            <div className={styles.sidebarFooter}>
              <button
                type="button"
                className={`${styles.sidebarLink} ${logoutConfirmArmed ? styles.sidebarLinkConfirm : ""}`}
                title={logoutConfirmArmed ? "Click again to confirm logout" : "Logout"}
                aria-label={logoutConfirmArmed ? "Confirm logout" : "Logout"}
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
              >
                <Image
                  src="/icons/logout.svg"
                  alt=""
                  width={22}
                  height={22}
                  className={styles.sidebarIcon}
                />
                <span className={styles.sidebarLinkLabel}>
                  {isLoggingOut ? "Logging out..." : logoutConfirmArmed ? "Confirm Logout" : "Logout"}
                </span>
              </button>
            </div>
          </aside>

          <section className={styles.canvas}>
            <header className={styles.topbar}>
              <div className={styles.greetingBlock}>
                <div>
                  {headerLead ? <div className={styles.headerLead}>{headerLead}</div> : null}
                  <p className={styles.eyebrow}>{eyebrow}</p>
                  <h1 className={styles.title}>{title}</h1>
                  {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
                </div>
              </div>

              {headerRight ? <div className={styles.topbarActions}>{headerRight}</div> : null}
            </header>

            <div className={styles.body}>{children}</div>
          </section>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className={styles.mobileMenu} role="dialog" aria-modal="true" aria-label="Dashboard menu">
          <div className={styles.mobileMenuHeader}>
            <Link href="/" className={styles.mobileMenuBrand} aria-label="Investigation Tool home" onClick={() => setMobileMenuOpen(false)}>
              <Image
                src="/images/investigation-tool.png"
                alt="Investigation Tool"
                width={36}
                height={36}
                className={styles.mobileMenuBrandImage}
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

          <nav className={styles.mobileMenuNav} aria-label="Dashboard mobile navigation">
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link href="/templates" onClick={() => setMobileMenuOpen(false)}>
              Templates
            </Link>
            <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
              Account
            </Link>
          </nav>

          <div className={styles.mobileMenuActions}>
            <button
              type="button"
              className={styles.mobileMenuLogout}
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : logoutConfirmArmed ? "Confirm Logout" : "Logout"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
