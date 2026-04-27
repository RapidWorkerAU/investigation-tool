import DashboardShell from "@/components/dashboard/DashboardShell";
import { ReportProgressLoadingView } from "@/components/loading/ReportProgressLoadingView";
import shellStyles from "@/components/dashboard/DashboardShell.module.css";

export default function GeneratedReportLoading() {
  return (
    <DashboardShell
      activeNav="dashboard"
      eyebrow="Investigation Tool"
      title="Preparing PDF Viewer"
      subtitle="Loading report content."
    >
      <section className={shellStyles.accountCard}>
        <ReportProgressLoadingView
          phase={0}
          title="Preparing PDF Viewer"
          subtitle="Loading report content and preparing the preview."
          helperText="This may take a few minutes for larger reports."
          inline
        />
      </section>
    </DashboardShell>
  );
}
