import DashboardShell from "@/components/dashboard/DashboardShell";
import { ReportProgressLoadingView } from "@/components/loading/ReportProgressLoadingView";
import shellStyles from "@/components/dashboard/DashboardShell.module.css";

export default function EditReportLoading() {
  return (
    <DashboardShell
      activeNav="dashboard"
      eyebrow="Investigation Tool"
      title="Preparing Report Editor"
      subtitle="Loading saved report version."
    >
      <section className={shellStyles.accountCard}>
        <ReportProgressLoadingView
          phase={0}
          title="Preparing Report Editor"
          subtitle="Loading saved report content and evidence previews."
          inline
        />
      </section>
    </DashboardShell>
  );
}
