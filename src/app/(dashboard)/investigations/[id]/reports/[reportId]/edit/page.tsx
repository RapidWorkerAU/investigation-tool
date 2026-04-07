"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import shellStyles from "@/components/dashboard/DashboardShell.module.css";
import editStyles from "../EditReportPage.module.css";
import { ReportProgressLoadingView } from "@/components/loading/ReportProgressLoadingView";
import { accessBlocksInvestigationEntry, accessRequiresSelection, fetchAccessState } from "@/lib/access";
import {
  buildDraftReportText,
  normalizeInvestigationReportPayload,
} from "@/lib/investigation-report/helpers";
import type { InvestigationSavedReportPayload, InvestigationReportStatus } from "@/lib/investigation-report/types";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { parsePersonLabels } from "@/app/(dashboard)/system-maps/[mapId]/canvasShared";

type MapRow = {
  id: string;
  title: string;
};

type CanvasElementRow = {
  id: string;
  element_type: string;
  heading: string | null;
  element_config: Record<string, unknown> | null;
  created_at: string;
  pos_x: number | null;
  pos_y: number | null;
};

type TimelineRow = {
  id: string;
  date: string;
  time: string;
  location: string;
  description: string;
};

type EvidencePreviewLayout = {
  src: string;
  orientation: "portrait" | "landscape";
};

type PdfJsPageProxy = {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => {
    promise: Promise<void>;
  };
};

type PdfJsDocumentProxy = {
  getPage: (pageNumber: number) => Promise<PdfJsPageProxy>;
};

type PdfJsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: string) => { promise: Promise<PdfJsDocumentProxy> };
};

type SectionId =
  | "executive_summary"
  | "document_branding"
  | "long_description"
  | "task_and_conditions"
  | "incident_outcomes"
  | "people_involved"
  | "incident_timeline"
  | "factors_and_system_factors"
  | "predisposing_factors"
  | "controls_and_barriers"
  | "incident_findings"
  | "recommendations"
  | "preliminary_facts"
  | "evidence"
  | "signatures";

type SectionDefinition = {
  id: SectionId;
  label: string;
  description: string;
  mode: "editable_text" | "read_only" | "evidence" | "signatures" | "branding" | "preliminary_facts";
  canHideInPdf?: boolean;
};

const sectionDefinitions: SectionDefinition[] = [
  {
    id: "document_branding",
    label: "Document Branding",
    description: "Upload a report logo and set heading colors used in the PDF document.",
    mode: "branding",
    canHideInPdf: false,
  },
  {
    id: "executive_summary",
    label: "Executive Summary",
    description: "High-level incident summary used in the final styled PDF.",
    mode: "editable_text",
    canHideInPdf: true,
  },
  {
    id: "long_description",
    label: "Long Description",
    description: "Detailed narrative account. Keep paragraph breaks where needed.",
    mode: "editable_text",
    canHideInPdf: true,
  },
  {
    id: "task_and_conditions",
    label: "Task And Conditions",
    description: "Task context and conditions that existed at the time of the incident.",
    mode: "editable_text",
    canHideInPdf: true,
  },
  {
    id: "incident_outcomes",
    label: "Incident Outcomes",
    description: "Observed or supported outcomes resulting from the incident.",
    mode: "editable_text",
    canHideInPdf: true,
  },
  {
    id: "people_involved",
    label: "People Involved",
    description: "Read-only section linked to person nodes on the investigation map.",
    mode: "read_only",
    canHideInPdf: true,
  },
  {
    id: "incident_timeline",
    label: "Incident Timeline",
    description: "Read-only section linked to sequence nodes on the investigation map.",
    mode: "read_only",
    canHideInPdf: true,
  },
  {
    id: "factors_and_system_factors",
    label: "Factors And System Factors",
    description: "Read-only node-backed table used in the report.",
    mode: "read_only",
    canHideInPdf: true,
  },
  {
    id: "predisposing_factors",
    label: "Predisposing Factors",
    description: "Read-only node-backed table used in the report.",
    mode: "read_only",
    canHideInPdf: true,
  },
  {
    id: "controls_and_barriers",
    label: "Controls And Barriers",
    description: "Read-only node-backed table used in the report.",
    mode: "read_only",
    canHideInPdf: true,
  },
  {
    id: "incident_findings",
    label: "Incident Findings",
    description: "Edit the findings summary text and review the non-editable findings table below it.",
    mode: "editable_text",
    canHideInPdf: true,
  },
  {
    id: "recommendations",
    label: "Recommendations",
    description: "Edit the recommendations summary text and review the non-editable recommendations table below it.",
    mode: "editable_text",
    canHideInPdf: true,
  },
  {
    id: "preliminary_facts",
    label: "Preliminary Facts",
    description: "Add context notes for uncertain facts and missing information shown in the appendix page.",
    mode: "preliminary_facts",
    canHideInPdf: true,
  },
  {
    id: "evidence",
    label: "Evidence",
    description: "Choose which evidence items appear in the final report.",
    mode: "evidence",
    canHideInPdf: true,
  },
  {
    id: "signatures",
    label: "Signature Blocks",
    description: "Prefill names, roles, and dates above report signature lines.",
    mode: "signatures",
    canHideInPdf: true,
  },
];

const hideableSectionIds = sectionDefinitions
  .filter((section) => section.canHideInPdf)
  .map((section) => section.id as Exclude<SectionId, "document_branding">);

function isSectionVisibleInPdf(report: InvestigationSavedReportPayload, sectionId: SectionId) {
  if (!hideableSectionIds.includes(sectionId as Exclude<SectionId, "document_branding">)) return true;
  return report.report.section_visibility?.[sectionId as Exclude<SectionId, "document_branding">] !== false;
}

function getSectionValue(report: InvestigationSavedReportPayload, sectionId: SectionId) {
  switch (sectionId) {
    case "executive_summary":
      return report.report.sections.executive_summary;
    case "long_description":
      return report.report.sections.long_description;
    case "task_and_conditions":
      return report.report.sections.task_and_conditions;
    case "incident_outcomes":
      return report.report.sections.incident_outcomes;
    case "incident_findings":
      return report.report.sections.incident_findings.summary;
    case "recommendations":
      return report.report.sections.recommendations.summary;
    default:
      return "";
  }
}

function setSectionValue(
  report: InvestigationSavedReportPayload,
  sectionId: SectionId,
  value: string,
): InvestigationSavedReportPayload {
  switch (sectionId) {
    case "executive_summary":
      return {
        ...report,
        report: {
          ...report.report,
          sections: { ...report.report.sections, executive_summary: value },
        },
      };
    case "long_description":
      return {
        ...report,
        report: {
          ...report.report,
          sections: { ...report.report.sections, long_description: value },
        },
      };
    case "task_and_conditions":
      return {
        ...report,
        report: {
          ...report.report,
          sections: { ...report.report.sections, task_and_conditions: value },
        },
      };
    case "incident_outcomes":
      return {
        ...report,
        report: {
          ...report.report,
          sections: { ...report.report.sections, incident_outcomes: value },
        },
      };
    case "incident_findings":
      return {
        ...report,
        report: {
          ...report.report,
          sections: {
            ...report.report.sections,
            incident_findings: {
              ...report.report.sections.incident_findings,
              summary: value,
            },
          },
        },
      };
    case "recommendations":
      return {
        ...report,
        report: {
          ...report.report,
          sections: {
            ...report.report.sections,
            recommendations: {
              ...report.report.sections.recommendations,
              summary: value,
            },
          },
        },
      };
    default:
      return report;
  }
}

