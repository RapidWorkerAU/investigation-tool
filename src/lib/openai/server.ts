import "server-only";

import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

export const investigationReportModel =
  process.env.OPENAI_INVESTIGATION_REPORT_MODEL?.trim() || "gpt-5.2";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }

  return cachedClient;
}
