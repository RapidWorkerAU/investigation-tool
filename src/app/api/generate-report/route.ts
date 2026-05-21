import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient, investigationReportModel } from "@/lib/openai/server";
import { accessCanUseReportGeneration } from "@/lib/access";
import { buildDraftReportText } from "@/lib/investigation-report/helpers";
import { generateReportSchema } from "@/lib/investigation-report/schema";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import { createAuthedServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { insertUserProfileActivity } from "@/lib/userProfileActivity";
import type { InvestigationReportPayload, ReadinessCheck, ReportRowItem } from "@/lib/investigation-report/types";

export const runtime = "nodejs";

type GenerateReportRequest = {
  caseData?: unknown;
};

type GenerateReportResponse = InvestigationReportPayload;
type RowItem = ReportRowItem;
type PreviousReportBranding = {
  logo_storage_path?: string;
  section_heading_color?: string;
  table_heading_color?: string;
};

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

function reduceRepeatedSentenceOpeners(text: string) {
  return text
    .split(/(\n{2,})/)
    .map((part) => {
      if (/^\n+$/.test(part)) return part;
      const openerCounts = new Map<string, number>();
      let previousOpener = "";

      return part.replace(
        /(^|[.!?]\s+)(Subsequently|As a result|However|Notably|Then|Next|Afterward|Afterwards|Following this),\s+/gi,
        (_match, prefix: string, opener: string) => {
          const key = opener.toLowerCase();
          const count = (openerCounts.get(key) ?? 0) + 1;
          openerCounts.set(key, count);

          if ((key === "subsequently" && count > 1) || (key === "as a result" && count > 1) || key === previousOpener) {
            previousOpener = "";
            return prefix;
          }

          previousOpener = key;
          return `${prefix}${opener}, `;
        },
      );
    })
    .join("");
}

function polishGeneratedNarrativeSections(report: InvestigationReportPayload) {
  const sections = report.report.sections;
  sections.executive_summary = reduceRepeatedSentenceOpeners(sections.executive_summary);
  sections.long_description = reduceRepeatedSentenceOpeners(sections.long_description);
  sections.response_and_recovery.summary = reduceRepeatedSentenceOpeners(sections.response_and_recovery.summary);
  sections.task_and_conditions = reduceRepeatedSentenceOpeners(sections.task_and_conditions);
  sections.incident_outcomes = reduceRepeatedSentenceOpeners(sections.incident_outcomes);
  sections.incident_findings.summary = reduceRepeatedSentenceOpeners(sections.incident_findings.summary);
  sections.recommendations.summary = reduceRepeatedSentenceOpeners(sections.recommendations.summary);
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
  const recordReportActivity = async (
    status: "success" | "failed",
    summary: string,
    metadata: Record<string, unknown> = {},
  ) => {
    await insertUserProfileActivity(serviceSupabase, {
      userId: user.userId,
      actorUserId: user.userId,
      action: "report_generation",
      status,
      summary,
      metadata: {
        caseId,
        ...metadata,
      },
    });
  };
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

  const { data: orgMemberships, error: orgMembershipsError } = await serviceSupabase
    .from("organisation_memberships")
    .select("organisation_id")
    .eq("user_id", user.userId)
    .eq("invite_status", "active");

  if (orgMembershipsError) {
    return NextResponse.json({ error: orgMembershipsError.message }, { status: 500 });
  }

  let orgManagedAccess = false;
  const organisationIds = Array.from(new Set((orgMemberships ?? []).map((membership) => membership.organisation_id)));

  if (organisationIds.length) {
    const { data: activeOrganisations, error: organisationsError } = await serviceSupabase
      .from("organisations")
      .select("id")
      .in("id", organisationIds)
      .eq("status", "active")
      .limit(1);

    if (organisationsError) {
      return NextResponse.json({ error: organisationsError.message }, { status: 500 });
    }

    orgManagedAccess = Boolean(activeOrganisations?.length);
  }

  const accessState = {
    userId: accessStateRow.user_id,
    stripeCustomerId: accessStateRow.stripe_customer_id ?? null,
    accessSelectionRequired: orgManagedAccess ? false : Boolean(accessStateRow.access_selection_required),
    currentAccessType: orgManagedAccess ? "subscription_monthly" : accessStateRow.current_access_type ?? null,
    currentAccessStatus: orgManagedAccess ? "active" : accessStateRow.current_access_status,
    currentAccessPeriodId: accessStateRow.current_access_period_id ?? null,
    currentStripeSubscriptionId: accessStateRow.current_stripe_subscription_id ?? null,
    currentStripePriceId: accessStateRow.current_stripe_price_id ?? null,
    cancellationScheduled: false,
    currentPeriodStartsAt: accessStateRow.current_period_starts_at ?? null,
    currentPeriodEndsAt: accessStateRow.current_period_ends_at ?? null,
    readOnlyReason: orgManagedAccess ? null : accessStateRow.read_only_reason ?? null,
    canCreateMaps: orgManagedAccess ? true : Boolean(accessStateRow.can_create_maps),
    canEditMaps: orgManagedAccess ? true : Boolean(accessStateRow.can_edit_maps),
    canExport: orgManagedAccess ? true : Boolean(accessStateRow.can_export),
    canShareMaps: orgManagedAccess ? true : Boolean(accessStateRow.can_share_maps),
    canDuplicateMaps: orgManagedAccess ? true : Boolean(accessStateRow.can_duplicate_maps),
  };

  if (!accessCanUseReportGeneration(accessState)) {
    await recordReportActivity("failed", "Report generation unavailable.", {
      source: "access_control",
      currentAccessType: accessState.currentAccessType,
      currentAccessStatus: accessState.currentAccessStatus,
      readOnlyReason: accessState.readOnlyReason,
    });
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
    await recordReportActivity("failed", "Report generation forbidden.", {
      source: "supabase",
      reason: "map_access_denied",
    });
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const readiness: ReadinessCheck = {
    requires_acknowledgement: false,
    missing_information_detected: [],
    disclaimer: null,
    suggested_next_steps: [],
  };
  const responseRecoveryNodeCount = countElementType(body.caseData, "incident_response_recovery");

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
      case_data: body.caseData,
    });

    const requestInstructions = [
      "You are an investigation reporting assistant.",
      "ENGLISH SENTENCE STRUCTURE RULES FOR AI CONTENT GENERATION.",
      "SYSTEM PROMPT FORMAT. COPY AND DEPLOY AS-IS.",
      "PRIORITY 1. ABSOLUTE RULES. Never violate these rules. These rules must be applied to every sentence generated without exception.",
      "RULE 1. CLEAR PURPOSE PER SENTENCE. Each sentence must have one clear purpose. Closely related actions may be combined when they share the same actor, object, time period, and context, and when combining them improves readability without obscuring facts.",
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
      "RULE 17. USE TRANSITIONS SPARINGLY AND NATURALLY. Do not force a transition word into every sentence. Use explicit transitions only when they add meaning. Never start consecutive sentences with the same word or phrase. Do not use 'Subsequently' more than once in a paragraph. Prefer chronological order, exact times, subjects, and clear verbs over repeated transition openers.",
      "RULE 18. VARY SENTENCE LENGTH DELIBERATELY. Short sentences under 12 words must be used to state key facts or conclusions. Longer sentences of 12 to 30 words must be used to provide context or explain relationships. Do not generate multiple long sentences in a row without a short sentence between them.",
      "RULE 19. KEEP SUBJECT AND VERB CLOSE TOGETHER. The subject and its verb must not be separated by more than one clause. If a modifier or clause separates the subject from its verb by more than 8 words, restructure the sentence.",
      "RULE 20. PLACE ADVERBS NEXT TO THE WORD THEY MODIFY. Adverbs must be placed immediately before or after the word or phrase they are modifying. Misplaced adverbs change meaning and will not be permitted.",
      "COMPLIANCE CHECKLIST. Before finalising any output, verify every sentence against the following. Does this sentence have one clear purpose? Does this sentence make sense in isolation? Does this sentence state anything unconfirmed as fact? Are facts and interpretations in separate sentences? Is this sentence in active voice where possible? Is this sentence under 30 words? Are events written in the order they occurred? Is uncertainty clearly marked with an approved phrase? Is all information correctly categorised as confirmed, estimated, or unknown? Has any filler language been removed? Does the paragraph avoid repeated sentence openings?",
      "OUTPUT BEHAVIOUR INSTRUCTIONS. You are a factual content generator. You must follow all 20 sentence structure rules provided. You must apply the compliance checklist to every sentence before including it in your output. If you cannot confirm a piece of information, you must explicitly state it is unconfirmed using the approved uncertainty markers. You must never use vague language to conceal missing information. You must never exceed 30 words in a single sentence. You must write events in the order they occur. You must separate facts from interpretations. Violations of Priority 1 rules are not permitted under any circumstance.",
      "REFINEMENT INSTRUCTIONS. ADD TO EXISTING SYSTEM PROMPT.",
      "STRICT WORD COUNT ENFORCEMENT. You must count the words in every sentence before including it in your output. No sentence may exceed 30 words. This rule has no exceptions. If a sentence exceeds 30 words at any point during drafting, you must split it before outputting it. Do not wait until the end to check. Check every sentence as it is written.",
      "MULTI-FACT SENTENCE CONTROL. Keep separate outcomes in separate sentences when combining them would confuse cause, severity, timing, or responsibility. Do not split closely related simple actions into separate sentences merely because they came from separate source items.",
      "NESTED CLAUSE PROHIBITION, EXTENDED. When describing a sequence of conditions that led to an outcome, do not write them as a single sentence. Each condition must be its own sentence. Each outcome must be its own sentence. The following structure is prohibited: '[Action] while [condition] and [condition], which led to [outcome].' Rewrite this as sentence 1, the action. Sentence 2, the first condition. Sentence 3, the second condition. Sentence 4, the outcome.",
      "CAUSAL CHAIN RULE. When one event directly causes another, write the cause before the effect. Use 'As a result,' only when a causal link is explicitly supported and the phrase improves clarity. Do not use 'Subsequently' to imply causation.",
      "INFORMATION GAP RULE. Do not end every paragraph with a missing-information statement. Put missing information in missing_information unless a specific unknown is essential to understanding that paragraph.",
      "DEATH, INJURY, AND OUTCOME SEQUENCING RULE. When an incident results in fatalities, injuries, or significant harm, these must be stated in the following order. Fatalities, stated first, in their own sentence. Injuries or survivors, stated second, in their own sentence. Rescue, recovery, or response details, stated third, in their own sentence. Do not combine any of these into a single sentence regardless of how closely related they appear.",
      "SELF-CHECK INSTRUCTION. APPEND TO EVERY OUTPUT TASK. Before submitting your output, re-read every sentence and answer the following for each one. Is this sentence 30 words or fewer? Does this sentence have one clear purpose? Does this sentence contain a clause nested inside another clause? Does this sentence combine a cause and effect using 'which', 'causing', or 'leading to'? Does this paragraph avoid repeated openings and repeated transition words? If this sentence contains an unresolved fact, does the next sentence resolve it or acknowledge it explicitly? If the answer to any of these checks is a violation, rewrite the sentence before outputting it. Do not output a sentence that fails any check.",
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
      "NARRATIVE QUALITY RULE. For simple or sparse incident maps, do not convert every source item into a separate sentence. Synthesize adjacent, related steps into a readable account while preserving the supported order and facts.",
      "NARRATIVE QUALITY RULE. Avoid repeated openings such as 'At approximately', 'Subsequently', 'The worker', or the same person's full name in every sentence. Use the time only when it helps the reader follow the sequence. Use pronouns when the referent is clear.",
      "NARRATIVE QUALITY RULE. No paragraph may contain the same transition opener more than once. A paragraph must not read like a list of database events joined by repeated connector words.",
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
      "Long Description paragraph 2 must avoid mechanical repetition. Do not begin each sentence with the time, the actor's full name, or 'Subsequently'.",
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
      await recordReportActivity("failed", "OpenAI report output failed.", {
        source: "openai",
        diagnostic,
        trace,
      });
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
    } catch (parseError) {
      await recordReportActivity("failed", "OpenAI report JSON failed.", {
        source: "openai",
        error: parseError instanceof Error ? parseError.message : String(parseError),
        diagnostic,
        trace,
      });
      return NextResponse.json(
        {
          error: "OpenAI returned invalid JSON.",
          diagnostic: { ...diagnostic, trace },
        },
        { status: 502 },
      );
    }

    if (!isGenerateReportResponse(parsed)) {
      await recordReportActivity("failed", "OpenAI report schema failed.", {
        source: "openai",
        diagnostic,
        trace,
      });
      return NextResponse.json(
        {
          error: "OpenAI returned a response that did not match the expected schema.",
          diagnostic: { ...diagnostic, trace },
        },
        { status: 502 },
      );
    }

    parsed.readiness = readiness;
    polishGeneratedNarrativeSections(parsed);
    addTrace("Narrative transition polish applied.");

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
      await recordReportActivity("failed", "Report save failed.", {
        source: "supabase",
        error: saveError?.message ?? "Saved report payload missing.",
        nextVersionNumber,
        trace,
      });
      return NextResponse.json(
        {
          error: saveError?.message || "Report generated but could not be saved.",
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
      await recordReportActivity("failed", "Report map sync failed.", {
        source: "supabase",
        error: mapUpdateError.message,
        savedReportId: savedReport.id,
        versionNumber: savedReport.version_number,
        trace,
      });
      return NextResponse.json(
        {
          error: "Report generated and saved, but the investigation long description could not be updated.",
          diagnostic: { trace },
        },
        { status: 500 },
      );
    }

    addTrace("Generated report saved successfully.");
    await recordReportActivity("success", "Report generated.", {
      source: "openai",
      savedReportId: savedReport.id,
      versionNumber: savedReport.version_number,
      status: savedReport.status,
      generatedAt: savedReport.generated_at,
    });
    return NextResponse.json({
      ...parsed,
      saved_report: savedReport,
    });
  } catch (error) {
    await recordReportActivity("failed", "Report generation failed.", {
      source: "application",
      error: error instanceof Error ? error.message : String(error),
      trace,
    });
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
