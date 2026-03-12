import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const basic = process.env.STRIPE_PRICE_BASIC;
    const pro = process.env.STRIPE_PRICE_PRO;

    if (!secretKey) return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });

    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });
    const price = plan === "pro" ? pro : basic;
    if (!price) return NextResponse.json({ error: "Missing Stripe price id for selected plan" }, { status: 400 });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${siteUrl}/checkout/success`,
      cancel_url: `${siteUrl}/checkout/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Checkout session failed" }, { status: 500 });
  }
}
