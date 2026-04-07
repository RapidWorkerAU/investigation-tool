import type { InvestigationReportPayload } from "@/lib/investigation-report/types";

const pdfSectionVisibilityDefaults = {
  executive_summary: true,
  long_description: true,
  task_and_conditions: true,
  incident_outcomes: true,
  people_involved: true,
  incident_timeline: true,
  factors_and_system_factors: true,
  predisposing_factors: true,
  controls_and_barriers: true,
  incident_findings: true,
  recommendations: true,
  preliminary_facts: true,
  evidence: true,
  signatures: true,
} as const;

export function buildDraftReportText(report: InvestigationReportPayload) {
  return [
    report.report.sections.executive_summary,
    report.report.sections.long_description,
    report.report.sections.task_and_conditions,
    report.report.sections.incident_outcomes,
    report.report.sections.incident_findings.summary,
    report.report.sections.recommendations.summary,
    report.report.sections.report_metadata,
  ]
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .join("\n\n");
}

export function normalizeInvestigationReportPayload(report: InvestigationReportPayload): InvestigationReportPayload {
  const recommendationPrefills = Array.isArray(report.report.sections.recommendation_sign_off_prefills)
    ? report.report.sections.recommendation_sign_off_prefills.map((item) => (typeof item === "string" ? item : ""))
    : [];
  const recommendationEndorsements = Array.isArray(report.report.sections.recommendations.endorsed)
    ? report.report.sections.recommendations.endorsed.map((item) => item === true)
    : [];
  const uncertainNotes = Array.isArray(report.report.sections.preliminary_facts?.uncertain_notes)
    ? report.report.sections.preliminary_facts?.uncertain_notes.map((item) => (typeof item === "string" ? item : ""))
    : [];
  const missingInformationNotes = Array.isArray(report.report.sections.preliminary_facts?.missing_information_notes)
    ? report.report.sections.preliminary_facts?.missing_information_notes.map((item) => (typeof item === "string" ? item : ""))
    : [];
  const investigationSignoffPrefills = Array.isArray(report.report.sections.investigation_sign_off.prefills)
    ? report.report.sections.investigation_sign_off.prefills.map((item) => (typeof item === "string" ? item : ""))
    : [];

  return {
    ...report,
    report: {
      ...report.report,
      branding: {
        logo_storage_path: report.report.branding?.logo_storage_path ?? "",
        section_heading_color: report.report.branding?.section_heading_color ?? "#22344d",
        table_heading_color: report.report.branding?.table_heading_color ?? "#7c8793",
      },
      section_visibility: {
        ...pdfSectionVisibilityDefaults,
        ...(report.report.section_visibility ?? {}),
      },
      sections: {
        ...report.report.sections,
        evidence: {
          ...report.report.sections.evidence,
          items: report.report.sections.evidence.items.map((item) => ({
            ...item,
            include_in_report: item.include_in_report !== false,
          })),
        },
        preliminary_facts: {
          uncertain_notes: report.facts_uncertain.map((_item, index) => uncertainNotes[index] ?? ""),
          missing_information_notes: report.missing_information.map((_item, index) => missingInformationNotes[index] ?? ""),
        },
        recommendations: {
          ...report.report.sections.recommendations,
          endorsed: report.report.sections.recommendations.rows.map(
            (_row, index) => recommendationEndorsements[index] === true,
          ),
        },
        recommendation_sign_off_prefills: report.report.sections.recommendations.approval_fields.map(
          (_field, index) => recommendationPrefills[index] ?? "",
        ),
        investigation_sign_off: {
          ...report.report.sections.investigation_sign_off,
          prefills: report.report.sections.investigation_sign_off.fields.map(
            (_field, index) => investigationSignoffPrefills[index] ?? "",
          ),
        },
      },
    },
  };
}
