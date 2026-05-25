import { NextResponse } from "next/server";

type RateLimitOptions = {
  scope: string;
  limit: number;
  windowMs: number;
  identifier?: string | null;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();
const maxBuckets = 5000;

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwarded ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < maxBuckets) return;
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function enforceRateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const key = [
    options.scope,
    clientIp(request),
    options.identifier?.trim().toLowerCase() || "",
  ].join(":");
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  existing.count += 1;
  if (existing.count <= options.limit) return null;

  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return NextResponse.json(
    { error: "Too many requests. Please wait before trying again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}
