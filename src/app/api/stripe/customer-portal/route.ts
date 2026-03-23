import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

async function getOrCreateStripeCustomerId(
  stripe: Stripe,
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  email: string,
  existingCustomerId?: string | null,
) {
  if (existingCustomerId) {
    return existingCustomerId;
  }

  const customers = await stripe.customers.list({
    email,
    limit: 10,
  });

  const matchedCustomer = customers.data.find((customer) => !customer.deleted && customer.email === email) ?? null;

  const customerId =
    matchedCustomer?.id ??
    (
      await stripe.customers.create({
        email,
        metadata: {
          user_id: userId,
        },
      })
    ).id;

  await supabase
    .from("billing_profiles")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
      },
      { onConflict: "user_id" },
    );

  return customerId;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const user = await getUserFromAuthHeader(authHeader);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!secretKey) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
  }

  const supabase = createServiceRoleClient();
  const { data: billingProfile, error } = await supabase
    .from("billing_profiles")
    .select("stripe_customer_id")
    .eq("user_id", user.userId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });
  const stripeCustomerId = await getOrCreateStripeCustomerId(
    stripe,
    supabase,
    user.userId,
    user.email,
    billingProfile?.stripe_customer_id,
  );

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${siteUrl}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
