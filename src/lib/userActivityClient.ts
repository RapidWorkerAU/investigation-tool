"use client";

import { supabaseBrowser } from "@/lib/supabase/client";

type ReportUserActivityArgs = {
  action: string;
  status?: "success" | "failed" | "info";
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function reportUserActivity({
  action,
  status = "success",
  summary,
  metadata = {},
}: ReportUserActivityArgs) {
  try {
    const {
      data: { session },
    } = await supabaseBrowser.auth.getSession();
    const accessToken = session?.access_token || window.localStorage.getItem("investigation_tool_access_token") || "";

    if (!accessToken) return;

    await fetch("/api/user-activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        action,
        status,
        summary,
        metadata,
      }),
    });
  } catch (error) {
    console.error("Unable to record user activity", error);
  }
}
