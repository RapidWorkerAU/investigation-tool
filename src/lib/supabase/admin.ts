import { NextResponse } from "next/server";
import { getUserFromAuthHeader } from "./auth";
import { isPlatformAdminEmail } from "@/lib/platformAdmin";

export const requireAdmin = async (request: Request) => {
  const authHeader = request.headers.get("authorization");
  const user = await getUserFromAuthHeader(authHeader);
  if (!user) {
    return { user: null, response: new NextResponse("Unauthorized.", { status: 401 }) };
  }
  return { user, response: null };
};

export const requirePlatformAdmin = async (request: Request) => {
  const { user, response } = await requireAdmin(request);
  if (response || !user) {
    return { user: null, response };
  }

  if (!isPlatformAdminEmail(user.email)) {
    return { user: null, response: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return { user, response: null };
};
