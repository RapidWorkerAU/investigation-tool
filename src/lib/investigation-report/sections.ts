export const reportSectionVisibilityIds = [
  "executive_summary",
  "long_description",
  "response_and_recovery",
  "task_and_conditions",
  "incident_outcomes",
  "people_involved",
  "incident_timeline",
  "factors_and_system_factors",
  "predisposing_factors",
  "controls_and_barriers",
  "incident_findings",
  "recommendations",
  "preliminary_facts",
  "evidence",
  "signatures",
] as const;

export type ReportSectionVisibilityId = (typeof reportSectionVisibilityIds)[number];

export const reportSectionVisibilityDefaults: Record<ReportSectionVisibilityId, boolean> =
  Object.fromEntries(reportSectionVisibilityIds.map((id) => [id, true])) as Record<ReportSectionVisibilityId, boolean>;

export function isReportSectionVisibilityId(value: string): value is ReportSectionVisibilityId {
  return reportSectionVisibilityIds.includes(value as ReportSectionVisibilityId);
}

export function isReportSectionVisible(
  visibility: Partial<Record<ReportSectionVisibilityId, boolean>> | null | undefined,
  sectionId: ReportSectionVisibilityId
) {
  return visibility?.[sectionId] !== false;
}