function getConfigValue(config: Record<string, unknown> | null | undefined, ...keys: string[]) {
  if (!config) return "";
  for (const key of keys) {
    const value = config[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function getEvidenceMediaPath(config: Record<string, unknown> | null | undefined) {
  return getConfigValue(config, "media_storage_path", "mediaStoragePath", "storage_path", "storagePath");
}

function getEvidenceMediaUrl(config: Record<string, unknown> | null | undefined) {
  return getConfigValue(config, "preview_url", "previewUrl", "file_url", "fileUrl", "public_url", "publicUrl", "url");
}

function getEvidenceMediaMime(config: Record<string, unknown> | null | undefined) {
  return getConfigValue(config, "media_mime", "mediaMime", "mime_type", "mimeType");
}

function getEvidenceMediaName(config: Record<string, unknown> | null | undefined) {
  return getConfigValue(config, "media_name", "mediaName", "file_name", "fileName");
}

function isPdfEvidence(config: Record<string, unknown> | null | undefined) {
  const mime = getEvidenceMediaMime(config).toLowerCase();
  const name = getEvidenceMediaName(config).toLowerCase();
  const path = getEvidenceMediaPath(config).toLowerCase();
  return mime.includes("pdf") || name.endsWith(".pdf") || path.endsWith(".pdf");
}

function getEvidenceFileType(config: Record<string, unknown> | null | undefined) {
  const mime = getEvidenceMediaMime(config).toLowerCase();
  if (mime.includes("/")) {
    return mime.split("/").pop()?.toUpperCase() || "FILE";
  }
  const name = getEvidenceMediaName(config).toLowerCase();
  const path = getEvidenceMediaPath(config).toLowerCase();
  const source = name || path;
  const match = source.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toUpperCase() || "FILE";
}

function cleanEvidenceDescription(value: string | null | undefined) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";

  const sourceStripped = trimmed
    .replace(/source:\s*.*?(?=(media:|description:|storage path:|$))/i, "")
    .replace(/media:\s*.*?(?=(description:|storage path:|$))/i, "")
    .replace(/storage path:\s*.*$/i, "")
    .trim();

  const descriptionMatch = sourceStripped.match(/description:\s*(.*)$/i);
  if (descriptionMatch?.[1]?.trim()) {
    return descriptionMatch[1].trim();
  }

  return sourceStripped
    .replace(/\([^)]*\/[^)]*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatReportDate(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatReportTime(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function toTitleCaseLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalizeHexColor(value: string, fallback: string) {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  return fallback;
}

function autosizePreliminaryFactTextarea(textarea: HTMLTextAreaElement) {
  const computedStyle = window.getComputedStyle(textarea);
  const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 20;
  const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;
  const borderTop = Number.parseFloat(computedStyle.borderTopWidth) || 0;
  const borderBottom = Number.parseFloat(computedStyle.borderBottomWidth) || 0;
  const maxHeight = Math.ceil((lineHeight * 4) + paddingTop + paddingBottom + borderTop + borderBottom);

  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
}

function autosizeReportTextarea(textarea: HTMLTextAreaElement) {
  const computedStyle = window.getComputedStyle(textarea);
  const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 24;
  const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;
  const borderTop = Number.parseFloat(computedStyle.borderTopWidth) || 0;
  const borderBottom = Number.parseFloat(computedStyle.borderBottomWidth) || 0;
  const minHeight = Math.ceil(lineHeight + paddingTop + paddingBottom + borderTop + borderBottom);
  const maxHeight = Math.ceil((lineHeight * 18) + paddingTop + paddingBottom + borderTop + borderBottom);

  textarea.style.height = "auto";
  textarea.style.height = `${Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight))}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
}

function normalizeHeaderKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function splitBracketedValue(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(.*?)\s*\((.*?)\)\s*$/);
  if (!match) return { main: trimmed, bracket: "" };
  return { main: match[1].trim(), bracket: toTitleCaseLabel(match[2].trim()) };
}

function isScopeManagedSignoffField(field: string) {
  const normalized = field.trim().toLowerCase();
  return normalized.startsWith("investigation lead:") || normalized.startsWith("responsible person:");
}

function getFactorPillClass(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.includes("present")) return shellStyles.factorPillPresent;
  if (normalized.includes("absent")) return shellStyles.factorPillAbsent;
  if (normalized.includes("neutral")) return shellStyles.factorPillNeutral;
  if (normalized.includes("essential")) return shellStyles.factorPillEssential;
  if (normalized.includes("contributing")) return shellStyles.factorPillContributing;
  if (normalized.includes("predisposing")) return shellStyles.factorPillPredisposing;
  if (normalized.includes("failed") || normalized.includes("ineffective") || normalized.includes("missing")) return shellStyles.factorPillAbsent;
  if (normalized.includes("effective") || normalized.includes("high")) return shellStyles.factorPillPresent;
  if (normalized.includes("medium") || normalized.includes("corrective")) return shellStyles.factorPillContributing;
  return "";
}

function renderPill(value: string, fallbackClass = shellStyles.factorPillNeutral) {
  const trimmed = value.trim();
  if (!trimmed) return "-";
  return <span className={`${shellStyles.statusPill} ${getFactorPillClass(trimmed) || fallbackClass}`}>{toTitleCaseLabel(trimmed)}</span>;
}

function normalizeMainFactorsTable(columns: string[], rows: string[][]) {
  const normalizedColumns = columns.map(normalizeHeaderKey);
  const findIndex = (...patterns: string[]) => normalizedColumns.findIndex((column) => patterns.some((pattern) => column.includes(pattern)));
  const foundItemIndex = findIndex("factor", "item", "name");
  const itemIndex = foundItemIndex >= 0 ? foundItemIndex : 0;
  const typeIndex = findIndex("type");
  const presenceIndex = findIndex("presence", "status", "present");
  const classificationIndex = findIndex("classification", "role in incident", "role", "contribution");
  const detailsIndex = findIndex("detail", "support", "description", "definition", "why");
  const categoryIndex = findIndex("category", "influence");
  const pick = (row: string[], index: number) => (index >= 0 ? row[index] || "" : "");

  return {
    columns: ["Details", "Type", "Presence", "Classification", "Category"],
    rows: rows.map((row) => {
      const rawItem = pick(row, itemIndex);
      const rawClassification = pick(row, classificationIndex);
      const itemParts = splitBracketedValue(rawItem);
      const classificationParts = splitBracketedValue(rawClassification);

      return [
        pick(row, detailsIndex),
        pick(row, typeIndex) || itemParts.bracket || classificationParts.bracket,
        pick(row, presenceIndex),
        classificationParts.main || rawClassification,
        pick(row, categoryIndex),
      ];
    }),
  };
}

function normalizeControlsTable(columns: string[], rows: string[][]) {
  const normalizedColumns = columns.map(normalizeHeaderKey);
  const findIndex = (...patterns: string[]) => normalizedColumns.findIndex((column) => patterns.some((pattern) => column.includes(pattern)));
  const itemIndex = findIndex("control", "barrier", "item");
  const typeIndex = findIndex("type");
  const stateIndex = findIndex("state", "status", "present", "failed", "absent");
  const roleIndex = findIndex("role", "classification");
  const detailsIndex = findIndex("detail", "support", "description", "definition", "why");
  const pick = (row: string[], index: number) => (index >= 0 ? row[index] || "" : "");
  return {
    columns: ["Item", "Type", "State", "Role", "Details"],
    rows: rows.map((row) => [pick(row, itemIndex), pick(row, typeIndex), pick(row, stateIndex), pick(row, roleIndex), pick(row, detailsIndex)]),
  };
}

function normalizeRecommendationsTable(columns: string[], rows: string[][]) {
  const normalizedColumns = columns.map(normalizeHeaderKey);
  const findIndex = (...patterns: string[]) => normalizedColumns.findIndex((column) => patterns.some((pattern) => column.includes(pattern)));
  const recommendationIndex = findIndex("recommendation", "action", "item");
  const descriptionIndex = findIndex("description", "detail", "summary", "why");
  const actionTypeIndex = findIndex("action type", "type");
  const ownerIndex = findIndex("owner", "responsible");
  const dueDateIndex = findIndex("due", "date");
  const pick = (row: string[], index: number) => (index >= 0 ? row[index] || "" : "");
  return {
    columns: ["Recommendation", "Description", "Action Type", "Owner", "Due Date"],
    rows: rows.map((row) => [pick(row, recommendationIndex), pick(row, descriptionIndex), pick(row, actionTypeIndex), pick(row, ownerIndex), pick(row, dueDateIndex)]),
  };
}

function ReadOnlyTable({
  columns,
  rows,
  renderCell,
}: {
  columns: string[];
  rows: string[][];
  renderCell?: (value: string, rowIndex: number, cellIndex: number) => ReactNode;
}) {
  return (
    <div className={shellStyles.tableWrap}>
      <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length}>No saved rows available for this section.</td></tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={`${columns.join("-")}-${rowIndex}`}>
                {columns.map((column, cellIndex) => (
                  <td key={`${column}-${cellIndex}`}>
                    {renderCell ? renderCell(row[cellIndex] || "-", rowIndex, cellIndex) : row[cellIndex] || "-"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function EditInvestigationReportPage() {
  const params = useParams<{ id: string; reportId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [map, setMap] = useState<MapRow | null>(null);
  const [report, setReport] = useState<InvestigationSavedReportPayload | null>(null);
  const [lastSavedReport, setLastSavedReport] = useState<InvestigationSavedReportPayload | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<SectionId>("document_branding");
  const [visitedSections, setVisitedSections] = useState<Record<SectionId, boolean>>({
    document_branding: true,
    executive_summary: false,
    long_description: false,
    task_and_conditions: false,
    incident_outcomes: false,
    people_involved: false,
    incident_timeline: false,
    factors_and_system_factors: false,
    predisposing_factors: false,
    controls_and_barriers: false,
    incident_findings: false,
    recommendations: false,
    preliminary_facts: false,
    evidence: false,
    signatures: false,
  });
  const [showExcludedSectionsModal, setShowExcludedSectionsModal] = useState(false);
  const [excludedSectionsPendingExport, setExcludedSectionsPendingExport] = useState<SectionDefinition[]>([]);
  const [elements, setElements] = useState<CanvasElementRow[]>([]);
  const [evidenceSignedUrls, setEvidenceSignedUrls] = useState<Record<string, string>>({});
  const [evidencePreviewLayouts, setEvidencePreviewLayouts] = useState<Record<string, EvidencePreviewLayout[]>>({});
  const [brandingLogoUrl, setBrandingLogoUrl] = useState<string | null>(null);
  const [brandingUploading, setBrandingUploading] = useState(false);
  const [signedUrlsReady, setSignedUrlsReady] = useState(false);
  const [pdfLayoutsReady, setPdfLayoutsReady] = useState(false);
  const [imageLayoutsReady, setImageLayoutsReady] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [displayLoadingPhase, setDisplayLoadingPhase] = useState(0);
  const sidebarCardRef = useRef<HTMLElement | null>(null);
  const editorCardRef = useRef<HTMLDivElement | null>(null);
  const [syncedSidebarHeight, setSyncedSidebarHeight] = useState<number | null>(null);

  const activeSection = sectionDefinitions.find((section) => section.id === activeSectionId) ?? sectionDefinitions[0];
  const personElements = useMemo(() => elements.filter((element) => element.element_type === "person"), [elements]);
  const evidenceElements = useMemo(() => elements.filter((element) => element.element_type === "incident_evidence"), [elements]);
  const timelineItems = useMemo<TimelineRow[]>(
    () =>
      elements
        .filter((element) => element.element_type === "incident_sequence_step")
        .map((element) => {
          const config = element.element_config ?? {};
          const timestamp = String(config.timestamp ?? "").trim();
          const description = String(config.description ?? "").trim() || element.heading?.trim() || "-";
          const location = String(config.location ?? "").trim();
          const parsedTime = timestamp ? new Date(timestamp).getTime() : Number.NaN;

          return {
            id: element.id,
            date: formatReportDate(timestamp),
            time: timestamp ? formatReportTime(timestamp) : "-",
            location,
            description,
            sortTime: Number.isFinite(parsedTime) ? parsedTime : Number.MAX_SAFE_INTEGER,
            pos_x: element.pos_x ?? 0,
            pos_y: element.pos_y ?? 0,
            created_at: element.created_at,
          };
        })
        .sort((a, b) => {
          if (a.sortTime !== b.sortTime) return a.sortTime - b.sortTime;
          if (a.pos_x !== b.pos_x) return a.pos_x - b.pos_x;
          if (a.pos_y !== b.pos_y) return a.pos_y - b.pos_y;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        })
        .map(({ id, date, time, location, description }) => ({ id, date, time, location, description })),
    [elements],
  );
  const normalizedFactorsTable = useMemo(
    () =>
      normalizeMainFactorsTable(
        report?.report.sections.factors_and_system_factors.columns ?? [],
        report?.report.sections.factors_and_system_factors.rows ?? [],
      ),
    [report],
  );
  const normalizedPredisposingFactorsTable = useMemo(
    () =>
      normalizeMainFactorsTable(
        report?.report.sections.predisposing_factors.columns ?? [],
        report?.report.sections.predisposing_factors.rows ?? [],
      ),
    [report],
  );
  const normalizedControlsTable = useMemo(
    () =>
      normalizeControlsTable(
        report?.report.sections.controls_and_barriers.columns ?? [],
        report?.report.sections.controls_and_barriers.rows ?? [],
      ),
    [report],
  );
  const normalizedRecommendationsTable = useMemo(
    () =>
      normalizeRecommendationsTable(
        report?.report.sections.recommendations.columns ?? [],
        report?.report.sections.recommendations.rows ?? [],
      ),
    [report],
  );
  const dirtySectionCount = useMemo(() => {
    if (!report || !lastSavedReport) return 0;

    const dirtyChecks: Array<[SectionId, boolean]> = [
      ["executive_summary", report.report.sections.executive_summary !== lastSavedReport.report.sections.executive_summary],
      ["long_description", report.report.sections.long_description !== lastSavedReport.report.sections.long_description],
      ["task_and_conditions", report.report.sections.task_and_conditions !== lastSavedReport.report.sections.task_and_conditions],
      ["incident_outcomes", report.report.sections.incident_outcomes !== lastSavedReport.report.sections.incident_outcomes],
      [
        "incident_findings",
        report.report.sections.incident_findings.summary !== lastSavedReport.report.sections.incident_findings.summary,
      ],
      [
        "recommendations",
        report.report.sections.recommendations.summary !== lastSavedReport.report.sections.recommendations.summary ||
          JSON.stringify(report.report.sections.recommendations.endorsed ?? []) !==
            JSON.stringify(lastSavedReport.report.sections.recommendations.endorsed ?? []),
      ],
      [
        "evidence",
        JSON.stringify(report.report.sections.evidence.items) !== JSON.stringify(lastSavedReport.report.sections.evidence.items),
      ],
      [
        "signatures",
        JSON.stringify(report.report.sections.recommendation_sign_off_prefills ?? []) !==
          JSON.stringify(lastSavedReport.report.sections.recommendation_sign_off_prefills ?? []) ||
          JSON.stringify(report.report.sections.investigation_sign_off.prefills ?? []) !==
            JSON.stringify(lastSavedReport.report.sections.investigation_sign_off.prefills ?? []),
      ],
      [
        "document_branding",
        (report.report.branding?.logo_storage_path ?? "") !== (lastSavedReport.report.branding?.logo_storage_path ?? "") ||
          normalizeHexColor(report.report.branding?.section_heading_color ?? "", "#22344d") !==
            normalizeHexColor(lastSavedReport.report.branding?.section_heading_color ?? "", "#22344d") ||
          normalizeHexColor(report.report.branding?.table_heading_color ?? "", "#7c8793") !==
            normalizeHexColor(lastSavedReport.report.branding?.table_heading_color ?? "", "#7c8793"),
      ],
      [
        "preliminary_facts",
        JSON.stringify(report.report.sections.preliminary_facts?.uncertain_notes ?? []) !==
          JSON.stringify(lastSavedReport.report.sections.preliminary_facts?.uncertain_notes ?? []) ||
          JSON.stringify(report.report.sections.preliminary_facts?.missing_information_notes ?? []) !==
            JSON.stringify(lastSavedReport.report.sections.preliminary_facts?.missing_information_notes ?? []),
      ],
      [
        "document_branding",
        JSON.stringify(report.report.section_visibility ?? {}) !== JSON.stringify(lastSavedReport.report.section_visibility ?? {}),
      ],
    ];

    return dirtyChecks.filter(([, isDirty]) => isDirty).length;
  }, [lastSavedReport, report]);
  const excludedSectionDefinitions = useMemo(
    () =>
      report
        ? sectionDefinitions.filter((section) => section.canHideInPdf && !isSectionVisibleInPdf(report, section.id))
        : [],
    [report],
  );
  const evidencePreviewReady = signedUrlsReady && pdfLayoutsReady && imageLayoutsReady;
  const needsDataLoading = loading || (!!report && !!map && !evidencePreviewReady);
  const showLoadingExperience = needsDataLoading || displayLoadingPhase < loadingPhase;

  useEffect(() => {
    const hasCoreData = Boolean(report && map);
    const hasEvidence = evidenceElements.length > 0;
    const targetPhase = loading
      ? 0
      : !hasCoreData
        ? 1
        : !hasEvidence
          ? 5
          : !signedUrlsReady
            ? 2
            : !pdfLayoutsReady
              ? 3
              : !imageLayoutsReady
                ? 4
                : 6;

    setLoadingPhase((current) => Math.max(current, targetPhase));
  }, [evidenceElements.length, imageLayoutsReady, loading, map, pdfLayoutsReady, report, signedUrlsReady]);

  useEffect(() => {
    if (displayLoadingPhase >= loadingPhase) return;
    const timeoutId = window.setTimeout(() => {
      setDisplayLoadingPhase((current) => Math.min(current + 1, loadingPhase));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [displayLoadingPhase, loadingPhase]);

  useEffect(() => {
    if (!message) return;

    const timeoutId = window.setTimeout(() => {
      setMessage(null);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [message]);

  useEffect(() => {
    setVisitedSections((current) => (current[activeSectionId] ? current : { ...current, [activeSectionId]: true }));
  }, [activeSectionId]);

  useLayoutEffect(() => {
    const editorNode = editorCardRef.current;
    if (!editorNode || typeof window === "undefined" || typeof ResizeObserver === "undefined") return;

    const syncHeight = () => {
      setSyncedSidebarHeight(editorNode.getBoundingClientRect().height);
    };

    syncHeight();
    const rafId = window.requestAnimationFrame(() => syncHeight());
    const timeoutIds = [
      window.setTimeout(() => syncHeight(), 0),
      window.setTimeout(() => syncHeight(), 80),
      window.setTimeout(() => syncHeight(), 180),
      window.setTimeout(() => syncHeight(), 320),
    ];
    const resizeObserver = new ResizeObserver(() => syncHeight());
    resizeObserver.observe(editorNode);
    const mutationObserver = new MutationObserver(() => syncHeight());
    mutationObserver.observe(editorNode, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", syncHeight);

    return () => {
      window.cancelAnimationFrame(rafId);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", syncHeight);
    };
  }, [activeSectionId, report]);

  useEffect(() => {
    if (showLoadingExperience || typeof window === "undefined") return;

    const editorNode = editorCardRef.current;
    if (!editorNode) return;

    let runs = 0;
    let stableRuns = 0;
    let lastHeight = 0;

    const intervalId = window.setInterval(() => {
      const nextHeight = Math.ceil(editorNode.getBoundingClientRect().height);
      setSyncedSidebarHeight(nextHeight);

      if (nextHeight === lastHeight) {
        stableRuns += 1;
      } else {
        stableRuns = 0;
        lastHeight = nextHeight;
      }

      runs += 1;
      if (stableRuns >= 3 || runs >= 20) {
        window.clearInterval(intervalId);
      }
    }, 50);

    return () => window.clearInterval(intervalId);
  }, [showLoadingExperience, activeSectionId, report]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setLoadingPhase(0);
      setDisplayLoadingPhase(0);
      setSignedUrlsReady(false);
      setPdfLayoutsReady(false);
      setImageLayoutsReady(false);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push(`/login?returnTo=${encodeURIComponent(`/investigations/${params.id}/reports/${params.reportId}/edit`)}`);
        return;
      }

      const accessState = await fetchAccessState(session.access_token);
      if (accessRequiresSelection(accessState)) {
        router.push("/subscribe");
        return;
      }
      if (accessBlocksInvestigationEntry(accessState)) {
        router.push("/dashboard?mapAccess=blocked");
        return;
      }

      const [{ data: mapRow, error: mapError }, { data: reportRow, error: reportError }, { data: elementRows, error: elementsError }] = await Promise.all([
        supabase.schema("ms").from("system_maps").select("id,title").eq("id", params.id).single(),
        supabase
          .schema("ms")
          .from("investigation_reports")
          .select("id,status,generated_at,updated_at,version_number,ai_output_json")
          .eq("case_id", params.id)
          .eq("id", params.reportId)
          .single(),
        supabase
          .schema("ms")
          .from("canvas_elements")
          .select("id,element_type,heading,element_config,created_at,pos_x,pos_y")
          .eq("map_id", params.id)
          .order("created_at", { ascending: true }),
      ]);

      if (mapError) {
        setError(mapError.message || "Unable to load investigation.");
        setLoading(false);
        return;
      }

      if (reportError || !reportRow) {
        setError(reportError?.message || "Unable to load saved report.");
        setLoading(false);
        return;
      }
      if (elementsError) {
        setError(elementsError.message || "Unable to load investigation map data.");
        setLoading(false);
        return;
      }

      setMap(mapRow as MapRow);
      setElements((elementRows ?? []) as CanvasElementRow[]);
      const normalizedReport = {
        ...normalizeInvestigationReportPayload((reportRow.ai_output_json ?? {}) as InvestigationSavedReportPayload),
        saved_report: {
          id: reportRow.id,
          status: reportRow.status as InvestigationReportStatus,
          generated_at: reportRow.generated_at,
          updated_at: reportRow.updated_at,
          version_number: reportRow.version_number,
        },
      } as InvestigationSavedReportPayload;

      setReport(normalizedReport);
      setLastSavedReport(normalizedReport);
      setLoading(false);
    };

    void load();
  }, [params.id, params.reportId, router, supabase]);

  useEffect(() => {
    let cancelled = false;

    const loadEvidenceSignedUrls = async () => {
      const pathPairs = evidenceElements
        .map((element) => ({
          id: element.id,
          path: getEvidenceMediaPath(element.element_config),
        }))
        .filter((entry) => entry.path);

      setSignedUrlsReady(false);

      if (pathPairs.length === 0) {
        if (!cancelled) {
          setEvidenceSignedUrls({});
          setSignedUrlsReady(true);
        }
        return;
      }

      const { data, error: signedUrlError } = await supabase.storage
        .from("systemmap")
        .createSignedUrls(pathPairs.map((entry) => entry.path), 3600);

      if (cancelled || signedUrlError) {
        if (!cancelled) {
          setEvidenceSignedUrls({});
          setSignedUrlsReady(true);
        }
        return;
      }

      const nextSignedUrls: Record<string, string> = {};
      const signedUrlByPath = new Map<string, string>();
      data?.forEach((row) => {
        if (row.path && row.signedUrl) signedUrlByPath.set(row.path, row.signedUrl);
      });

      pathPairs.forEach((entry) => {
        const signedUrl = signedUrlByPath.get(entry.path);
        if (signedUrl) nextSignedUrls[entry.id] = signedUrl;
      });

      if (!cancelled) {
        setEvidenceSignedUrls(nextSignedUrls);
        setSignedUrlsReady(true);
      }
    };

    void loadEvidenceSignedUrls();

    return () => {
      cancelled = true;
    };
  }, [evidenceElements, supabase]);

  useEffect(() => {
    let cancelled = false;

    const loadPdfLayouts = async () => {
      const pdfEvidence = evidenceElements
        .map((element) => {
          const signedUrl = evidenceSignedUrls[element.id];
          const fallbackUrl = getEvidenceMediaUrl(element.element_config);
          const url = signedUrl || fallbackUrl;
          return { id: element.id, url, isPdf: isPdfEvidence(element.element_config) };
        })
        .filter((entry) => entry.isPdf && entry.url);

      setPdfLayoutsReady(false);

      if (pdfEvidence.length === 0) {
        if (!cancelled) setPdfLayoutsReady(true);
        return;
      }

      try {
        const importPdfJs = new Function("url", "return import(/* webpackIgnore: true */ url);") as (
          url: string,
        ) => Promise<PdfJsModule>;
        const pdfjs = await importPdfJs("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";

        const nextLayouts: Record<string, EvidencePreviewLayout[]> = {};

        for (const entry of pdfEvidence) {
          const pdfDocument = await pdfjs.getDocument(entry.url).promise;
          const page = await pdfDocument.getPage(1);
          const viewport = page.getViewport({ scale: 1.35 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: context, viewport }).promise;

          nextLayouts[entry.id] = [
            {
              src: canvas.toDataURL("image/png"),
              orientation: viewport.width > viewport.height ? "landscape" : "portrait",
            },
          ];
        }

        if (!cancelled) {
          setEvidencePreviewLayouts((current) => ({ ...current, ...nextLayouts }));
          setPdfLayoutsReady(true);
        }
      } catch {
        if (!cancelled) setPdfLayoutsReady(true);
      }
    };

    void loadPdfLayouts();

    return () => {
      cancelled = true;
    };
  }, [evidenceElements, evidenceSignedUrls]);

  useEffect(() => {
    let cancelled = false;

    const loadBrandingLogoUrl = async () => {
      const storagePath = report?.report.branding?.logo_storage_path?.trim() ?? "";
      if (!storagePath) {
        setBrandingLogoUrl(null);
        return;
      }

      const { data, error: signedUrlError } = await supabase.storage
        .from("reportlogo")
        .createSignedUrl(storagePath, 3600);

      if (cancelled) return;
      if (signedUrlError || !data?.signedUrl) {
        setBrandingLogoUrl(null);
        return;
      }

      setBrandingLogoUrl(data.signedUrl);
    };

    void loadBrandingLogoUrl();

    return () => {
      cancelled = true;
    };
  }, [report?.report.branding?.logo_storage_path, supabase]);

  useEffect(() => {
    let cancelled = false;

    const loadImageLayouts = async () => {
      const imageEvidence = evidenceElements
        .map((element) => {
          const signedUrl = evidenceSignedUrls[element.id];
          const fallbackUrl = getEvidenceMediaUrl(element.element_config);
          const url = signedUrl || fallbackUrl;
          return { id: element.id, url, isPdf: isPdfEvidence(element.element_config) };
        })
        .filter((entry) => !entry.isPdf && entry.url);

      setImageLayoutsReady(false);

      if (imageEvidence.length === 0) {
        if (!cancelled) setImageLayoutsReady(true);
        return;
      }

      const nextLayouts: Record<string, EvidencePreviewLayout[]> = {};
      await Promise.all(
        imageEvidence.map(
          (entry) =>
            new Promise<void>((resolve) => {
              const image = new window.Image();
              image.onload = () => {
                nextLayouts[entry.id] = [
                  {
                    src: entry.url,
                    orientation: image.naturalWidth > image.naturalHeight ? "landscape" : "portrait",
                  },
                ];
                resolve();
              };
              image.onerror = () => resolve();
              image.src = entry.url;
            }),
        ),
      );

      if (!cancelled) {
        setEvidencePreviewLayouts((current) => ({ ...current, ...nextLayouts }));
        setImageLayoutsReady(true);
      }
    };

    void loadImageLayouts();

    return () => {
      cancelled = true;
    };
  }, [evidenceElements, evidenceSignedUrls]);

  const handleSectionChange = (value: string) => {
    if (!report) return;
    setReport((current) => (current ? setSectionValue(current, activeSectionId, value) : current));
  };

  const handleSectionSelect = (sectionId: SectionId) => {
    setActiveSectionId(sectionId);
    setVisitedSections((current) => (current[sectionId] ? current : { ...current, [sectionId]: true }));
  };

  const handleSectionVisibilityToggle = (sectionId: SectionId, checked: boolean) => {
    if (!report || !hideableSectionIds.includes(sectionId as Exclude<SectionId, "document_branding">)) return;

    setReport((current) => {
      if (!current) return current;
      return {
        ...current,
        report: {
          ...current.report,
          section_visibility: {
            ...(current.report.section_visibility ?? {}),
            [sectionId]: checked,
          },
        },
      };
    });
  };

  const handleEvidenceToggle = (index: number, includeInReport: boolean) => {
    setReport((current) => {
      if (!current) return current;
      return {
        ...current,
        report: {
          ...current.report,
          sections: {
            ...current.report.sections,
            evidence: {
              ...current.report.sections.evidence,
              items: current.report.sections.evidence.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, include_in_report: includeInReport } : item,
              ),
            },
          },
        },
      };
    });
  };

  const handleBrandingColorChange = (target: "section_heading_color" | "table_heading_color", value: string) => {
    setReport((current) => {
      if (!current) return current;
      const nextColor = normalizeHexColor(value, target === "section_heading_color" ? "#22344d" : "#7c8793");

      return {
        ...current,
        report: {
          ...current.report,
          branding: {
            ...(current.report.branding ?? {}),
            [target]: nextColor,
          },
        },
      };
    });
  };

  const handleBrandingLogoUpload = async (file: File | null) => {
    if (!file || !report) return;

    const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "";
    const safeExtension = extension && /^[a-z0-9]+$/.test(extension) ? extension : "png";
    const filePath = `${params.id}/${params.reportId}/logo-${Date.now()}.${safeExtension}`;

    setBrandingUploading(true);
    setError(null);
    setMessage(null);

    const { error: uploadError } = await supabase.storage
      .from("reportlogo")
      .upload(filePath, file, { cacheControl: "3600", upsert: true, contentType: file.type || undefined });

    if (uploadError) {
      setError(uploadError.message || "Unable to upload logo.");
      setBrandingUploading(false);
      return;
    }

    const { data, error: signedUrlError } = await supabase.storage
      .from("reportlogo")
      .createSignedUrl(filePath, 3600);

    setReport((current) => {
      if (!current) return current;
      return {
        ...current,
        report: {
          ...current.report,
          branding: {
            ...(current.report.branding ?? {}),
            logo_storage_path: filePath,
            section_heading_color: normalizeHexColor(current.report.branding?.section_heading_color ?? "", "#22344d"),
            table_heading_color: normalizeHexColor(current.report.branding?.table_heading_color ?? "", "#7c8793"),
          },
        },
      };
    });

    setBrandingLogoUrl(signedUrlError ? null : (data?.signedUrl ?? null));
    setMessage("Logo uploaded. Save changes to apply branding.");
    setBrandingUploading(false);
  };

  const handleRecommendationEndorsementToggle = (index: number, endorsed: boolean) => {
    setReport((current) => {
      if (!current) return current;
      const nextEndorsements = [...(current.report.sections.recommendations.endorsed ?? [])];
      nextEndorsements[index] = endorsed;

      return {
        ...current,
        report: {
          ...current.report,
          sections: {
            ...current.report.sections,
            recommendations: {
              ...current.report.sections.recommendations,
              endorsed: current.report.sections.recommendations.rows.map(
                (_row, rowIndex) => nextEndorsements[rowIndex] === true,
              ),
            },
          },
        },
      };
    });
  };

  const handlePreliminaryFactNoteChange = (
    target: "uncertain_notes" | "missing_information_notes",
    index: number,
    value: string,
  ) => {
    setReport((current) => {
      if (!current) return current;
      const nextNotes = [...(current.report.sections.preliminary_facts?.[target] ?? [])];
      nextNotes[index] = value;

      return {
        ...current,
        report: {
          ...current.report,
          sections: {
            ...current.report.sections,
            preliminary_facts: {
              uncertain_notes: current.facts_uncertain.map((_item, noteIndex) =>
                target === "uncertain_notes" ? nextNotes[noteIndex] ?? "" : current.report.sections.preliminary_facts?.uncertain_notes?.[noteIndex] ?? "",
              ),
              missing_information_notes: current.missing_information.map((_item, noteIndex) =>
                target === "missing_information_notes"
                  ? nextNotes[noteIndex] ?? ""
                  : current.report.sections.preliminary_facts?.missing_information_notes?.[noteIndex] ?? "",
              ),
            },
          },
        },
      };
    });
  };

  const handleSignaturePrefillChange = (target: "recommendation" | "investigation", index: number, value: string) => {
    setReport((current) => {
      if (!current) return current;
      if (target === "recommendation") {
        const nextPrefills = [...(current.report.sections.recommendation_sign_off_prefills ?? [])];
        nextPrefills[index] = value;
        return {
          ...current,
          report: {
            ...current.report,
            sections: {
              ...current.report.sections,
              recommendation_sign_off_prefills: nextPrefills,
            },
          },
        };
      }

      const nextPrefills = [...(current.report.sections.investigation_sign_off.prefills ?? [])];
      nextPrefills[index] = value;
      return {
        ...current,
        report: {
          ...current.report,
          sections: {
            ...current.report.sections,
            investigation_sign_off: {
              ...current.report.sections.investigation_sign_off,
              prefills: nextPrefills,
            },
          },
        },
      };
    });
  };

  const saveReport = async () => {
    if (!report) return false;

    setSaving(true);
    setMessage(null);
    setError(null);

    const { saved_report: _savedReport, ...reportPayload } = report;

    const { error: updateError } = await supabase
      .schema("ms")
      .from("investigation_reports")
      .update({
        ai_output_json: reportPayload,
        draft_report_text: buildDraftReportText(reportPayload),
        missing_information_json: report.missing_information,
      })
      .eq("case_id", params.id)
      .eq("id", params.reportId);

    if (updateError) {
      setError(updateError.message || "Unable to save report changes.");
      setSaving(false);
      return false;
    }

    setLastSavedReport(report);
    setMessage("Report changes saved.");
    setSaving(false);
    return true;
  };

  const continueExportToPdf = async () => {
    const saved = await saveReport();
    if (!saved) return;
    router.push(`/investigations/${params.id}/generated-report?reportId=${params.reportId}`);
  };

  const handleExportToPdf = async () => {
    if (excludedSectionDefinitions.length > 0) {
      setExcludedSectionsPendingExport(excludedSectionDefinitions);
      setShowExcludedSectionsModal(true);
      return;
    }

    await continueExportToPdf();
  };

  const renderReadOnlySection = () => {
    if (!report) return null;

    const note = (
      <p className={editStyles.readOnlyNote}>
        These report views are not editable because they directly link back to nodes on your investigation map. To edit this
        information, update your investigation map and then create a new report version.
      </p>
    );

    switch (activeSectionId) {
      case "people_involved":
        return (
          <div className={editStyles.previewStack}>
            {note}
            {personElements.length > 0 ? (
              <div className={editStyles.peopleGrid}>
                {personElements.map((person) => {
                  const labels = parsePersonLabels((person.heading ?? "").replaceAll("\\n", "\n"));
                  return (
                    <div key={person.id} className={editStyles.personCard}>
                      <strong>{labels.role || "Person"}</strong>
                      {labels.department && labels.department !== "Department" ? <span>{labels.department}</span> : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={editStyles.helperText}>{report.report.sections.people_involved.note}</p>
            )}
          </div>
        );
      case "incident_timeline":
        return (
          <div className={editStyles.previewStack}>
            {note}
            {timelineItems.length > 0 ? (
              <div className={editStyles.timelineList}>
                {timelineItems.map((item) => (
                  <div key={item.id} className={editStyles.timelineRow}>
                    <div className={editStyles.timelineMeta}>
                      <strong>{item.date}</strong>
                      <span>{item.time}</span>
                    </div>
                    <div className={editStyles.timelineBody}>
                      {item.location ? <strong>{item.location}</strong> : null}
                      <p>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={editStyles.helperText}>No saved sequence nodes are available for this report.</p>
            )}
          </div>
        );
      case "factors_and_system_factors":
        return (
          <div className={editStyles.previewStack}>
            {note}
            <ReadOnlyTable
              columns={normalizedFactorsTable.columns}
              rows={normalizedFactorsTable.rows}
              renderCell={(value, _rowIndex, cellIndex) => {
                if (cellIndex === 2 || cellIndex === 3) return renderPill(value);
                return value || "-";
              }}
            />
          </div>
        );
      case "predisposing_factors":
        return (
          <div className={editStyles.previewStack}>
            {note}
            <ReadOnlyTable
              columns={normalizedPredisposingFactorsTable.columns}
              rows={normalizedPredisposingFactorsTable.rows}
              renderCell={(value, _rowIndex, cellIndex) => {
                if (cellIndex === 2 || cellIndex === 3) return renderPill(value);
                return value || "-";
              }}
            />
          </div>
        );
      case "controls_and_barriers":
        return (
          <div className={editStyles.previewStack}>
            {note}
            <ReadOnlyTable
              columns={normalizedControlsTable.columns}
              rows={normalizedControlsTable.rows}
              renderCell={(value, _rowIndex, cellIndex) => {
                if (cellIndex === 2 || cellIndex === 3) return renderPill(value);
                return value || "-";
              }}
            />
          </div>
        );
      case "incident_findings":
        return (
          <div className={editStyles.previewStack}>
            {note}
            <ReadOnlyTable
              columns={report.report.sections.incident_findings.columns}
              rows={report.report.sections.incident_findings.rows}
              renderCell={(value, _rowIndex, cellIndex) => {
                if (cellIndex === 2) return renderPill(value);
                return value || "-";
              }}
            />
          </div>
        );
      case "recommendations":
        return (
          <div className={editStyles.previewStack}>
            {note}
            <ReadOnlyTable
              columns={[...normalizedRecommendationsTable.columns, "Approved"]}
              rows={normalizedRecommendationsTable.rows.map((row, rowIndex) => [
                ...row,
                report.report.sections.recommendations.endorsed?.[rowIndex] ? "true" : "false",
              ])}
              renderCell={(value, rowIndex, cellIndex) => {
                if (cellIndex === 2) return renderPill(value, shellStyles.factorPillPredisposing);
                if (cellIndex === 5) {
                  return (
                    <label className={editStyles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={report.report.sections.recommendations.endorsed?.[rowIndex] === true}
                        onChange={(event) => handleRecommendationEndorsementToggle(rowIndex, event.target.checked)}
                      />
                      Approved
                    </label>
                  );
                }
                return value || "-";
              }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const renderEvidenceSection = () => {
    if (!report) return null;

    return (
      <div className={editStyles.previewStack}>
        <p className={editStyles.readOnlyNote}>
          Evidence remains stored on the investigation record. The checkbox below only controls whether that evidence appears
          in this report version.
        </p>
        {report.report.sections.evidence.items.length > 0 ? (
          <div className={editStyles.evidenceGrid}>
            {report.report.sections.evidence.items.map((item, index) => {
              const matchingElement = evidenceElements[index];
              const previewLayouts = matchingElement ? evidencePreviewLayouts[matchingElement.id] ?? [] : [];
              const preview = previewLayouts[0];
              const fileType = matchingElement ? getEvidenceFileType(matchingElement.element_config) : "FILE";
              const fallbackDescription = matchingElement
                ? cleanEvidenceDescription(getConfigValue(matchingElement.element_config, "description", "summary", "caption", "notes"))
                : "";
              const description = cleanEvidenceDescription(item.description) || fallbackDescription || "No description provided.";
              const label = (item.label || `Attachment ${index + 1}`).trim();
              const normalizedLabel = label.replace(/\s+/g, " ").trim().toLowerCase();
              const normalizedDescription = description.replace(/\s+/g, " ").trim().toLowerCase();
              const summaryText = normalizedDescription && normalizedDescription !== normalizedLabel ? description : label;

              return (
                <div key={`${item.label}-${index}`} className={editStyles.evidenceCard}>
                  <div className={editStyles.evidenceControls}>
                    <label className={editStyles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={item.include_in_report !== false}
                        onChange={(event) => handleEvidenceToggle(index, event.target.checked)}
                      />
                      Include In Report
                    </label>
                  </div>
                  <div className={editStyles.evidenceSummary}>
                    <p className={editStyles.evidenceSummaryText}>{summaryText}</p>
                    <p className={editStyles.evidenceFileType}>{fileType}</p>
                  </div>
                  <div className={editStyles.previewFrame}>
                    {preview ? (
                      <img
                        src={preview.src}
                        alt={label}
                        className={editStyles.previewImage}
                      />
                    ) : (
                      <div className={editStyles.previewPlaceholder}>Preview not available for this evidence item yet.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={editStyles.helperText}>No saved evidence items are available for this report.</p>
        )}
      </div>
    );
  };

  const renderSignatureSection = () => {
    if (!report) return null;

    return (
      <div className={editStyles.previewStack}>
        <p className={editStyles.readOnlyNote}>
          You can prefill the names, roles, and dates shown above the existing signature lines. The signature block structure in
          the report cannot be changed here.
        </p>

        <div className={editStyles.previewStack}>
          <div className={editStyles.signatureSection}>
            <h3 className={editStyles.editorTitle}>Recommendation Sign Off</h3>
            <div className={editStyles.signatureFields}>
              {report.report.sections.recommendations.approval_fields.map((field, index) => (
                <div key={field} className={editStyles.signatureFieldRow}>
                  <label className={editStyles.signatureFieldLabel} htmlFor={`recommendation-signoff-${index}`}>
                    {field}
                  </label>
                  <input
                    id={`recommendation-signoff-${index}`}
                    className={editStyles.signatureInput}
                    value={report.report.sections.recommendation_sign_off_prefills?.[index] ?? ""}
                    onChange={(event) => handleSignaturePrefillChange("recommendation", index, event.target.value)}
                    placeholder={`Prefill for ${field}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={editStyles.previewStack}>
          <div className={editStyles.signatureSection}>
            <h3 className={editStyles.editorTitle}>{report.report.sections.investigation_sign_off.heading}</h3>
            <div className={editStyles.signatureFields}>
              {report.report.sections.investigation_sign_off.fields
                .map((field, index) => ({ field, index }))
                .filter(({ field }) => !isScopeManagedSignoffField(field))
                .map(({ field, index }) => (
                  <div key={field} className={editStyles.signatureFieldRow}>
                    <label className={editStyles.signatureFieldLabel} htmlFor={`investigation-signoff-${index}`}>
                      {field}
                    </label>
                    <input
                      id={`investigation-signoff-${index}`}
                      className={editStyles.signatureInput}
                      value={report.report.sections.investigation_sign_off.prefills?.[index] ?? ""}
                      onChange={(event) => handleSignaturePrefillChange("investigation", index, event.target.value)}
                      placeholder={`Prefill for ${field}`}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBrandingSection = () => {
    if (!report) return null;

    const sectionHeadingColor = normalizeHexColor(report.report.branding?.section_heading_color ?? "", "#22344d");
    const tableHeadingColor = normalizeHexColor(report.report.branding?.table_heading_color ?? "", "#7c8793");

    return (
      <div className={editStyles.previewStack}>
        <p className={editStyles.readOnlyNote}>
          Set document branding used in generated PDFs. Upload a logo and choose heading colors to match your business style.
        </p>

        <div className={editStyles.brandingGrid}>
          <div className={editStyles.brandingCard}>
            <h3 className={editStyles.brandingCardTitle}>Logo</h3>
            <p className={editStyles.helperText}>Upload a PNG, JPG, or SVG logo for the report cover and contents pages.</p>
            <label className={editStyles.brandingUploadButton}>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                className={editStyles.brandingFileInput}
                onChange={(event) => void handleBrandingLogoUpload(event.target.files?.[0] ?? null)}
                disabled={brandingUploading}
              />
              {brandingUploading ? "Uploading..." : "Upload Logo"}
            </label>
            {brandingLogoUrl ? (
              <div className={editStyles.brandingLogoPreviewWrap}>
                <img src={brandingLogoUrl} alt="Document logo preview" className={editStyles.brandingLogoPreview} />
              </div>
            ) : (
              <p className={editStyles.helperText}>No logo uploaded yet.</p>
            )}
          </div>

          <div className={editStyles.brandingCard}>
            <h3 className={editStyles.brandingCardTitle}>Heading Colors</h3>
            <div className={editStyles.brandingColorRow}>
              <label className={editStyles.brandingColorLabel} htmlFor="section-heading-color">Section heading color</label>
              <div className={editStyles.brandingColorControl}>
                <input
                  id="section-heading-color"
                  type="color"
                  value={sectionHeadingColor}
                  onChange={(event) => handleBrandingColorChange("section_heading_color", event.target.value)}
                  className={editStyles.brandingColorInput}
                />
                <input
                  type="text"
                  value={sectionHeadingColor}
                  onChange={(event) => handleBrandingColorChange("section_heading_color", event.target.value)}
                  className={editStyles.brandingHexInput}
                  maxLength={7}
                />
              </div>
            </div>
            <div className={editStyles.brandingColorRow}>
              <label className={editStyles.brandingColorLabel} htmlFor="table-heading-color">Table heading color</label>
              <div className={editStyles.brandingColorControl}>
                <input
                  id="table-heading-color"
                  type="color"
                  value={tableHeadingColor}
                  onChange={(event) => handleBrandingColorChange("table_heading_color", event.target.value)}
                  className={editStyles.brandingColorInput}
                />
                <input
                  type="text"
                  value={tableHeadingColor}
                  onChange={(event) => handleBrandingColorChange("table_heading_color", event.target.value)}
                  className={editStyles.brandingHexInput}
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPreliminaryFactsSection = () => {
    if (!report) return null;

    const uncertainNotes = report.report.sections.preliminary_facts?.uncertain_notes ?? [];
    const missingInformationNotes = report.report.sections.preliminary_facts?.missing_information_notes ?? [];

    return (
      <div className={editStyles.previewStack}>
        <p className={editStyles.readOnlyNote}>
          Add working notes for each uncertain fact and missing information item. These notes will appear in the styled PDF appendix.
        </p>

        <div className={editStyles.preliminaryFactsBlock}>
          <h3 className={editStyles.editorTitle}>{report.report.front_page.facts_uncertain_heading}</h3>
          {report.facts_uncertain.length > 0 ? (
            <div className={editStyles.preliminaryFactsTableWrap}>
              <table className={editStyles.preliminaryFactsTable}>
                <thead>
                  <tr>
                    <th>Uncertain Fact</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {report.facts_uncertain.map((item, index) => (
                    <tr key={`uncertain-${index}`}>
                      <td>{item}</td>
                      <td>
                        <textarea
                          className={editStyles.preliminaryFactNoteInput}
                          value={uncertainNotes[index] ?? ""}
                          rows={1}
                          onChange={(event) => {
                            autosizePreliminaryFactTextarea(event.target);
                            handlePreliminaryFactNoteChange("uncertain_notes", index, event.target.value);
                          }}
                          onInput={(event) => autosizePreliminaryFactTextarea(event.currentTarget)}
                          ref={(node) => {
                            if (node) autosizePreliminaryFactTextarea(node);
                          }}
                          placeholder="Add what is currently known or why this remains uncertain"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={editStyles.helperText}>No uncertain facts recorded for this report.</p>
          )}
        </div>

        <div className={editStyles.preliminaryFactsBlock}>
          <h3 className={editStyles.editorTitle}>{report.report.front_page.missing_information_heading}</h3>
          {report.missing_information.length > 0 ? (
            <div className={editStyles.preliminaryFactsTableWrap}>
              <table className={editStyles.preliminaryFactsTable}>
                <thead>
                  <tr>
                    <th>Missing Information</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {report.missing_information.map((item, index) => (
                    <tr key={`missing-${index}`}>
                      <td>{item}</td>
                      <td>
                        <textarea
                          className={editStyles.preliminaryFactNoteInput}
                          value={missingInformationNotes[index] ?? ""}
                          rows={1}
                          onChange={(event) => {
                            autosizePreliminaryFactTextarea(event.target);
                            handlePreliminaryFactNoteChange("missing_information_notes", index, event.target.value);
                          }}
                          onInput={(event) => autosizePreliminaryFactTextarea(event.currentTarget)}
                          ref={(node) => {
                            if (node) autosizePreliminaryFactTextarea(node);
                          }}
                          placeholder="Add what is missing or what is needed to close the gap"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={editStyles.helperText}>No missing information items recorded for this report.</p>
          )}
        </div>
      </div>
    );
  };

  if (showLoadingExperience) {
    return (
      <DashboardShell
        activeNav="dashboard"
        eyebrow="Investigation Tool"
        title={map ? `${map.title} Report Editor` : "Edit Report"}
        subtitle="Preparing report editor."
        headerLead={
          <button
            type="button"
            className={shellStyles.reportBackButton}
            onClick={() => router.push(`/investigations/${params.id}`)}
            aria-label="Back to investigation"
          >
            <Image src="/icons/back.svg" alt="" width={18} height={18} className={shellStyles.reportBackIcon} />
            <span>Back</span>
          </button>
        }
      >
        <section className={shellStyles.accountCard}>
          <ReportProgressLoadingView
            phase={displayLoadingPhase}
            title="Preparing Report Editor"
            subtitle="Loading saved report content and evidence previews."
            inline
          />
        </section>
      </DashboardShell>
    );
  }

  if (!report || !map) {
    return (
      <DashboardShell activeNav="dashboard" eyebrow="Investigation Tool" title="Edit Report" subtitle="Saved report editor.">
        <section className={shellStyles.accountCard}>
          <div className={shellStyles.accountSection}>
            <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{error || "Saved report not found."}</p>
          </div>
        </section>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      activeNav="dashboard"
      eyebrow="Investigation Tool"
      title={`${map.title} Report Editor`}
      subtitle={`Editing saved version ${report.saved_report.version_number}.`}
      headerLead={
        <button
          type="button"
          className={shellStyles.reportBackButton}
          onClick={() => router.push(`/investigations/${params.id}`)}
          aria-label="Back to investigation"
        >
          <Image src="/icons/back.svg" alt="" width={18} height={18} className={shellStyles.reportBackIcon} />
          <span>Back</span>
        </button>
      }
    >
      <section className={`${shellStyles.accountCard} ${editStyles.reportEditorShell}`}>
        <div className={shellStyles.accountSection}>
          <div className={editStyles.mobileSelectWrap}>
            <label className={shellStyles.reportMobileSelectLabel} htmlFor="report-section-select">
              Section
            </label>
            <select
              id="report-section-select"
              className={shellStyles.reportMobileSelect}
              value={activeSectionId}
              onChange={(event) => handleSectionSelect(event.target.value as SectionId)}
            >
              {sectionDefinitions.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </select>
          </div>

          <div className={editStyles.layout}>
            <aside
              ref={sidebarCardRef}
              className={editStyles.sidebarCard}
              style={syncedSidebarHeight ? { height: `${Math.ceil(syncedSidebarHeight)}px` } : undefined}
            >
              <h2 className={editStyles.sidebarTitle}>Report Sections</h2>
              <p className={editStyles.sidebarMeta}>
                Version {report.saved_report.version_number}. Click each tab to review report information and uncheck any
                sections you do not want included in the final PDF.
              </p>
              <div className={editStyles.sidebarNavList}>
                {sectionDefinitions.map((section) => (
                  <div
                    key={section.id}
                    className={`${editStyles.navButton} ${activeSectionId === section.id ? editStyles.navButtonActive : ""} ${
                      visitedSections[section.id] ? editStyles.navButtonVisited : ""
                    }`}
                  >
                    {section.canHideInPdf ? (
                      <input
                        type="checkbox"
                        checked={isSectionVisibleInPdf(report, section.id)}
                        onChange={(event) => handleSectionVisibilityToggle(section.id, event.target.checked)}
                        onClick={(event) => event.stopPropagation()}
                        className={editStyles.navCheckbox}
                        aria-label={`Include ${section.label} in PDF`}
                      />
                    ) : (
                      <span className={editStyles.navCheckboxSpacer} aria-hidden="true" />
                    )}
                    <button
                      type="button"
                      className={editStyles.navButtonLabel}
                      onClick={() => handleSectionSelect(section.id)}
                    >
                      {section.label}
                    </button>
                  </div>
                ))}
              </div>
            </aside>

            <div ref={editorCardRef} className={editStyles.editorCard}>
              <div className={editStyles.editorHeader}>
                <div className={editStyles.editorHeaderMain}>
                  <h2 className={editStyles.editorTitle}>{activeSection.label}</h2>
                  <p className={editStyles.editorDescription}>{activeSection.description}</p>
                </div>
                <div className={editStyles.topActionsCluster}>
                  <div className={editStyles.topActionsButtons}>
                    <button
                      type="button"
                      title="Save changes"
                      aria-label="Save changes"
                      className={`${shellStyles.button} ${editStyles.iconActionButton}`}
                      onClick={() => void saveReport()}
                      disabled={saving}
                    >
                      <Image src="/icons/save.svg" alt="" width={16} height={16} className={editStyles.actionButtonIcon} />
                    </button>
                    <button
                      type="button"
                      title="Generate PDF"
                      aria-label="Generate PDF"
                      className={`${shellStyles.buttonWizard} ${editStyles.generateActionButton}`}
                      onClick={() => void handleExportToPdf()}
                      disabled={saving}
                    >
                      <Image src="/icons/generate.svg" alt="" width={36} height={36} className={`${editStyles.actionButtonIcon} ${editStyles.generateActionIcon}`} />
                      <span>{saving ? "Saving..." : "Generate PDF"}</span>
                    </button>
                  </div>
                  {dirtySectionCount > 0 ? (
                    <p className={editStyles.unsavedChangesText}>
                      <strong>{dirtySectionCount}</strong> {dirtySectionCount === 1 ? "tab has" : "tabs have"} unsaved changes. Save changes to keep them.
                    </p>
                  ) : null}
                  {error || message ? (
                    <div className={editStyles.topActionsStatus}>
                      {error ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{error}</p> : null}
                      {message ? <p className={`${shellStyles.message} ${shellStyles.messageSuccess}`}>{message}</p> : null}
                    </div>
                  ) : null}
                </div>
              </div>

              {activeSection.mode === "editable_text" ? (
                <>
                  <textarea
                    className={editStyles.textArea}
                    rows={1}
                    value={getSectionValue(report, activeSection.id)}
                    onChange={(event) => {
                      autosizeReportTextarea(event.target);
                      handleSectionChange(event.target.value);
                    }}
                    onInput={(event) => autosizeReportTextarea(event.currentTarget)}
                    ref={(node) => {
                      if (node) autosizeReportTextarea(node);
                    }}
                  />
                  <p className={editStyles.helperText}>
                    Paragraph breaks are preserved in the saved report and carried into the PDF output where applicable.
                  </p>
                  {activeSection.id === "incident_findings" || activeSection.id === "recommendations"
                    ? renderReadOnlySection()
                    : null}
                </>
              ) : null}

              {activeSection.mode === "read_only" ? renderReadOnlySection() : null}
              {activeSection.mode === "evidence" ? renderEvidenceSection() : null}
              {activeSection.mode === "signatures" ? renderSignatureSection() : null}
              {activeSection.mode === "branding" ? renderBrandingSection() : null}
              {activeSection.mode === "preliminary_facts" ? renderPreliminaryFactsSection() : null}
            </div>
          </div>
        </div>
      </section>
      {showExcludedSectionsModal ? (
        <div className={editStyles.modalOverlay} role="presentation">
          <div className={editStyles.modalCard} role="dialog" aria-modal="true" aria-labelledby="excluded-sections-modal-title">
            <h2 id="excluded-sections-modal-title" className={editStyles.modalTitle}>Excluded Sections</h2>
            <p className={editStyles.modalBody}>
              One or more report sections are currently unchecked and will not appear in the final PDF. Other visible parts of
              the report may rely on that information to make sense.
            </p>
            <p className={editStyles.modalBody}>Please confirm that you want to continue generating the PDF without these sections:</p>
            <ul className={editStyles.modalList}>
              {excludedSectionsPendingExport.map((section) => (
                <li key={section.id}>{section.label}</li>
              ))}
            </ul>
            <div className={editStyles.modalActions}>
              <button
                type="button"
                className={editStyles.modalSecondaryButton}
                onClick={() => {
                  setShowExcludedSectionsModal(false);
                  setExcludedSectionsPendingExport([]);
                }}
              >
                Go Back
              </button>
              <button
                type="button"
                className={editStyles.modalPrimaryButton}
                onClick={() => {
                  setShowExcludedSectionsModal(false);
                  void continueExportToPdf();
                }}
              >
                Continue To PDF
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
