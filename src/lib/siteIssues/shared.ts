export type SiteIssueSource =
  | "application"
  | "browser"
  | "network"
  | "openai"
  | "resend"
  | "stripe"
  | "supabase"
  | "vercel"
  | "unknown";

export type SiteIssueReport = {
  action?: string;
  endpoint?: string;
  errorName?: string;
  metadata?: Record<string, unknown>;
  method?: string;
  pageUrl?: string;
  source?: SiteIssueSource | string;
  stack?: string;
  status?: number;
  technicalMessage?: string;
  timestamp?: string;
  userAgent?: string;
  userMessage?: string;
};

const DEFAULT_USER_MESSAGE = "Error completing task. Please try again later.";
const USER_PROMPT = "Please try again later.";
const MAX_USER_MESSAGE_WORDS = 8;

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeAction(action: string) {
  return action
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 2)
    .join(" ");
}

export function getSiteIssueUserMessage(userMessage?: string | null, action?: string | null) {
  const cleanedMessage = userMessage?.replace(/\s+/g, " ").trim();

  if (
    cleanedMessage &&
    cleanedMessage.toLowerCase().includes(USER_PROMPT.toLowerCase()) &&
    countWords(cleanedMessage) <= MAX_USER_MESSAGE_WORDS
  ) {
    return cleanedMessage;
  }

  const cleanedAction = action ? normalizeAction(action) : "";
  if (cleanedAction) {
    const actionMessage = `Error ${cleanedAction}. ${USER_PROMPT}`;
    if (countWords(actionMessage) <= MAX_USER_MESSAGE_WORDS) {
      return actionMessage;
    }
  }

  return DEFAULT_USER_MESSAGE;
}

export function errorToSiteIssueFields(error: unknown) {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      stack: error.stack,
      technicalMessage: error.message,
    };
  }

  if (typeof error === "string") {
    return {
      technicalMessage: error,
    };
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message = typeof record.message === "string" ? record.message : "";
    const details = typeof record.details === "string" ? record.details : "";
    const hint = typeof record.hint === "string" ? record.hint : "";
    const code = typeof record.code === "string" ? record.code : "";
    const technicalMessage = [message, details, hint ? `Hint: ${hint}` : "", code ? `Code: ${code}` : ""]
      .filter(Boolean)
      .join(" ");

    return {
      errorName: typeof record.name === "string" ? record.name : undefined,
      stack: typeof record.stack === "string" ? record.stack : undefined,
      technicalMessage: technicalMessage || "Unknown object error",
    };
  }

  return {
    technicalMessage: "Unknown error",
  };
}

export function inferSiteIssueSource(input: Pick<SiteIssueReport, "endpoint" | "source" | "status" | "technicalMessage">) {
  if (input.source && input.source !== "unknown") return input.source;

  const haystack = [input.endpoint, input.technicalMessage].filter(Boolean).join(" ").toLowerCase();

  if (haystack.includes("openai") || haystack.includes("api.openai.com")) return "openai";
  if (haystack.includes("supabase") || haystack.includes("postgres") || haystack.includes("row-level security")) return "supabase";
  if (haystack.includes("vercel") || haystack.includes("edge function")) return "vercel";
  if (haystack.includes("resend") || haystack.includes("email")) return "resend";
  if (haystack.includes("stripe") || haystack.includes("checkout") || haystack.includes("billing portal")) return "stripe";
  if (haystack.includes("network") || haystack.includes("failed to fetch") || haystack.includes("load failed")) return "network";
  if (input.status && input.status >= 500) return "application";

  return "unknown";
}

export function classifySiteIssue(input: Pick<SiteIssueReport, "errorName" | "source" | "status" | "technicalMessage">) {
  const source = inferSiteIssueSource(input);
  const message = input.technicalMessage?.toLowerCase() ?? "";
  const errorName = input.errorName?.toLowerCase() ?? "";

  if (
    source === "network" ||
    input.status === 408 ||
    input.status === 429 ||
    (input.status && input.status >= 502) ||
    message.includes("timeout") ||
    message.includes("temporarily") ||
    message.includes("rate limit") ||
    message.includes("failed to fetch")
  ) {
    return "Likely temporary outage or network/service interruption.";
  }

  if (
    errorName.includes("typeerror") ||
    errorName.includes("referenceerror") ||
    message.includes("not configured") ||
    message.includes("cannot read") ||
    message.includes("undefined") ||
    message.includes("schema cache")
  ) {
    return "Likely problematic application code or configuration.";
  }

  if (source === "openai" || source === "supabase" || source === "stripe" || source === "resend") {
    return "Likely external service or integration failure.";
  }

  if (input.status && input.status >= 500) {
    return "Likely problematic application code or runtime failure.";
  }

  return "Needs review; cause could not be determined automatically.";
}
