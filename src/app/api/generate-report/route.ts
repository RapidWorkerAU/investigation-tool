import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient, investigationReportModel } from "@/lib/openai/server";
import { accessCanUseReportGeneration } from "@/lib/access";
import { buildDraftReportText } from "@/lib/investigation-report/helpers";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import { createAuthedServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { InvestigationReportPayload, ReadinessCheck, ReportRowItem } from "@/lib/investigation-report/types";

export const runtime = "nodejs";

type GenerateReportRequest = {
  caseData?: unknown;
  acknowledgeMissingInformation?: boolean;
};

type GenerateReportResponse = InvestigationReportPayload;
type RowItem = ReportRowItem;
type PreviousReportBranding = {
  logo_storage_path?: string;
  section_heading_color?: string;
  table_heading_color?: string;
};

const tableRowSchema = {
  type: "array",
  items: { type: "string" },
} as const;

const generateReportSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    readiness: {
      type: "object",
      additionalProperties: false,
      properties: {
        requires_acknowledgement: { type: "boolean" },
        missing_information_detected: {
          type: "array",
          items: { type: "string" },
        },
        disclaimer: { type: ["string", "null"] },
        suggested_next_steps: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: [
        "requires_acknowledgement",
        "missing_information_detected",
        "disclaimer",
        "suggested_next_steps",
      ],
    },
    facts_confirmed: {
      type: "array",
      items: { type: "string" },
    },
    facts_uncertain: {
      type: "array",
      items: { type: "string" },
    },
    missing_information: {
      type: "array",
      items: { type: "string" },
    },
    report: {
      type: "object",
      additionalProperties: false,
      properties: {
        front_page: {
          type: "object",
          additionalProperties: false,
          properties: {
            facts_confirmed_heading: { type: "string" },
            facts_uncertain_heading: { type: "string" },
            missing_information_heading: { type: "string" },
          },
          required: [
            "facts_confirmed_heading",
            "facts_uncertain_heading",
            "missing_information_heading",
          ],
        },
        cover_page: {
          type: "object",
          additionalProperties: false,
          properties: {
            incident_name: { type: "string" },
            incident_date: { type: "string" },
            report_generated_date: { type: "string" },
            business_logo_note: { type: "string" },
          },
          required: [
            "incident_name",
            "incident_date",
            "report_generated_date",
            "business_logo_note",
          ],
        },
        contents_page: {
          type: "array",
          items: { type: "string" },
        },
        sections: {
          type: "object",
          additionalProperties: false,
          properties: {
            executive_summary: { type: "string" },
            long_description: { type: "string" },
            response_and_recovery: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                columns: { type: "array", items: { type: "string" } },
                rows: { type: "array", items: tableRowSchema },
              },
              required: ["summary", "columns", "rows"],
            },
            people_involved: {
              type: "object",
              additionalProperties: false,
              properties: {
                heading: { type: "string" },
                render_mode: { type: "string", enum: ["person_node_visuals"] },
                note: { type: "string" },
              },
              required: ["heading", "render_mode", "note"],
            },
            incident_timeline: {
              type: "object",
              additionalProperties: false,
              properties: {
                heading: { type: "string" },
                entries: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["heading", "entries"],
            },
            task_and_conditions: { type: "string" },
            factors_and_system_factors: {
              type: "object",
              additionalProperties: false,
              properties: {
                heading: { type: "string" },
                columns: { type: "array", items: { type: "string" } },
                rows: { type: "array", items: tableRowSchema },
              },
              required: ["heading", "columns", "rows"],
            },
            predisposing_factors: {
              type: "object",
              additionalProperties: false,
              properties: {
                heading: { type: "string" },
                columns: { type: "array", items: { type: "string" } },
                rows: { type: "array", items: tableRowSchema },
              },
              required: ["heading", "columns", "rows"],
            },
            controls_and_barriers: {
              type: "object",
              additionalProperties: false,
              properties: {
                heading: { type: "string" },
                columns: { type: "array", items: { type: "string" } },
                rows: { type: "array", items: tableRowSchema },
              },
              required: ["heading", "columns", "rows"],
            },
            incident_outcomes: { type: "string" },
            incident_findings: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                columns: { type: "array", items: { type: "string" } },
                rows: { type: "array", items: tableRowSchema },
              },
              required: ["summary", "columns", "rows"],
            },
            recommendations: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                columns: { type: "array", items: { type: "string" } },
                rows: { type: "array", items: tableRowSchema },
                approval_fields: { type: "array", items: { type: "string" } },
              },
              required: ["summary", "columns", "rows", "approval_fields"],
            },
            evidence: {
              type: "object",
              additionalProperties: false,
              properties: {
                heading: { type: "string" },
                preview_max_width_percent: { type: "number" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      label: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["label", "description"],
                  },
                },
              },
              required: ["heading", "preview_max_width_percent", "items"],
            },
            report_metadata: { type: "string" },
            investigation_sign_off: {
              type: "object",
              additionalProperties: false,
              properties: {
                heading: { type: "string" },
                fields: { type: "array", items: { type: "string" } },
              },
              required: ["heading", "fields"],
            },
          },
          required: [
            "executive_summary",
            "long_description",
            "response_and_recovery",
            "people_involved",
            "incident_timeline",
            "task_and_conditions",
            "factors_and_system_factors",
            "predisposing_factors",
            "controls_and_barriers",
            "incident_outcomes",
            "incident_findings",
            "recommendations",
            "evidence",
            "report_metadata",
            "investigation_sign_off",
          ],
        },
      },
      required: ["front_page", "cover_page", "contents_page", "sections"],
    },
  },
  required: [
    "readiness",
    "facts_confirmed",
    "facts_uncertain",
    "missing_information",
    "report",
  ],
} as const;

