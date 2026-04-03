import { DashboardPageSkeleton } from "@/components/dashboard/DashboardTableLoadingState";

export default function TemplatesLoading() {
  return (
    <DashboardPageSkeleton
      activeNav="templates"
      eyebrow="Template Library"
      title="Templates"
      subtitle="Manage saved investigation templates here. Create live investigations from the dashboard when you want to use a template in active work."
      rows={5}
      columns="4% 32% 16% 18% 18% 12%"
    />
  );
}
