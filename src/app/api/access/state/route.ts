import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const user = await getUserFromAuthHeader(authHeader);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data: refreshed, error: refreshError } = await supabase.rpc("refresh_billing_profile_state", {
    p_user_id: user.userId,
  });

  if (refreshError) {
    return NextResponse.json({ error: refreshError.message }, { status: 500 });
  }

  const row = Array.isArray(refreshed) ? refreshed[0] : refreshed;

  if (!row) {
    return NextResponse.json({ error: "Access state not found." }, { status: 404 });
  }

  let cancellationScheduled = false;

  if (row.current_access_period_id) {
    const { data: period } = await supabase
      .from("access_periods")
      .select("stripe_payment_status")
      .eq("id", row.current_access_period_id)
      .maybeSingle();

    cancellationScheduled =
      row.current_access_type === "subscription_monthly" &&
      row.current_access_status === "active" &&
      period?.stripe_payment_status === "cancel_at_period_end";
  }

  return NextResponse.json({
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id ?? null,
    accessSelectionRequired: Boolean(row.access_selection_required),
    currentAccessType: row.current_access_type ?? null,
    currentAccessStatus: row.current_access_status,
    currentAccessPeriodId: row.current_access_period_id ?? null,
    currentStripeSubscriptionId: row.current_stripe_subscription_id ?? null,
    currentStripePriceId: row.current_stripe_price_id ?? null,
    cancellationScheduled,
    currentPeriodStartsAt: row.current_period_starts_at ?? null,
    currentPeriodEndsAt: row.current_period_ends_at ?? null,
    readOnlyReason: row.read_only_reason ?? null,
    canCreateMaps: Boolean(row.can_create_maps),
    canEditMaps: Boolean(row.can_edit_maps),
    canExport: Boolean(row.can_export),
    canShareMaps: Boolean(row.can_share_maps),
    canDuplicateMaps: Boolean(row.can_duplicate_maps),
  });
}
