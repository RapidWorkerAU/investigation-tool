import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import { listActiveLeadMapCampaigns, listLeadAccessHistory } from "@/lib/leadAccess";

const platformAdminUserId = "420266a0-2087-4f36-8c28-340443dd1a82";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await getUserFromAuthHeader(authHeader);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (user.userId !== platformAdminUserId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const [campaigns, history] = await Promise.all([
      listActiveLeadMapCampaigns(),
      listLeadAccessHistory(30),
    ]);

    return NextResponse.json({ campaigns, history });
  } catch (error) {
    console.error("Lead access admin list failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load lead access data." }, { status: 500 });
  }
}
