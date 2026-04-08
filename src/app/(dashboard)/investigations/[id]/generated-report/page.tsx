"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PDFViewer, pdf, type DocumentProps } from "@react-pdf/renderer";
import DashboardShell from "@/components/dashboard/DashboardShell";
import shellStyles from "@/components/dashboard/DashboardShell.module.css";
import pageStyles from "./GeneratedReportPage.module.css";
import InvestigationReportPdfDocument from "@/components/investigation-report/InvestigationReportPdfDocument";
import { ReportProgressLoadingView } from "@/components/loading/ReportProgressLoadingView";
import { accessBlocksInvestigationEntry, accessCanUseReportGeneration, accessRequiresSelection, fetchAccessState } from "@/lib/access";
import { normalizeInvestigationReportPayload } from "@/lib/investigation-report/helpers";
import type { InvestigationSavedReportPayload, ReadinessCheck } from "@/lib/investigation-report/types";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { parsePersonLabels } from "@/app/(dashboard)/system-maps/[mapId]/canvasShared";

function EditGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={pageStyles.controlButtonSvg}>
      <path
        d="M4 20h4l10-10a2.121 2.121 0 0 0-3-3L5 17v3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m13.5 6.5 4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SaveGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={pageStyles.controlButtonSvg}>
      <path
        d="M5 3h11l3 3v15H5V3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 3v6h8V3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21v-6h6v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PrintGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={pageStyles.controlButtonSvg}>
      <path d="M7 8V3h10v5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M6 17H5a2 2 0 0 1-2-2v-4a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v4a2 2 0 0 1-2 2h-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 14h10v7H7v-7Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type MapRow = {
  id: string;
  title: string;
  owner_id: string;
  created_at: string;
  incident_long_description: string | null;
  incident_occurred_at: string | null;
  incident_location: string | null;
  responsible_person_name: string | null;
  investigation_lead_name: string | null;
  items_of_interest: string | null;
};

type CanvasElementRow = {
  id: string;
  element_type: string;
  heading: string | null;
  element_config: Record<string, unknown> | null;
  created_at: string;
  pos_x: number | null;
  pos_y: number | null;
  width: number | null;
  height: number | null;
};

type PdfJsPageProxy = {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => {
    promise: Promise<void>;
  };
};

type PdfJsDocumentProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsPageProxy>;
};

type PdfJsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: string) => { promise: Promise<PdfJsDocumentProxy> };
};

type SequenceTimelineItem = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  location: string;
  sortTime: number;
  pos_x: number | null;
  pos_y: number | null;
  created_at: string;
};

type ErrorPayload = {
  error?: string;
  readiness?: ReadinessCheck;
  diagnostic?: {
    status?: string | null;
    refusal?: string | null;
    outputTextPreview?: string | null;
    incompleteReason?: string | null;
  };
};

type ReportPayload = InvestigationSavedReportPayload;

type FlowSection = {
  key: string;
  label: string;
  estimatedUnits: number;
  content: React.ReactNode;
};

type PdfVisibleSectionId =
  | "executive_summary"
  | "long_description"
  | "response_and_recovery"
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

type EvidencePreviewLayout = {
  src: string;
  orientation: "portrait" | "landscape";
};

async function blobToBase64(blob: Blob) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

  return dataUrl.includes(",") ? dataUrl.split(",")[1] ?? "" : dataUrl;
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-AU", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatHeaderReportSubtitle(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const datePart = parsed.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
  const timePart = parsed.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
  return `${datePart} at ${timePart}`;
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}

function formatReportDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function buildCaseData(map: MapRow, elements: CanvasElementRow[]) {
  return {
    map: {
      id: map.id,
      title: map.title,
      created_at: map.created_at,
      incident_long_description: map.incident_long_description,
      incident_occurred_at: map.incident_occurred_at,
      incident_location: map.incident_location,
      responsible_person_name: map.responsible_person_name,
      investigation_lead_name: map.investigation_lead_name,
      items_of_interest: map.items_of_interest,
    },
    elements,
  };
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

function normalizeParagraphText(value: string | null | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed || "-";
}

function renderParagraphBlocks(value: string | null | undefined, keyPrefix: string) {
  const paragraphs = (value ?? "")
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return <p className={pageStyles.paragraph}>-</p>;
  }

  return paragraphs.map((paragraph, index) => (
    <p key={`${keyPrefix}-${index}`} className={pageStyles.paragraph}>
      {paragraph}
    </p>
  ));
}

function parseReportPersonLabels(heading: string | null | undefined) {
  const normalized = (heading ?? "").replaceAll("\\n", "\n");
  return parsePersonLabels(normalized);
}

function toTitleCaseLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function renderFactorPrimaryCell(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(.*?)\s*\((.*?)\)\s*$/);

  if (!match) return trimmed || "-";

  const mainText = match[1].trim() || "-";
  const subText = toTitleCaseLabel(match[2].trim());

  return (
    <span className={pageStyles.factorCell}>
      <span>{mainText}</span>
      {subText ? <em>{subText}</em> : null}
    </span>
  );
}

function renderFactorTypeCell(value: string) {
  return renderFactorPrimaryCell(value);
}

function normalizeHeaderKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function splitBracketedValue(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(.*?)\s*\((.*?)\)\s*$/);

  if (!match) {
    return { main: trimmed, bracket: "" };
  }

  return {
    main: match[1].trim(),
    bracket: toTitleCaseLabel(match[2].trim()),
  };
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
  if (normalized.includes("failed")) return shellStyles.factorPillAbsent;
  if (normalized.includes("ineffective")) return shellStyles.factorPillAbsent;
  return "";
}

function renderFactorPill(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";
  const className = getFactorPillClass(trimmed);
  if (!className) return trimmed;
  return <span className={`${shellStyles.statusPill} ${className} ${pageStyles.factorPillCompact}`}>{toTitleCaseLabel(trimmed)}</span>;
}

function renderOutlinePill(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";
  return <span className={`${shellStyles.statusPill} ${pageStyles.outlinePill} ${pageStyles.factorPillCompact}`}>{toTitleCaseLabel(trimmed)}</span>;
}

function renderControlBarrierStatePill(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";

  let className = shellStyles.factorPillNeutral;

  switch (trimmed.toLowerCase()) {
    case "effective":
      className = shellStyles.factorPillPresent;
      break;
    case "failed":
    case "missing":
      className = shellStyles.factorPillAbsent;
      break;
    default:
      className = shellStyles.factorPillNeutral;
      break;
  }

  return <span className={`${shellStyles.statusPill} ${className} ${pageStyles.factorPillCompact}`}>{toTitleCaseLabel(trimmed)}</span>;
}

function renderConfidencePill(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";

  const normalized = trimmed.toLowerCase();
  let className = shellStyles.factorPillNeutral;

  if (normalized.includes("high")) className = shellStyles.factorPillPresent;
  else if (normalized.includes("medium")) className = shellStyles.factorPillContributing;
  else if (normalized.includes("low")) className = shellStyles.factorPillAbsent;

  return <span className={`${shellStyles.statusPill} ${className} ${pageStyles.factorPillCompact}`}>{toTitleCaseLabel(trimmed)}</span>;
}

function renderActionTypePill(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";

  const normalized = trimmed.toLowerCase();
  let className = shellStyles.factorPillPredisposing;

  if (normalized.includes("immediate")) className = shellStyles.factorPillAbsent;
  else if (normalized.includes("corrective")) className = shellStyles.factorPillContributing;
  else if (normalized.includes("prevent")) className = shellStyles.factorPillPresent;
  else if (normalized.includes("improve")) className = shellStyles.factorPillNeutral;

  return <span className={`${shellStyles.statusPill} ${className} ${pageStyles.factorPillCompact}`}>{toTitleCaseLabel(trimmed)}</span>;
}

