import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

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

  if (!billingProfile?.stripe_customer_id) {
    return NextResponse.json({ error: "No Stripe customer is linked to this account." }, { status: 400 });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });
  const session = await stripe.billingPortal.sessions.create({
    customer: billingProfile.stripe_customer_id,
    return_url: `${siteUrl}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
