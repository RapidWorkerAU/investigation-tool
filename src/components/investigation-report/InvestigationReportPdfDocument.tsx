import React from "react";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatReportDateTime } from "@/lib/investigation-report/formatters";
import { isReportSectionVisible, type ReportSectionVisibilityId } from "@/lib/investigation-report/sections";
import { splitBracketedValue, toTitleCaseLabel } from "@/lib/investigation-report/text";

type TableData = {
  columns: string[];
  rows: string[][];
};

type PersonCard = {
  id: string;
  role: string;
  department: string;
};

type TimelineItem = {
  id: string;
  date: string;
  time: string;
  location: string;
  description: string;
};

type EvidenceEntry = {
  attachmentNumber: number;
  description: string;
  fileType: string;
  previewSources: Array<{
    src: string;
    orientation: "portrait" | "landscape";
  }>;
};

type ContentEntry = {
  label: string;
  index: number;
};

type PdfReportPayload = {
  saved_report: { status: "draft" | "reviewed" | "approved"; generated_at: string; version_number: number };
  facts_uncertain: string[];
  missing_information: string[];
  report: {
    branding?: {
      logo_storage_path?: string;
      section_heading_color?: string;
      table_heading_color?: string;
    };
    section_visibility?: Partial<Record<ReportSectionVisibilityId, boolean>>;
    front_page: {
      facts_uncertain_heading: string;
      missing_information_heading: string;
    };
    cover_page: {
      incident_name: string;
    };
    sections: {
      executive_summary: string;
      long_description: string;
      response_and_recovery: { summary: string; columns: string[]; rows: string[][] };
      people_involved: { heading: string; note: string };
      incident_timeline: { heading: string; entries: string[] };
      task_and_conditions: string;
      factors_and_system_factors: { heading: string };
      predisposing_factors: { heading: string };
      controls_and_barriers: { heading: string };
      incident_outcomes: string;
      incident_findings: { summary: string; columns: string[]; rows: string[][] };
      recommendations: { summary: string; approval_fields: string[]; endorsed?: boolean[] };
      evidence: { heading: string };
      preliminary_facts?: {
        uncertain_notes?: string[];
        missing_information_notes?: string[];
      };
      report_metadata: string;
      investigation_sign_off: { heading: string; fields: string[]; prefills?: string[] };
      recommendation_sign_off_prefills?: string[];
    };
  };
};