function normalizeFactorTable(columns: string[], rows: string[][]) {
  const normalizedColumns = columns.map(normalizeHeaderKey);

  const findIndex = (...patterns: string[]) =>
    normalizedColumns.findIndex((column) => patterns.some((pattern) => column.includes(pattern)));

  const foundItemIndex = findIndex("factor", "item", "name");
  const typeIndex = findIndex("type");
  const presenceIndex = findIndex("presence", "status", "present");
  const classificationIndex = findIndex("classification", "role in incident", "role", "contribution");
  const detailsIndex = findIndex("detail", "support", "description", "definition", "why");
  const itemIndex = foundItemIndex >= 0 ? foundItemIndex : 0;

  const pick = (row: string[], index: number) => (index >= 0 ? row[index] || "" : "");

  const splitCombinedStatus = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return { presence: "", classification: "" };

    const slashParts = trimmed.split("/").map((part) => part.trim()).filter(Boolean);
    if (slashParts.length >= 2) {
      return {
        presence: slashParts[0],
        classification: slashParts.slice(1).join(" / "),
      };
    }

    const normalized = trimmed.toLowerCase();
    const presenceMatch = ["present", "absent", "neutral"].find((token) => normalized.includes(token)) ?? "";
    const classificationMatch =
      ["essential", "contributing", "predisposing", "neutral"].find((token) => normalized.includes(token)) ?? "";

    return {
      presence: presenceMatch ? toTitleCaseLabel(presenceMatch) : "",
      classification: classificationMatch ? toTitleCaseLabel(classificationMatch) : "",
    };
  };

  return {
    columns: ["Item", "Type", "Presence", "Classification", "Details"],
    rows: rows.map((row) => {
      const rawItem = pick(row, itemIndex);
      const rawType = pick(row, typeIndex);
      const rawPresence = pick(row, presenceIndex);
      const rawClassification = pick(row, classificationIndex);
      const itemParts = splitBracketedValue(rawItem);
      const typeParts = splitBracketedValue(rawType);
      const classificationParts = splitBracketedValue(rawClassification);
      const combinedSource =
        rawPresence && rawClassification && rawPresence === rawClassification
          ? rawPresence
          : rawPresence || rawClassification;
      const split = splitCombinedStatus(combinedSource);
      const resolvedType =
        typeParts.main ||
        typeParts.bracket ||
        itemParts.bracket ||
        classificationParts.bracket;
      const resolvedClassification =
        split.classification ||
        classificationParts.main ||
        rawClassification;

      return [
        itemParts.main || rawItem,
        resolvedType,
        split.presence || rawPresence,
        resolvedClassification,
        pick(row, detailsIndex),
      ];
    }),
  };
}

function normalizeMainFactorsTable(columns: string[], rows: string[][]) {
  const normalizedColumns = columns.map(normalizeHeaderKey);

  const findIndex = (...patterns: string[]) =>
    normalizedColumns.findIndex((column) => patterns.some((pattern) => column.includes(pattern)));

  const foundItemIndex = findIndex("factor", "item", "name");
  const typeIndex = findIndex("type");
  const presenceIndex = findIndex("presence", "status", "present");
  const classificationIndex = findIndex("classification", "role in incident", "role", "contribution");
  const detailsIndex = findIndex("detail", "support", "description", "definition", "why");
  const categoryIndex = findIndex("category", "influence");
  const itemIndex = foundItemIndex >= 0 ? foundItemIndex : 0;

  const pick = (row: string[], index: number) => (index >= 0 ? row[index] || "" : "");

  const splitCombinedStatus = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return { presence: "", classification: "" };

    const slashParts = trimmed.split("/").map((part) => part.trim()).filter(Boolean);
    if (slashParts.length >= 2) {
      return {
        presence: slashParts[0],
        classification: slashParts.slice(1).join(" / "),
      };
    }

    const normalized = trimmed.toLowerCase();
    const presenceMatch = ["present", "absent", "neutral"].find((token) => normalized.includes(token)) ?? "";
    const classificationMatch =
      ["essential", "contributing", "predisposing", "neutral"].find((token) => normalized.includes(token)) ?? "";

    return {
      presence: presenceMatch ? toTitleCaseLabel(presenceMatch) : "",
      classification: classificationMatch ? toTitleCaseLabel(classificationMatch) : "",
    };
  };

  return {
    columns: ["Details", "Type", "Presence", "Classification", "Category"],
    rows: rows.map((row) => {
      const rawItem = pick(row, itemIndex);
      const rawType = pick(row, typeIndex);
      const rawPresence = pick(row, presenceIndex);
      const rawClassification = pick(row, classificationIndex);
      const rawCategory = pick(row, categoryIndex);
      const itemParts = splitBracketedValue(rawItem);
      const typeParts = splitBracketedValue(rawType);
      const classificationParts = splitBracketedValue(rawClassification);
      const combinedSource =
        rawPresence && rawClassification && rawPresence === rawClassification
          ? rawPresence
          : rawPresence || rawClassification;
      const split = splitCombinedStatus(combinedSource);

      return [
        pick(row, detailsIndex),
        rawType || itemParts.bracket || classificationParts.bracket,
        split.presence || rawPresence,
        split.classification || classificationParts.main || rawClassification,
        rawCategory,
      ];
    }),
  };
}

function normalizeControlsTable(columns: string[], rows: string[][]) {
  const normalizedColumns = columns.map(normalizeHeaderKey);

  const findIndex = (...patterns: string[]) =>
    normalizedColumns.findIndex((column) => patterns.some((pattern) => column.includes(pattern)));

  const itemIndex = findIndex("control", "barrier", "item");
  const typeIndex = findIndex("type");
  const stateIndex = findIndex("state", "status", "present", "failed", "absent");
  const roleIndex = findIndex("role", "classification", "essential", "contributing", "predisposing");
  const detailsIndex = findIndex("detail", "support", "description", "definition", "why");

  const pick = (row: string[], index: number) => (index >= 0 ? row[index] || "" : "");

  return {
    columns: ["Item", "Type", "State", "Role", "Details"],
    rows: rows.map((row) => [
      pick(row, itemIndex),
      pick(row, typeIndex),
      pick(row, stateIndex),
      pick(row, roleIndex),
      pick(row, detailsIndex),
    ]),
  };
}

function normalizeRecommendationsTable(columns: string[], rows: string[][]) {
  const normalizedColumns = columns.map(normalizeHeaderKey);

  const findIndex = (...patterns: string[]) =>
    normalizedColumns.findIndex((column) => patterns.some((pattern) => column.includes(pattern)));

  const recommendationIndex = findIndex("recommendation", "action", "item");
  const descriptionIndex = findIndex("description", "detail", "summary", "why");
  const actionTypeIndex = findIndex("action type", "type");
  const ownerIndex = findIndex("owner", "responsible");
  const dueDateIndex = findIndex("due", "date");

  const pick = (row: string[], index: number) => (index >= 0 ? row[index] || "" : "");

  return {
    columns: ["Recommendation", "Description", "Action Type", "Owner", "Due Date"],
    rows: rows.map((row) => [
      pick(row, recommendationIndex),
      pick(row, descriptionIndex),
      pick(row, actionTypeIndex),
      pick(row, ownerIndex),
      pick(row, dueDateIndex),
    ]),
  };
}

