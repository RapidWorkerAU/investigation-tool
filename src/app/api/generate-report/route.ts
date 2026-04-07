import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient, investigationReportModel } from "@/lib/openai/server";
import { buildDraftReportText } from "@/lib/investigation-report/helpers";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import { createAuthedServerClient } from "@/lib/supabase/server";
import type { InvestigationReportPayload, ReadinessCheck, ReportRowItem } from "@/lib/investigation-report/types";

export const runtime = "nodejs";

type GenerateReportRequest = {
  caseData?: unknown;
  acknowledgeMissingInformation?: boolean;
};

type GenerateReportResponse = InvestigationReportPayload;
type RowItem = ReportRowItem;

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

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as GenerateReportRequest | null;
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
  const { data: accessibleMap } = await authedSupabase
    .schema("ms")
    .from("system_maps")
    .select("id")
    .eq("id", caseId)
    .maybeSingle();

  if (!accessibleMap) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const localMissingInformation = extractLocalMissingInformation(body.caseData);
  const readiness = buildReadiness(localMissingInformation);

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
    const client = getOpenAIClient();

    const response = await client.responses.create({
      model: investigationReportModel,
      store: false,
      max_output_tokens: 5200,
      instructions: [
        "You are an investigation reporting assistant.",
        "Use only the information provided in the input.",
        "Do not infer, assume, estimate, or invent facts.",
        "If information is missing, list it under missing_information.",
        "If a statement may be true but is not directly supported by the input, place it under facts_uncertain.",
        "Write in a neutral, professional, factual tone.",
        "Do not assign blame.",
        "Do not use medical, legal, or causal conclusions unless explicitly supported by the provided information.",
        "Follow the fixed report structure exactly.",
        "The first page is a preliminary facts page using the provided fact headings only.",
        "The second page is a cover page.",
        "The third page is a contents page.",
        "After that, generate the report section by section in the supplied order.",
        "For the Executive Summary, write one short direct paragraph in normal report language, not metadata language.",
        "The Executive Summary must describe what physically happened, when it happened, where it happened, and what the result was.",
        "Where date or time is available, convert it into normal human-readable form rather than raw timestamps.",
        "If a time is approximate based on the available information, it may say approximately.",
        "If outcome nodes explicitly support that there were no injuries, say that clearly in the Executive Summary.",
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
        "Long Description paragraph 2 must be written as a coherent narrative with natural sentence structure, transitions, and links between events.",
        "Long Description paragraph 2 may reuse important investigation terminology from the source information, but it must not preserve awkward source phrasing if it harms readability.",
        "Long Description paragraph 3 must explain which controls or barriers contributed, whether they were present or absent, effective or ineffective, and how the predisposing factors and findings support that view.",
        "Long Description paragraph 3 must link those control or barrier statements back to the earlier incident sequence and other supported information in a clear explanatory paragraph.",
        "Long Description paragraph 4 must set out the key recommendations and explain why they are critical by linking them back to the earlier supported events, factors, controls, barriers, findings, and outcomes.",
        "The Long Description must remain factual, sequential, internally consistent, and easy to follow.",
        "The Long Description must prefer reader clarity over mirroring the original wording of any single source item.",
        "The Long Description must not mention nodes, fields, records, source-data structure, or say that the AI is generating the text.",
        "The Long Description must not infer unsupported causation, motives, diagnoses, or conclusions.",
        "If evidence for a requested point is missing, state that the specific point is unknown at this stage rather than inventing bridging detail.",
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
      ].join(" "),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(
                {
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
          name: "investigation_report_layout_result",
          schema: generateReportSchema,
          strict: true,
        },
      },
    });

    const outputText = response.output_text?.trim();
    const diagnostic = extractResponseDiagnostic(response as unknown as Record<string, unknown>);

    if (!outputText) {
      return NextResponse.json(
        {
          error: "OpenAI returned no structured text output.",
          diagnostic,
        },
        { status: 502 },
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(outputText);
    } catch {
      return NextResponse.json(
        {
          error: "OpenAI returned invalid JSON.",
          diagnostic,
        },
        { status: 502 },
      );
    }

    if (!isGenerateReportResponse(parsed)) {
      return NextResponse.json(
        {
          error: "OpenAI returned a response that did not match the expected schema.",
          diagnostic,
        },
        { status: 502 },
      );
    }

    parsed.readiness = readiness;

    const draftReportText = buildDraftReportText(parsed);

    const { data: latestVersionRow } = await authedSupabase
      .schema("ms")
      .from("investigation_reports")
      .select("version_number")
      .eq("case_id", caseId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersionNumber =
      latestVersionRow && typeof latestVersionRow.version_number === "number"
        ? latestVersionRow.version_number + 1
        : 1;

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

    if (saveError || !savedReport) {
      return NextResponse.json(
        { error: saveError.message || "Report generated but could not be saved." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ...parsed,
      saved_report: savedReport,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to generate report.",
        readiness,
      },
      { status: 500 },
    );
  }
}
