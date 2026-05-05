import { DashboardPageSkeleton } from "@/components/dashboard/DashboardTableLoadingState";

export default function LeadAccessLoading() {
  return (
    <DashboardPageSkeleton
      activeNav="lead-access"
      eyebrow="Platform Admin"
      title="Lead Access Codes"
      subtitle="Create, reset, and remove guest access codes tied to a specific email."
      rows={5}
      columns="4% 18% 22% 10% 10% 13% 13% 11%"
      showToolbar
    />
  );
}