export type InvestigationReportPdfDocumentProps = {
  report: PdfReportPayload;
  map: {
    title: string | null;
    incident_location: string | null;
    incident_occurred_at: string | null;
    created_at: string;
    responsible_person_name: string | null;
    investigation_lead_name: string | null;
  } | null;
  logoUrl?: string;
  contentEntries: ContentEntry[];
  people: PersonCard[];
  timelineItems: TimelineItem[];
  taskConditionsTable: TableData;
  incidentFactorsTable: TableData;
  incidentSystemFactorsTable: TableData;
  predisposingFactorsTable: TableData;
  controlsTable: TableData;
  responseRecoveryTable: TableData;
  incidentOutcomesTable: TableData;
  findingsTable: TableData;
  recommendationsTable: TableData;
  evidenceEntries: EvidenceEntry[];
};

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingRight: 34,
    paddingBottom: 42,
    paddingLeft: 34,
    backgroundColor: "#ffffff",
    color: "#1d2430",
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  pageCompact: {
    paddingTop: 20,
    paddingRight: 34,
    paddingBottom: 42,
    paddingLeft: 34,
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 34,
    right: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerLine: {
    flexGrow: 1,
    height: 1,
    backgroundColor: "#707780",
  },
  footerText: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#5f6978",
  },
  pageTitle: {
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#d7dce3",
    fontSize: 18,
    fontWeight: 600,
  },
  section: {
    marginBottom: 30,
    width: "100%",
  },
  sectionSpacing: {
    height: 30,
  },
  tableSectionStart: {
    width: "100%",
  },
  sectionHeaderBlock: {
    marginBottom: 8,
    width: "100%",
  },
  sectionTitle: {
    marginBottom: 6,
    paddingTop: 6,
    paddingRight: 10,
    paddingBottom: 6,
    paddingLeft: 10,
    backgroundColor: "#22344d",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    width: "100%",
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.45,
    width: "100%",
  },
  paragraphBlock: {
    marginBottom: 8,
    fontSize: 10,
    lineHeight: 1.45,
    width: "100%",
  },
  subheading: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#22344d",
  },
  frontMatterGrid: {
    flexDirection: "column",
    gap: 14,
  },
  frontMatterCard: {
    borderWidth: 1,
    borderColor: "#d7dce3",
    padding: 12,
  },
  frontMatterTitle: {
    marginBottom: 8,
    fontSize: 11,
    fontWeight: 600,
  },
  bulletItem: {
    marginBottom: 4,
    fontSize: 10,
    lineHeight: 1.4,
  },
  coverLogoRow: {
    minHeight: 90,
    justifyContent: "flex-start",
  },
  coverLogo: {
    width: 124,
    height: 62,
    objectFit: "contain",
  },
  coverHero: {
    marginTop: 16,
    backgroundColor: "#d9d9d9",
    paddingTop: 22,
    paddingRight: 24,
    paddingBottom: 18,
    paddingLeft: 24,
    minHeight: 330,
    justifyContent: "space-between",
  },
  coverEyebrow: {
    fontSize: 9,
    textTransform: "uppercase",
    color: "#4d4d4d",
    marginBottom: 8,
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: 800,
    textTransform: "uppercase",
    lineHeight: 1.02,
    color: "#31363d",
    marginBottom: 14,
  },
  coverLocation: {
    fontSize: 12,
    textTransform: "uppercase",
    color: "#4d4d4d",
  },
  coverVersion: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#5b6169",
  },
  coverMeta: {
    marginTop: 14,
    flexDirection: "row",
    gap: 12,
  },
  coverMetaCard: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#6f7680",
    paddingTop: 9,
    paddingRight: 12,
    paddingBottom: 9,
    paddingLeft: 12,
    alignItems: "center",
  },
  coverMetaLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    fontWeight: 700,
    marginBottom: 4,
  },
  coverMetaValue: {
    fontSize: 9,
    color: "#5b6169",
  },
  contentsHeader: {
    minHeight: 72,
    alignItems: "flex-start",
  },
  contentsLogo: {
    width: 72,
    height: 72,
    objectFit: "contain",
  },
  pageWithHeader: {
    paddingTop: 112,
  },
  repeatingHeader: {
    position: "absolute",
    top: 28,
    left: 34,
    right: 34,
    minHeight: 72,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  repeatingHeaderLogo: {
    width: 72,
    height: 72,
    objectFit: "contain",
  },
  contentsTitle: {
    marginTop: 24,
    marginBottom: 26,
    fontSize: 24,
    fontWeight: 800,
    textTransform: "uppercase",
  },
  contentsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingLeft: 18,
    paddingRight: 18,
  },
  contentsPrefix: {
    width: 72,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  contentsLabel: {
    flexGrow: 1,
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: 400,
  },
  contentsIndex: {
    width: 28,
    textAlign: "right",
    fontSize: 12,
    color: "#4d4d4d",
    fontWeight: 700,
    marginLeft: 12,
  },
  peopleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  personCard: {
    width: "23%",
    borderWidth: 1,
    borderColor: "#d7dce3",
    paddingTop: 10,
    paddingRight: 8,
    paddingBottom: 10,
    paddingLeft: 8,
    alignItems: "center",
  },
  personRole: {
    marginBottom: 4,
    fontSize: 10,
    fontWeight: 700,
    textAlign: "center",
  },
  personText: {
    fontSize: 8.5,
    lineHeight: 1.35,
    textAlign: "center",
    color: "#314057",
  },
  timelineRow: {
    flexDirection: "row",
    marginBottom: 8,
    width: "100%",
  },
  timelineDateBlock: {
    width: 88,
    flexShrink: 0,
    alignItems: "flex-end",
    paddingTop: 2,
    paddingRight: 10,
  },
  timelineDate: {
    fontSize: 8.5,
    fontWeight: 700,
  },
  timelineTime: {
    fontSize: 8,
    color: "#36506f",
  },
  timelineContent: {
    flexGrow: 1,
    flexShrink: 1,
    width: 0,
    maxWidth: "100%",
    borderLeftWidth: 2,
    borderLeftColor: "#d7dce3",
    paddingLeft: 12,
  },
  timelineLocation: {
    fontSize: 8.5,
    fontWeight: 700,
    marginBottom: 2,
  },
  timelineDescription: {
    width: "100%",
    fontSize: 9,
    lineHeight: 1.4,
  },
  table: {
    display: "flex",
    width: "100%",
    borderWidth: 1,
    borderColor: "#d7dce3",
    borderBottomWidth: 0,
    marginTop: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d7dce3",
  },
  tableHeaderRow: {
    backgroundColor: "#7c8793",
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 8,
    textTransform: "uppercase",
    fontWeight: 700,
  },
  tableCell: {
    paddingTop: 8,
    paddingRight: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    fontSize: 8.5,
    lineHeight: 1.35,
  },
  statusCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  statusCellText: {
    fontSize: 8,
    fontWeight: 700,
    textAlign: "center",
    lineHeight: 1.3,
  },
  checkboxCellText: {
    fontSize: 12,
    textAlign: "center",
    color: "#43526a",
    lineHeight: 1,
  },
  checkboxCellWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBox: {
    width: 12,
    height: 12,
    borderWidth: 1.25,
    borderColor: "#7c8793",
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  checkboxBoxChecked: {
    backgroundColor: "#1f4a8a",
    borderColor: "#1f4a8a",
  },
  checkboxTick: {
    color: "#ffffff",
    fontSize: 9,
    lineHeight: 1,
    fontWeight: 700,
    marginTop: -1,
  },
  primaryCell: {
    gap: 2,
  },
  primarySubtext: {
    fontSize: 8,
    color: "#5f6978",
    fontStyle: "italic",
  },
  sectionIntro: {
    marginTop: 6,
    marginBottom: 8,
    fontSize: 9.25,
    lineHeight: 1.45,
    color: "#344054",
  },
  subsectionHeader: {
    marginTop: 10,
    paddingTop: 6,
    paddingRight: 10,
    paddingBottom: 6,
    paddingLeft: 10,
    backgroundColor: "#7c8793",
  },
  subsectionHeaderText: {
    color: "#ffffff",
    fontSize: 9,
    textTransform: "uppercase",
    fontWeight: 700,
  },
  signatureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 10,
  },
  signatureField: {
    width: "47%",
    marginBottom: 10,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#5f6978",
    height: 20,
    marginBottom: 4,
  },
  signatureValue: {
    fontSize: 10,
    color: "#1d2430",
    marginBottom: 2,
    minHeight: 14,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#5f6978",
  },
  evidenceItem: {
    marginBottom: 12,
  },
  evidenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  evidenceTilePortrait: {
    width: "48%",
    marginBottom: 12,
  },
  evidenceTileLandscape: {
    width: "100%",
    marginBottom: 12,
  },
  evidencePreviewFrame: {
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 6,
  },
  evidenceImage: {
    width: "100%",
    objectFit: "contain",
  },
  evidenceCaption: {
    fontSize: 8.5,
    lineHeight: 1.35,
  },
  evidenceCaptionTitle: {
    fontSize: 8.5,
    fontWeight: 700,
    marginBottom: 2,
  },
  evidenceCaptionBody: {
    fontSize: 8.5,
    lineHeight: 1.35,
    marginBottom: 2,
  },
  evidenceCaptionType: {
    fontSize: 8,
    color: "#5f6978",
  },
  numberedList: {
    marginTop: 4,
  },
  numberedListItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  numberedListIndex: {
    width: 16,
    fontSize: 10,
    lineHeight: 1.4,
  },
  numberedListText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.4,
  },
});