const nodeRequirementRules = [
  {
    key: "incident_sequence_step",
    message: "No sequence step nodes were found. The report may be missing incident date, time, location, and timeline detail.",
  },
  {
    key: "incident_outcome",
    message: "No outcome nodes were found. The report may be unable to confirm impacts, outcomes, or whether an injury occurred.",
  },
  {
    key: "incident_task_condition",
    message: "No task/condition nodes were found. The report may be unable to describe the task context and conditions present.",
  },
  {
    key: "person",
    message: "No person nodes were found. The People Involved section cannot be populated.",
  },
  {
    key: "incident_factor",
    message: "No factor nodes were found. The Factors section may be incomplete.",
  },
  {
    key: "incident_system_factor",
    message: "No system factor nodes were found. Organisational contributors may be missing from the report.",
  },
  {
    key: "incident_control_barrier",
    message: "No control/barrier nodes were found. The Controls And Barriers section cannot be populated.",
  },
  {
    key: "incident_finding",
    message: "No finding nodes were found. The Incident Findings section may be incomplete.",
  },
  {
    key: "incident_recommendation",
    message: "No recommendation nodes were found. The Recommendations section cannot be populated.",
  },
  {
    key: "incident_evidence",
    message: "No evidence nodes were found. The Evidence section may be incomplete.",
  },
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRowItem(value: unknown): value is RowItem {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRowMatrix(value: unknown): value is RowItem[] {
  return Array.isArray(value) && value.every((item) => isRowItem(item));
}

function collectElementRecords(value: unknown, found: Array<Record<string, unknown>> = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectElementRecords(item, found));
    return found;
  }

  if (!isRecord(value)) return found;

  if (typeof value.element_type === "string") {
    found.push(value);
  }

  Object.values(value).forEach((child) => collectElementRecords(child, found));
  return found;
}

function countElementType(value: unknown, elementType: string) {
  return collectElementRecords(value).filter((record) => record.element_type === elementType).length;
}

function extractLocalMissingInformation(caseData: unknown) {
  const elementRecords = collectElementRecords(caseData);
  const counts = new Map<string, number>();

  elementRecords.forEach((record) => {
    const elementType = typeof record.element_type === "string" ? record.element_type : "";
    if (!elementType) return;
    counts.set(elementType, (counts.get(elementType) ?? 0) + 1);
  });

  const missing: string[] = nodeRequirementRules
    .filter((rule) => !counts.get(rule.key))
    .map((rule) => rule.message);

  const sequenceRecords = elementRecords.filter((record) => record.element_type === "incident_sequence_step");
  const hasTimestamp = sequenceRecords.some((record) => {
    const config = isRecord(record.element_config) ? record.element_config : null;
    return typeof config?.timestamp === "string" && config.timestamp.trim().length > 0;
  });
  const hasLocation = sequenceRecords.some((record) => {
    const config = isRecord(record.element_config) ? record.element_config : null;
    return typeof config?.location === "string" && config.location.trim().length > 0;
  });

  if (!hasTimestamp) {
    missing.push("No explicit incident timestamp was found in the sequence nodes.");
  }

  if (!hasLocation) {
    missing.push("No explicit incident location was found in the sequence nodes.");
  }

  const outcomeRecords = elementRecords.filter((record) => record.element_type === "incident_outcome");
  const hasInjuryOutcome = outcomeRecords.some((record) => {
    const config = isRecord(record.element_config) ? record.element_config : null;
    return String(config?.impact_type ?? "").trim().toLowerCase() === "injury";
  });

  if (!hasInjuryOutcome) {
    missing.push("No explicit injury outcome node was found to confirm whether an injury did or did not occur.");
  }

  return missing;
}

function buildReadiness(missingInformationDetected: string[]): ReadinessCheck {
  const requiresAcknowledgement = missingInformationDetected.length > 0;

  return {
    requires_acknowledgement: requiresAcknowledgement,
    missing_information_detected: missingInformationDetected,
    disclaimer: requiresAcknowledgement
      ? "This report may be incomplete or inaccurate unless the missing investigation information is confirmed or intentionally excluded by the user."
      : null,
    suggested_next_steps: requiresAcknowledgement
      ? [
          "Review the missing information flagged before generating the final report.",
          "Either add the missing investigation nodes or explicitly acknowledge that you want to continue without them.",
          "Treat any generated report text as provisional where the source map is incomplete.",
        ]
      : [],
  };
}

