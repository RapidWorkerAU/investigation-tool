import { NextRequest, NextResponse } from "next/server";
import { emailTemplates, loadEmailRecipientByUserId, sendAdminAccessActivatedEmail, sendResendEmail } from "@/lib/email";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const user = await getUserFromAuthHeader(authHeader);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("start_trial_access", {
    p_user_id: user.userId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const row = Array.isArray(data) ? data[0] : data;

  const recipient = await loadEmailRecipientByUserId(supabase, user.userId);
  if (recipient) {
    const { count: accessPeriodCount } = await supabase
      .from("access_periods")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.userId);

    if (accessPeriodCount === 1) {
      const welcome = emailTemplates.welcome({
        firstName: recipient.firstName,
        actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
      });

      try {
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

      try {
        await sendAdminAccessActivatedEmail({
          email: recipient.email,
          fullName: recipient.fullName,
          accessType: "trial_7d",
        });
      } catch (error) {
        console.error("Failed to send admin trial signup notification", error);
      }
    }

    const email = emailTemplates.trialStarted({
      firstName: recipient.firstName,
      endsAt: row?.current_period_ends_at ?? null,
      actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
    });

    try {
      await sendResendEmail({
        to: recipient.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        tags: [
          { name: "category", value: "access" },
          { name: "template", value: "trial-started" },
        ],
      });
    } catch (error) {
      console.error("Failed to send trial started email", error);
    }
  }

  return NextResponse.json({
    userId: row?.user_id ?? user.userId,
    currentAccessType: row?.current_access_type ?? null,
    currentAccessStatus: row?.current_access_status ?? "active",
    currentPeriodEndsAt: row?.current_period_ends_at ?? null,
  });
}