function DocumentTable({
  columns,
  rows,
  emptyLabel,
  renderCell,
  columnClassName,
  columnWidthClassName,
}: {
  columns: string[];
  rows: string[][];
  emptyLabel: string;
  renderCell?: (value: string, rowIndex: number, cellIndex: number) => React.ReactNode;
  columnClassName?: (column: string, cellIndex: number) => string | undefined;
  columnWidthClassName?: (column: string, cellIndex: number) => string | undefined;
}) {
  return (
    <div className={pageStyles.tableWrap}>
      <table className={pageStyles.table}>
        <colgroup>
          {columns.map((column, cellIndex) => (
            <col key={`${column}-${cellIndex}`} className={columnWidthClassName?.(column, cellIndex)} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((column, cellIndex) => (
              <th key={column} className={columnClassName?.(column, cellIndex)}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={Math.max(columns.length, 1)}>{emptyLabel}</td></tr>
          ) : (
            rows.map((row, index) => (
              <tr key={`${columns.join("-")}-${index}`}>
                {columns.map((column, cellIndex) => (
                  <td key={`${column}-${cellIndex}`} className={columnClassName?.(column, cellIndex)}>
                    {renderCell ? renderCell(row[cellIndex] || "-", index, cellIndex) : row[cellIndex] || "-"}
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

function paginateFlowSections(sections: FlowSection[], pageCapacity: number) {
  const pages: FlowSection[][] = [];
  let currentPage: FlowSection[] = [];
  let currentUnits = 0;

  for (const section of sections) {
    const sectionUnits = Math.max(section.estimatedUnits, 1);

    if (currentPage.length > 0 && currentUnits + sectionUnits > pageCapacity) {
      pages.push(currentPage);
      currentPage = [section];
      currentUnits = sectionUnits;
      continue;
    }

    currentPage.push(section);
    currentUnits += sectionUnits;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

function ReportPage({
  pageNumber,
  totalPages,
  title,
  children,
  compact = false,
}: {
  pageNumber: number;
  totalPages: number;
  title?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <article className={`${pageStyles.reportPage} ${compact ? pageStyles.reportPageCompact : ""}`}>
      {title ? <h2 className={pageStyles.pageHeading}>{title}</h2> : null}
      <div className={pageStyles.pageBody}>{children}</div>
      <footer className={pageStyles.pageFooter}>Page {pageNumber} Of {totalPages}</footer>
    </article>
  );
}

export default function GeneratedInvestigationReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const reportId = searchParams.get("reportId")?.trim() || "";
  const viewMode = reportId.length > 0;

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<MapRow | null>(null);
  const [elements, setElements] = useState<CanvasElementRow[]>([]);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [readiness, setReadiness] = useState<ReadinessCheck | null>(null);
  const [pendingCaseData, setPendingCaseData] = useState<unknown>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorDiagnostic, setErrorDiagnostic] = useState<ErrorPayload["diagnostic"] | null>(null);
  const [evidenceSignedUrls, setEvidenceSignedUrls] = useState<Record<string, string>>({});
  const [evidencePdfPageImages, setEvidencePdfPageImages] = useState<Record<string, string[]>>({});
  const [evidencePreviewLayouts, setEvidencePreviewLayouts] = useState<Record<string, EvidencePreviewLayout[]>>({});
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfPreparing, setPdfPreparing] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [stablePdfDocument, setStablePdfDocument] = useState<ReactElement<DocumentProps> | null>(null);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [displayLoadingPhase, setDisplayLoadingPhase] = useState(0);
  const [brandingLogoUrl, setBrandingLogoUrl] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailPanelOpen, setEmailPanelOpen] = useState(false);
  const [emailSentFlash, setEmailSentFlash] = useState(false);
  const emailPanelRef = useRef<HTMLDivElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const emailSentTimeoutRef = useRef<number | null>(null);

  const personElements = useMemo(() => elements.filter((element) => element.element_type === "person"), [elements]);
  const evidenceElements = useMemo(() => elements.filter((element) => element.element_type === "incident_evidence"), [elements]);
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
  const responseRecoveryTable = useMemo(
    () => ({
      columns: report?.report.sections.response_and_recovery.columns ?? [],
      rows: report?.report.sections.response_and_recovery.rows ?? [],
    }),
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
  const sequenceItems = useMemo<SequenceTimelineItem[]>(
    () =>
      elements
        .filter((element) => element.element_type === "incident_sequence_step")
        .map((element) => {
          const config = element.element_config ?? {};
          const timestamp = String(config.timestamp ?? "").trim();
          const description = String(config.description ?? "").trim();
          const location = String(config.location ?? "").trim();
          const parsedTime = timestamp ? new Date(timestamp).getTime() : Number.NaN;

          return {
            id: element.id,
            title: element.heading?.trim() || "",
            description,
            timestamp,
            location,
            sortTime: Number.isFinite(parsedTime) ? parsedTime : Number.MAX_SAFE_INTEGER,
            pos_x: element.pos_x,
            pos_y: element.pos_y,
            created_at: element.created_at,
          };
        })
        .sort((a, b) => {
          if (a.sortTime !== b.sortTime) return a.sortTime - b.sortTime;
          if ((a.pos_x ?? 0) !== (b.pos_x ?? 0)) return (a.pos_x ?? 0) - (b.pos_x ?? 0);
          if ((a.pos_y ?? 0) !== (b.pos_y ?? 0)) return (a.pos_y ?? 0) - (b.pos_y ?? 0);
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }),
    [elements],
  );
  const isPdfSectionVisible = (sectionId: PdfVisibleSectionId) =>
    report?.report.section_visibility?.[sectionId] !== false;
  const showLoadingExperience =
    loading ||
    generating ||
    (!!report && !pdfError && (!stablePdfDocument || pdfPreparing || !pdfBlobUrl)) ||
    displayLoadingPhase < loadingPhase;

  useEffect(() => {
    const targetPhase = loading
      ? 0
      : generating
        ? 1
        : !report
          ? 2
          : !stablePdfDocument
            ? 3
            : pdfPreparing || !pdfBlobUrl
              ? 4
              : 6;

    setLoadingPhase((current) => Math.max(current, targetPhase));
  }, [generating, loading, pdfBlobUrl, pdfPreparing, report, stablePdfDocument]);

  useEffect(() => {
    if (displayLoadingPhase >= loadingPhase) return;
    const timeoutId = window.setTimeout(() => {
      setDisplayLoadingPhase((current) => Math.min(current + 1, loadingPhase));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [displayLoadingPhase, loadingPhase]);

  useEffect(() => {
    let cancelled = false;

    const loadBrandingLogoUrl = async () => {
      const storagePath = report?.report.branding?.logo_storage_path?.trim() ?? "";
      if (!storagePath) {
        if (!cancelled) setBrandingLogoUrl(null);
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

      try {
        const response = await fetch(data.signedUrl);
        if (!response.ok) {
          setBrandingLogoUrl(null);
          return;
        }

        const logoBlob = await response.blob();
        if (cancelled) return;

        const logoDataUrl = await blobToDataUrl(logoBlob);
        if (cancelled) return;

        setBrandingLogoUrl(logoDataUrl || null);
      } catch {
        setBrandingLogoUrl(null);
      }
    };

    void loadBrandingLogoUrl();

    return () => {
      cancelled = true;
    };
  }, [report?.report.branding?.logo_storage_path, supabase]);

  useEffect(() => {
    let cancelled = false;

    const loadEvidenceSignedUrls = async () => {
      const pathPairs = evidenceElements
        .map((element) => ({
          id: element.id,
          path: getEvidenceMediaPath(element.element_config),
        }))
        .filter((entry) => entry.path);

      if (pathPairs.length === 0) {
        if (!cancelled) setEvidenceSignedUrls({});
        return;
      }

      const { data, error: signedUrlError } = await supabase.storage
        .from("systemmap")
        .createSignedUrls(pathPairs.map((entry) => entry.path), 3600);

      if (cancelled || signedUrlError) {
        if (!cancelled) setEvidenceSignedUrls({});
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

      if (!cancelled) setEvidenceSignedUrls(nextSignedUrls);
    };

    void loadEvidenceSignedUrls();

    return () => {
      cancelled = true;
    };
  }, [evidenceElements, supabase]);

  useEffect(() => {
    let cancelled = false;

    const loadPdfPageImages = async () => {
      const pdfEvidence = evidenceElements
        .map((element) => {
          const signedUrl = evidenceSignedUrls[element.id];
          const fallbackUrl = getEvidenceMediaUrl(element.element_config);
          const url = signedUrl || fallbackUrl;
          return {
            id: element.id,
            url,
            isPdf: isPdfEvidence(element.element_config),
          };
        })
        .filter((entry) => entry.isPdf && entry.url);

      if (pdfEvidence.length === 0) {
        if (!cancelled) setEvidencePdfPageImages({});
        return;
      }

      try {
        const importPdfJs = new Function("url", "return import(/* webpackIgnore: true */ url);") as (
          url: string,
        ) => Promise<PdfJsModule>;
        const pdfjs = await importPdfJs("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs");

        pdfjs.GlobalWorkerOptions.workerSrc =
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";

        const nextImages: Record<string, string[]> = {};
        const nextLayouts: Record<string, EvidencePreviewLayout[]> = {};

        for (const entry of pdfEvidence) {
          const pdfDocument = await pdfjs.getDocument(entry.url).promise;
          const pageImages: string[] = [];

          for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
            const page = await pdfDocument.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1.35 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            if (!context) continue;

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
              canvasContext: context,
              viewport,
            }).promise;

            const src = canvas.toDataURL("image/png");
            pageImages.push(src);
            if (!nextLayouts[entry.id]) nextLayouts[entry.id] = [];
            nextLayouts[entry.id].push({
              src,
              orientation: viewport.width > viewport.height ? "landscape" : "portrait",
            });
          }

          nextImages[entry.id] = pageImages;
        }

        if (!cancelled) {
          setEvidencePdfPageImages(nextImages);
          setEvidencePreviewLayouts((current) => ({ ...current, ...nextLayouts }));
        }
      } catch {
        if (!cancelled) setEvidencePdfPageImages({});
      }
    };

    void loadPdfPageImages();

    return () => {
      cancelled = true;
    };
  }, [evidenceElements, evidenceSignedUrls]);

  useEffect(() => {
    let cancelled = false;

    const loadImageLayouts = async () => {
      const imageEvidence = evidenceElements
        .map((element) => {
          const signedUrl = evidenceSignedUrls[element.id];
          const fallbackUrl = getEvidenceMediaUrl(element.element_config);
          const url = signedUrl || fallbackUrl;
          return {
            id: element.id,
            url,
            isPdf: isPdfEvidence(element.element_config),
          };
        })
        .filter((entry) => !entry.isPdf && entry.url);

      if (imageEvidence.length === 0) {
        if (!cancelled) {
          setEvidencePreviewLayouts((current) => {
            const next = { ...current };
            evidenceElements.forEach((element) => {
              if (!isPdfEvidence(element.element_config)) delete next[element.id];
            });
            return next;
          });
        }
        return;
      }

      const loadImageSize = (src: string) =>
        new Promise<EvidencePreviewLayout>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            resolve({
              src,
              orientation: img.naturalWidth > img.naturalHeight ? "landscape" : "portrait",
            });
          };
          img.onerror = () => resolve({ src, orientation: "portrait" });
          img.src = src;
        });

      const loadedEntries = await Promise.all(
        imageEvidence.map(async (entry) => ({
          id: entry.id,
          layouts: [await loadImageSize(entry.url)],
        })),
      );

      if (cancelled) return;

      setEvidencePreviewLayouts((current) => {
        const next = { ...current };
        loadedEntries.forEach((entry) => {
          next[entry.id] = entry.layouts;
        });
        return next;
      });
    };

    void loadImageLayouts();

    return () => {
      cancelled = true;
    };
  }, [evidenceElements, evidenceSignedUrls]);
  const flowSections = useMemo<FlowSection[]>(() => {
    if (!report) return [];

    const sections: Array<FlowSection | null> = [
      isPdfSectionVisible("executive_summary") ? {
        key: "executive-summary",
        label: "Executive Summary",
        estimatedUnits: 2,
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>Executive Summary</h2>
            <p className={pageStyles.paragraph}>{normalizeParagraphText(report.report.sections.executive_summary)}</p>
          </section>
        ),
      } : null,
      isPdfSectionVisible("long_description") ? {
        key: "long-description",
        label: "Long Description",
        estimatedUnits: 4,
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>Long Description</h2>
            {renderParagraphBlocks(report.report.sections.long_description, "long-description")}
          </section>
        ),
      } : null,
      isPdfSectionVisible("response_and_recovery") ? {
        key: "response-and-recovery",
        label: "Response / Recovery",
        estimatedUnits: 4,
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>Response / Recovery</h2>
            <p className={pageStyles.paragraph}>{normalizeParagraphText(report.report.sections.response_and_recovery.summary)}</p>
            <DocumentTable
              columns={responseRecoveryTable.columns}
              rows={responseRecoveryTable.rows}
              emptyLabel="No response or recovery actions available."
              renderCell={(value) => value || "-"}
            />
          </section>
        ),
      } : null,
      isPdfSectionVisible("people_involved") ? {
        key: "people-involved",
        label: "People Involved",
        estimatedUnits: 3,
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>{report.report.sections.people_involved.heading}</h2>
            {personElements.length > 0 ? (
              <div className={pageStyles.peopleGrid}>
                {personElements.map((person) => {
                  const labels = parseReportPersonLabels(person.heading);
                  const personName =
                    getConfigValue(person.element_config, "occupant_name", "name", "person_name", "full_name") || "Person name not provided";
                  return (
                    <div key={person.id} className={pageStyles.personCard}>
                      <div className={pageStyles.personAvatar}>
                        <Image src="/icons/account.svg" alt="" width={28} height={28} className={pageStyles.personAvatarIcon} />
                      </div>
                      <div className={pageStyles.personBody}>
                        <strong>{labels.role}</strong>
                        <span>{personName}</span>
                        {labels.department && labels.department !== "Department" ? <p>{labels.department}</p> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={pageStyles.paragraph}>{report.report.sections.people_involved.note}</p>
            )}
          </section>
        ),
      } : null,
      isPdfSectionVisible("incident_timeline") ? {
        key: "incident-timeline",
        label: "Incident Timeline",
        estimatedUnits: sequenceItems.length > 5 ? 5 : 4,
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>{report.report.sections.incident_timeline.heading}</h2>
            {sequenceItems.length > 0 ? (
              <div className={pageStyles.timelineFlow}>
                {sequenceItems.map((item) => (
                  <div key={item.id} className={pageStyles.timelineRow}>
                    <div className={pageStyles.timelineDateBlock}>
                      <span className={pageStyles.timelineDate}>{formatReportDate(item.timestamp)}</span>
                      <span className={pageStyles.timelineTime}>{formatReportTime(item.timestamp) || "-"}</span>
                    </div>
                    <div className={pageStyles.timelineMarkerWrap}>
                      <span className={pageStyles.timelineMarker} />
                      <span className={pageStyles.timelineRail} />
                    </div>
                    <div className={pageStyles.timelineCard}>
                      {item.location ? <span>{item.location}</span> : null}
                      {item.description ? <p>{item.description}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : report.report.sections.incident_timeline.entries.length > 0 ? (
              <ol className={pageStyles.timelineList}>
                {report.report.sections.incident_timeline.entries.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            ) : (
              <p className={pageStyles.paragraph}>No timeline entries available.</p>
            )}
          </section>
        ),
      } : null,
      isPdfSectionVisible("task_and_conditions") ? {
        key: "task-and-conditions",
        label: "Task And Conditions",
        estimatedUnits: 2,
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>Task And Conditions</h2>
            <p className={pageStyles.paragraph}>{normalizeParagraphText(report.report.sections.task_and_conditions)}</p>
          </section>
        ),
      } : null,
      isPdfSectionVisible("factors_and_system_factors") ? {
        key: "factors-and-system-factors",
        label: "Factors And System Factors",
        estimatedUnits: 5,
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>{report.report.sections.factors_and_system_factors.heading}</h2>
            <DocumentTable
              columns={normalizedFactorsTable.columns}
              rows={normalizedFactorsTable.rows}
              emptyLabel="No factors or system factors available."
              renderCell={(value, _rowIndex, cellIndex) => {
                if (cellIndex === 0) return value || "-";
                if (cellIndex === 1) return renderFactorTypeCell(value);
                if (cellIndex === 2 || cellIndex === 3) return renderFactorPill(value);
                if (cellIndex === 4) return value.trim() ? toTitleCaseLabel(value) : "-";
                return value || "-";
              }}
              columnClassName={(_column, cellIndex) =>
                [
                  pageStyles.factorCellDetails,
                  pageStyles.factorCellType,
                  pageStyles.factorCellPresence,
                  pageStyles.factorCellClassification,
                  pageStyles.factorCellItem,
                ][cellIndex]
              }
              columnWidthClassName={(_column, cellIndex) =>
                [
                  pageStyles.factorColumnDetails,
                  pageStyles.factorColumnType,
                  pageStyles.factorColumnPresence,
                  pageStyles.factorColumnClassification,
                  pageStyles.factorColumnItem,
                ][cellIndex]
              }
            />
          </section>
        ),
      } : null,
      isPdfSectionVisible("predisposing_factors") ? {
        key: "predisposing-factors",
        label: "Predisposing Factors",
        estimatedUnits: 5,
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>{report.report.sections.predisposing_factors.heading}</h2>
            <DocumentTable
              columns={normalizedPredisposingFactorsTable.columns}
              rows={normalizedPredisposingFactorsTable.rows}
              emptyLabel="No predisposing factors available."
              renderCell={(value, _rowIndex, cellIndex) => {
                if (cellIndex === 0) return value || "-";
                if (cellIndex === 1) return renderFactorTypeCell(value);
                if (cellIndex === 2 || cellIndex === 3) return renderFactorPill(value);
                if (cellIndex === 4) return value.trim() ? toTitleCaseLabel(value) : "-";
                return value || "-";
              }}
              columnClassName={(_column, cellIndex) =>
                [
                  pageStyles.factorCellDetails,
                  pageStyles.factorCellType,
                  pageStyles.factorCellPresence,
                  pageStyles.factorCellClassification,
                  pageStyles.factorCellItem,
                ][cellIndex]
              }
              columnWidthClassName={(_column, cellIndex) =>
                [
                  pageStyles.factorColumnDetails,
                  pageStyles.factorColumnType,
                  pageStyles.factorColumnPresence,
                  pageStyles.factorColumnClassification,
                  pageStyles.factorColumnItem,
                ][cellIndex]
              }
            />
          </section>
        ),
      } : null,
      isPdfSectionVisible("controls_and_barriers") ? {
        key: "controls-and-barriers",
        label: "Controls And Barriers",
        estimatedUnits: 5,
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>{report.report.sections.controls_and_barriers.heading}</h2>
            <DocumentTable
              columns={normalizedControlsTable.columns}
              rows={normalizedControlsTable.rows}
              emptyLabel="No controls or barriers available."
              renderCell={(value, _rowIndex, cellIndex) => {
                if (cellIndex === 0) return renderFactorPrimaryCell(value);
                if (cellIndex === 1 || cellIndex === 3) return renderOutlinePill(value);
                if (cellIndex === 2) return renderControlBarrierStatePill(value);
                return value || "-";
              }}
              columnClassName={(_column, cellIndex) =>
                [
                  pageStyles.factorCellItem,
                  pageStyles.factorCellType,
                  pageStyles.factorCellPresence,
                  pageStyles.factorCellClassification,
                  pageStyles.factorCellDetails,
                ][cellIndex]
              }
              columnWidthClassName={(_column, cellIndex) =>
                [
                  pageStyles.factorColumnItem,
                  pageStyles.factorColumnType,
                  pageStyles.factorColumnPresence,
                  pageStyles.factorColumnClassification,
                  pageStyles.factorColumnDetails,
                ][cellIndex]
              }
            />
          </section>
        ),
      } : null,
      isPdfSectionVisible("incident_outcomes") ? {
        key: "incident-outcomes",
        label: "Incident Outcomes",
        estimatedUnits: 2,
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>Incident Outcomes</h2>
            <p className={pageStyles.paragraph}>{normalizeParagraphText(report.report.sections.incident_outcomes)}</p>
          </section>
        ),
      } : null,
      isPdfSectionVisible("incident_findings") ? {
        key: "incident-findings",
        label: "Incident Findings",
        estimatedUnits: 4,
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>Incident Findings</h2>
            <p className={pageStyles.paragraph}>{normalizeParagraphText(report.report.sections.incident_findings.summary)}</p>
            <DocumentTable
              columns={report.report.sections.incident_findings.columns}
              rows={report.report.sections.incident_findings.rows}
              emptyLabel="No finding details available."
              renderCell={(value, _rowIndex, cellIndex) => (cellIndex === 2 ? renderConfidencePill(value) : value || "-")}
              columnClassName={(_column, cellIndex) =>
                [
                  pageStyles.findingColumnFinding,
                  pageStyles.findingColumnDescription,
                  pageStyles.findingColumnConfidence,
                ][cellIndex]
              }
              columnWidthClassName={(_column, cellIndex) =>
                [
                  pageStyles.findingColumnFinding,
                  pageStyles.findingColumnDescription,
                  pageStyles.findingColumnConfidence,
                ][cellIndex]
              }
            />
          </section>
        ),
      } : null,
      isPdfSectionVisible("recommendations") ? {
        key: "recommendations",
        label: "Recommendations",
        estimatedUnits: 5,
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>Recommendations</h2>
            <p className={pageStyles.paragraph}>{normalizeParagraphText(report.report.sections.recommendations.summary)}</p>
            <DocumentTable
              columns={normalizedRecommendationsTable.columns}
              rows={normalizedRecommendationsTable.rows}
              emptyLabel="No recommendations available."
              renderCell={(value, _rowIndex, cellIndex) => (cellIndex === 2 ? renderActionTypePill(value) : value || "-")}
              columnWidthClassName={(_column, cellIndex) =>
                [
                  pageStyles.recommendationColumnRecommendation,
                  pageStyles.recommendationColumnDescription,
                  pageStyles.recommendationColumnActionType,
                  pageStyles.recommendationColumnOwner,
                  pageStyles.recommendationColumnDueDate,
                ][cellIndex]
              }
            />
            {isPdfSectionVisible("signatures") ? (
              <div className={pageStyles.signatureGrid}>
                {report.report.sections.recommendations.approval_fields.map((field) => (
                  <div key={field} className={pageStyles.signatureField}>
                    <span>{field}</span>
                    <div />
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ),
      } : null,
      isPdfSectionVisible("evidence") ? {
        key: "evidence",
        label: "Evidence",
        estimatedUnits: Math.max(4, Math.min(report.report.sections.evidence.items.length + 2, 6)),
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>{report.report.sections.evidence.heading}</h2>
            <div className={pageStyles.evidenceList}>
              {report.report.sections.evidence.items.length > 0 ? report.report.sections.evidence.items.map((item, index) => {
                const matchingElement = evidenceElements[index];
                const preview = matchingElement
                  ? evidenceSignedUrls[matchingElement.id] || getEvidenceMediaUrl(matchingElement.element_config)
                  : "";
                const fallbackDescription = matchingElement ? getConfigValue(matchingElement.element_config, "description", "summary", "caption", "notes") : "";
                const isPdf = matchingElement ? isPdfEvidence(matchingElement.element_config) : false;
                const pdfPageImages = matchingElement ? evidencePdfPageImages[matchingElement.id] ?? [] : [];
                return (
                  <section key={item.label} className={pageStyles.evidenceItem}>
                    {preview ? (
                      isPdf ? (
                        pdfPageImages.length > 0 ? (
                          <div className={pageStyles.evidencePdfPages}>
                            {pdfPageImages.map((pageImage, pageIndex) => (
                              <img
                                key={`${matchingElement?.id ?? item.label}-page-${pageIndex + 1}`}
                                src={pageImage}
                                alt={`${item.label} page ${pageIndex + 1}`}
                                className={pageStyles.evidencePdfPageImage}
                              />
                            ))}
                          </div>
                        ) : <div className={pageStyles.evidencePlaceholder}>Rendering PDF preview...</div>
                      ) : (
                        <img src={preview} alt={item.label} className={pageStyles.evidencePreview} />
                      )
                    ) : <div className={pageStyles.evidencePlaceholder}>Evidence preview unavailable</div>}
                    <p className={pageStyles.evidenceCaption}><strong>{item.label}:</strong> {item.description || fallbackDescription || "-"}</p>
                  </section>
                );
              }) : <p className={pageStyles.paragraph}>No evidence items available.</p>}
            </div>
          </section>
        ),
      } : null,
      isPdfSectionVisible("signatures") ? {
        key: "investigation-sign-off",
        label: "Investigation Sign-Off",
        estimatedUnits: 2,
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>{report.report.sections.investigation_sign_off.heading}</h2>
            <div className={pageStyles.signoffGrid}>
              {report.report.sections.investigation_sign_off.fields.map((field) => (
                <div key={field} className={pageStyles.signoffField}>
                  <span>{field}</span>
                  <div />
                </div>
              ))}
            </div>
          </section>
        ),
      } : null,
    ];

    return sections.filter((section): section is FlowSection => section !== null);
  }, [
    report,
    personElements,
    sequenceItems,
    normalizedFactorsTable,
    normalizedPredisposingFactorsTable,
    normalizedControlsTable,
    normalizedRecommendationsTable,
    evidenceElements,
    evidenceSignedUrls,
    evidencePdfPageImages,
    map?.responsible_person_name,
    map?.investigation_lead_name,
    map?.created_at,
  ]);

  const contentPages = useMemo(() => paginateFlowSections(flowSections, 10), [flowSections]);

  const contentPageNumbers = useMemo(() => {
    const pageNumbers: Array<{ label: string; page: number }> = [];
    const seen = new Set<string>();

    contentPages.forEach((pageSections, pageIndex) => {
      const pageNumber = pageIndex + 3;
      pageSections.forEach((section) => {
        if (seen.has(section.label)) return;
        seen.add(section.label);
        pageNumbers.push({ label: section.label, page: pageNumber });
      });
    });

    if (isPdfSectionVisible("preliminary_facts")) {
      pageNumbers.push({ label: "Preliminary Facts", page: contentPages.length + 3 });
    }

    return pageNumbers;
  }, [contentPages, report]);

  const totalPages = contentPages.length + (isPdfSectionVisible("preliminary_facts") ? 3 : 2);
  const contentEntries = useMemo(
    () =>
      [
        ...flowSections.map((section) => ({ label: section.label })),
        ...(isPdfSectionVisible("preliminary_facts") ? [{ label: "Preliminary Facts" }] : []),
      ].map((section, index) => ({
        label: section.label,
        index: index + 1,
      })),
    [flowSections, report],
  );
  const pdfPeople = useMemo(
    () =>
      personElements.map((person) => {
        const labels = parseReportPersonLabels(person.heading);
        return {
          id: person.id,
          role: labels.role,
          department: labels.department && labels.department !== "Department" ? labels.department : "",
        };
      }),
    [personElements],
  );
  const pdfTimelineItems = useMemo(
    () =>
      sequenceItems.map((item) => ({
        id: item.id,
        date: formatReportDate(item.timestamp),
        time: formatReportTime(item.timestamp) || "-",
        location: item.location,
        description: item.description,
      })),
    [sequenceItems],
  );
  const pdfEvidenceEntries = useMemo(
    () =>
      report?.report.sections.evidence.items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.include_in_report !== false)
        .map(({ item, index }, visibleIndex) => {
          const matchingElement = evidenceElements[index];
          const fallbackDescription = matchingElement
            ? cleanEvidenceDescription(getConfigValue(matchingElement.element_config, "description", "summary", "caption", "notes"))
            : "";

          return {
            attachmentNumber: visibleIndex + 1,
            description: cleanEvidenceDescription(item.description) || fallbackDescription || "-",
            fileType: matchingElement ? getEvidenceFileType(matchingElement.element_config) : "FILE",
            previewSources: matchingElement ? evidencePreviewLayouts[matchingElement.id] ?? [] : [],
          };
        }) ?? [],
    [report, evidenceElements, evidencePreviewLayouts],
  );
  const defaultLogoUrl = useMemo(
    () => (typeof window !== "undefined" ? `${window.location.origin}/images/logo-black.png` : undefined),
    [],
  );
  const logoUrl = brandingLogoUrl || defaultLogoUrl;
  const pdfDocument = useMemo<ReactElement<DocumentProps> | null>(() => {
    if (!report) return null;

    return (
      <InvestigationReportPdfDocument
        report={report}
        map={map}
        logoUrl={logoUrl}
        contentEntries={contentEntries}
        people={pdfPeople}
        timelineItems={pdfTimelineItems}
        factorsTable={normalizedFactorsTable}
        predisposingFactorsTable={normalizedPredisposingFactorsTable}
        controlsTable={normalizedControlsTable}
        responseRecoveryTable={responseRecoveryTable}
        recommendationsTable={normalizedRecommendationsTable}
        evidenceEntries={pdfEvidenceEntries}
      />
    ) as ReactElement<DocumentProps>;
  }, [
    report,
    map,
    logoUrl,
    contentEntries,
    pdfPeople,
    pdfTimelineItems,
    normalizedFactorsTable,
    normalizedPredisposingFactorsTable,
    normalizedControlsTable,
    responseRecoveryTable,
    normalizedRecommendationsTable,
    pdfEvidenceEntries,
  ]);

  const callGenerateReport = async (args: { caseData: unknown; acknowledgeMissingInformation: boolean }) => {
    const { data: { session } } = await supabase.auth.getSession();
    return fetch("/api/generate-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(args),
    });
  };

  useEffect(() => {
    const loadAndGenerate = async (acknowledgeMissingInformation = false, existingCaseData?: unknown) => {
      setGenerating(true);
      setError(null);
      setErrorDiagnostic(null);
      setLoadingPhase(0);
      setDisplayLoadingPhase(0);

      try {
        if (viewMode) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            router.push(`/login?returnTo=${encodeURIComponent(`/investigations/${params.id}/generated-report?reportId=${reportId}`)}`);
            return;
          }

          const accessState = await fetchAccessState(session.access_token);
          if (accessRequiresSelection(accessState)) {
            router.push("/subscribe");
            return;
          }
          if (!accessCanUseReportGeneration(accessState)) {
            router.push("/subscribe");
            return;
          }
          if (accessBlocksInvestigationEntry(accessState)) {
            router.push("/dashboard?mapAccess=blocked");
            return;
          }

          const [
            { data: mapRow, error: mapError },
            { data: elementRows, error: elementsError },
            { data: savedReportRow, error: savedReportError },
          ] = await Promise.all([
            supabase
              .schema("ms")
              .from("system_maps")
              .select("id,title,owner_id,created_at,incident_long_description,incident_occurred_at,incident_location,responsible_person_name,investigation_lead_name,items_of_interest")
              .eq("id", params.id)
              .single(),
            supabase
              .schema("ms")
              .from("canvas_elements")
              .select("id,element_type,heading,element_config,created_at,pos_x,pos_y,width,height")
              .eq("map_id", params.id)
              .order("created_at", { ascending: true }),
            supabase
              .schema("ms")
              .from("investigation_reports")
              .select("id,status,generated_at,updated_at,version_number,ai_output_json")
              .eq("case_id", params.id)
              .eq("id", reportId)
              .single(),
          ]);

          if (mapError) {
            setError(mapError.message || "Unable to load investigation.");
            setGenerating(false);
            setLoading(false);
            return;
          }
          if (elementsError) {
            setError(elementsError.message || "Unable to load investigation elements.");
            setGenerating(false);
            setLoading(false);
            return;
          }
          if (savedReportError || !savedReportRow) {
            setError(savedReportError?.message || "Unable to load the saved report.");
            setGenerating(false);
            setLoading(false);
            return;
          }

          setMap(mapRow as MapRow);
          setElements((elementRows ?? []) as CanvasElementRow[]);
          setReport({
            ...normalizeInvestigationReportPayload((savedReportRow.ai_output_json ?? {}) as Omit<ReportPayload, "saved_report">),
            saved_report: {
              id: savedReportRow.id,
              status: savedReportRow.status,
              generated_at: savedReportRow.generated_at,
              updated_at: savedReportRow.updated_at,
              version_number: savedReportRow.version_number,
            },
          } as ReportPayload);
          setReadiness(
            savedReportRow.ai_output_json &&
              typeof savedReportRow.ai_output_json === "object" &&
              "readiness" in (savedReportRow.ai_output_json as Record<string, unknown>)
              ? (((savedReportRow.ai_output_json as Record<string, unknown>).readiness ?? null) as ReadinessCheck | null)
              : null,
          );
          setGenerating(false);
          setLoading(false);
          return;
        }

        let caseData = existingCaseData;

        if (!caseData) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            router.push(`/login?returnTo=${encodeURIComponent(`/investigations/${params.id}/generated-report`)}`);
            return;
          }

          const accessState = await fetchAccessState(session.access_token);
          if (accessRequiresSelection(accessState)) {
            router.push("/subscribe");
            return;
          }
          if (!accessCanUseReportGeneration(accessState)) {
            router.push("/subscribe");
            return;
          }
          if (accessBlocksInvestigationEntry(accessState)) {
            router.push("/dashboard?mapAccess=blocked");
            return;
          }

          const [{ data: mapRow, error: mapError }, { data: elementRows, error: elementsError }] = await Promise.all([
            supabase
              .schema("ms")
              .from("system_maps")
              .select("id,title,owner_id,created_at,incident_long_description,incident_occurred_at,incident_location,responsible_person_name,investigation_lead_name,items_of_interest")
              .eq("id", params.id)
              .single(),
            supabase
              .schema("ms")
              .from("canvas_elements")
              .select("id,element_type,heading,element_config,created_at,pos_x,pos_y,width,height")
              .eq("map_id", params.id)
              .order("created_at", { ascending: true }),
          ]);

          if (mapError) {
            setError(mapError.message || "Unable to load investigation.");
            setGenerating(false);
            setLoading(false);
            return;
          }
          if (elementsError) {
            setError(elementsError.message || "Unable to load investigation elements.");
            setGenerating(false);
            setLoading(false);
            return;
          }

          const nextMap = mapRow as MapRow;
          const nextElements = (elementRows ?? []) as CanvasElementRow[];
          setMap(nextMap);
          setElements(nextElements);
          caseData = buildCaseData(nextMap, nextElements);
          setPendingCaseData(caseData);
        }

        const response = await callGenerateReport({ caseData, acknowledgeMissingInformation });
        const payload = (await response.json().catch(() => null)) as (ReportPayload & ErrorPayload) | ErrorPayload | null;

        if (response.status === 409) {
          setReadiness(payload && "readiness" in payload ? payload.readiness ?? null : null);
          setReport(null);
          setErrorDiagnostic(payload && "diagnostic" in payload ? payload.diagnostic ?? null : null);
          setLoading(false);
          setGenerating(false);
          return;
        }

        if (!response.ok || !payload || !("report" in payload)) {
          setError(payload && "error" in payload ? payload.error ?? "Unable to generate report." : "Unable to generate report.");
          setReadiness(payload && "readiness" in payload ? payload.readiness ?? null : null);
          setErrorDiagnostic(payload && "diagnostic" in payload ? payload.diagnostic ?? null : null);
          setLoading(false);
          setGenerating(false);
          return;
        }

        router.replace(`/investigations/${params.id}/reports/${payload.saved_report.id}/edit`);
        return;
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to generate report.");
        setLoading(false);
        setGenerating(false);
      }
    };

    void loadAndGenerate();
  }, [params.id, reportId, router, supabase, viewMode]);

  const handleContinueAnyway = async () => {
    if (!pendingCaseData) return;
    setError(null);
    setErrorDiagnostic(null);
    setLoading(false);
    setGenerating(true);

    const response = await callGenerateReport({ caseData: pendingCaseData, acknowledgeMissingInformation: true });
    const payload = (await response.json().catch(() => null)) as (ReportPayload & ErrorPayload) | ErrorPayload | null;

    if (!response.ok || !payload || !("report" in payload)) {
      setError(payload && "error" in payload ? payload.error ?? "Unable to generate report." : "Unable to generate report.");
      setErrorDiagnostic(payload && "diagnostic" in payload ? payload.diagnostic ?? null : null);
      setGenerating(false);
      return;
    }

    router.replace(`/investigations/${params.id}/reports/${payload.saved_report.id}/edit`);
  };

  const handleStatusUpdate = async (nextStatus: "draft" | "reviewed" | "approved") => {
    if (!report?.saved_report.id) return;
    setStatusSaving(true);
    setStatusMessage(null);

    const { error: updateError } = await supabase
      .schema("ms")
      .from("investigation_reports")
      .update({ status: nextStatus })
      .eq("id", report.saved_report.id);

    if (updateError) {
      setStatusMessage(updateError.message || "Unable to update report status.");
      setStatusSaving(false);
      return;
    }

    setReport((current) =>
      current
        ? { ...current, saved_report: { ...current.saved_report, status: nextStatus } }
        : current,
    );
    setStatusMessage(`Report marked as ${nextStatus}.`);
    setStatusSaving(false);
  };

  useEffect(() => {
    if (!pdfDocument) {
      setStablePdfDocument(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStablePdfDocument(pdfDocument);
    }, 320);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pdfDocument]);

  useEffect(() => {
    if (!stablePdfDocument) {
      setPdfBlob(null);
      setPdfBlobUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      return;
    }

    let cancelled = false;

    const buildPdfBlob = async () => {
      setPdfPreparing(true);
      setPdfError(null);

      try {
        const nextBlob = await pdf(stablePdfDocument as Parameters<typeof pdf>[0]).toBlob();
        if (cancelled) return;

        const nextUrl = URL.createObjectURL(nextBlob);
        setPdfBlob(nextBlob);
        setPdfBlobUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return nextUrl;
        });
      } catch (buildError) {
        if (!cancelled) {
          setPdfError(buildError instanceof Error ? buildError.message : "Unable to prepare PDF preview.");
          setPdfBlob(null);
          setPdfBlobUrl((current) => {
            if (current) URL.revokeObjectURL(current);
            return null;
          });
        }
      } finally {
        if (!cancelled) setPdfPreparing(false);
      }
    };

    void buildPdfBlob();

    return () => {
      cancelled = true;
    };
  }, [stablePdfDocument]);

  const handleSavePdf = () => {
    if (!pdfBlobUrl) return;
    const link = document.createElement("a");
    link.href = pdfBlobUrl;
    link.download = `${(report?.report.cover_page.incident_name || map?.title || "investigation-report")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "investigation-report"}.pdf`;
    link.click();
  };

  const handlePrintPdf = () => {
    if (!pdfBlobUrl) return;
    const printWindow = window.open(pdfBlobUrl, "_blank", "noopener,noreferrer");
    if (!printWindow) return;
    window.setTimeout(() => {
      try {
        printWindow.print();
      } catch {
        // Let the user print manually from the opened PDF tab if the browser blocks it.
      }
    }, 600);
  };

  const handleEmailPdf = async () => {
    if (!pdfBlob || !report) return;
    if (emailSentFlash) return;
    if (!emailTo.trim()) {
      setStatusMessage("Enter a recipient email first.");
      return;
    }

    setEmailSending(true);
    setStatusMessage(null);

    try {
      const pdfBase64 = await blobToBase64(pdfBlob);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/investigation-report/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          to: emailTo.trim(),
          reportTitle: report.report.cover_page.incident_name || map?.title || "Investigation Report",
          incidentDate: report.report.cover_page.incident_date || map?.incident_occurred_at || "",
          incidentLocation: map?.incident_location || "",
          responsibleName: map?.responsible_person_name || "",
          executiveSummary: report.report.sections.executive_summary || "",
          filename: `${(report.report.cover_page.incident_name || map?.title || "investigation-report")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")}.pdf`,
          pdfBase64,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to email PDF.");
      }

      setStatusMessage(`PDF emailed to ${emailTo.trim()}.`);
      setEmailSentFlash(true);
      if (emailSentTimeoutRef.current !== null) {
        window.clearTimeout(emailSentTimeoutRef.current);
      }
      emailSentTimeoutRef.current = window.setTimeout(() => {
        setEmailSentFlash(false);
        setEmailPanelOpen(false);
        setEmailTo("");
        setStatusMessage(null);
        emailSentTimeoutRef.current = null;
      }, 2000);
    } catch (emailError) {
      setStatusMessage(emailError instanceof Error ? emailError.message : "Unable to email PDF.");
    } finally {
      setEmailSending(false);
    }
  };

  useEffect(() => {
    if (!emailPanelOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (emailPanelRef.current?.contains(target)) return;
      setEmailPanelOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [emailPanelOpen]);

  useEffect(() => {
    if (!emailPanelOpen) return;
    const timeoutId = window.setTimeout(() => emailInputRef.current?.focus(), 140);
    return () => window.clearTimeout(timeoutId);
  }, [emailPanelOpen]);

  useEffect(() => {
    return () => {
      if (emailSentTimeoutRef.current !== null) {
        window.clearTimeout(emailSentTimeoutRef.current);
      }
    };
  }, []);

  if (showLoadingExperience) {
    return (
      <DashboardShell
        activeNav="dashboard"
        eyebrow="Investigation Tool"
        title={map ? `${map.title} Report` : viewMode ? "Saved Report" : "Generating Report"}
        subtitle={viewMode ? "Preparing PDF viewer." : "Generating report preview."}
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
            title={viewMode ? "Preparing PDF Viewer" : "Building Report Preview"}
            subtitle={
              viewMode
                ? "Loading saved report content and building a stable PDF preview."
                : "Generating the report and preparing a stable PDF preview."
            }
            inline
          />
        </section>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      activeNav="dashboard"
      eyebrow="Investigation Tool"
      title={map ? `${map.title} Report` : viewMode ? "Saved Report" : "Generating Report"}
      subtitle={
        report
          ? `Version ${report.saved_report.version_number}. Generated ${formatHeaderReportSubtitle(report.saved_report.generated_at)}. Current status: ${report.saved_report.status}`
          : viewMode
            ? "Loading saved investigation report."
            : "Generating structured investigation report draft."
      }
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
        <div className={pageStyles.screenOnly}>
          {generating ? (
            <div className={shellStyles.tableLoadingStateInline}>
              <div className={shellStyles.tableLoadingBar} aria-hidden="true" />
              <span>Generating report...</span>
            </div>
          ) : null}
          {error ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{error}</p> : null}
          {errorDiagnostic ? (
            <div className={shellStyles.accountSection}>
              <h2>Generation Diagnostic</h2>
              <dl className={shellStyles.reportList}>
                <div><dt>Response Status</dt><dd>{errorDiagnostic.status || "-"}</dd></div>
                <div><dt>Incomplete Reason</dt><dd>{errorDiagnostic.incompleteReason || "-"}</dd></div>
                <div><dt>Refusal</dt><dd>{errorDiagnostic.refusal || "-"}</dd></div>
                <div><dt>Output Preview</dt><dd>{errorDiagnostic.outputTextPreview || "-"}</dd></div>
              </dl>
            </div>
          ) : null}
          {readiness && readiness.missing_information_detected.length > 0 ? (
            <div className={shellStyles.accountSection}>
              <h2>Missing Information</h2>
              {readiness.disclaimer ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{readiness.disclaimer}</p> : null}
              <ul className={shellStyles.accountChecklist}>
                {readiness.missing_information_detected.map((item) => <li key={item}>{item}</li>)}
              </ul>
              {readiness.suggested_next_steps.length > 0 ? (
                <div className={shellStyles.reportScopeActions}>
                  <div>
                    <p className={shellStyles.subtitle}>Suggested next steps</p>
                    <ul className={shellStyles.accountChecklist}>
                      {readiness.suggested_next_steps.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  {!report ? (
                    <div className={shellStyles.reportScopeActionButtons}>
                      <button type="button" className={`${shellStyles.button} ${shellStyles.buttonAccent}`} onClick={() => router.push(`/investigations/${params.id}`)}>Go Back</button>
                      <button type="button" className={`${shellStyles.button} ${shellStyles.buttonAccent}`} onClick={() => void handleContinueAnyway()} disabled={generating}>
                        {generating ? "Generating..." : "Continue Anyway"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {report ? (
          <>
            <div className={`${shellStyles.accountSection} ${pageStyles.screenOnly} ${pageStyles.reportControlsSection}`}>
              <div className={`${shellStyles.reportScopeActions} ${pageStyles.reportControlsRow}`}>
                <div>
                  {pdfError ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{pdfError}</p> : null}
                  {statusMessage && !emailSentFlash ? (
                    <p className={`${shellStyles.message} ${statusMessage.toLowerCase().includes("unable") ? shellStyles.messageError : shellStyles.messageSuccess}`}>{statusMessage}</p>
                  ) : null}
                </div>
                <div className={`${shellStyles.reportScopeActionButtons} ${pageStyles.reportActionButtons}`}>
                  <div className={pageStyles.emailActionWrap}>
                    <div ref={emailPanelRef} className={`${pageStyles.emailPanelInline} ${emailPanelOpen ? pageStyles.emailPanelInlineOpen : ""}`}>
                      <div className={`${pageStyles.emailExpandShell} ${emailSentFlash ? pageStyles.emailExpandShellSent : ""}`}>
                        <button
                          type="button"
                          className={pageStyles.emailExpandTrigger}
                          onClick={() => {
                            if (emailSentFlash) return;
                            setEmailPanelOpen((open) => !open);
                          }}
                          aria-expanded={emailPanelOpen}
                          disabled={!pdfBlob || pdfPreparing || emailSending || emailSentFlash}
                        >
                          <Image src="/icons/email.svg" alt="" width={16} height={16} className={pageStyles.emailToolbarButtonIcon} />
                          <span>Email PDF</span>
                        </button>
                        <input
                          ref={emailInputRef}
                          type="email"
                          className={`${pageStyles.emailInputInline} ${emailSentFlash ? pageStyles.emailInputInlineSent : ""}`}
                          placeholder="Email PDF to..."
                          value={emailSentFlash ? "Email sent" : emailTo}
                          onChange={(event) => setEmailTo(event.target.value)}
                          onKeyDown={(event) => {
                            if (emailSentFlash) return;
                            if (event.key === "Enter") {
                              event.preventDefault();
                              void handleEmailPdf();
                            }
                            if (event.key === "Escape") {
                              setEmailPanelOpen(false);
                            }
                          }}
                          disabled={!pdfBlob || pdfPreparing || emailSending}
                          readOnly={emailSentFlash}
                        />
                      </div>
                      <div className={pageStyles.emailPanelInlineBody}>
                        <button
                          type="button"
                          className={pageStyles.emailInlineIconButton}
                          onClick={() => void handleEmailPdf()}
                          disabled={!pdfBlob || pdfPreparing || emailSending || emailSentFlash}
                          title={emailSending ? "Emailing" : "Send email"}
                          aria-label={emailSending ? "Emailing" : "Send email"}
                        >
                          <Image src="/icons/send.svg" alt="" width={16} height={16} className={pageStyles.emailInlineIcon} />
                        </button>
                        <button
                          type="button"
                          className={pageStyles.emailInlineIconButton}
                          onClick={() => setEmailPanelOpen(false)}
                          title="Close email field"
                          aria-label="Close email field"
                          disabled={emailSending || emailSentFlash}
                        >
                          <span className={pageStyles.emailInlineCloseIcon} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonAccent} ${pageStyles.controlIconButton}`}
                    onClick={() => router.push(`/investigations/${params.id}/reports/${report.saved_report.id}/edit`)}
                    title="Edit report"
                    aria-label="Edit report"
                  >
                    <EditGlyph />
                  </button>
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonAccent} ${pageStyles.controlIconButton}`}
                    onClick={handleSavePdf}
                    disabled={!pdfBlobUrl || pdfPreparing}
                    title="Save PDF"
                    aria-label="Save PDF"
                  >
                    <SaveGlyph />
                  </button>
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonAccent} ${pageStyles.controlIconButton}`}
                    onClick={handlePrintPdf}
                    disabled={!pdfBlobUrl || pdfPreparing}
                    title="Print PDF"
                    aria-label="Print PDF"
                  >
                    <PrintGlyph />
                  </button>
                  <select
                    className={pageStyles.statusSelect}
                    value={report.saved_report.status}
                    disabled={statusSaving}
                    onChange={(event) => void handleStatusUpdate(event.target.value as "draft" | "reviewed" | "approved")}
                    aria-label="Change report status"
                  >
                    <option value="draft">Draft</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={pageStyles.pdfViewerShell}>
              <PDFViewer className={pageStyles.pdfViewer} showToolbar>
                {stablePdfDocument!}
              </PDFViewer>
            </div>
          </>
        ) : null}
      </section>
    </DashboardShell>
  );
}