function isGenerateReportResponse(value: unknown): value is GenerateReportResponse {
  if (!isRecord(value)) return false;
  if (!isRecord(value.readiness)) return false;
  if (!isStringArray(value.facts_confirmed)) return false;
  if (!isStringArray(value.facts_uncertain)) return false;
  if (!isStringArray(value.missing_information)) return false;
  if (!isRecord(value.report)) return false;
  const report = value.report;
  if (!isRecord(report.front_page)) return false;
  if (!isRecord(report.cover_page)) return false;
  if (!isStringArray(report.contents_page)) return false;
  if (!isRecord(report.sections)) return false;

  const readiness = value.readiness;
  const frontPage = report.front_page;
  const coverPage = report.cover_page;
  const sections = report.sections;

  return (
    typeof readiness.requires_acknowledgement === "boolean" &&
    isStringArray(readiness.missing_information_detected) &&
    (typeof readiness.disclaimer === "string" || readiness.disclaimer === null) &&
    isStringArray(readiness.suggested_next_steps) &&
    typeof frontPage.facts_confirmed_heading === "string" &&
    typeof frontPage.facts_uncertain_heading === "string" &&
    typeof frontPage.missing_information_heading === "string" &&
    typeof coverPage.incident_name === "string" &&
    typeof coverPage.incident_date === "string" &&
    typeof coverPage.report_generated_date === "string" &&
    typeof coverPage.business_logo_note === "string" &&
    typeof sections.executive_summary === "string" &&
    typeof sections.long_description === "string" &&
    isRecord(sections.people_involved) &&
    sections.people_involved.render_mode === "person_node_visuals" &&
    typeof sections.people_involved.heading === "string" &&
    typeof sections.people_involved.note === "string" &&
    isRecord(sections.incident_timeline) &&
    typeof sections.incident_timeline.heading === "string" &&
    isStringArray(sections.incident_timeline.entries) &&
    typeof sections.task_and_conditions === "string" &&
    isRecord(sections.response_and_recovery) &&
    typeof sections.response_and_recovery.summary === "string" &&
    isStringArray(sections.response_and_recovery.columns) &&
    isRowMatrix(sections.response_and_recovery.rows) &&
    isRecord(sections.factors_and_system_factors) &&
    typeof sections.factors_and_system_factors.heading === "string" &&
    isStringArray(sections.factors_and_system_factors.columns) &&
    isRowMatrix(sections.factors_and_system_factors.rows) &&
    isRecord(sections.predisposing_factors) &&
    typeof sections.predisposing_factors.heading === "string" &&
    isStringArray(sections.predisposing_factors.columns) &&
    isRowMatrix(sections.predisposing_factors.rows) &&
    isRecord(sections.controls_and_barriers) &&
    typeof sections.controls_and_barriers.heading === "string" &&
    isStringArray(sections.controls_and_barriers.columns) &&
    isRowMatrix(sections.controls_and_barriers.rows) &&
    typeof sections.incident_outcomes === "string" &&
    isRecord(sections.incident_findings) &&
    typeof sections.incident_findings.summary === "string" &&
    isStringArray(sections.incident_findings.columns) &&
    isRowMatrix(sections.incident_findings.rows) &&
    isRecord(sections.recommendations) &&
    typeof sections.recommendations.summary === "string" &&
    isStringArray(sections.recommendations.columns) &&
    isRowMatrix(sections.recommendations.rows) &&
    isStringArray(sections.recommendations.approval_fields) &&
    isRecord(sections.evidence) &&
    typeof sections.evidence.heading === "string" &&
    typeof sections.evidence.preview_max_width_percent === "number" &&
    Array.isArray(sections.evidence.items) &&
    sections.evidence.items.every(
      (item) => isRecord(item) && typeof item.label === "string" && typeof item.description === "string",
    ) &&
    typeof sections.report_metadata === "string" &&
    isRecord(sections.investigation_sign_off) &&
    typeof sections.investigation_sign_off.heading === "string" &&
    isStringArray(sections.investigation_sign_off.fields)
  );
}

function extractResponseDiagnostic(response: Record<string, unknown>) {
  const status = typeof response.status === "string" ? response.status : "unknown";
  const incompleteDetails = isRecord(response.incomplete_details) ? response.incomplete_details : null;
  const output = Array.isArray(response.output) ? response.output : [];
  const firstOutput = output[0];
  const firstContent =
    isRecord(firstOutput) && Array.isArray(firstOutput.content) ? firstOutput.content[0] : null;

  const refusal =
    isRecord(firstContent) && typeof firstContent.refusal === "string"
      ? firstContent.refusal
      : null;

  const outputText =
    isRecord(firstContent) && typeof firstContent.text === "string"
      ? firstContent.text
      : null;

  return {
    status,
    refusal,
    outputTextPreview: outputText ? outputText.slice(0, 500) : null,
    incompleteReason:
      incompleteDetails && typeof incompleteDetails.reason === "string"
        ? incompleteDetails.reason
        : null,
  };
}

function getPreviousReportBranding(value: unknown): PreviousReportBranding | null {
  if (!isRecord(value) || !isRecord(value.report) || !isRecord(value.report.branding)) return null;

  const branding = value.report.branding;
  const nextBranding: PreviousReportBranding = {};

  if (typeof branding.logo_storage_path === "string" && branding.logo_storage_path.trim()) {
    nextBranding.logo_storage_path = branding.logo_storage_path.trim();
  }
  if (typeof branding.section_heading_color === "string" && branding.section_heading_color.trim()) {
    nextBranding.section_heading_color = branding.section_heading_color.trim();
  }
  if (typeof branding.table_heading_color === "string" && branding.table_heading_color.trim()) {
    nextBranding.table_heading_color = branding.table_heading_color.trim();
  }

  return Object.keys(nextBranding).length > 0 ? nextBranding : null;
}

