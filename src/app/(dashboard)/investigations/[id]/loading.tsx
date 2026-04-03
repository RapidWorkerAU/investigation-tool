import { DashboardPageSkeleton } from "@/components/dashboard/DashboardTableLoadingState";

export default function InvestigationReportLoading() {
  return (
    <DashboardPageSkeleton
      activeNav="dashboard"
      title="Investigation Report"
      subtitle="Review the investigation record before opening the incident map."
      variant="detail"
    />
  );
}
