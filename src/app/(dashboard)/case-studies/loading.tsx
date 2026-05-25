import { DashboardPageSkeleton } from "@/components/dashboard/DashboardTableLoadingState";

export default function CaseStudiesLoading() {
  return (
    <DashboardPageSkeleton
      activeNav="case-studies"
      title="Case Studies"
      subtitle="Open public investigation maps in read-only mode."
      rows={5}
      columns="24% 18% 16% 12% 14% 10% 6%"
    />
  );
}
