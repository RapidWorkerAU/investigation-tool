"use client";

import DashboardShell from "./DashboardShell";
import shellStyles from "./DashboardShell.module.css";
import loaderStyles from "@/components/loading/HsesLoaders.module.css";
import { CardGridSkeleton, DetailPageSkeleton, LoadingRow, TableSkeleton } from "@/components/loading/HsesLoaders";

type DashboardPageSkeletonProps = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  activeNav?: "dashboard" | "templates" | "account";
  variant?: "table" | "cards" | "detail";
  rows?: number;
  columns?: string;
  showToolbar?: boolean;
};

function HeaderSummarySkeleton() {
  return (
    <div className={shellStyles.accountSummary} aria-hidden="true">
      <div className={shellStyles.accountSummaryText}>
        <div className={shellStyles.accountSummaryPrimary}>
          <div className={loaderStyles.line} style={{ width: "6rem" }} />
          <div className={loaderStyles.line} style={{ width: "12rem" }} />
        </div>
      </div>
    </div>
  );
}

export function DashboardPageSkeleton({
  title,
  eyebrow = "Investigation Tool",
  subtitle,
  activeNav = "dashboard",
  variant = "table",
  rows,
  columns,
  showToolbar,
}: DashboardPageSkeletonProps) {
  const content =
    variant === "cards" ? (
      <CardGridSkeleton cards={3} />
    ) : variant === "detail" ? (
      <DetailPageSkeleton />
    ) : (
      <TableSkeleton rows={rows} columns={columns} showToolbar={showToolbar} />
    );

  return (
    <DashboardShell
      activeNav={activeNav}
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      headerRight={<HeaderSummarySkeleton />}
    >
      <section className={shellStyles.accountCard} aria-label={`${title} loading`}>
        {content}
      </section>
    </DashboardShell>
  );
}

export function DashboardTableLoadingState({ message }: { message: string }) {
  return (
    <div className={shellStyles.tableLoadingState}>
      <LoadingRow label={message} />
    </div>
  );
}

export function DashboardMobileLoadingState({ message }: { message: string }) {
  return (
    <div className={shellStyles.dashboardMobileState}>
      <LoadingRow label={message} />
    </div>
  );
}
