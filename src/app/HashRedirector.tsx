"use client";

import { useEffect } from "react";

export default function HashRedirector() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    const query = new URLSearchParams(window.location.search);
    const hashParams = hash.startsWith("#") ? new URLSearchParams(hash.slice(1)) : null;
    const type = hashParams?.get("type") ?? query.get("type");
    const hasAuthPayload =
      Boolean(hashParams?.get("access_token")) ||
      (Boolean(hashParams?.get("refresh_token")) && Boolean(type)) ||
      Boolean(query.get("code"));

    if (!hasAuthPayload || !type) return;

    const pathname = window.location.pathname;
    const onSetPassword = pathname.startsWith("/auth/set-password");
    const onConfirmAccount = pathname.startsWith("/confirm-account");

    if (type === "recovery" && !onSetPassword) {
      window.location.replace("/auth/set-password" + window.location.search + window.location.hash);
      return;
    }

    if ((type === "signup" || type === "email_change" || type === "magiclink") && !onConfirmAccount) {
      window.location.replace("/confirm-account" + window.location.search + window.location.hash);
    }
  }, []);

  return null;
}
