import { DashboardPageSkeleton } from "@/components/dashboard/DashboardTableLoadingState";

export default function AccountLoading() {
  return (
    <DashboardPageSkeleton
      activeNav="account"
      eyebrow="Account"
      title="Edit Profile"
      subtitle="Manage your profile, account data and subscription history."
      variant="detail"
    />
  );
}
