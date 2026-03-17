import { NextResponse } from "next/server";
import { emailTemplates, sendResendEmail } from "@/lib/email";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const user = await getUserFromAuthHeader(authHeader);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const userId = user.userId;

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name,email")
      .eq("id", userId)
      .maybeSingle();

    const recipientEmail = profile?.email?.trim() || user.email;
    const firstName = profile?.full_name?.trim() ? profile.full_name.trim().split(/\s+/)[0] : null;

    if (recipientEmail) {
      const email = emailTemplates.accountDeletionStarted({ firstName });

      try {
        await sendResendEmail({
          to: recipientEmail,
          subject: email.subject,
          html: email.html,
          text: email.text,
          tags: [
            { name: "category", value: "account" },
            { name: "template", value: "account-deletion-started" },
          ],
        });
      } catch (error) {
        console.error("Failed to send account deletion email", error);
      }
    }

    await supabase.schema("ms").from("document_outline_items").delete().in(
      "node_id",
      (
        await supabase
          .schema("ms")
          .from("document_nodes")
          .select("id")
          .eq("owner_user_id", userId)
      ).data?.map((row) => row.id) ?? ["00000000-0000-0000-0000-000000000000"]
    );

    await supabase.schema("ms").from("canvas_elements").delete().eq("created_by_user_id", userId);
    await supabase.schema("ms").from("document_nodes").delete().eq("owner_user_id", userId);
    await supabase.schema("ms").from("system_maps").delete().eq("owner_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);

    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      return NextResponse.json({ error: deleteUserError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete account." },
      { status: 500 }
    );
  }
}
