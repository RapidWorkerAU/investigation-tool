import { NextRequest, NextResponse } from "next/server";
import { emailTemplates, loadEmailRecipientByUserId, sendResendEmail } from "@/lib/email";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type AccessPeriodReminderRow = {
  id: string;
  user_id: string;
  ends_at: string;
  access_type: "trial_7d" | "pass_30d";
  access_status: string;
  reminder_3_business_days_sent_at: string | null;
  reminder_day_of_expiry_sent_at: string | null;
  expiry_notice_sent_at: string | null;
};

const REMINDER_TIMEZONE = "Australia/Perth";

function requireCronSecret(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;

  const bearer = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");

  return bearer === `Bearer ${expected}` || headerSecret === expected;
}

function zonedDateKey(value: string | Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(typeof value === "string" ? new Date(value) : value);
}

function dateKeyToUtcDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function isWeekend(date: Date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function businessDaysUntil(todayKey: string, endKey: string) {
  const start = dateKeyToUtcDate(todayKey);
  const end = dateKeyToUtcDate(endKey);

  if (end < start) return -1;
  if (end.getTime() === start.getTime()) return 0;

  let businessDays = 0;
  const cursor = new Date(start);

  while (cursor < end) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (!isWeekend(cursor)) {
      businessDays += 1;
    }
  }

  return businessDays;
}

async function sendTaggedEmail(to: string, subject: string, html: string, text: string, template: string) {
  try {
    await sendResendEmail({
      to,
      subject,
      html,
      text,
      tags: [
        { name: "category", value: "access-reminder" },
        { name: "template", value: template },
      ],
    });
  } catch (error) {
    console.error(`Failed to send ${template} email`, error);
    throw error;
  }
}

async function handleReminderRequest(request: NextRequest) {
  if (!requireCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const todayKey = zonedDateKey(new Date(), REMINDER_TIMEZONE);

  const { data, error } = await supabase
    .from("access_periods")
    .select(
      "id,user_id,ends_at,access_type,access_status,reminder_3_business_days_sent_at,reminder_day_of_expiry_sent_at,expiry_notice_sent_at",
    )
    .in("access_type", ["trial_7d", "pass_30d"])
    .in("access_status", ["active", "expired"])
    .not("ends_at", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as AccessPeriodReminderRow[];
  let threeBusinessDaysSent = 0;
  let endsTodaySent = 0;
  let expiredSent = 0;

  for (const row of rows) {
    const endKey = zonedDateKey(row.ends_at, REMINDER_TIMEZONE);
    const daysRemaining = businessDaysUntil(todayKey, endKey);
    const recipient = await loadEmailRecipientByUserId(supabase, row.user_id);

    if (!recipient) {
      continue;
    }

    if (row.access_type === "pass_30d" && daysRemaining === 3 && !row.reminder_3_business_days_sent_at) {
      const email = emailTemplates.accessEndingSoon({
        firstName: recipient.firstName,
        endsAt: row.ends_at,
      });

      await sendTaggedEmail(recipient.email, email.subject, email.html, email.text, "access-ending-soon");
      await supabase
        .from("access_periods")
        .update({ reminder_3_business_days_sent_at: new Date().toISOString() })
        .eq("id", row.id);
      threeBusinessDaysSent += 1;
      continue;
    }

    if (daysRemaining === 0 && !row.reminder_day_of_expiry_sent_at) {
      const email =
        row.access_type === "trial_7d"
          ? emailTemplates.trialEndsToday({
              firstName: recipient.firstName,
              endsAt: row.ends_at,
            })
          : emailTemplates.accessEndsToday({
              firstName: recipient.firstName,
              endsAt: row.ends_at,
            });

      await sendTaggedEmail(
        recipient.email,
        email.subject,
        email.html,
        email.text,
        row.access_type === "trial_7d" ? "trial-ends-today" : "access-ends-today",
      );
      await supabase
        .from("access_periods")
        .update({ reminder_day_of_expiry_sent_at: new Date().toISOString() })
        .eq("id", row.id);
      endsTodaySent += 1;
      continue;
    }

    if (daysRemaining < 0 && !row.expiry_notice_sent_at) {
      if (row.access_type === "pass_30d") {
        const email = emailTemplates.accessExpired({
          firstName: recipient.firstName,
        });

        await sendTaggedEmail(recipient.email, email.subject, email.html, email.text, "access-expired");
      }

      await supabase
        .from("access_periods")
        .update({
          expiry_notice_sent_at: new Date().toISOString(),
          access_status: row.access_status === "active" ? "expired" : row.access_status,
        })
        .eq("id", row.id);

      await supabase.rpc("refresh_billing_profile_state", { p_user_id: row.user_id });
      expiredSent += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    checked: rows.length,
    sent: {
      threeBusinessDaysSent,
      endsTodaySent,
      expiredSent,
    },
  });
}

export async function GET(request: NextRequest) {
  return handleReminderRequest(request);
}

export async function POST(request: NextRequest) {
  return handleReminderRequest(request);
}
