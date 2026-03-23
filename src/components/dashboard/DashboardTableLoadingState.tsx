"use client";

import styles from "./DashboardShell.module.css";

export function DashboardPageSkeleton({ title }: { title: string }) {
  return (
    <div className={styles.viewport}>
      <div className={styles.deviceShell}>
        <div className={styles.deviceBezel}>
      <aside className={styles.sidebar} aria-hidden="true">
        <div className={styles.sidebarTop}>
          <div className={styles.accountSummaryPrimary}>
            <div className={styles.pageSkeletonAvatar} />
            <div className={styles.pageEyebrowSkeleton} style={{ width: "7rem" }} />
          </div>
          <div className={styles.tableToolbarSkeletonButton} style={{ width: "2.5rem", height: "2.5rem" }} />
        </div>
        <div className={styles.sidebarNav}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={styles.sidebarSkeletonLink} />
          ))}
        </div>
      </aside>

      <section className={styles.canvas}>
        <header className={styles.topbar} aria-hidden="true">
          <div className={styles.greetingBlock}>
            <div>
            <div className={styles.pageEyebrowSkeleton} />
            <div className={styles.pageTitleSkeleton} />
            <div className={styles.pageSubtitleSkeleton} />
          </div>
          </div>
          <div className={styles.accountSummarySkeleton} />
        </header>

        <div className={styles.body}>
        <section className={styles.accountCard} aria-label={`${title} loading`}>
          <div className={styles.tableToolbar}>
            <div className={styles.tableToolbarSkeletonButton} />
          </div>
          <div className={styles.pageSkeletonTable}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={styles.pageSkeletonRow}>
                <div className={styles.pageSkeletonAvatar} />
                <div className={styles.pageSkeletonRowBody}>
                  <div className={styles.pageSkeletonLineShort} />
                  <div className={styles.pageSkeletonLineMedium} />
                  <div className={styles.pageSkeletonLineLong} />
                </div>
              </div>
            ))}
          </div>
        </section>
        </div>
      </section>
        </div>
      </div>
    </div>
  );
}

export function DashboardTableLoadingState({ message }: { message: string }) {
  return (
    <div className={styles.tableLoadingState}>
      <div className={styles.tableLoadingBar} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function DashboardMobileLoadingState({ message }: { message: string }) {
  return (
    <div className={styles.dashboardMobileState}>
      <div className={styles.tableLoadingBar} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
