import { NextRequest, NextResponse } from "next/server";
import { sendAdminNewSignupEmail } from "@/lib/email";
import { createAnonServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type SignupBody = {
  email?: string;
  password?: string;
  fullName?: string;
  redirectTo?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SignupBody | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";
  const fullName = body?.fullName?.trim() ?? "";
  const redirectTo = body?.redirectTo?.trim() || `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/confirm-account`;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const supabase = createAnonServerClient();

  const { data: emailExists, error: emailExistsError } = await supabase.rpc("email_exists_for_auth", {
    p_email: email,
  });

  if (emailExistsError) {
    return NextResponse.json({ error: "Unable to verify that email address right now. Please try again." }, { status: 500 });
  }

  if (emailExists) {
    return NextResponse.json({ error: "That email address is already registered. Please sign in instead." }, { status: 409 });
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        full_name: fullName,
        name: fullName,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    await sendAdminNewSignupEmail({
      email,
      fullName,
    });
  } catch (notificationError) {
    console.error("Failed to send admin signup notification", notificationError);
  }

  return NextResponse.json({ ok: true });
}
