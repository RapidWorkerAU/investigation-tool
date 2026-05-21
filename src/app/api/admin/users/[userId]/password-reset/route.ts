import { NextResponse } from "next/server";
import { emailTemplates, sendResendEmail } from "@/lib/email";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { insertUserProfileActivity } from "@/lib/userProfileActivity";

type ProfileRow = {
  email: string | null;
  full_name: string | null;
};

function firstName(fullName: string | null | undefined) {
  return fullName?.trim().split(/\s+/)[0] ?? "";
}

export async function POST(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { user: adminUser, response } = await requirePlatformAdmin(request);
    if (response) return response;

    const { userId } = await context.params;
    const supabase = createServiceRoleClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email,full_name")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw new Error(profileError.message);
    const row = profile as ProfileRow | null;
    const email = row?.email?.trim().toLowerCase() ?? "";

    if (!email) {
      return NextResponse.json({ error: "User email not found." }, { status: 404 });
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
    const redirectTo = `${siteUrl}/auth/set-password`;
    const linkResult = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo,
      },
    });

    if (linkResult.error || !linkResult.data.properties?.action_link) {
      await insertUserProfileActivity(supabase, {
        userId,
        actorUserId: adminUser?.userId ?? null,
        action: "admin_password_reset_email",
        status: "failed",
        summary: "Password reset email failed.",
        metadata: {
          source: "supabase",
          email,
          error: linkResult.error?.message || "Action link missing.",
        },
      });
      throw new Error(linkResult.error?.message || "Unable to generate password reset link.");
    }

    const template = emailTemplates.forgotPassword({
      firstName: firstName(row?.full_name),
      actionUrl: linkResult.data.properties.action_link,
    });

    try {
      await sendResendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        tags: [
          { name: "category", value: "admin" },
          { name: "template", value: "admin-password-reset" },
        ],
      });
    } catch (emailError) {
      await insertUserProfileActivity(supabase, {
        userId,
        actorUserId: adminUser?.userId ?? null,
        action: "admin_password_reset_email",
        status: "failed",
        summary: "Password reset email failed.",
        metadata: {
          source: "resend",
          email,
          error: emailError instanceof Error ? emailError.message : String(emailError),
        },
      });
      throw emailError;
    }

    await insertUserProfileActivity(supabase, {
      userId,
      actorUserId: adminUser?.userId ?? null,
      action: "admin_password_reset_email",
      status: "success",
      summary: "Admin sent a password reset email.",
      metadata: {
        email,
      },
    });

    return NextResponse.json({ ok: true, email });
  } catch (error) {
    console.error("Admin password reset failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send password reset email." },
      { status: 500 },
    );
  }
}