export async function POST(request: NextRequest) {
  const trace: string[] = [];
  const addTrace = (message: string) => {
    trace.push(`${new Date().toISOString()} ${message}`);
  };

  addTrace("Request received.");
  const body = (await request.json().catch(() => null)) as GenerateReportRequest | null;
  addTrace("Request body parsed.");
  const authHeader = request.headers.get("authorization");
  const user = await getUserFromAuthHeader(authHeader);

  if (!body || body.caseData === undefined || body.caseData === null) {
    return NextResponse.json(
      { error: "caseData is required and must be valid JSON." },
      { status: 400 },
    );
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const token = authHeader?.replace("Bearer ", "").trim() ?? "";

  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const caseId =
    isRecord(body.caseData) &&
    isRecord(body.caseData.map) &&
    typeof body.caseData.map.id === "string" &&
    body.caseData.map.id.trim()
      ? body.caseData.map.id.trim()
      : "";

  if (!caseId) {
    return NextResponse.json({ error: "caseData.map.id is required." }, { status: 400 });
  }

  const authedSupabase = createAuthedServerClient(token);
  const serviceSupabase = createServiceRoleClient();
  addTrace("Refreshing billing profile state.");
  const { data: refreshedAccessState, error: accessStateError } = await serviceSupabase.rpc("refresh_billing_profile_state", {
    p_user_id: user.userId,
  });

  if (accessStateError) {
    return NextResponse.json({ error: accessStateError.message }, { status: 500 });
  }

  const accessStateRow = Array.isArray(refreshedAccessState) ? refreshedAccessState[0] : refreshedAccessState;
  if (!accessStateRow) {
    return NextResponse.json({ error: "Access state not found." }, { status: 404 });
  }

  const accessState = {
    userId: accessStateRow.user_id,
    stripeCustomerId: accessStateRow.stripe_customer_id ?? null,
    accessSelectionRequired: Boolean(accessStateRow.access_selection_required),
    currentAccessType: accessStateRow.current_access_type ?? null,
    currentAccessStatus: accessStateRow.current_access_status,
    currentAccessPeriodId: accessStateRow.current_access_period_id ?? null,
    currentStripeSubscriptionId: accessStateRow.current_stripe_subscription_id ?? null,
    currentStripePriceId: accessStateRow.current_stripe_price_id ?? null,
    cancellationScheduled: false,
    currentPeriodStartsAt: accessStateRow.current_period_starts_at ?? null,
    currentPeriodEndsAt: accessStateRow.current_period_ends_at ?? null,
    readOnlyReason: accessStateRow.read_only_reason ?? null,
    canCreateMaps: Boolean(accessStateRow.can_create_maps),
    canEditMaps: Boolean(accessStateRow.can_edit_maps),
    canExport: Boolean(accessStateRow.can_export),
    canShareMaps: Boolean(accessStateRow.can_share_maps),
    canDuplicateMaps: Boolean(accessStateRow.can_duplicate_maps),
  };

  if (!accessCanUseReportGeneration(accessState)) {
    return NextResponse.json(
      { error: "Report generation is not available on the 7 day free trial." },
      { status: 403 },
    );
  }

  const { data: accessibleMap } = await authedSupabase
    .schema("ms")
    .from("system_maps")
    .select("id")
    .eq("id", caseId)
    .maybeSingle();
  addTrace("Verified map access.");

  if (!accessibleMap) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const localMissingInformation = extractLocalMissingInformation(body.caseData);
  const readiness = buildReadiness(localMissingInformation);
  const responseRecoveryNodeCount = countElementType(body.caseData, "incident_response_recovery");

  if (readiness.requires_acknowledgement && !body.acknowledgeMissingInformation) {
    return NextResponse.json(
      {
        error: "Missing investigation information requires user acknowledgement before report generation.",
        readiness,
      },
      { status: 409 },
    );
  }

  try {
    addTrace("Creating OpenAI client.");
    const client = getOpenAIClient();
    const responseInputText = JSON.stringify({
      task: "Generate a structured investigation report using the fixed report layout.",
      report_layout: {
        front_page: [
          "Facts Confirmed",
          "Facts Uncertain",
          "Missing Information",
        ],
        page_order: [
          "Cover Page",
          "Contents",
          "Executive Summary",
          "Long Description",
          "Response / Recovery",
          "People Involved",
          "Incident Timeline",
          "Task And Conditions",
          "Factors And System Factors",
          "Predisposing Factors",
          "Controls And Barriers",
          "Incident Outcomes",
          "Incident Findings",
          "Recommendations",
          "Evidence",
          "Report Metadata",
          "Investigation Sign-Off",
          "Preliminary Facts",
        ],
      },
      local_readiness_assessment: readiness,
      case_data: body.caseData,
    });

    const requestInstructions = [
      "You are an investigation reporting assistant.",
      "ENGLISH SENTENCE STRUCTURE RULES FOR AI CONTENT GENERATION.",
      "SYSTEM PROMPT FORMAT. COPY AND DEPLOY AS-IS.",
      "PRIORITY 1. ABSOLUTE RULES. Never violate these rules. These rules must be applied to every sentence generated without exception.",
      "RULE 1. ONE IDEA PER SENTENCE. Each sentence must contain exactly one main idea. If two ideas are present, they must be written as two separate sentences. Do not join independent ideas with 'and', 'but', or 'so' unless they are directly and inseparably linked.",
      "RULE 2. EVERY SENTENCE MUST BE SELF-CONTAINED. Every sentence must make complete grammatical and logical sense when read in isolation. A reader must not need to read the next sentence to understand the current one.",
      "RULE 3. NEVER FABRICATE OR IMPLY UNKNOWN INFORMATION. If information is not confirmed, do not state it as fact. Do not use vague qualifiers such as 'mostly', 'largely', 'generally', or 'in most cases' to conceal that information is missing or unverified. If something is unknown, state that it is unknown explicitly.",
      "RULE 4. SEPARATE FACTS FROM INTERPRETATION. Confirmed facts and interpretations or assessments must appear in separate sentences. A sentence must not mix what is known with what it might mean. State the fact first. State the interpretation in the next sentence.",
      "RULE 5. ACTIVE VOICE BY DEFAULT. All sentences must use active voice unless the subject of the action is genuinely unknown. In that case, passive voice is permitted. Passive voice must never be used simply to soften a statement or add formality.",
      "PRIORITY 2. STRUCTURAL RULES. Apply these to every sentence.",
      "RULE 6. SENTENCE LENGTH LIMIT. No sentence may exceed 30 words. If a sentence exceeds 30 words, it must be split. Count words before finalising any sentence.",
      "RULE 7. CAUSAL AND CHRONOLOGICAL ORDER. When describing a sequence of events, sentences must be written in the order the events occurred. The cause must appear before the effect. Do not describe an outcome and then explain its cause afterward.",
      "RULE 8. CONTEXT BEFORE CONCLUSION IN LONG SENTENCES. When a sentence requires a qualifying condition, that condition must appear at the start of the sentence. The main point must appear at the end. Example format: 'Although X was the case, Y was the outcome.'",
      "RULE 9. NO EMBEDDED CLAUSES WITHIN CLAUSES. A sentence must not contain a clause nested inside another clause inside another clause. If a sentence requires re-reading to untangle its meaning, it must be rewritten as two or more sentences.",
      "RULE 10. PARALLEL STRUCTURE IN LISTS AND SERIES. When listing items or actions within a sentence, every item must use the same grammatical form. Do not mix verb forms, noun forms, or tense within a list.",
      "PRIORITY 3. FACTUAL AND REPORT-SPECIFIC RULES. Apply these when generating factual, investigative, or report-style content.",
      "RULE 11. LEAD WITH CONFIRMED INFORMATION. When both confirmed and unconfirmed information is present, always state confirmed information first. Unconfirmed or partial information must follow, clearly labelled as such.",
      "RULE 12. USE EXPLICIT UNCERTAINTY MARKERS. When information is incomplete or unverified, use one of the following phrases to signal this clearly: 'This could not be confirmed at the time of writing.' 'It is not yet known whether...' 'Preliminary findings indicate... however this has not been verified.' 'Data for [X] was unavailable at the time of this report.' '[X] is estimated based on available information and may be subject to revision.' Do not omit these markers. Do not substitute them with vague qualifiers.",
      "RULE 13. DISTINGUISH CONFIRMED, ESTIMATED, AND UNKNOWN INFORMATION. Every piece of information must be clearly categorised using the following language. Confirmed fact: state directly with no qualifier. Estimated or partial: use 'approximately', 'based on available data', or 'estimated at'. Unknown: use 'has not been confirmed', 'is not yet known', or 'was unavailable at the time of writing.'",
      "RULE 14. ATTRIBUTE INFORMATION TO ITS SOURCE. When a fact originates from a specific source, document, observation, or report, name that source within the sentence. Example: 'According to the site inspection report...' or 'Based on witness accounts...'",
      "RULE 15. CLOSE INFORMATION GAPS WITH A RESOLUTION STATEMENT. When a gap in information is identified, the following sentence must state when or how that gap will be resolved, if this is known. Example: 'This will be confirmed in the follow-up investigation report.' If resolution timing is unknown, state: 'The timeframe for confirmation has not yet been established.'",
      "RULE 16. NO PADDING OR FILLER PHRASES. The following phrases must never appear in generated content: 'It is worth noting that...' 'It should be mentioned that...' 'As previously stated...' 'It is important to note...' 'Needless to say...' State the fact directly. Remove any phrase that precedes the fact without adding meaning.",
      "PRIORITY 4. FLOW AND READABILITY RULES.",
      "RULE 17. USE TRANSITIONAL WORDS TO SIGNAL RELATIONSHIPS. When a sentence logically follows from the previous one, use a transitional word or phrase to signal the relationship. Use 'However,' for contrast, 'As a result,' for consequence, 'Subsequently,' for chronological follow-on, 'Notably,' for significant information, and 'At the time of writing,' for time-bounded statements.",
      "RULE 18. VARY SENTENCE LENGTH DELIBERATELY. Short sentences under 12 words must be used to state key facts or conclusions. Longer sentences of 12 to 30 words must be used to provide context or explain relationships. Do not generate multiple long sentences in a row without a short sentence between them.",
      "RULE 19. KEEP SUBJECT AND VERB CLOSE TOGETHER. The subject and its verb must not be separated by more than one clause. If a modifier or clause separates the subject from its verb by more than 8 words, restructure the sentence.",
      "RULE 20. PLACE ADVERBS NEXT TO THE WORD THEY MODIFY. Adverbs must be placed immediately before or after the word or phrase they are modifying. Misplaced adverbs change meaning and will not be permitted.",
      "COMPLIANCE CHECKLIST. Before finalising any output, verify every sentence against the following. Does this sentence contain only one main idea? Does this sentence make sense in isolation? Does this sentence state anything unconfirmed as fact? Are facts and interpretations in separate sentences? Is this sentence in active voice where possible? Is this sentence under 30 words? Are events written in the order they occurred? Is uncertainty clearly marked with an approved phrase? Is all information correctly categorised as confirmed, estimated, or unknown? Has any filler language been removed?",
      "OUTPUT BEHAVIOUR INSTRUCTIONS. You are a factual content generator. You must follow all 20 sentence structure rules provided. You must apply the compliance checklist to every sentence before including it in your output. If you cannot confirm a piece of information, you must explicitly state it is unconfirmed using the approved uncertainty markers. You must never use vague language to conceal missing information. You must never exceed 30 words in a single sentence. You must write events in the order they occur. You must separate facts from interpretations. Violations of Priority 1 rules are not permitted under any circumstance.",
      "REFINEMENT INSTRUCTIONS. ADD TO EXISTING SYSTEM PROMPT.",
      "STRICT WORD COUNT ENFORCEMENT. You must count the words in every sentence before including it in your output. No sentence may exceed 30 words. This rule has no exceptions. If a sentence exceeds 30 words at any point during drafting, you must split it before outputting it. Do not wait until the end to check. Check every sentence as it is written.",
      "MULTI-FACT SENTENCE PROHIBITION. When an event produces more than one distinct outcome, each outcome must be written as its own sentence. A sentence must never combine a death toll, a survival count, and a rescue method into one sentence. Each is a separate fact. Each requires a separate sentence. Apply this rule to any sentence that contains more than one number, more than one named outcome, or more than one named party.",
      "NESTED CLAUSE PROHIBITION, EXTENDED. When describing a sequence of conditions that led to an outcome, do not write them as a single sentence. Each condition must be its own sentence. Each outcome must be its own sentence. The following structure is prohibited: '[Action] while [condition] and [condition], which led to [outcome].' Rewrite this as sentence 1, the action. Sentence 2, the first condition. Sentence 3, the second condition. Sentence 4, the outcome.",
      "CAUSAL CHAIN RULE. When one event directly causes another, write the cause as one sentence and the effect as the next sentence. Do not place the cause and effect in the same sentence joined by 'which', 'causing', 'resulting in', or 'leading to'. Use a transitional opener on the effect sentence instead, for example 'As a result,' or 'This caused' or 'Subsequently,'.",
      "RESOLUTION STATEMENT REQUIREMENT. When a paragraph describes an incident, event, or situation where further information exists, such as an investigation, inquiry, findings, or follow-up report, the final sentence of the paragraph must reference this. If investigation findings are known, state them. If they are not included in the paragraph, state that further detail is available and identify where. If no follow-up information exists, state: 'No further information was available at the time of this report.' Do not end a paragraph on an unresolved fact without this closing statement.",
      "DEATH, INJURY, AND OUTCOME SEQUENCING RULE. When an incident results in fatalities, injuries, or significant harm, these must be stated in the following order. Fatalities, stated first, in their own sentence. Injuries or survivors, stated second, in their own sentence. Rescue, recovery, or response details, stated third, in their own sentence. Do not combine any of these into a single sentence regardless of how closely related they appear.",
      "SELF-CHECK INSTRUCTION. APPEND TO EVERY OUTPUT TASK. Before submitting your output, re-read every sentence and answer the following for each one. Is this sentence 30 words or fewer? Does this sentence contain only one fact or idea? Does this sentence contain a clause nested inside another clause? Does this sentence combine a cause and effect using 'which', 'causing', or 'leading to'? If this sentence contains an unresolved fact, does the next sentence resolve it or acknowledge it explicitly? If the answer to any of these checks is a violation, rewrite the sentence before outputting it. Do not output a sentence that fails any check.",
      "Use only the information provided in the input.",
      "Do not infer, assume, estimate, or invent facts.",
      "If information is missing, list it under missing_information.",
      "If a statement may be true but is not directly supported by the input, place it under facts_uncertain.",
      "Write in a neutral, professional, factual tone.",
      "Never use em dashes. Use commas, parentheses, or full stops instead.",
      "Do not assign blame.",
      "Do not use medical, legal, or causal conclusions unless explicitly supported by the provided information.",
      "Follow the fixed report structure exactly.",
      "The first page is a preliminary facts page using the provided fact headings only.",
      "The second page is a cover page.",
      "The third page is a contents page.",
      "After that, generate the report section by section in the supplied order.",
      "For the Executive Summary, write one short direct paragraph in normal report language, not metadata language.",
      "The Executive Summary must describe what physically happened, when it happened, where it happened, and what the result was.",
      "The Executive Summary must set up the activity and operational context before describing the first initiating event in the incident sequence.",
      "The Executive Summary must read in this order where the information is available: date and location, the work or activity underway, the first supported initiating event, the immediate consequence, the escalation or eventual outcome, and finally the injury or fatality outcome.",
      "The first two sentences of the Executive Summary must capture, in clear English and where supported by the information provided: the date, the location, the activity underway, what happened, how it happened, and whether an injury occurred or what the outcome was.",
      "Do not omit the activity underway from the opening of the Executive Summary when that information is available.",
      "Keep the Executive Summary to two to four sentences unless the available information is genuinely too limited to support that structure.",
      "Do not overload the opening sentence. If the date, location, activity, incident sequence, and outcome create an overlong sentence, split them into two clear sentences.",
      "Present the incident sequence in the order it occurred. Do not describe a later event and then explain the earlier cause afterward in the same sentence.",
      "Separate confirmed physical outcomes from potential consequences or risk assessments. Do not combine actual damage, possible injury potential, and uncertainty in one crowded sentence.",
      "If injury status is unknown, state the confirmed physical outcome first, then state clearly in a separate sentence that injury status could not be confirmed from the provided information.",
      "Do not use phrases such as 'the recorded outcomes include', 'it was recorded that', or other wording that makes the summary sound like database extraction.",
      "Do not begin the Executive Summary with a technical event that assumes the reader already understands the operational context.",
      "When equipment names, permit numbers, or component identifiers are used, introduce them in a way that makes sense to a first-time reader rather than assuming prior knowledge.",
      "Where date or time is available, convert it into normal human-readable form rather than raw timestamps.",
      "If a time is approximate based on the available information, it may say approximately.",
      "If outcome nodes explicitly support that there were no injuries, say that clearly in the Executive Summary.",
      "Do not invent a next step or future confirmation action unless the provided information explicitly states one.",
      "Do not write the Executive Summary as a list of recorded items or a recap of what the case data contains.",
      "Do not use phrases such as 'an event titled', 'was recorded', 'case data', 'sequence steps associated with', or similar metadata phrasing.",
      "Do not mention nodes, fields, records, titles, or source-data structure in the Executive Summary.",
      "After the Executive Summary, generate a Long Description section as exactly four paragraphs in this order and with this purpose.",
      "The Long Description must read like a clear investigation narrative written for a human reader, not like pasted node text.",
      "Before writing each Long Description paragraph, synthesise all relevant supported details from the available information and then rewrite them into the clearest narrative structure.",
      "Do not march through one node at a time in sentence order if that produces awkward wording or repeated location, time, or event detail.",
      "If multiple supported details describe the same place, time, event, or circumstance at different levels of specificity, merge them into one natural sentence instead of listing them separately.",
      "For example, if one supported detail gives a site and another gives a more specific area within that site, write them together naturally as one location phrase such as 'at the site, within the specific area' rather than adding a second clause that sounds like metadata.",
      "Do not write phrases such as 'with sequence steps occurring at', 'supporting information indicates', 'the nodes show', 'the record states', or similar constructions.",
      "Long Description paragraph 1 must state: on this date, at this time, this happened in this location, which resulted in these outcomes, what task was being completed and or what conditions existed, and whether an injury occurred or did not occur if explicitly supported.",
      "Long Description paragraph 1 must use sequence nodes, task and condition nodes, and outcome nodes where available, but it must combine them into one easy-to-read opening account.",
      "Long Description paragraph 1 must explicitly say that an item is unknown at this stage when the relevant information is not available.",
      "Long Description paragraph 2 must give a chronological recount of what occurred using the sequence information as the backbone and weaving in only the supporting factors, system factors, findings, people, and predisposing factors that help the reader understand the event progression.",
      "The Long Description must be sequential in layout. It must begin with the first supported incident sequence step and then move through the remaining sequence steps in logical order without jumping ahead or summarising later events before earlier ones.",
      "When supporting node information is used in the Long Description, it must be inserted at the point in the sequence where it becomes relevant. Do not group all supporting factors, people, or findings into a separate untimed summary if they belong to a specific stage of the incident timeline.",
      "Do not rearrange the incident sequence for style. Preserve the actual order of events shown by the sequence nodes unless two events share the same supported time and order cannot be distinguished.",
      "If sequence timing is incomplete, use the best supported logical order from the available sequence nodes and state clearly where exact timing could not be confirmed.",
      "The Long Description must read like a step-by-step incident narrative, not a thematic summary.",
      "Long Description paragraph 2 must be written as a coherent narrative with natural sentence structure, transitions, and links between events.",
      "Long Description paragraph 2 may reuse important investigation terminology from the source information, but it must not preserve awkward source phrasing if it harms readability.",
      "Long Description paragraph 3 must explain which controls or barriers contributed, whether they were present or absent, effective or ineffective, and how the predisposing factors and findings support that view.",
      "Long Description paragraph 3 must not use self-contradictory wording such as saying controls were present but absent.",
      "If multiple controls were identified and they had different states, describe them precisely, for example: some controls were identified, but several were missing, failed, ineffective, or overwhelmed at key points.",
      "Use 'identified', 'existing', 'available', 'missing', 'failed', 'ineffective', or 'overwhelmed' carefully so that each sentence remains logically consistent.",
      "Long Description paragraph 3 must link those control or barrier statements back to the earlier incident sequence and other supported information in a clear explanatory paragraph.",
      "Long Description paragraph 4 must set out the key recommendations and explain why they are critical by linking them back to the earlier supported events, factors, controls, barriers, findings, and outcomes.",
      "The Long Description must remain factual, sequential, internally consistent, and easy to follow.",
      "Every sentence in every section must be logically coherent on its own and must not rely on the reader already knowing the source material.",
      "The Long Description must prefer reader clarity over mirroring the original wording of any single source item.",
      "The Long Description must not mention nodes, fields, records, source-data structure, or say that the AI is generating the text.",
      "The Long Description must not infer unsupported causation, motives, diagnoses, or conclusions.",
      "If evidence for a requested point is missing, state that the specific point is unknown at this stage rather than inventing bridging detail.",
      "For Response And Recovery, write one short factual introduction about the immediate response or recovery actions taken after the incident and then provide a supporting table.",
      "Use response and recovery nodes for this section, including their category and descriptive detail where available.",
      "Use person nodes only for the People Involved visual section.",
      "Use sequence nodes for incident date, time, location, and timeline entries where available.",
      "Use outcome nodes to determine impacts and whether injury did or did not occur, but only if explicitly supported.",
      "For Task And Conditions, write one short factual paragraph in normal report language.",
      "The Task And Conditions paragraph must describe what work was being undertaken and the conditions that were present or absent, if explicitly supported.",
      "Do not write Task And Conditions as a list, dataset summary, node recap, or metadata description.",
      "Do not mention task nodes, condition nodes, records, titles, or source-data structure in Task And Conditions.",
      "Use task/condition nodes for task context.",
      "For Factors And System Factors, exclude items identified as predisposing.",
      "For Predisposing Factors, include only factors or system factors identified as predisposing.",
      "For Controls And Barriers, include state, role, type, and supporting detail where present.",
      "For Incident Findings, provide an executive-summary level paragraph plus a supporting table.",
      "For Recommendations, provide an intro paragraph, a supporting table, and approval fields.",
      "For Evidence, list each item one by one and keep the preview_max_width_percent at 90.",
      "If a section has no supporting source nodes, keep the section structurally present but leave rows or entries empty and rely on missing_information to explain the gap.",
    ].join(" ");

    const createReportResponse = (maxOutputTokens: number) =>
      client.responses.create({
        model: investigationReportModel,
        store: false,
        max_output_tokens: maxOutputTokens,
        instructions: requestInstructions,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: responseInputText,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "investigation_report_layout_result",
            schema: generateReportSchema,
            strict: true,
          },
        },
      });

    addTrace("Submitting OpenAI structured response request (max_output_tokens=5200).");
    let response = await createReportResponse(5200);
    addTrace("OpenAI returned first structured response.");
    let diagnostic = extractResponseDiagnostic(response as unknown as Record<string, unknown>);
    let outputText = response.output_text?.trim();

    if (diagnostic.incompleteReason === "max_output_tokens") {
      addTrace("OpenAI response hit max_output_tokens, retrying with 12000.");
      response = await createReportResponse(12000);
      addTrace("OpenAI returned second structured response.");
      diagnostic = extractResponseDiagnostic(response as unknown as Record<string, unknown>);
      outputText = response.output_text?.trim();
    }

    if (!outputText) {
      return NextResponse.json(
        {
          error: "OpenAI returned no structured text output.",
          diagnostic: { ...diagnostic, trace },
        },
        { status: 502 },
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(outputText);
      addTrace("Structured JSON parsed successfully.");
    } catch {
      return NextResponse.json(
        {
          error: "OpenAI returned invalid JSON.",
          diagnostic: { ...diagnostic, trace },
        },
        { status: 502 },
      );
    }

    if (!isGenerateReportResponse(parsed)) {
      return NextResponse.json(
        {
          error: "OpenAI returned a response that did not match the expected schema.",
          diagnostic: { ...diagnostic, trace },
        },
        { status: 502 },
      );
    }

    parsed.readiness = readiness;

    if (responseRecoveryNodeCount === 0) {
      parsed.report.sections.response_and_recovery = {
        summary: "",
        columns: [],
        rows: [],
      };
      parsed.report.section_visibility = {
        ...(parsed.report.section_visibility ?? {}),
        response_and_recovery: false,
      };
    }

    const draftReportText = buildDraftReportText(parsed);
    addTrace("Draft report text assembled.");

    addTrace("Loading previous report versions for numbering and branding.");
    const { data: previousReportRows } = await authedSupabase
      .schema("ms")
      .from("investigation_reports")
      .select("version_number,ai_output_json")
      .eq("case_id", caseId)
      .order("version_number", { ascending: false })
      .limit(50);

    const latestVersionRow = previousReportRows?.[0] ?? null;

    const nextVersionNumber =
      latestVersionRow && typeof latestVersionRow.version_number === "number"
        ? latestVersionRow.version_number + 1
        : 1;

    const previousBranding =
      previousReportRows
        ?.map((row) => getPreviousReportBranding(row.ai_output_json))
        .find((branding): branding is PreviousReportBranding => branding !== null) ?? null;

    if (previousBranding) {
      parsed.report.branding = {
        ...(parsed.report.branding ?? {}),
        ...previousBranding,
      };
    }

    const { data: savedReport, error: saveError } = await authedSupabase
      .schema("ms")
      .from("investigation_reports")
      .insert({
        case_id: caseId,
        version_number: nextVersionNumber,
        generated_by_user_id: user.userId,
        input_snapshot_json: body.caseData,
        ai_output_json: parsed,
        draft_report_text: draftReportText || null,
        missing_information_json: parsed.missing_information,
        status: "draft",
      })
      .select("id,status,generated_at,updated_at,version_number")
      .single();
    addTrace("Attempted to save generated report.");

    if (saveError || !savedReport) {
      return NextResponse.json(
        {
          error: saveError.message || "Report generated but could not be saved.",
          diagnostic: { trace },
        },
        { status: 500 },
      );
    }

    const nextLongDescription = parsed.report.sections.long_description.trim();
    const { error: mapUpdateError } = await authedSupabase
      .schema("ms")
      .from("system_maps")
      .update({
        incident_long_description: nextLongDescription || null,
      })
      .eq("id", caseId);
    addTrace("Attempted to sync system map long description.");

    if (mapUpdateError) {
      return NextResponse.json(
        {
          error: "Report generated and saved, but the investigation long description could not be updated.",
          diagnostic: { trace },
        },
        { status: 500 },
      );
    }

    addTrace("Generated report saved successfully.");
    return NextResponse.json({
      ...parsed,
      saved_report: savedReport,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to generate report.",
        readiness,
        diagnostic: { trace },
      },
      { status: 500 },
    );
  }
}
