import { NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await getUserFromAuthHeader(authHeader);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase.rpc("accept_pending_organisation_invites", {
      p_user_id: user.userId,
      p_email: user.email,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Accept organisation invites failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to accept organisation invites." },
      { status: 500 }
    );
  }
}
