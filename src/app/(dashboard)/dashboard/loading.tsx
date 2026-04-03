import { DashboardPageSkeleton } from "@/components/dashboard/DashboardTableLoadingState";

export default function DashboardLoading() {
  return (
    <DashboardPageSkeleton
      activeNav="dashboard"
      title="Investigations"
      subtitle="View and manage your live investigations."
      rows={5}
      columns="5% 22% 14% 11% 14% 12% 12% 10%"
    />
  );
}
