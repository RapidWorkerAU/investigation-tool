"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import styles from "./DashboardShell.module.css";

type NavKey = "dashboard" | "account" | "export";

type DashboardShellProps = {
  activeNav?: NavKey;
  eyebrow: string;
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
};

const sidebarLinks = [
  { key: "dashboard" as const, href: "/dashboard", label: "Dashboard", icon: "/icons/house.svg" },
  { key: "account" as const, href: "/account", label: "Edit Account", icon: "/icons/account.svg", preserveIconColor: true },
];

export default function DashboardShell({ activeNav = "dashboard", eyebrow, title, subtitle, headerRight, children }: DashboardShellProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutPopoverRef = useRef<HTMLDivElement | null>(null);

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
    if (!showLogoutConfirm) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!logoutPopoverRef.current?.contains(event.target as Node)) {
        setShowLogoutConfirm(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showLogoutConfirm]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.deviceShell}>
        <div className={styles.deviceBezel}>
          <aside className={styles.sidebar}>
            <div className={styles.brand} aria-hidden="true">
              <Image
                src="/images/investigation-tool.png"
                alt=""
                width={52}
                height={52}
                className={styles.brandImage}
              />
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
                    className={`${styles.sidebarIcon}${link.preserveIconColor ? ` ${styles.sidebarIconOriginal}` : ""}`}
                  />
                </Link>
              ))}
            </nav>

            <div className={styles.sidebarFooter}>
              <div className={styles.logoutWrap} ref={logoutPopoverRef}>
                <button
                  type="button"
                  className={styles.sidebarLink}
                  title="Logout"
                  aria-label="Logout"
                  onClick={() => setShowLogoutConfirm((current) => !current)}
                >
                  <Image
                    src="/icons/logout.svg"
                    alt=""
                    width={22}
                    height={22}
                    className={styles.sidebarIcon}
                  />
                </button>

                {showLogoutConfirm ? (
                  <div className={styles.logoutPopover}>
                    <p className={styles.logoutPopoverText}>Log out of Investigation Tool?</p>
                    <div className={styles.logoutPopoverActions}>
                      <button
                        type="button"
                        className={`${styles.logoutConfirmButton} ${styles.logoutPopoverButton}`}
                        onClick={() => void handleLogout()}
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut ? "Logging out..." : "Confirm"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>

          <section className={styles.canvas}>
            <header className={styles.topbar}>
              <div className={styles.greetingBlock}>
                <div>
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
    </div>
  );
}
