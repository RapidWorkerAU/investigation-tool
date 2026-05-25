"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { isPlatformAdminEmail } from "@/lib/platformAdmin";
import styles from "./DashboardShell.module.css";

type NavKey =
  | "dashboard"
  | "templates"
  | "case-studies"
  | "lead-access"
  | "lead-access-notes"
  | "account"
  | "admin"
  | "admin-users"
  | "admin-organisations"
  | "export";

type ShellMode = "default" | "admin";

type DashboardShellProps = {
  activeNav?: NavKey;
  mode?: ShellMode;
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
  { key: "case-studies" as const, href: "/case-studies", label: "Case Studies", icon: "/icons/documentmap.svg" },
  { key: "account" as const, href: "/account", label: "Edit Account", icon: "/icons/account.svg" },
];

const adminSidebarLinks = [
  { key: "dashboard" as const, href: "/dashboard", label: "Dashboard", icon: "/icons/house.svg" },
  { key: "admin-users" as const, href: "/admin/users", label: "Users", icon: "/icons/users.svg" },
  {
    key: "admin-organisations" as const,
    href: "/admin/organisations",
    label: "Organisations",
    icon: "/icons/organisation.svg",
  },
  {
    key: "lead-access" as const,
    href: "/lead-access",
    label: "Lead Access",
    icon: "/icons/lock.svg",
    children: [
      { key: "lead-access-notes" as const, href: "/lead-access/notes", label: "Guest Notes", icon: "/icons/comments.svg" },
    ],
  },
];

const DESKTOP_SIDEBAR_STATE_KEY = "investigation_tool_dashboard_sidebar_collapsed";
const LEAD_ACCESS_CHILDREN_STATE_KEY = "investigation_tool_admin_lead_access_children_open";
const USER_EMAIL_STORAGE_KEY = "investigation_tool_user_email";

const getInitialDesktopSidebarCollapsed = () => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DESKTOP_SIDEBAR_STATE_KEY) === "true";
};

const getInitialLeadAccessChildrenOpen = () => {
  if (typeof window === "undefined") return true;
  const storedValue = window.localStorage.getItem(LEAD_ACCESS_CHILDREN_STATE_KEY);
  return storedValue === null ? true : storedValue === "true";
};