function renderFooter() {
  return (
    <View fixed style={styles.footer}>
      <View style={styles.footerLine} />
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} Of ${totalPages}`}
      />
      <View style={styles.footerLine} />
    </View>
  );
}
function getPillTone(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return { backgroundColor: "#f5f6f8", borderColor: "#cfd4dc", color: "#3b4657" };
  if (normalized.includes("abnormal")) {
    return { backgroundColor: "#fdeeed", borderColor: "#f0b9b3", color: "#b42318" };
  }
  if (normalized.includes("present") || normalized.includes("effective") || normalized.includes("high") || normalized.includes("prevent") || normalized === "normal") {
    return { backgroundColor: "#e5f4e8", borderColor: "#b7dcbf", color: "#24743d" };
  }
  if (normalized.includes("absent") || normalized.includes("failed") || normalized.includes("missing") || normalized.includes("low") || normalized.includes("essential") || normalized.includes("immediate")) {
    return { backgroundColor: "#fdeeed", borderColor: "#f0b9b3", color: "#b42318" };
  }
  if (normalized.includes("contributing") || normalized.includes("medium") || normalized.includes("corrective")) {
    return { backgroundColor: "#fff5df", borderColor: "#f3ce84", color: "#aa6b00" };
  }
  return { backgroundColor: "#eef1f5", borderColor: "#cfd5df", color: "#43526a" };
}

function getResponseRecoveryTone(value: string) {
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case "emergency_response":
      return { backgroundColor: "#FEF3C7", color: "#92400E" };
    case "make_area_safe":
      return { backgroundColor: "#F3E8FF", color: "#6B21A8" };
    case "medical_treatment":
      return { backgroundColor: "#DCFCE7", color: "#166534" };
    case "scene_preservation":
      return { backgroundColor: "#E0E7FF", color: "#3730A3" };
    default:
      return { backgroundColor: "#FCE7F3", color: "#9D174D" };
  }
}

function getOutcomeMatrixTone(value: string) {
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case "rare":
    case "insignificant":
      return { backgroundColor: "#DCFCE7", color: "#166534" };
    case "unlikely":
    case "minor":
      return { backgroundColor: "#ECFCCB", color: "#3F6212" };
    case "possible":
    case "moderate":
      return { backgroundColor: "#FEF3C7", color: "#92400E" };
    case "likely":
    case "major":
      return { backgroundColor: "#FED7AA", color: "#9A3412" };
    case "almost_certain":
    case "almost certain":
    case "severe":
    case "catastrophic":
      return { backgroundColor: "#FEE2E2", color: "#7F1D1D" };
    default:
      return { backgroundColor: "#F3F4F6", color: "#374151" };
  }
}

function normalizeHexColor(value: string | null | undefined, fallback: string) {
  const trimmed = (value ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toUpperCase() : fallback;
}

function getContrastingTextColor(hexColor: string) {
  const normalized = normalizeHexColor(hexColor, "#22344d");
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1d2430" : "#ffffff";
}

function renderSectionHeader(
  title: string,
  intro: string | undefined,
  sectionHeadingColor: string,
  sectionHeadingTextColor: string,
) {
  return (
    <View style={styles.sectionHeaderBlock} wrap={false}>
      <Text style={[styles.sectionTitle, { backgroundColor: sectionHeadingColor, color: sectionHeadingTextColor }]}>{title}</Text>
      {intro ? <Text style={styles.sectionIntro}>{intro}</Text> : null}
    </View>
  );
}

function renderTableSectionStart(children: React.ReactNode) {
  return (
    <View style={styles.tableSectionStart} minPresenceAhead={240}>
      {children}
    </View>
  );
}

function renderParagraphBlocks(value: string | null | undefined) {
  const paragraphs = (value ?? "")
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return <Text style={styles.paragraph}>-</Text>;
  }

  return paragraphs.map((paragraph, index) => (
    <Text key={`paragraph-${index}`} style={styles.paragraphBlock}>
      {paragraph}
    </Text>
  ));
}

function renderTimelineRow(item: TimelineItem) {
  return (
    <View key={item.id} style={styles.timelineRow} wrap={false}>
      <View style={styles.timelineDateBlock}>
        <Text style={styles.timelineDate}>{item.date}</Text>
        <Text style={styles.timelineTime}>{item.time}</Text>
      </View>
      <View style={styles.timelineContent}>
        {item.location ? <Text style={styles.timelineLocation}>{item.location}</Text> : null}
        <Text style={styles.timelineDescription}>{item.description || "-"}</Text>
      </View>
    </View>
  );
}

function renderEvidenceTile(
  entry: EvidenceEntry,
  source: EvidenceEntry["previewSources"][number],
  index: number,
) {
  return (
    <View
      key={`attachment-${entry.attachmentNumber}-${index}`}
      style={source.orientation === "landscape" ? styles.evidenceTileLandscape : styles.evidenceTilePortrait}
      wrap={false}
    >
      <View style={styles.evidencePreviewFrame}>
        <Image src={source.src} style={styles.evidenceImage} />
      </View>
      <View style={styles.evidenceCaption}>
        <Text style={styles.evidenceCaptionTitle}>{`Attachment ${entry.attachmentNumber}`}</Text>
        <Text style={styles.evidenceCaptionBody}>{entry.description || "-"}</Text>
        <Text style={styles.evidenceCaptionType}>{`(${entry.fileType || "File"})`}</Text>
      </View>
    </View>
  );
}

function renderNumberedList(items: string[], emptyMessage: string) {
  const entries = items.length > 0 ? items : [emptyMessage];

  return (
    <View style={styles.numberedList}>
      {entries.map((item, index) => (
        <View key={`${index}-${item}`} style={styles.numberedListItem}>
          <Text style={styles.numberedListIndex}>{`${index + 1}.`}</Text>
          <Text style={styles.numberedListText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function getSignoffDisplayValue(label: string, map: InvestigationReportPdfDocumentProps["map"]) {
  const normalized = label.trim().toLowerCase();
  if (normalized.includes("investigation lead")) return map?.investigation_lead_name || "";
  if (normalized.includes("responsible person")) return map?.responsible_person_name || "";
  return "";
}

function getSignoffLabel(label: string) {
  return label
    .replace(/:.*/u, "")
    .replace(/\(\s*name\s*\)/giu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function PdfTable({
  columns,
  rows,
  cellWidths,
  tableHeadingColor,
  tableHeadingTextColor,
  pillColumns = [],
  pillToneResolver,
  outlineColumns = [],
  titleCaseColumns = [],
  primaryColumns = [],
  checkboxColumns = [],
  protectedLeadingRows = 0,
}: {
  columns: string[];
  rows: string[][];
  cellWidths: string[];
  tableHeadingColor: string;
  tableHeadingTextColor: string;
  pillColumns?: number[];
  pillToneResolver?: (value: string, columnIndex: number) => { backgroundColor: string; color: string };
  outlineColumns?: number[];
  titleCaseColumns?: number[];
  primaryColumns?: number[];
  checkboxColumns?: number[];
  protectedLeadingRows?: number;
}) {
  const leadingRows =
    protectedLeadingRows > 0 && rows.length > 0 ? rows.slice(0, Math.min(rows.length, protectedLeadingRows)) : [];
  const trailingRows =
    protectedLeadingRows > 0 && rows.length > protectedLeadingRows ? rows.slice(protectedLeadingRows) : [];

  return (
    <View style={styles.table} minPresenceAhead={54}>
      <View style={[styles.tableRow, styles.tableHeaderRow, { backgroundColor: tableHeadingColor }]} fixed>
        {columns.map((column, index) => (
          <View key={`${column}-${index}`} style={[styles.tableCell, { width: cellWidths[index] }]}>
            <Text style={[styles.tableHeaderText, { color: tableHeadingTextColor }]}>{column}</Text>
          </View>
        ))}
      </View>
      {rows.length === 0 ? (
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { width: "100%" }]}>
            <Text>-</Text>
          </View>
        </View>
      ) : leadingRows.length > 0 ? (
        <View wrap={false} minPresenceAhead={92}>
          {leadingRows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.tableRow} wrap={false}>
              {columns.map((column, index) => {
                const rawValue = row[index] || "-";
                const titleValue = titleCaseColumns.includes(index) ? toTitleCaseLabel(rawValue) : rawValue;
                if (pillColumns.includes(index)) {
                  const tone = pillToneResolver ? pillToneResolver(rawValue, index) : getPillTone(rawValue);
                  return (
                    <View
                      key={`${column}-${index}`}
                      style={[
                        styles.tableCell,
                        styles.statusCell,
                        {
                          width: cellWidths[index],
                          backgroundColor: tone.backgroundColor,
                          borderLeftWidth: 1,
                          borderLeftColor: "#d7dce3",
                          borderRightWidth: 1,
                          borderRightColor: "#d7dce3",
                        },
                      ]}
                    >
                      <Text style={[styles.statusCellText, { color: tone.color }]}>{toTitleCaseLabel(rawValue)}</Text>
                    </View>
                  );
                }
                if (outlineColumns.includes(index)) {
                  return (
                    <View
                      key={`${column}-${index}`}
                      style={[
                        styles.tableCell,
                        styles.statusCell,
                        {
                          width: cellWidths[index],
                          backgroundColor: "#f3f5f8",
                          borderLeftWidth: 1,
                          borderLeftColor: "#d7dce3",
                          borderRightWidth: 1,
                          borderRightColor: "#d7dce3",
                        },
                      ]}
                    >
                      <Text style={[styles.statusCellText, { color: "#43526a" }]}>{toTitleCaseLabel(rawValue)}</Text>
                    </View>
                  );
                }
                if (checkboxColumns.includes(index)) {
                  const isChecked = rawValue.trim().toLowerCase() === "true";
                  return (
                    <View
                      key={`${column}-${index}`}
                      style={[
                        styles.tableCell,
                        styles.statusCell,
                        {
                          width: cellWidths[index],
                          backgroundColor: "#f8fafc",
                          borderLeftWidth: 1,
                          borderLeftColor: "#d7dce3",
                        },
                      ]}
                    >
                      <View style={styles.checkboxCellWrap}>
                        <View style={isChecked ? [styles.checkboxBox, styles.checkboxBoxChecked] : styles.checkboxBox}>
                          {isChecked ? <Text style={styles.checkboxTick}>Ã¢Å“â€œ</Text> : null}
                        </View>
                      </View>
                    </View>
                  );
                }
                if (primaryColumns.includes(index)) {
                  const parts = splitBracketedValue(rawValue);
                  return (
                    <View key={`${column}-${index}`} style={[styles.tableCell, styles.primaryCell, { width: cellWidths[index] }]}>
                      <Text>{parts.main || "-"}</Text>
                      {parts.bracket ? <Text style={styles.primarySubtext}>{parts.bracket}</Text> : null}
                    </View>
                  );
                }
                return (
                  <View key={`${column}-${index}`} style={[styles.tableCell, { width: cellWidths[index] }]}>
                    <Text>{titleValue || "-"}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      ) : (
        rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.tableRow} wrap={false}>
            {columns.map((column, index) => {
              const rawValue = row[index] || "-";
              const titleValue = titleCaseColumns.includes(index) ? toTitleCaseLabel(rawValue) : rawValue;
              if (pillColumns.includes(index)) {
                const tone = pillToneResolver ? pillToneResolver(rawValue, index) : getPillTone(rawValue);
                return (
                  <View
                    key={`${column}-${index}`}
                    style={[
                      styles.tableCell,
                      styles.statusCell,
                      {
                        width: cellWidths[index],
                        backgroundColor: tone.backgroundColor,
                        borderLeftWidth: 1,
                        borderLeftColor: "#d7dce3",
                        borderRightWidth: 1,
                        borderRightColor: "#d7dce3",
                      },
                    ]}
                  >
                    <Text style={[styles.statusCellText, { color: tone.color }]}>{toTitleCaseLabel(rawValue)}</Text>
                  </View>
                );
              }
              if (outlineColumns.includes(index)) {
                return (
                  <View
                    key={`${column}-${index}`}
                    style={[
                      styles.tableCell,
                      styles.statusCell,
                      {
                        width: cellWidths[index],
                        backgroundColor: "#f3f5f8",
                        borderLeftWidth: 1,
                        borderLeftColor: "#d7dce3",
                        borderRightWidth: 1,
                        borderRightColor: "#d7dce3",
                      },
                    ]}
                  >
                    <Text style={[styles.statusCellText, { color: "#43526a" }]}>{toTitleCaseLabel(rawValue)}</Text>
                  </View>
                );
              }
              if (checkboxColumns.includes(index)) {
                const isChecked = rawValue.trim().toLowerCase() === "true";
                return (
                  <View
                    key={`${column}-${index}`}
                    style={[
                      styles.tableCell,
                      styles.statusCell,
                      {
                        width: cellWidths[index],
                        backgroundColor: "#f8fafc",
                        borderLeftWidth: 1,
                        borderLeftColor: "#d7dce3",
                      },
                    ]}
                  >
                    <View style={styles.checkboxCellWrap}>
                      <View style={isChecked ? [styles.checkboxBox, styles.checkboxBoxChecked] : styles.checkboxBox}>
                        {isChecked ? <Text style={styles.checkboxTick}>âœ“</Text> : null}
                      </View>
                    </View>
                  </View>
                );
              }
              if (primaryColumns.includes(index)) {
                const parts = splitBracketedValue(rawValue);
                return (
                  <View key={`${column}-${index}`} style={[styles.tableCell, styles.primaryCell, { width: cellWidths[index] }]}>
                    <Text>{parts.main || "-"}</Text>
                    {parts.bracket ? <Text style={styles.primarySubtext}>{parts.bracket}</Text> : null}
                  </View>
                );
              }
              return (
                <View key={`${column}-${index}`} style={[styles.tableCell, { width: cellWidths[index] }]}>
                  <Text>{titleValue || "-"}</Text>
                </View>
              );
            })}
          </View>
        ))
      )}
    </View>
  );
}

export default function InvestigationReportPdfDocument({
  report,
  map,
  logoUrl,
  contentEntries,
  people,
  timelineItems,
  taskConditionsTable,
  incidentFactorsTable,
  incidentSystemFactorsTable,
  predisposingFactorsTable,
  controlsTable,
  responseRecoveryTable,
  incidentOutcomesTable,
  findingsTable,
  recommendationsTable,
  evidenceEntries,
}: InvestigationReportPdfDocumentProps) {
  const timelineLeadItems = timelineItems.slice(0, 6);
  const timelineRemainingItems = timelineItems.slice(6);
  const evidenceTiles = evidenceEntries.flatMap((entry) =>
    entry.previewSources.map((source, index) => ({ entry, source, index })),
  );
  const evidenceLeadTiles =
    evidenceTiles.length === 0
      ? []
      : evidenceTiles[0]?.source.orientation === "landscape"
        ? evidenceTiles.slice(0, 1)
        : evidenceTiles[1]?.source.orientation === "portrait"
          ? evidenceTiles.slice(0, 2)
          : evidenceTiles.slice(0, 1);
  const remainingEvidenceTiles = evidenceTiles.slice(evidenceLeadTiles.length);
  const sectionHeadingColor = normalizeHexColor(report.report.branding?.section_heading_color, "#22344d");
  const tableHeadingColor = normalizeHexColor(report.report.branding?.table_heading_color, "#7c8793");
  const sectionHeadingTextColor = getContrastingTextColor(sectionHeadingColor);
  const tableHeadingTextColor = getContrastingTextColor(tableHeadingColor);
  const uncertainFactRows = report.facts_uncertain.map((item, index) => [
    item || "-",
    report.report.sections.preliminary_facts?.uncertain_notes?.[index] || "-",
  ]);
  const missingInformationRows = report.missing_information.map((item, index) => [
    item || "-",
    report.report.sections.preliminary_facts?.missing_information_notes?.[index] || "-",
  ]);
  const isPdfSectionVisible = (sectionId: ReportSectionVisibilityId) =>
    isReportSectionVisible(report.report.section_visibility, sectionId);

  return (
    <Document title={`${report.report.cover_page.incident_name || map?.title || "Investigation Report"} Report`}>
      <Page size="A4" style={[styles.page, styles.pageCompact]}>
        <View style={styles.coverLogoRow}>
          {logoUrl ? <Image src={logoUrl} style={styles.coverLogo} /> : null}
        </View>
        <View style={styles.coverHero}>
          <View>
            <Text style={styles.coverEyebrow}>Investigation Report</Text>
            <Text style={styles.coverTitle}>{map?.title || report.report.cover_page.incident_name || "-"}</Text>
            <Text style={styles.coverLocation}>{map?.incident_location || "-"}</Text>
          </View>
          <Text style={styles.coverVersion}>Report Version: {report.saved_report.version_number}</Text>
        </View>
        <View style={styles.coverMeta}>
          <View style={styles.coverMetaCard}>
            <Text style={styles.coverMetaLabel}>Incident Date</Text>
            <Text style={styles.coverMetaValue}>{formatReportDateTime(map?.incident_occurred_at)}</Text>
          </View>
          <View style={styles.coverMetaCard}>
            <Text style={styles.coverMetaLabel}>Report Generated</Text>
            <Text style={styles.coverMetaValue}>{formatReportDateTime(report.saved_report.generated_at)}</Text>
          </View>
        </View>
        {renderFooter()}
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.contentsHeader}>
          {logoUrl ? <Image src={logoUrl} style={styles.contentsLogo} /> : null}
        </View>
        <Text style={styles.contentsTitle}>Report Contents</Text>
        {contentEntries.map((entry) => (
          <View key={entry.label} style={styles.contentsRow}>
            <Text style={styles.contentsPrefix}>{`Section ${entry.index}:`}</Text>
            <Text style={styles.contentsLabel}>{entry.label}</Text>
            <Text style={styles.contentsIndex}>{String(entry.index).padStart(2, "0")}</Text>
          </View>
        ))}
        {renderFooter()}
      </Page>

      <Page size="A4" style={[styles.page, styles.pageWithHeader]} wrap>
        <View style={styles.repeatingHeader} fixed>
          {logoUrl ? <Image src={logoUrl} style={styles.repeatingHeaderLogo} /> : null}
        </View>
        {isPdfSectionVisible("executive_summary") ? <View style={styles.section}>
          <View wrap={false}>
            <Text style={[styles.sectionTitle, { backgroundColor: sectionHeadingColor, color: sectionHeadingTextColor }]}>Executive Summary</Text>
            <Text style={styles.paragraph}>{report.report.sections.executive_summary.trim() || "-"}</Text>
          </View>
        </View> : null}

        {isPdfSectionVisible("long_description") ? <View style={styles.section}>
          <View wrap={false}>
            <Text style={[styles.sectionTitle, { backgroundColor: sectionHeadingColor, color: sectionHeadingTextColor }]}>Long Description</Text>
          </View>
          {renderParagraphBlocks(report.report.sections.long_description)}
        </View> : null}

        {isPdfSectionVisible("response_and_recovery") ? (
          <>
            {renderTableSectionStart(
              <>
                {renderSectionHeader(
                  "Response / Recovery",
                  report.report.sections.response_and_recovery.summary.trim() || "-",
                  sectionHeadingColor,
                  sectionHeadingTextColor,
                )}
                <PdfTable
                  columns={responseRecoveryTable.columns}
                  rows={responseRecoveryTable.rows}
                  cellWidths={["80%", "20%"]}
                  tableHeadingColor={tableHeadingColor}
                  tableHeadingTextColor={tableHeadingTextColor}
                  pillColumns={[1]}
                  pillToneResolver={(value) => getResponseRecoveryTone(value)}
                />
              </>
            )}
            <View style={styles.sectionSpacing} />
          </>
        ) : null}

        {isPdfSectionVisible("people_involved") ? <View style={styles.section}>
          <View wrap={false}>
            <Text style={[styles.sectionTitle, { backgroundColor: sectionHeadingColor, color: sectionHeadingTextColor }]}>
              {report.report.sections.people_involved.heading}
            </Text>
            {people.length > 0 ? (
              <View style={styles.peopleGrid}>
                {people.map((person) => (
                  <View key={person.id} style={styles.personCard} wrap={false}>
                    <Text style={styles.personRole}>{person.role}</Text>
                    {person.department ? <Text style={styles.personText}>{person.department}</Text> : null}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.paragraph}>{report.report.sections.people_involved.note}</Text>
            )}
          </View>
        </View> : null}

        {isPdfSectionVisible("incident_timeline") ? <View style={styles.section}>
          <View wrap={false}>
            <Text style={[styles.sectionTitle, { backgroundColor: sectionHeadingColor, color: sectionHeadingTextColor }]}>
              {report.report.sections.incident_timeline.heading}
            </Text>
            {timelineItems.length > 0 ? (
              timelineLeadItems.map((item) => renderTimelineRow(item))
            ) : (
              report.report.sections.incident_timeline.entries.map((entry) => (
                <Text key={entry} style={styles.bulletItem}>- {entry}</Text>
              ))
            )}
          </View>
          {timelineRemainingItems.map((item) => renderTimelineRow(item))}
        </View> : null}

        {isPdfSectionVisible("task_and_conditions") ? (
          <>
            {renderTableSectionStart(
              <>
                {renderSectionHeader("Task And Conditions", report.report.sections.task_and_conditions.trim() || "-", sectionHeadingColor, sectionHeadingTextColor)}
                <PdfTable
                  columns={taskConditionsTable.columns}
                  rows={taskConditionsTable.rows}
                  cellWidths={["44%", "16%", "40%"]}
                  tableHeadingColor={tableHeadingColor}
                  tableHeadingTextColor={tableHeadingTextColor}
                  pillColumns={[1]}
                />
              </>
            )}
            <View style={styles.sectionSpacing} />
          </>
        ) : null}

        {isPdfSectionVisible("factors_and_system_factors") ? (
          <>
            {renderTableSectionStart(
              <>
                {renderSectionHeader(
                  "Factors",
                  "This section sets out the factors identified by the investigation team as contributing to the incident sequence.",
                  sectionHeadingColor,
                  sectionHeadingTextColor,
                )}
                <PdfTable
                  columns={incidentFactorsTable.columns.slice(1)}
                  rows={incidentFactorsTable.rows.map((row) => row.slice(1))}
                  cellWidths={["56%", "14%", "15%", "15%"]}
                  tableHeadingColor={tableHeadingColor}
                  tableHeadingTextColor={tableHeadingTextColor}
                  pillColumns={[1, 2]}
                  titleCaseColumns={[3]}
                />
              </>
            )}
        <View style={styles.sectionSpacing} />
          </>
        ) : null}

        {isPdfSectionVisible("factors_and_system_factors") ? (
          <>
            {renderTableSectionStart(
              <>
                {renderSectionHeader(
                  "System Factors",
                  "This section sets out the organisational and systemic factors identified by the investigation team as contributing to the incident sequence.",
                  sectionHeadingColor,
                  sectionHeadingTextColor,
                )}
                <PdfTable
                  columns={incidentSystemFactorsTable.columns.slice(1)}
                  rows={incidentSystemFactorsTable.rows.map((row) => row.slice(1))}
                  cellWidths={["56%", "14%", "15%", "15%"]}
                  tableHeadingColor={tableHeadingColor}
                  tableHeadingTextColor={tableHeadingTextColor}
                  pillColumns={[1, 2]}
                  titleCaseColumns={[3]}
                />
              </>
            )}
        <View style={styles.sectionSpacing} />
          </>
        ) : null}

        {isPdfSectionVisible("predisposing_factors") ? (
          <>
            {renderTableSectionStart(
              <>
                {renderSectionHeader(
                  report.report.sections.predisposing_factors.heading,
                  "This section describes background conditions and existing circumstances that increased the likelihood of the incident occurring. These factors may not have directly triggered the event, but they help explain why the work environment or system was vulnerable at the time.",
                  sectionHeadingColor,
                  sectionHeadingTextColor,
                )}
                <PdfTable
                  columns={predisposingFactorsTable.columns}
                  rows={predisposingFactorsTable.rows}
                  cellWidths={["56%", "20%", "24%"]}
                  tableHeadingColor={tableHeadingColor}
                  tableHeadingTextColor={tableHeadingTextColor}
                  pillColumns={[1]}
                  titleCaseColumns={[2]}
                />
              </>
            )}
        <View style={styles.sectionSpacing} />
          </>
        ) : null}

        {isPdfSectionVisible("controls_and_barriers") ? (
          <>
            {renderTableSectionStart(
              <>
                {renderSectionHeader(
                  report.report.sections.controls_and_barriers.heading,
                  "This section summarises the controls and barriers that were expected to prevent the incident or reduce its consequences. It shows the type of control, its state at the time of the incident, and the role it was intended to play so the reader can understand where protections were effective, failed, or missing.",
                  sectionHeadingColor,
                  sectionHeadingTextColor,
                )}
                <PdfTable
                  columns={controlsTable.columns}
                  rows={controlsTable.rows}
                  cellWidths={["40%", "14%", "14%", "16%", "16%"]}
                  tableHeadingColor={tableHeadingColor}
                  tableHeadingTextColor={tableHeadingTextColor}
                  pillColumns={[1, 2]}
                  titleCaseColumns={[3]}
                />
              </>
            )}
        <View style={styles.sectionSpacing} />
          </>
        ) : null}

        {isPdfSectionVisible("incident_outcomes") ? (
          <>
            {renderTableSectionStart(
              <>
                {renderSectionHeader("Incident Outcomes", report.report.sections.incident_outcomes.trim() || "-", sectionHeadingColor, sectionHeadingTextColor)}
                <PdfTable
                  columns={incidentOutcomesTable.columns.slice(1)}
                  rows={incidentOutcomesTable.rows.map((row) => row.slice(1))}
                  cellWidths={["38%", "14%", "16%", "16%", "16%"]}
                  tableHeadingColor={tableHeadingColor}
                  tableHeadingTextColor={tableHeadingTextColor}
                  pillColumns={[2, 3]}
                  pillToneResolver={(value) => getOutcomeMatrixTone(value)}
                  titleCaseColumns={[1, 4]}
                />
              </>
            )}
            <View style={styles.sectionSpacing} />
          </>
        ) : null}

        {isPdfSectionVisible("incident_findings") ? (
          <>
            {renderTableSectionStart(
              <>
                {renderSectionHeader("Incident Findings", report.report.sections.incident_findings.summary.trim() || "-", sectionHeadingColor, sectionHeadingTextColor)}
                <PdfTable
                  columns={findingsTable.columns}
                  rows={findingsTable.rows}
                  cellWidths={["80%", "20%"]}
                  tableHeadingColor={tableHeadingColor}
                  tableHeadingTextColor={tableHeadingTextColor}
                  pillColumns={[1]}
                />
              </>
            )}
            <View style={styles.sectionSpacing} />
          </>
        ) : null}

        {isPdfSectionVisible("recommendations") ? (
          <>
            {renderTableSectionStart(
              <>
                {renderSectionHeader(
                  "Recommendations",
                  `${report.report.sections.recommendations.summary.trim() || "This section lists the actions identified to address the findings of the investigation."} The Approved column is used to indicate which recommendations are endorsed for implementation. The recommendation sign-off below records formal approval of the endorsed actions.`,
                  sectionHeadingColor,
                  sectionHeadingTextColor,
                )}
                <PdfTable
                  columns={[...recommendationsTable.columns, "Approved"]}
                  rows={recommendationsTable.rows.map((row, index) => [
                    ...row,
                    report.report.sections.recommendations.endorsed?.[index] ? "true" : "false",
                  ])}
                  cellWidths={["40%", "15%", "15%", "15%", "15%"]}
                  tableHeadingColor={tableHeadingColor}
                  tableHeadingTextColor={tableHeadingTextColor}
                  pillColumns={[1]}
                  checkboxColumns={[4]}
                />
              </>
            )}
        {isPdfSectionVisible("signatures") ? <View wrap={false}>
          <View style={[styles.subsectionHeader, { backgroundColor: tableHeadingColor }]}>
            <Text style={[styles.subsectionHeaderText, { color: tableHeadingTextColor }]}>Recommendation Sign Off</Text>
          </View>
          <View style={styles.signatureGrid}>
            {report.report.sections.recommendations.approval_fields.map((field, index) => (
              <View key={`${field}-${index}`} style={styles.signatureField}>
                <Text style={styles.signatureValue}>{report.report.sections.recommendation_sign_off_prefills?.[index] || ""}</Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>{field}</Text>
              </View>
            ))}
          </View>
        </View> : null}
        <View style={styles.sectionSpacing} />
          </>
        ) : null}

        {isPdfSectionVisible("evidence") ? <View wrap={false}>
          {renderSectionHeader(
            report.report.sections.evidence.heading,
            "This section contains the attachments and supporting material reviewed as part of the investigation. It provides the visual and documentary evidence relied on to support the findings, analysis, and recommendations recorded in this report.",
            sectionHeadingColor,
            sectionHeadingTextColor,
          )}
          {evidenceLeadTiles.length > 0 ? (
            <View style={styles.evidenceGrid}>
              {evidenceLeadTiles.map(({ entry, source, index }) =>
                renderEvidenceTile(entry, source, index),
              )}
            </View>
          ) : null}
        </View> : null}
        {isPdfSectionVisible("evidence") ? (evidenceEntries.length > 0 ? (
          <View style={styles.evidenceGrid}>
            {remainingEvidenceTiles.map(({ entry, source, index }) =>
              renderEvidenceTile(entry, source, index),
            )}
          </View>
        ) : <Text style={styles.paragraph}>No evidence items available.</Text>) : null}
        {isPdfSectionVisible("evidence") ? <View style={styles.sectionSpacing} /> : null}

        {isPdfSectionVisible("signatures") ? <View style={styles.section}>
          {renderSectionHeader(
            report.report.sections.investigation_sign_off.heading,
            "This section allows the client to review the investigation findings, supporting information, and recommendations before final approval. Sign-off confirms that the investigation has been completed to the required standard and is accepted for close-out.",
            sectionHeadingColor,
            sectionHeadingTextColor,
          )}
          <View wrap={false}>
            <View style={styles.signatureGrid}>
              {report.report.sections.investigation_sign_off.fields.map((field, index) => (
                <View key={`${field}-${index}`} style={styles.signatureField}>
                  <Text style={styles.signatureValue}>
                    {report.report.sections.investigation_sign_off.prefills?.[index] || getSignoffDisplayValue(field, map)}
                  </Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureLabel}>{getSignoffLabel(field)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View> : null}

        {renderFooter()}
      </Page>

      {isPdfSectionVisible("preliminary_facts") ? <Page size="A4" style={[styles.page, styles.pageWithHeader]}>
        <View style={styles.repeatingHeader} fixed>
          {logoUrl ? <Image src={logoUrl} style={styles.repeatingHeaderLogo} /> : null}
        </View>
        <View style={styles.section}>
          {renderSectionHeader(
            "Preliminary Facts",
            "This appendix records investigation information that remained uncertain or unavailable at the time this report was generated. It helps the reader distinguish supported report content from matters that still require confirmation, clarification, or additional evidence.",
            sectionHeadingColor,
            sectionHeadingTextColor,
          )}
          <Text style={[styles.subheading, { color: sectionHeadingColor }]}>{report.report.front_page.facts_uncertain_heading}</Text>
          {renderTableSectionStart(
            <PdfTable
              columns={["Uncertain Fact", "Notes"]}
              rows={uncertainFactRows}
              cellWidths={["50%", "50%"]}
              tableHeadingColor={tableHeadingColor}
              tableHeadingTextColor={tableHeadingTextColor}
            />
          )}
          <Text style={[styles.subheading, { color: sectionHeadingColor }]}>{report.report.front_page.missing_information_heading}</Text>
          {renderTableSectionStart(
            <PdfTable
              columns={["Missing Information", "Notes"]}
              rows={missingInformationRows}
              cellWidths={["50%", "50%"]}
              tableHeadingColor={tableHeadingColor}
              tableHeadingTextColor={tableHeadingTextColor}
            />
          )}
        </View>

        {renderFooter()}
      </Page> : null}
    </Document>
  );
}


