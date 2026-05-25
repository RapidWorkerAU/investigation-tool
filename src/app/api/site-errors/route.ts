import { NextRequest, NextResponse } from "next/server";
import { sendWebsiteErrorEmail } from "@/lib/email/siteErrors";
import { enforceRateLimit } from "@/lib/rateLimit";
import { getSiteIssueUserMessage, type SiteIssueReport } from "@/lib/siteIssues/shared";

function configuredSiteOrigin() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return null;

  try {
    return new URL(siteUrl).origin;
  } catch {
    return null;
  }
}

function requestOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  if (!host) return null;

  const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

function hasAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const allowedOrigins = [configuredSiteOrigin(), requestOrigin(request)].filter(Boolean);
  return allowedOrigins.includes(origin);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.slice(0, 4000) : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function metadataValue(value: unknown) {
  if (!isRecord(value)) return undefined;
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 30)
      .map(([key, entry]) => [key.slice(0, 80), typeof entry === "string" ? entry.slice(0, 2000) : entry]),
  );
}

function normalizeReport(body: unknown): SiteIssueReport {
  if (!isRecord(body)) {
    return {
      action: "completing task",
      source: "unknown",
      technicalMessage: "Invalid site error report payload.",
      userMessage: getSiteIssueUserMessage(),
    };
  }

  const action = stringValue(body.action);
  return {
    action,
    endpoint: stringValue(body.endpoint),
    errorName: stringValue(body.errorName),
    metadata: metadataValue(body.metadata),
    method: stringValue(body.method),
    pageUrl: stringValue(body.pageUrl),
    source: stringValue(body.source),
    stack: stringValue(body.stack),
    status: numberValue(body.status),
    technicalMessage: stringValue(body.technicalMessage),
    timestamp: stringValue(body.timestamp) || new Date().toISOString(),
    userAgent: stringValue(body.userAgent),
    userMessage: getSiteIssueUserMessage(stringValue(body.userMessage), action),
  };
}

export async function POST(request: NextRequest) {
  if (!hasAllowedOrigin(request)) {
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  }

  const limit = enforceRateLimit(request, {
    scope: "site-error-report",
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (limit) return limit;

  try {
    const body = await request.json();
    const report = normalizeReport(body);

    await sendWebsiteErrorEmail(report);

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (error) {
    console.error("Website error notification failed", error);
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}
