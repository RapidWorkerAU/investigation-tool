"use client";

import { useEffect, useRef, useState } from "react";
import { reportSiteIssue, SITE_ISSUE_TOAST_EVENT, type SiteIssueToastDetail } from "@/lib/siteIssues/client";
import styles from "./SiteIssueProvider.module.css";

type SiteIssueProviderProps = {
  children: React.ReactNode;
};

type Toast = {
  id: number;
  message: string;
};

const TOAST_DURATION_MS = 3000;

function getFetchUrl(input: RequestInfo | URL) {
  if (typeof window === "undefined") return null;

  const rawUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  try {
    return new URL(rawUrl, window.location.href);
  } catch {
    return null;
  }
}

function getFetchMethod(input: RequestInfo | URL, init?: RequestInit) {
  if (init?.method) return init.method.toUpperCase();
  if (typeof input !== "string" && !(input instanceof URL) && input.method) return input.method.toUpperCase();
  return "GET";
}

function shouldReportFetchResponse(url: URL | null, response: Response) {
  if (!url || typeof window === "undefined") return false;
  const isFirstPartyApi = url.origin === window.location.origin && url.pathname.startsWith("/api/");
  const isKnownService =
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("api.openai.com") ||
    url.hostname.includes("api.stripe.com");

  if (isFirstPartyApi && url.pathname === "/api/site-errors") return false;
  if (!isFirstPartyApi && !isKnownService) return false;

  return response.status >= 500 || response.status === 429;
}

function shouldReportFetchError(url: URL | null) {
  if (!url || typeof window === "undefined") return true;
  return url.pathname !== "/api/site-errors";
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function actionFromPath(pathname: string) {
  if (pathname.includes("/generate-report")) return "generating report";
  if (pathname.includes("/investigation-report/email")) return "emailing report";
  if (pathname.includes("/stripe/customer-portal")) return "opening billing";
  if (pathname.includes("/stripe/checkout-session")) return "starting checkout";
  if (pathname.includes("/account/delete")) return "deleting account";
  if (pathname.includes("/account/export")) return "exporting account";
  if (pathname.includes("/auth/signup")) return "creating account";
  if (pathname.includes("/lead-access")) return "updating access";
  if (pathname.includes("/system-maps")) return "updating map";
  if (pathname.includes("/map-suggestions")) return "loading suggestions";
  if (pathname.includes("/admin")) return "updating admin";
  return "completing request";
}

function sourceFromUrl(url: URL | null) {
  if (!url) return "network";
  if (url.hostname.includes("supabase.co")) return "supabase";
  if (url.hostname.includes("api.openai.com")) return "openai";
  if (url.hostname.includes("api.stripe.com")) return "stripe";
  return "application";
}

async function getResponseBodyPreview(response: Response) {
  try {
    const text = await response.clone().text();
    return text.slice(0, 1200);
  } catch {
    return "";
  }
}

export default function SiteIssueProvider({ children }: SiteIssueProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextToastId = useRef(0);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<SiteIssueToastDetail>;
      const message = customEvent.detail?.message;
      if (!message) return;

      const id = nextToastId.current;
      nextToastId.current += 1;

      setToasts((current) => [...current, { id, message }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, TOAST_DURATION_MS);
    };

    window.addEventListener(SITE_ISSUE_TOAST_EVENT, handleToast);
    return () => {
      window.removeEventListener(SITE_ISSUE_TOAST_EVENT, handleToast);
    };
  }, []);

  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      reportSiteIssue({
        action: "completing task",
        error: event.error || event.message,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        source: "browser",
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportSiteIssue({
        action: "completing task",
        error: event.reason,
        source: "browser",
      });
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    const wrappedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getFetchUrl(input);
      const method = getFetchMethod(input, init);

      try {
        const response = await originalFetch(input, init);

        if (shouldReportFetchResponse(url, response)) {
          void getResponseBodyPreview(response).then((bodyPreview) => {
            reportSiteIssue({
              action: actionFromPath(url?.pathname ?? ""),
              endpoint: url?.origin === window.location.origin ? url?.pathname : url?.href,
              metadata: {
                responseBodyPreview: bodyPreview,
                statusText: response.statusText,
              },
              method,
              source: sourceFromUrl(url),
              status: response.status,
              technicalMessage: `${sourceFromUrl(url)} request returned ${response.status} ${response.statusText || "error"}.`,
            });
          });
        }

        return response;
      } catch (error) {
        if (!isAbortError(error) && shouldReportFetchError(url)) {
          reportSiteIssue({
            action: actionFromPath(url?.pathname ?? ""),
            endpoint: url?.pathname || url?.href,
            error,
            method,
            source: "network",
          });
        }

        throw error;
      }
    };

    window.fetch = wrappedFetch;

    return () => {
      if (window.fetch === wrappedFetch) {
        window.fetch = originalFetch;
      }
    };
  }, []);

  return (
    <>
      {children}
      <div className={styles.toastRegion} role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={styles.toast}>
            {toast.message}
          </div>
        ))}
      </div>
    </>
  );
}
