"use client";

import { supabaseBrowser } from "./client";

const STORAGE_KEYS = {
  accessToken: "investigation_tool_access_token",
  refreshToken: "investigation_tool_refresh_token",
  userEmail: "investigation_tool_user_email",
  userId: "investigation_tool_user_id",
} as const;

type RefreshPayload = {
  access_token?: string;
  refresh_token?: string;
  user?: { email?: string; id?: string };
};

const setStoredSession = (payload: RefreshPayload) => {
  if (payload.access_token) {
    localStorage.setItem(STORAGE_KEYS.accessToken, payload.access_token);
  }
  if (payload.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, payload.refresh_token);
  }
  if (payload.user?.email) {
    localStorage.setItem(STORAGE_KEYS.userEmail, payload.user.email);
  }
  if (payload.user?.id) {
    localStorage.setItem(STORAGE_KEYS.userId, payload.user.id);
  }
};

const refreshSessionFromApi = async () => {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
  if (!refreshToken) return null;

  const response = await fetch("/api/portal/session/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as RefreshPayload;
  if (!payload.access_token || !payload.refresh_token) return null;
  setStoredSession(payload);
  return payload;
};

export const ensurePortalSupabaseUser = async () => {
  let { data: sessionData } = await supabaseBrowser.auth.getSession();
  let session = sessionData.session;

  if (!session) {
    const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);

    if (accessToken && refreshToken) {
      const { error } = await supabaseBrowser.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (!error) {
        const next = await supabaseBrowser.auth.getSession();
        session = next.data.session;
      }
    }
  }

  if (!session) {
    const refreshed = await refreshSessionFromApi();
    if (refreshed?.access_token && refreshed.refresh_token) {
      const { error } = await supabaseBrowser.auth.setSession({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
      });
      if (!error) {
        const next = await supabaseBrowser.auth.getSession();
        session = next.data.session;
      }
    }
  }

  if (!session) return null;

  const { data, error } = await supabaseBrowser.auth.getUser();
  if (error || !data.user?.id) return null;
  return data.user;
};
