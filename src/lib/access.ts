export type BillingAccessState = {
  userId: string;
  stripeCustomerId: string | null;
  accessSelectionRequired: boolean;
  currentAccessType: "trial_7d" | "pass_30d" | "subscription_monthly" | null;
  currentAccessStatus:
    | "selection_required"
    | "checkout_required"
    | "pending_activation"
    | "active"
    | "expired"
    | "payment_failed"
    | "cancelled";
  currentAccessPeriodId: string | null;
  currentStripeSubscriptionId: string | null;
  currentStripePriceId: string | null;
  currentPeriodStartsAt: string | null;
  currentPeriodEndsAt: string | null;
  readOnlyReason: string | null;
  canCreateMaps: boolean;
  canEditMaps: boolean;
  canExport: boolean;
  canShareMaps: boolean;
  canDuplicateMaps: boolean;
};

export function accessRequiresSelection(state: BillingAccessState | null | undefined) {
  if (!state) return true;

  return (
    state.accessSelectionRequired ||
    state.currentAccessStatus === "selection_required" ||
    state.currentAccessStatus === "checkout_required" ||
    state.currentAccessStatus === "pending_activation"
  );
}

export function accessIsReadOnlyRestricted(state: BillingAccessState | null | undefined) {
  if (!state) return false;

  return (
    state.currentAccessStatus === "expired" ||
    state.currentAccessStatus === "payment_failed" ||
    state.currentAccessStatus === "cancelled"
  );
}

export function accessBlocksInvestigationEntry(state: BillingAccessState | null | undefined) {
  if (!state) return false;
  return state.currentAccessType === "trial_7d" && accessIsReadOnlyRestricted(state);
}

export function isExpiredTrialAccess(state: BillingAccessState | null | undefined) {
  if (!state) return false;
  return state.currentAccessType === "trial_7d" && state.currentAccessStatus === "expired";
}

export async function fetchAccessState(accessToken: string) {
  const response = await fetch("/api/access/state", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Unable to load access state.");
  }

  return data as BillingAccessState;
}
