import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { emailTemplates, loadEmailRecipientByUserId, sendResendEmail } from "@/lib/email";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function mapSubscriptionStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
    case "trialing":
      return "active" as const;
    case "past_due":
    case "unpaid":
      return "payment_failed" as const;
    case "incomplete":
      return "pending_activation" as const;
    case "canceled":
    case "incomplete_expired":
      return "cancelled" as const;
    default:
      return "pending_activation" as const;
  }
}

async function refreshProfileForUser(userId: string) {
  const supabase = createServiceRoleClient();
  await supabase.rpc("refresh_billing_profile_state", { p_user_id: userId });
}

async function sendLifecycleEmail(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  template: { subject: string; html: string; text: string },
  templateName: string,
) {
  const recipient = await loadEmailRecipientByUserId(supabase, userId);
  if (!recipient) return;

  try {
    await sendResendEmail({
      to: recipient.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [
        { name: "category", value: "billing" },
        { name: "template", value: templateName },
      ],
    });
  } catch (error) {
    console.error(`Failed to send ${templateName} email`, error);
  }
}

async function sendWelcomeEmailIfFirstAccess(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string,
) {
  const { count } = await supabase
    .from("access_periods")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count !== 1) return;

  const recipient = await loadEmailRecipientByUserId(supabase, userId);
  if (!recipient) return;

  try {
    const welcome = emailTemplates.welcome({
      firstName: recipient.firstName,
      actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
    });

    await sendResendEmail({
      to: recipient.email,
      subject: welcome.subject,
      html: welcome.html,
      text: welcome.text,
      tags: [
        { name: "category", value: "lifecycle" },
        { name: "template", value: "welcome" },
      ],
    });
  } catch (error) {
    console.error("Failed to send welcome email", error);
  }
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  if (!secretKey) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
  }

  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });
  const payload = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = (session.metadata?.user_id || session.client_reference_id) as string | undefined;
        const accessType = session.metadata?.access_type as string | undefined;
        const customerId = typeof session.customer === "string" ? session.customer : null;

        if (userId && customerId) {
          await supabase
            .from("billing_profiles")
            .upsert(
              {
                user_id: userId,
                stripe_customer_id: customerId,
              },
              { onConflict: "user_id" }
            );
        }

        if (userId && accessType === "pass_30d") {
          let lifecycleEndsAt: string | null = null;
          let createdAccessPeriod = false;
          const existing = await supabase
            .from("access_periods")
            .select("id")
            .eq("stripe_checkout_session_id", session.id)
            .maybeSingle();

          if (!existing.data?.id) {
            const now = new Date();
            const nowIso = now.toISOString();
            const { data: queuedPass } = await supabase
              .from("access_periods")
              .select("id")
              .eq("user_id", userId)
              .eq("access_type", "pass_30d")
              .eq("access_status", "active")
              .gt("starts_at", nowIso)
              .order("starts_at", { ascending: true })
              .limit(1)
              .maybeSingle();

            const { data: activePass } = await supabase
              .from("access_periods")
              .select("id,ends_at,reminder_3_business_days_sent_at")
              .eq("user_id", userId)
              .eq("access_type", "pass_30d")
              .eq("access_status", "active")
              .lte("starts_at", nowIso)
              .gt("ends_at", nowIso)
              .order("ends_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            const startsAt =
              activePass?.id && activePass.reminder_3_business_days_sent_at && !queuedPass?.id
                ? activePass.ends_at
                : nowIso;
            const endsAt = new Date(new Date(startsAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
            lifecycleEndsAt = endsAt;
            createdAccessPeriod = true;

            await supabase.from("access_periods").insert({
              user_id: userId,
              access_type: "pass_30d",
              access_status: "active",
              access_source: "stripe_checkout",
              stripe_checkout_session_id: session.id,
              stripe_price_id: session.metadata?.price_id ?? null,
              stripe_payment_status: session.payment_status ?? null,
              starts_at: startsAt,
              ends_at: endsAt,
              map_limit: 1,
              maps_allocated: 0,
              export_allowed: true,
              write_allowed: true,
              share_allowed: true,
              duplicate_allowed: false,
              notes: "30 day access pass",
            });
          }

          await refreshProfileForUser(userId);

          await sendLifecycleEmail(
            supabase,
            userId,
            emailTemplates.pass30Started({
              endsAt: lifecycleEndsAt,
              actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
            }),
            "pass-30-started",
          );

          if (createdAccessPeriod) {
            await sendWelcomeEmailIfFirstAccess(supabase, userId);
          }
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
        const status = mapSubscriptionStatus(subscription.status);
        const startsAt = new Date(subscription.current_period_start * 1000).toISOString();
        const endsAt = new Date(subscription.current_period_end * 1000).toISOString();
        const priceId = subscription.items.data[0]?.price?.id ?? null;

        if (userId && customerId) {
          await supabase
            .from("billing_profiles")
            .upsert(
              {
                user_id: userId,
                stripe_customer_id: customerId,
                current_stripe_subscription_id: subscription.id,
              },
              { onConflict: "user_id" }
            );
        }

        if (userId) {
          const existing = await supabase
            .from("access_periods")
            .select("id,access_status")
            .eq("stripe_subscription_id", subscription.id)
            .eq("starts_at", startsAt)
            .maybeSingle();

          let createdNewPeriod = false;

          if (existing.data?.id) {
            await supabase
              .from("access_periods")
              .update({
                access_status: status,
                stripe_price_id: priceId,
                stripe_payment_status: subscription.status,
                ends_at: endsAt,
                export_allowed: status === "active",
                write_allowed: status === "active",
                share_allowed: status === "active",
                duplicate_allowed: status === "active",
              })
              .eq("id", existing.data.id);
          } else {
            createdNewPeriod = true;
            await supabase.from("access_periods").insert({
              user_id: userId,
              access_type: "subscription_monthly",
              access_status: status,
              access_source: "stripe_subscription",
              stripe_subscription_id: subscription.id,
              stripe_price_id: priceId,
              stripe_payment_status: subscription.status,
              starts_at: startsAt,
              ends_at: endsAt,
              map_limit: null,
              maps_allocated: 0,
              export_allowed: status === "active",
              write_allowed: status === "active",
              share_allowed: status === "active",
              duplicate_allowed: status === "active",
              notes: "Recurring monthly subscription",
            });
          }

          await refreshProfileForUser(userId);

          if (status === "active") {
            if (event.type === "customer.subscription.created") {
              await sendLifecycleEmail(
                supabase,
                userId,
                emailTemplates.subscriptionStarted({
                  renewalDate: endsAt,
                  actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
                }),
                "subscription-started",
              );

              if (createdNewPeriod) {
                await sendWelcomeEmailIfFirstAccess(supabase, userId);
              }
            } else if (createdNewPeriod || existing.data?.access_status === "payment_failed") {
              await sendLifecycleEmail(
                supabase,
                userId,
                emailTemplates.subscriptionRenewed({
                  renewalDate: endsAt,
                  actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
                }),
                "subscription-renewed",
              );
            }
          }
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (userId) {
          await supabase
            .from("access_periods")
            .update({
              access_status: "cancelled",
              stripe_payment_status: subscription.status,
              ends_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

          await refreshProfileForUser(userId);
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;

        if (subscriptionId) {
          const { data: period } = await supabase
            .from("access_periods")
            .select("id,user_id")
            .eq("stripe_subscription_id", subscriptionId)
            .order("starts_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (period?.id) {
            await supabase
              .from("access_periods")
              .update({
                access_status: "payment_failed",
                stripe_invoice_id: invoice.id,
                stripe_payment_status: invoice.status ?? "payment_failed",
              })
              .eq("id", period.id);

            await refreshProfileForUser(period.user_id);

            await sendLifecycleEmail(
              supabase,
              period.user_id,
              emailTemplates.paymentFailed({
                actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/account`,
              }),
              "payment-failed",
            );
          }
        }

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;
        const billingReason = invoice.billing_reason ?? null;

        if (subscriptionId && billingReason === "subscription_cycle") {
          const { data: period } = await supabase
            .from("access_periods")
            .select("user_id,ends_at")
            .eq("stripe_subscription_id", subscriptionId)
            .order("starts_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (period?.user_id) {
            await sendLifecycleEmail(
              supabase,
              period.user_id,
              emailTemplates.subscriptionRenewed({
                renewalDate: period.ends_at,
                actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
              }),
              "subscription-renewed",
            );
          }
        }

        break;
      }

      default:
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
