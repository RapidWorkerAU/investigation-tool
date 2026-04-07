import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient, investigationReportModel } from "@/lib/openai/server";

export const runtime = "nodejs";

type ReportPriority = "low" | "medium" | "high";
type ReportStyle = "concise" | "standard" | "detailed";

type InvestigationReport = {
  title: string;
  executive_summary: string;
  case_overview: string;
  chronology: Array<{
    timestamp: string;
    event: string;
    significance: string;
  }>;
  key_findings: Array<{
    finding: string;
    detail: string;
    priority: ReportPriority;
    supporting_evidence: string[];
  }>;
  contributing_factors: Array<{
    factor: string;
    impact: string;
    evidence_status: "confirmed" | "inferred" | "missing";
  }>;
  evidence_gaps: Array<{
    gap: string;
    why_it_matters: string;
    recommended_next_step: string;
  }>;
  recommendations: Array<{
    action: string;
    rationale: string;
    priority: ReportPriority;
  }>;
  confidence_assessment: {
    overall: ReportPriority;
    rationale: string;
  };
};

type InvestigationReportRequest = {
  caseData?: unknown;
  reportStyle?: ReportStyle;
  focusQuestions?: string[];
  additionalInstructions?: string;
};

const reportSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    executive_summary: { type: "string" },
    case_overview: { type: "string" },
    chronology: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          timestamp: { type: "string" },
          event: { type: "string" },
          significance: { type: "string" },
        },
        required: ["timestamp", "event", "significance"],
      },
    },
    key_findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          finding: { type: "string" },
          detail: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          supporting_evidence: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["finding", "detail", "priority", "supporting_evidence"],
      },
    },
    contributing_factors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          factor: { type: "string" },
          impact: { type: "string" },
          evidence_status: {
            type: "string",
            enum: ["confirmed", "inferred", "missing"],
          },
        },
        required: ["factor", "impact", "evidence_status"],
      },
    },
    evidence_gaps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          gap: { type: "string" },
          why_it_matters: { type: "string" },
          recommended_next_step: { type: "string" },
        },
        required: ["gap", "why_it_matters", "recommended_next_step"],
      },
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          action: { type: "string" },
          rationale: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["action", "rationale", "priority"],
      },
    },
    confidence_assessment: {
      type: "object",
      additionalProperties: false,
      properties: {
        overall: { type: "string", enum: ["low", "medium", "high"] },
        rationale: { type: "string" },
      },
      required: ["overall", "rationale"],
    },
  },
  required: [
    "title",
    "executive_summary",
    "case_overview",
    "chronology",
    "key_findings",
    "contributing_factors",
    "evidence_gaps",
    "recommendations",
    "confidence_assessment",
  ],
} as const;

function isPlainJsonValue(value: unknown) {
  return value !== undefined && value !== null;
}

function normalizeReportStyle(value: unknown): ReportStyle {
  return value === "concise" || value === "detailed" ? value : "standard";
}

function normalizeFocusQuestions(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as InvestigationReportRequest | null;

  if (!body || !isPlainJsonValue(body.caseData)) {
    return NextResponse.json(
      { error: "caseData is required and must be valid JSON." },
      { status: 400 },
    );
  }

  const reportStyle = normalizeReportStyle(body.reportStyle);
  const focusQuestions = normalizeFocusQuestions(body.focusQuestions);
  const additionalInstructions =
    typeof body.additionalInstructions === "string" ? body.additionalInstructions.trim() : "";

  const client = getOpenAIClient();

  try {
    const response = await client.responses.create({
      model: investigationReportModel,
      store: false,
      max_output_tokens: 2200,
      instructions: [
        "You write structured investigation reports for incident and case review workflows.",
        "Use only the provided case data.",
        "Do not invent facts, dates, names, or evidence that are not grounded in the input.",
        "When information is incomplete, state the uncertainty clearly inside the structured fields.",
        `Write in a ${reportStyle} style.`,
      ].join(" "),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(
                {
                  task: "Generate a structured investigation report from the supplied case data.",
                  focus_questions: focusQuestions,
                  additional_instructions: additionalInstructions || null,
                  case_data: body.caseData,
                },
                null,
                2,
              ),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "investigation_report",
          schema: reportSchema,
          strict: true,
        },
      },
    });

    const outputText = response.output_text?.trim();

    if (!outputText) {
      return NextResponse.json(
        { error: "OpenAI returned an empty report response." },
        { status: 502 },
      );
    }

    const report = JSON.parse(outputText) as InvestigationReport;

    return NextResponse.json({
      report,
      responseId: response.id,
      model: response.model,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate investigation report.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
