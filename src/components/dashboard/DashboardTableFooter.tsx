"use client";

import styles from "./DashboardTableFooter.module.css";

type DashboardTableFooterProps = {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  label?: string;
};

export default function DashboardTableFooter({
  total,
  page,
  pageSize,
  onPageChange,
  label = "results",
}: DashboardTableFooterProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(safePage * pageSize, total);

  return (
    <div className={styles.footer}>
      <div className={styles.summary}>
        Showing {start}-{end} of {total} {label}
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.button}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
        >
          Prev
        </button>
        <span className={styles.page}>
          Page {safePage} of {totalPages}
        </span>
        <button
          type="button"
          className={styles.button}
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