export default function DashboardShell({
  activeNav = "dashboard",
  mode = "default",
  eyebrow,
  title,
  subtitle,
  headerLead,
  headerRight,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [logoutConfirmArmed, setLogoutConfirmArmed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(getInitialDesktopSidebarCollapsed);
  const [leadAccessChildrenOpen, setLeadAccessChildrenOpen] = useState(getInitialLeadAccessChildrenOpen);
  const [showAdminMenuItem, setShowAdminMenuItem] = useState(false);
  const [pendingGuestNotesCount, setPendingGuestNotesCount] = useState(0);

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

  useEffect(() => {
    window.localStorage.setItem(LEAD_ACCESS_CHILDREN_STATE_KEY, String(leadAccessChildrenOpen));
  }, [leadAccessChildrenOpen]);

  useEffect(() => {
    let cancelled = false;

    const loadAdminState = async () => {
      const storedEmail = window.localStorage.getItem(USER_EMAIL_STORAGE_KEY);
      if (storedEmail) {
        setShowAdminMenuItem(isPlatformAdminEmail(storedEmail));
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!cancelled) {
          setShowAdminMenuItem(isPlatformAdminEmail(user?.email));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        const isSupabaseLockAbort =
          (error instanceof DOMException && error.name === "AbortError") || message.includes("Lock broken by another request");

        if (!cancelled && !isSupabaseLockAbort) {
          setShowAdminMenuItem(false);
        }
      }
    };

    void loadAdminState();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const visibleSidebarLinks = mode === "admin" ? adminSidebarLinks : sidebarLinks;
  const isAdminShell = mode === "admin";

  const loadPendingGuestNotesCount = useCallback(async () => {
    if (!isAdminShell) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch("/api/lead-access/admin/notes?summary=1", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const payload = (await response.json()) as { pendingCount?: number };
      if (!response.ok) return;
      setPendingGuestNotesCount(Math.max(0, Number(payload.pendingCount ?? 0)));
    } catch {
      setPendingGuestNotesCount(0);
    }
  }, [isAdminShell, supabase]);

  useEffect(() => {
    void loadPendingGuestNotesCount();

    const handleNotesUpdated = () => {
      void loadPendingGuestNotesCount();
    };

    window.addEventListener("lead-access-notes-updated", handleNotesUpdated);
    return () => {
      window.removeEventListener("lead-access-notes-updated", handleNotesUpdated);
    };
  }, [loadPendingGuestNotesCount]);

  const renderPendingBadge = (count: number, className: string) => {
    if (count <= 0) return null;
    return (
      <span className={className} aria-label={`${count} guest note${count === 1 ? "" : "s"} pending approval`}>
        {count > 99 ? "99+" : count}
      </span>
    );
  };

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
          <header className={`${styles.mobileHeader} ${isAdminShell ? styles.mobileHeaderAdmin : ""}`}>
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

          <aside
            className={`${styles.sidebar} ${desktopSidebarCollapsed ? styles.sidebarCollapsed : ""} ${
              isAdminShell ? styles.sidebarAdmin : ""
            }`}
          >
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
              {visibleSidebarLinks.map((link) => {
                const childLinks = "children" in link ? link.children : undefined;
                const hasActiveChild = childLinks?.some((child) => child.key === activeNav) ?? false;
                const childrenOpen = link.key === "lead-access" ? leadAccessChildrenOpen || hasActiveChild : true;
                return (
                  <div key={link.href} className={styles.sidebarNavGroup}>
                    <div className={childLinks?.length ? styles.sidebarParentRow : undefined}>
                      <Link
                        href={link.href}
                        className={`${styles.sidebarLink} ${activeNav === link.key || hasActiveChild ? styles.sidebarLinkActive : ""}`}
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
                        {link.key === "lead-access" && !childrenOpen ? renderPendingBadge(pendingGuestNotesCount, styles.sidebarParentBadge) : null}
                      </Link>
                      {childLinks?.length ? (
                        <button
                          type="button"
                          className={styles.sidebarSubmenuToggle}
                          aria-label={`${childrenOpen ? "Collapse" : "Expand"} ${link.label} menu`}
                          aria-expanded={childrenOpen}
                          onClick={() => setLeadAccessChildrenOpen((current) => !current)}
                        >
                          <span className={`${styles.sidebarSubmenuChevron} ${childrenOpen ? styles.sidebarSubmenuChevronOpen : ""}`} aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                    {childLinks?.length && childrenOpen ? (
                      <div className={styles.sidebarChildLinks} id={`${link.key}-children`}>
                        {childLinks.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`${styles.sidebarChildLink} ${activeNav === child.key ? styles.sidebarChildLinkActive : ""}`}
                            title={child.label}
                            aria-label={child.label}
                          >
                            <Image
                              src={child.icon}
                              alt=""
                              width={18}
                              height={18}
                              className={styles.sidebarChildIcon}
                            />
                            <span className={styles.sidebarChildLabel}>{child.label}</span>
                            {child.key === "lead-access-notes" ? renderPendingBadge(pendingGuestNotesCount, styles.sidebarBadge) : null}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>

            <div className={styles.sidebarFooter}>
              {!isAdminShell && showAdminMenuItem ? (
                <Link
                  href="/admin/users"
                  className={`${styles.sidebarLink} ${activeNav === "admin" ? styles.sidebarLinkActive : ""}`}
                  title="Admin"
                  aria-label="Admin"
                >
                  <Image
                    src="/icons/configure.svg"
                    alt=""
                    width={22}
                    height={22}
                    className={styles.sidebarIcon}
                  />
                  <span className={styles.sidebarLinkLabel}>Admin</span>
                </Link>
              ) : null}
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
            <header className={`${styles.topbar} ${isAdminShell ? styles.topbarAdmin : ""}`}>
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
        <div
          className={`${styles.mobileMenu} ${isAdminShell ? styles.mobileMenuAdmin : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Dashboard menu"
        >
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
            {isAdminShell ? (
              <>
                <Link href="/admin/users" onClick={() => setMobileMenuOpen(false)}>
                  Users
                </Link>
                <Link href="/admin/organisations" onClick={() => setMobileMenuOpen(false)}>
                  Organisations
                </Link>
                <Link href="/lead-access" onClick={() => setMobileMenuOpen(false)}>
                  Lead Access
                </Link>
                <Link href="/lead-access/notes" onClick={() => setMobileMenuOpen(false)} className={styles.mobileMenuChildLink}>
                  <span>Guest Notes</span>
                  {renderPendingBadge(pendingGuestNotesCount, styles.mobileMenuBadge)}
                </Link>
              </>
            ) : (
              <>
                <Link href="/templates" onClick={() => setMobileMenuOpen(false)}>
                  Templates
                </Link>
                <Link href="/case-studies" onClick={() => setMobileMenuOpen(false)}>
                  Case Studies
                </Link>
              </>
            )}
            {!isAdminShell && showAdminMenuItem ? (
              <Link href="/admin/users" onClick={() => setMobileMenuOpen(false)}>
                Admin
              </Link>
            ) : null}
            {!isAdminShell ? (
              <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
                Account
              </Link>
            ) : null}
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
