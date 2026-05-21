"use client";

import {
  errorToSiteIssueFields,
  getSiteIssueUserMessage,
  inferSiteIssueSource,
  type SiteIssueReport,
} from "./shared";

export const SITE_ISSUE_TOAST_EVENT = "investigation-tool:site-issue-toast";

type SiteIssueToastDetail = {
  message: string;
};

type ReportSiteIssueArgs = Omit<SiteIssueReport, "errorName" | "stack" | "technicalMessage"> & {
  error?: unknown;
  technicalMessage?: string;
};

function getCurrentPageUrl() {
  if (typeof window === "undefined") return undefined;
  return window.location.href;
}

function getUserAgent() {
  if (typeof navigator === "undefined") return undefined;
  return navigator.userAgent;
}

function dispatchSiteIssueToast(message: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<SiteIssueToastDetail>(SITE_ISSUE_TOAST_EVENT, {
      detail: { message },
    }),
  );
}

export function reportSiteIssue(args: ReportSiteIssueArgs = {}) {
  const errorFields: Partial<SiteIssueReport> = "error" in args ? errorToSiteIssueFields(args.error) : {};
  const userMessage = getSiteIssueUserMessage(args.userMessage, args.action);
  const technicalMessage = args.technicalMessage || errorFields.technicalMessage;
  const payload: SiteIssueReport = {
    ...args,
    ...errorFields,
    technicalMessage,
    source: inferSiteIssueSource({
      endpoint: args.endpoint,
      source: args.source,
      status: args.status,
      technicalMessage,
    }),
    pageUrl: args.pageUrl || getCurrentPageUrl(),
    timestamp: args.timestamp || new Date().toISOString(),
    userAgent: args.userAgent || getUserAgent(),
    userMessage,
  };

  dispatchSiteIssueToast(userMessage);

  if (typeof window === "undefined") return;

  void fetch("/api/site-errors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Reporting must never create another visible user error.
  });
}

export function reportSiteIssueFromError(error: unknown, args: Omit<ReportSiteIssueArgs, "error"> = {}) {
  reportSiteIssue({ ...args, error });
}

export type { SiteIssueToastDetail };
