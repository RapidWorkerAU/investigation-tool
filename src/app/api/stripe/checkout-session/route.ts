import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();
    const authHeader = req.headers.get("authorization");
    const user = await getUserFromAuthHeader(authHeader);
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const pass30PriceId = process.env.STRIPE_PRICE_BASIC;
    const monthlyPriceId = process.env.STRIPE_PRICE_PRO;

    if (!secretKey) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (plan !== "pass_30d" && plan !== "subscription_monthly") {
      return NextResponse.json({ error: "Unsupported access type for Stripe checkout." }, { status: 400 });
    }

    const isSubscription = plan === "subscription_monthly";
    const priceId = isSubscription ? monthlyPriceId : pass30PriceId;

    if (!priceId) {
      return NextResponse.json({ error: "Missing Stripe price id for selected access type." }, { status: 400 });
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });
    const supabase = createServiceRoleClient();
    const { data: billingProfile } = await supabase
      .from("billing_profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.userId)
      .maybeSingle();

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: billingProfile?.stripe_customer_id || undefined,
      customer_email: billingProfile?.stripe_customer_id ? undefined : user.email,
      client_reference_id: user.userId,
      metadata: {
        user_id: user.userId,
        access_type: plan,
        price_id: priceId,
      },
      subscription_data: isSubscription
        ? {
            metadata: {
              user_id: user.userId,
              access_type: plan,
            },
          }
        : undefined,
      success_url: `${siteUrl}/subscribe?checkout=success`,
      cancel_url: `${siteUrl}/subscribe?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Checkout session failed" }, { status: 500 });
  }
}
