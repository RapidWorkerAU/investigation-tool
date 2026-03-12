import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    app: "Investigation Tool",
    note: "Scaffold export endpoint. Replace with user-scoped Supabase export logic.",
  });
}
