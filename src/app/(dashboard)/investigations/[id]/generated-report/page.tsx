"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PDFViewer, pdf, type DocumentProps } from "@react-pdf/renderer";
import DashboardShell from "@/components/dashboard/DashboardShell";
import shellStyles from "@/components/dashboard/DashboardShell.module.css";
import pageStyles from "./GeneratedReportPage.module.css";
import InvestigationReportPdfDocument from "@/components/investigation-report/InvestigationReportPdfDocument";
import { ReportProgressLoadingView } from "@/components/loading/ReportProgressLoadingView";
import { type OrganisationBranding, type ResolvedOrganisationBranding, normalizeOrganisationBranding } from "@/lib/organisationBranding";
import {
  cleanEvidenceDescription,
  getConfigValue,
  getEvidenceFileType,
  getEvidenceMediaPath,
  getEvidenceMediaUrl,
  isPdfEvidence,
} from "@/lib/investigation-report/evidence";
import {
  formatHeaderReportSubtitle,
  formatReportDate,
  formatReportTime,
} from "@/lib/investigation-report/formatters";
import { normalizeInvestigationReportPayload } from "@/lib/investigation-report/helpers";
import { isReportSectionVisible, type ReportSectionVisibilityId } from "@/lib/investigation-report/sections";
import { normalizeHeaderKey, splitBracketedValue, toTitleCaseLabel } from "@/lib/investigation-report/text";
import type { InvestigationSavedReportPayload } from "@/lib/investigation-report/types";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { reportSiteIssue } from "@/lib/siteIssues/client";
import { reportUserActivity } from "@/lib/userActivityClient";
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
  diagnostic?: {
    status?: string | null;
    refusal?: string | null;
    outputTextPreview?: string | null;
    incompleteReason?: string | null;
    trace?: string[] | null;
  };
};

type ReportPayload = InvestigationSavedReportPayload;

async function loadOrganisationBranding(accessToken: string) {
  const response = await fetch("/api/account/organisation-branding", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = (await response.json().catch(() => null)) as { branding?: OrganisationBranding; error?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.error || "Unable to load organisation branding.");
  }

  return normalizeOrganisationBranding(payload?.branding ?? null);
}

function applyOrganisationBrandingFallback(report: ReportPayload, branding: ResolvedOrganisationBranding) {
  return {
    ...report,
    report: {
      ...report.report,
      branding: {
        logo_storage_path: report.report.branding?.logo_storage_path?.trim() || branding.logo_storage_path || undefined,
        section_heading_color: report.report.branding?.section_heading_color?.trim() || branding.section_heading_color,
        table_heading_color: report.report.branding?.table_heading_color?.trim() || branding.table_heading_color,
      },
    },
  };
}

type FlowSection = {
  key: string;
  label: string;
  estimatedUnits: number;
  content: React.ReactNode;
};

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

function stripActivityTimestamp(entry: string) {
  return entry.replace(/^\d{1,2}:\d{2}(?::\d{2})?\s*(?:[ap]\.?m\.?)?\s+/i, "").trim();
}

const SESSION_STORAGE_KEYS = {
  accessToken: "investigation_tool_access_token",
  refreshToken: "investigation_tool_refresh_token",
  userEmail: "investigation_tool_user_email",
  userId: "investigation_tool_user_id",
} as const;

type BrowserAuthSession = {
  access_token?: string | null;
  refresh_token?: string | null;
  user?: {
    email?: string | null;
    id?: string | null;
  } | null;
};

function persistBrowserAuthSession(session: BrowserAuthSession | null | undefined) {
  if (typeof window === "undefined" || !session) return;

  const accessToken = session.access_token?.trim() ?? "";
  const refreshToken = session.refresh_token?.trim() ?? "";

  if (accessToken) {
    window.localStorage.setItem(SESSION_STORAGE_KEYS.accessToken, accessToken);
  }
  if (refreshToken) {
    window.localStorage.setItem(SESSION_STORAGE_KEYS.refreshToken, refreshToken);
  }
  if (session.user?.email) {
    window.localStorage.setItem(SESSION_STORAGE_KEYS.userEmail, session.user.email);
  }
  if (session.user?.id) {
    window.localStorage.setItem(SESSION_STORAGE_KEYS.userId, session.user.id);
  }
}

function readAccessTokenFromLocalStorage() {
  if (typeof window === "undefined") return "";

  const directToken = window.localStorage.getItem(SESSION_STORAGE_KEYS.accessToken)?.trim() ?? "";
  if (directToken) return directToken;

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.includes("-auth-token")) continue;

    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) continue;

    try {
      const parsed = JSON.parse(rawValue) as unknown;

      if (parsed && typeof parsed === "object" && "access_token" in parsed) {
        const token = typeof parsed.access_token === "string" ? parsed.access_token.trim() : "";
        if (token) return token;
      }

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (!item || typeof item !== "object" || !("access_token" in item)) continue;
          const token = typeof item.access_token === "string" ? item.access_token.trim() : "";
          if (token) return token;
        }
      }
    } catch {
      continue;
    }
  }

  return "";
}

function readRefreshTokenFromLocalStorage() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(SESSION_STORAGE_KEYS.refreshToken)?.trim() ?? "";
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
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

function renderPresencePill(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";

  const normalized = trimmed.toLowerCase();
  let className = shellStyles.factorPillNeutral;

  if (normalized.includes("present")) className = shellStyles.factorPillPresent;
  else if (normalized.includes("failed")) className = shellStyles.factorPillAbsent;
  else if (normalized.includes("absent") || normalized.includes("missing")) className = shellStyles.factorPillContributing;

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

function renderTaskConditionStatePill(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";

  let className = shellStyles.factorPillNeutral;

  switch (trimmed.toLowerCase()) {
    case "normal":
      className = shellStyles.factorPillPresent;
      break;
    case "abnormal":
      className = shellStyles.factorPillAbsent;
      break;
    default:
      className = shellStyles.factorPillNeutral;
      break;
  }

  return <span className={`${shellStyles.statusPill} ${className} ${pageStyles.factorPillCompact}`}>{toTitleCaseLabel(trimmed)}</span>;
}

function getResponseRecoveryCategoryPillStyle(value: string) {
  const normalized = value.trim().toLowerCase();

  switch (normalized) {
    case "emergency_response":
      return { backgroundColor: "#FEF3C7", color: "#92400E", borderColor: "#FCD34D" };
    case "make_area_safe":
      return { backgroundColor: "#F3E8FF", color: "#6B21A8", borderColor: "#D8B4FE" };
    case "medical_treatment":
      return { backgroundColor: "#DCFCE7", color: "#166534", borderColor: "#86EFAC" };
    case "scene_preservation":
      return { backgroundColor: "#E0E7FF", color: "#3730A3", borderColor: "#A5B4FC" };
    default:
      return { backgroundColor: "#FCE7F3", color: "#9D174D", borderColor: "#F9A8D4" };
  }
}

function renderResponseRecoveryCategoryPill(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";

  return (
    <span className={`${shellStyles.statusPill} ${pageStyles.factorPillCompact}`} style={getResponseRecoveryCategoryPillStyle(trimmed)}>
      {toTitleCaseLabel(trimmed)}
    </span>
  );
}

function getOutcomeMatrixPillStyle(value: string) {
  const normalized = value.trim().toLowerCase();

  switch (normalized) {
    case "rare":
    case "insignificant":
      return { backgroundColor: "#DCFCE7", color: "#166534", borderColor: "#86EFAC" };
    case "unlikely":
    case "minor":
      return { backgroundColor: "#ECFCCB", color: "#3F6212", borderColor: "#BEF264" };
    case "possible":
    case "moderate":
      return { backgroundColor: "#FEF3C7", color: "#92400E", borderColor: "#FCD34D" };
    case "likely":
    case "major":
      return { backgroundColor: "#FED7AA", color: "#9A3412", borderColor: "#FB923C" };
    case "almost_certain":
    case "almost certain":
    case "severe":
    case "catastrophic":
      return { backgroundColor: "#FEE2E2", color: "#7F1D1D", borderColor: "#F87171" };
    default:
      return { backgroundColor: "#F3F4F6", color: "#374151", borderColor: "#D1D5DB" };
  }
}

function renderOutcomeMatrixPill(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";

  return (
    <span className={`${shellStyles.statusPill} ${pageStyles.factorPillCompact}`} style={getOutcomeMatrixPillStyle(trimmed)}>
      {toTitleCaseLabel(trimmed)}
    </span>
  );
}

function buildTaskConditionsTable(elements: CanvasElementRow[]) {
  return {
    columns: ["Details", "State", "Environmental Context"],
    rows: elements
      .filter((element) => element.element_type === "incident_task_condition")
      .map((element) => [
        getConfigValue(element.element_config, "description", "summary", "detail", "details") || element.heading?.trim() || "",
        getConfigValue(element.element_config, "state") || "normal",
        getConfigValue(element.element_config, "environmental_context", "environmentalContext", "context"),
      ]),
  };
}

function buildIncidentOutcomesTable(elements: CanvasElementRow[]) {
  return {
    columns: ["Outcome", "Description", "Category", "Likelihood", "Consequence", "Reporting Outcome"],
    rows: elements
      .filter((element) => element.element_type === "incident_outcome")
      .map((element) => [
        element.heading?.trim() || "Outcome",
        getConfigValue(element.element_config, "description", "summary", "detail", "details"),
        getConfigValue(element.element_config, "consequence_category"),
        getConfigValue(element.element_config, "likelihood"),
        getConfigValue(element.element_config, "consequence"),
        getConfigValue(element.element_config, "reporting_consequence"),
      ]),
  };
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
  const presenceIndex = findIndex("presence", "status", "present");
  const classificationIndex = findIndex("classification", "role in incident", "role", "contribution");
  const detailsIndex = findIndex("detail", "support", "description", "definition", "why");
  const categoryIndex = findIndex("category", "influence");
  const itemIndex = foundItemIndex >= 0 ? foundItemIndex : 0;

  const pick = (row: string[], index: number) => (index >= 0 ? row[index] || "" : "");

  return {
    columns: ["Details", "Presence", "Classification", "Category"],
    rows: rows.map((row) => {
      const rawItem = pick(row, itemIndex);
      const rawClassification = pick(row, classificationIndex);
      const itemParts = splitBracketedValue(rawItem);
      const detailText = pick(row, detailsIndex) || itemParts.main || rawItem;

      return [
        detailText,
        pick(row, presenceIndex),
        rawClassification,
        pick(row, categoryIndex),
      ];
    }),
  };
}

function normalizePredisposingFactorsTable(columns: string[], rows: string[][]) {
  const normalizedColumns = columns.map(normalizeHeaderKey);
  const findIndex = (...patterns: string[]) => normalizedColumns.findIndex((column) => patterns.some((pattern) => column.includes(pattern)));
  const foundItemIndex = findIndex("factor", "item", "name");
  const itemIndex = foundItemIndex >= 0 ? foundItemIndex : 0;
  const presenceIndex = findIndex("presence", "status", "present");
  const detailsIndex = findIndex("detail", "support", "description", "definition", "why");
  const categoryIndex = findIndex("category", "influence", "type");
  const pick = (row: string[], index: number) => (index >= 0 ? row[index] || "" : "");

  return {
    columns: ["Details", "Presence", "Influence Type"],
    rows: rows.map((row) => {
      const rawItem = pick(row, itemIndex);
      const itemParts = splitBracketedValue(rawItem);
      const detailText = pick(row, detailsIndex) || itemParts.main || rawItem;
      return [detailText, pick(row, presenceIndex), pick(row, categoryIndex)];
    }),
  };
}

function buildFactorsTable(elements: CanvasElementRow[], targetType: "incident_factor" | "incident_system_factor") {
  const firstColumnLabel = targetType === "incident_system_factor" ? "System Factor" : "Factor";
  const finalColumnLabel = targetType === "incident_system_factor" ? "Category" : "Influence Type";

  return {
    columns: [firstColumnLabel, "Details", "Presence", "Classification", finalColumnLabel],
    rows: elements
      .filter((element) => element.element_type === targetType)
      .map((element) => [
        element.heading?.trim() || toTitleCaseLabel(targetType.replace("incident_", "").replaceAll("_", " ")),
        getConfigValue(element.element_config, "description", "summary", "detail", "details"),
        getConfigValue(element.element_config, "factor_presence", "factorPresence", "presence", "factor_presence_state", "factorPresenceState"),
        getConfigValue(element.element_config, "factor_classification", "factorClassification", "cause_level", "causeLevel", "classification"),
        getConfigValue(element.element_config, "category", "influence_type", "influenceType"),
      ]),
  };
}

function buildControlsBarriersTable(elements: CanvasElementRow[]) {
  return {
    columns: ["Description", "Barrier State", "Barrier Role", "Control Type", "Owner"],
    rows: elements
      .filter((element) => element.element_type === "incident_control_barrier")
      .map((element) => [
        getConfigValue(element.element_config, "description", "summary", "detail", "details") || element.heading?.trim() || "",
        getConfigValue(element.element_config, "barrier_state", "barrierState", "state", "status"),
        getConfigValue(element.element_config, "barrier_role", "barrierRole", "role"),
        getConfigValue(element.element_config, "control_type", "controlType", "type"),
        getConfigValue(element.element_config, "owner_text", "ownerText", "owner"),
      ]),
  };
}

function normalizeResponseRecoveryTable(columns: string[], rows: string[][]) {
  const normalizedColumns = columns.map(normalizeHeaderKey);
  const findIndex = (...patterns: string[]) => normalizedColumns.findIndex((column) => patterns.some((pattern) => column.includes(pattern)));
  const categoryIndex = findIndex("category", "type", "classification");
  const detailsIndex = findIndex("description", "detail", "summary", "action", "response", "recovery");
  const pick = (row: string[], index: number) => (index >= 0 ? row[index] || "" : "");

  return {
    columns: ["Response Or Recovery Action", "Category"],
    rows: rows.map((row) => [pick(row, detailsIndex), pick(row, categoryIndex)]),
  };
}

function normalizeFindingsTable(columns: string[], rows: string[][]) {
  const normalizedColumns = columns.map(normalizeHeaderKey);
  const findIndex = (...patterns: string[]) => normalizedColumns.findIndex((column) => patterns.some((pattern) => column.includes(pattern)));
  const findingIndex = findIndex("finding", "description", "detail", "summary", "item");
  const confidenceIndex = findIndex("confidence");
  const pick = (row: string[], index: number) => (index >= 0 ? row[index] || "" : "");

  return {
    columns: ["Finding", "Confidence"],
    rows: rows.map((row) => [pick(row, findingIndex), pick(row, confidenceIndex)]),
  };
}

function buildRecommendationsTable(elements: CanvasElementRow[]) {
  return {
    columns: ["Description", "Action Type", "Owner", "Due Date"],
    rows: elements
      .filter((element) => element.element_type === "incident_recommendation")
      .map((element) => [
        getConfigValue(element.element_config, "description", "summary", "detail", "details") || element.heading?.trim() || "",
        getConfigValue(element.element_config, "action_type", "actionType", "type"),
        getConfigValue(element.element_config, "owner_text", "ownerText", "owner"),
        getConfigValue(element.element_config, "due_date", "dueDate", "date"),
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
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [emailTo, setEmailTo] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailPanelOpen, setEmailPanelOpen] = useState(false);
  const [emailSentFlash, setEmailSentFlash] = useState(false);
  const initialLoadRunKeyRef = useRef<string | null>(null);
  const emailPanelRef = useRef<HTMLDivElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const emailSentTimeoutRef = useRef<number | null>(null);
  const pdfActivityKeyRef = useRef<string | null>(null);

  const appendActivityLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setActivityLog((current) => {
      const next = [...current, `${timestamp}  ${message}`];
      return next.slice(-8);
    });
  }, []);

  const getAccessToken = useCallback(async (options: { forceRefresh?: boolean; allowStoredFallback?: boolean } = {}) => {
    const allowStoredFallback = options.allowStoredFallback ?? true;

    if (options.forceRefresh) {
      try {
        const { data } = await withTimeout(
          supabase.auth.refreshSession(),
          8000,
          "Session refresh timed out after 8 seconds.",
        );
        const refreshedToken = data.session?.access_token?.trim();
        if (refreshedToken) {
          persistBrowserAuthSession(data.session);
          return refreshedToken;
        }
      } catch {
        // Fall through to the current session and stored-token recovery paths.
      }
    }

    const { data } = await withTimeout(
      supabase.auth.getSession(),
      8000,
      "Session lookup timed out after 8 seconds.",
    );

    const liveToken = data.session?.access_token?.trim();
    if (liveToken) {
      persistBrowserAuthSession(data.session);
      return liveToken;
    }

    const storedToken = readAccessTokenFromLocalStorage();
    const storedRefreshToken = readRefreshTokenFromLocalStorage();

    if (storedToken && storedRefreshToken) {
      try {
        const { data: recoveredData, error } = await withTimeout(
          supabase.auth.setSession({
            access_token: storedToken,
            refresh_token: storedRefreshToken,
          }),
          8000,
          "Stored session recovery timed out after 8 seconds.",
        );
        const recoveredToken = recoveredData.session?.access_token?.trim();
        if (!error && recoveredToken) {
          persistBrowserAuthSession(recoveredData.session);
          return recoveredToken;
        }
      } catch {
        // The stored session may be expired or from a previous sign-in.
      }
    }

    return allowStoredFallback ? storedToken : "";
  }, [supabase]);

  const personElements = useMemo(() => elements.filter((element) => element.element_type === "person"), [elements]);
  const evidenceElements = useMemo(() => elements.filter((element) => element.element_type === "incident_evidence"), [elements]);
  const incidentFactorsTable = useMemo(() => buildFactorsTable(elements, "incident_factor"), [elements]);
  const incidentSystemFactorsTable = useMemo(() => buildFactorsTable(elements, "incident_system_factor"), [elements]);
  const normalizedPredisposingFactorsTable = useMemo(
    () =>
      normalizePredisposingFactorsTable(
        report?.report.sections.predisposing_factors.columns ?? [],
        report?.report.sections.predisposing_factors.rows ?? [],
      ),
    [report],
  );
  const controlsBarriersTable = useMemo(() => buildControlsBarriersTable(elements), [elements]);
  const responseRecoveryTable = useMemo(
    () =>
      normalizeResponseRecoveryTable(
        report?.report.sections.response_and_recovery.columns ?? [],
        report?.report.sections.response_and_recovery.rows ?? [],
      ),
    [report],
  );
  const normalizedFindingsTable = useMemo(
    () =>
      normalizeFindingsTable(
        report?.report.sections.incident_findings.columns ?? [],
        report?.report.sections.incident_findings.rows ?? [],
      ),
    [report],
  );
  const recommendationsTable = useMemo(() => buildRecommendationsTable(elements), [elements]);
  const taskConditionsTable = useMemo(() => buildTaskConditionsTable(elements), [elements]);
  const incidentOutcomesTable = useMemo(() => buildIncidentOutcomesTable(elements), [elements]);
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
  const isPdfSectionVisible = (sectionId: ReportSectionVisibilityId) =>
    isReportSectionVisible(report?.report.section_visibility, sectionId);
  const pdfViewerReady = Boolean(stablePdfDocument && !pdfPreparing && pdfBlobUrl);
  const showLoadingExperience = loading || generating || (!!report && !pdfError && !pdfViewerReady);
  const latestActivityMessage = activityLog.length > 0 ? stripActivityTimestamp(activityLog[activityLog.length - 1]) : "";
  const liveProgressPercent = useMemo(() => {
    if (viewMode) {
      if (report && stablePdfDocument && !pdfPreparing && pdfBlobUrl) return 100;
      if (report && stablePdfDocument) return 92;
      if (activityLog.length > 0) return Math.min(88, 10 + activityLog.length * 6);
      return 0;
    }

    if (!generating) {
      if (report && stablePdfDocument && !pdfPreparing && pdfBlobUrl) return 100;
      if (report && stablePdfDocument) return 92;
      if (loading) return 0;
      return Math.min(88, 8 + activityLog.length * 6);
    }

    if (activityLog.length === 0) return 0;
    return Math.min(94, 10 + activityLog.length * 6);
  }, [activityLog.length, generating, loading, pdfBlobUrl, pdfPreparing, report, stablePdfDocument, viewMode]);

  useEffect(() => {
    const targetPhase = generating
      ? 1
      : loading
        ? 0
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
    if (!generating) return;

    const intervalId = window.setInterval(() => {
      setLoadingPhase((current) => {
        if (current >= 4) return current;
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(intervalId);
  }, [generating]);

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
              renderCell={(value, _rowIndex, cellIndex) => {
                if (cellIndex === 1) return renderResponseRecoveryCategoryPill(value);
                return value || "-";
              }}
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
        estimatedUnits: taskConditionsTable.rows.length > 0 ? 4 : 2,
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>Task And Conditions</h2>
            <p className={pageStyles.paragraph}>{normalizeParagraphText(report.report.sections.task_and_conditions)}</p>
            <DocumentTable
              columns={taskConditionsTable.columns}
              rows={taskConditionsTable.rows}
              emptyLabel="No task or condition items available."
              renderCell={(value, _rowIndex, cellIndex) => {
                if (cellIndex === 1) return renderTaskConditionStatePill(value);
                return value || "-";
              }}
            />
          </section>
        ),
      } : null,
      isPdfSectionVisible("factors_and_system_factors") ? {
        key: "factors",
        label: "Factors",
        estimatedUnits: 5,
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>Factors</h2>
            <DocumentTable
              columns={incidentFactorsTable.columns}
              rows={incidentFactorsTable.rows}
              emptyLabel="No factors available."
              renderCell={(value, _rowIndex, cellIndex) => {
                if (cellIndex === 2) return renderPresencePill(value);
                if (cellIndex === 3) return renderFactorPill(value);
                if (cellIndex === 4) return value.trim() ? toTitleCaseLabel(value) : "-";
                return value || "-";
              }}
              columnWidthClassName={(_column, cellIndex) =>
                [
                  pageStyles.factorColumnItem,
                  pageStyles.factorColumnDetails,
                  pageStyles.factorColumnPresence,
                  pageStyles.factorColumnClassification,
                  pageStyles.factorColumnItem,
                ][cellIndex]
              }
            />
          </section>
        ),
      } : null,
      isPdfSectionVisible("factors_and_system_factors") ? {
        key: "system-factors",
        label: "System Factors",
        estimatedUnits: 5,
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>System Factors</h2>
            <DocumentTable
              columns={incidentSystemFactorsTable.columns}
              rows={incidentSystemFactorsTable.rows}
              emptyLabel="No system factors available."
              renderCell={(value, _rowIndex, cellIndex) => {
                if (cellIndex === 2) return renderPresencePill(value);
                if (cellIndex === 3) return renderFactorPill(value);
                if (cellIndex === 4) return value.trim() ? toTitleCaseLabel(value) : "-";
                return value || "-";
              }}
              columnWidthClassName={(_column, cellIndex) =>
                [
                  pageStyles.factorColumnItem,
                  pageStyles.factorColumnDetails,
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
                if (cellIndex === 1) return renderPresencePill(value);
                if (cellIndex === 2) return value.trim() ? toTitleCaseLabel(value) : "-";
                return value || "-";
              }}
              columnWidthClassName={(_column, cellIndex) =>
                [
                  pageStyles.factorColumnDetails,
                  pageStyles.factorColumnPresence,
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
              columns={controlsBarriersTable.columns}
              rows={controlsBarriersTable.rows}
              emptyLabel="No controls or barriers available."
              renderCell={(value, _rowIndex, cellIndex) => {
                if (cellIndex === 1) return renderControlBarrierStatePill(value);
                if (cellIndex === 2) return renderFactorPill(value);
                if (cellIndex === 3) return value ? toTitleCaseLabel(value) : "-";
                return value || "-";
              }}
              columnWidthClassName={(_column, cellIndex) =>
                [
                  pageStyles.factorColumnDetails,
                  pageStyles.factorColumnPresence,
                  pageStyles.factorColumnClassification,
                  pageStyles.factorColumnType,
                  pageStyles.factorColumnItem,
                ][cellIndex]
              }
            />
          </section>
        ),
      } : null,
      isPdfSectionVisible("incident_outcomes") ? {
        key: "incident-outcomes",
        label: "Incident Outcomes",
        estimatedUnits: 4,
        content: (
          <section className={pageStyles.sectionBlock}>
            <h2 className={pageStyles.inlineSectionHeading}>Incident Outcomes</h2>
            <p className={pageStyles.paragraph}>{normalizeParagraphText(report.report.sections.incident_outcomes)}</p>
            <DocumentTable
              columns={incidentOutcomesTable.columns}
              rows={incidentOutcomesTable.rows}
              emptyLabel="No outcomes available."
              renderCell={(value, _rowIndex, cellIndex) => {
                if (!value) return "-";
                if (cellIndex === 3 || cellIndex === 4) return renderOutcomeMatrixPill(value);
                if (cellIndex === 2 || cellIndex === 5) return toTitleCaseLabel(value);
                return value || "-";
              }}
            />
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
              columns={normalizedFindingsTable.columns}
              rows={normalizedFindingsTable.rows}
              emptyLabel="No finding details available."
              renderCell={(value, _rowIndex, cellIndex) => (cellIndex === 1 ? renderConfidencePill(value) : value || "-")}
              columnClassName={(_column, cellIndex) =>
                [
                  pageStyles.findingColumnFinding,
                  pageStyles.findingColumnConfidence,
                ][cellIndex]
              }
              columnWidthClassName={(_column, cellIndex) =>
                [
                  pageStyles.findingColumnFinding,
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
              columns={recommendationsTable.columns}
              rows={recommendationsTable.rows}
              emptyLabel="No recommendations available."
              renderCell={(value, _rowIndex, cellIndex) => (cellIndex === 1 ? renderActionTypePill(value) : value || "-")}
              columnWidthClassName={(_column, cellIndex) =>
                [
                  pageStyles.recommendationColumnDescription,
                  pageStyles.recommendationColumnActionType,
                  pageStyles.recommendationColumnOwner,
                  pageStyles.recommendationColumnDueDate,
                ][cellIndex]
              }
            />
            {isPdfSectionVisible("signatures") ? (
              <div className={pageStyles.signatureGrid}>
                {report.report.sections.recommendations.approval_fields.map((field, index) => (
                  <div key={`${field}-${index}`} className={pageStyles.signatureField}>
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
              {report.report.sections.investigation_sign_off.fields.map((field, index) => (
                <div key={`${field}-${index}`} className={pageStyles.signoffField}>
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
    taskConditionsTable,
    incidentFactorsTable,
    incidentSystemFactorsTable,
    normalizedPredisposingFactorsTable,
    controlsBarriersTable,
    responseRecoveryTable,
    incidentOutcomesTable,
    normalizedFindingsTable,
    recommendationsTable,
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
        taskConditionsTable={taskConditionsTable}
        incidentFactorsTable={incidentFactorsTable}
        incidentSystemFactorsTable={incidentSystemFactorsTable}
        predisposingFactorsTable={normalizedPredisposingFactorsTable}
        controlsTable={controlsBarriersTable}
        responseRecoveryTable={responseRecoveryTable}
        incidentOutcomesTable={incidentOutcomesTable}
        findingsTable={normalizedFindingsTable}
        recommendationsTable={recommendationsTable}
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
    taskConditionsTable,
    incidentFactorsTable,
    incidentSystemFactorsTable,
    normalizedPredisposingFactorsTable,
    controlsBarriersTable,
    responseRecoveryTable,
    incidentOutcomesTable,
    normalizedFindingsTable,
    recommendationsTable,
    pdfEvidenceEntries,
  ]);

  const callGenerateReport = async (args: { caseData: unknown }) => {
    const accessToken = await getAccessToken();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 180000);
    const requestBody = JSON.stringify(args);

    const sendGenerateReportRequest = (token: string) =>
      fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: requestBody,
        signal: controller.signal,
      });

    try {
      let response = await sendGenerateReportRequest(accessToken);

      if (response.status === 401) {
        const refreshedAccessToken = await getAccessToken({ forceRefresh: true, allowStoredFallback: false });
        if (refreshedAccessToken && refreshedAccessToken !== accessToken) {
          appendActivityLog("Session refreshed. Retrying the report request once.");
          response = await sendGenerateReportRequest(refreshedAccessToken);
        }
      }

      return response;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Report generation timed out after 180 seconds while waiting for the AI response.");
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    const runKey = `${params.id}:${reportId}:${viewMode ? "view" : "generate"}`;
    if (initialLoadRunKeyRef.current === runKey) return;
    initialLoadRunKeyRef.current = runKey;
    let cancelled = false;

    const loadAndGenerate = async (existingCaseData?: unknown) => {
      if (cancelled) return;
      setGenerating(true);
      setError(null);
      setErrorDiagnostic(null);
      setLoadingPhase(0);
      setDisplayLoadingPhase(0);
      setActivityLog([]);
      appendActivityLog(viewMode ? "Loading saved report viewer." : "Preparing a new report generation run.");

      try {
        if (viewMode) {
          appendActivityLog("Checking signed-in session.");
          const accessToken = await getAccessToken();
          if (cancelled) return;
          if (!accessToken) {
            router.push(`/login?returnTo=${encodeURIComponent(`/investigations/${params.id}/generated-report?reportId=${reportId}`)}`);
            return;
          }
          const organisationBranding = await loadOrganisationBranding(accessToken).catch(() => normalizeOrganisationBranding(null));

          appendActivityLog("Loading saved report data and related investigation records.");
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
          if (cancelled) return;

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
          setReport(applyOrganisationBrandingFallback({
            ...normalizeInvestigationReportPayload((savedReportRow.ai_output_json ?? {}) as Omit<ReportPayload, "saved_report">),
            saved_report: {
              id: savedReportRow.id,
              status: savedReportRow.status,
              generated_at: savedReportRow.generated_at,
              updated_at: savedReportRow.updated_at,
              version_number: savedReportRow.version_number,
            },
          } as ReportPayload, organisationBranding));
          appendActivityLog("Saved report loaded. Preparing PDF viewer.");
          setGenerating(false);
          setLoading(false);
          return;
        }

        let caseData = existingCaseData;

        if (!caseData) {
          appendActivityLog("Checking signed-in session.");
          const accessToken = await getAccessToken();
          if (cancelled) return;
          if (!accessToken) {
            router.push(`/login?returnTo=${encodeURIComponent(`/investigations/${params.id}/generated-report`)}`);
            return;
          }

          appendActivityLog("Loading investigation map and canvas elements.");
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
          if (cancelled) return;

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
          appendActivityLog("Building report request from investigation data.");
          caseData = buildCaseData(nextMap, nextElements);
        }

        appendActivityLog("Sending your report to the report builder.");
        appendActivityLog("Report builder request sent successfully.");
        const requestStartedAt = Date.now();
        let waitNoticeCount = 0;
        const waitNoticeInterval = window.setInterval(() => {
          waitNoticeCount += 1;
          const elapsedSeconds = Math.round((Date.now() - requestStartedAt) / 1000);
          appendActivityLog(
            waitNoticeCount === 1
              ? `Waiting for the structured report response (${elapsedSeconds}s elapsed).`
              : `Still building your structured report (${elapsedSeconds}s elapsed).`,
          );
        }, 12000);

        let response: Response;
        try {
          response = await callGenerateReport({ caseData });
        } finally {
          window.clearInterval(waitNoticeInterval);
        }
        if (cancelled) return;
        appendActivityLog("Report builder response received.");
        const payload = (await response.json().catch(() => null)) as (ReportPayload & ErrorPayload) | ErrorPayload | null;
        if (cancelled) return;

        if (!response.ok || !payload || !("report" in payload)) {
          setError(
            response.status === 401
              ? "Your sign-in session has expired. Please sign in again before generating the report."
              : payload && "error" in payload
                ? payload.error ?? "Unable to generate report."
                : "Unable to generate report.",
          );
          setErrorDiagnostic(payload && "diagnostic" in payload ? payload.diagnostic ?? null : null);
          if (response.status !== 401) {
            reportSiteIssue({
              action: "generating report",
              endpoint: "/api/generate-report",
              metadata: {
                diagnostic: payload && "diagnostic" in payload ? payload.diagnostic ?? null : null,
              },
              source: "openai",
              status: response.status,
              technicalMessage:
                payload && "error" in payload
                  ? payload.error ?? "Generate report failed without an error message."
                  : "Generate report returned an invalid payload.",
            });
          }
          const trace = payload && "diagnostic" in payload ? payload.diagnostic?.trace ?? [] : [];
          trace.forEach((entry) => appendActivityLog(`Server trace: ${entry}`));
          appendActivityLog("The report could not be completed before the editor opened.");
          setLoading(false);
          setGenerating(false);
          return;
        }

        appendActivityLog("Report generated and saved. Redirecting to the editor.");
        router.replace(`/investigations/${params.id}/reports/${payload.saved_report.id}/edit`);
        return;
      } catch (loadError) {
        if (cancelled) return;
        const message = loadError instanceof Error ? loadError.message : "Unable to generate report.";
        setError(message);
        reportSiteIssue({
          action: "generating report",
          error: loadError,
          source: "openai",
        });
        void reportUserActivity({
          action: "report_generation",
          status: "failed",
          summary: "Report generation failed.",
          metadata: {
            mapId: params.id,
            source: "client",
            error: message,
          },
        });
        appendActivityLog(`Generation request failed: ${message}`);
        setLoading(false);
        setGenerating(false);
      }
    };

    void loadAndGenerate();
    return () => {
      cancelled = true;
    };
  }, [appendActivityLog, params.id, reportId, router, supabase, viewMode]);

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

        const currentReportId = report?.saved_report?.id || reportId || null;
        const nextActivityKey = `${params.id}:${currentReportId || "current"}:${nextBlob.size}`;
        if (pdfActivityKeyRef.current !== nextActivityKey) {
          pdfActivityKeyRef.current = nextActivityKey;
          void reportUserActivity({
            action: "pdf_generation",
            status: "success",
            summary: "PDF generated.",
            metadata: {
              mapId: params.id,
              reportId: currentReportId,
              reportTitle: report?.report.cover_page.incident_name || map?.title || "Investigation Report",
              pdfSizeBytes: nextBlob.size,
              source: "client_pdf_renderer",
            },
          });
        }

        const nextUrl = URL.createObjectURL(nextBlob);
        setPdfBlob(nextBlob);
        setPdfBlobUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return nextUrl;
        });
      } catch (buildError) {
        if (!cancelled) {
          setPdfError(buildError instanceof Error ? buildError.message : "Unable to prepare PDF preview.");
          reportSiteIssue({
            action: "preparing pdf",
            error: buildError,
            source: "application",
          });
          void reportUserActivity({
            action: "pdf_generation",
            status: "failed",
            summary: "PDF generation failed.",
            metadata: {
              mapId: params.id,
              reportId: report?.saved_report?.id || reportId || null,
              reportTitle: report?.report.cover_page.incident_name || map?.title || "Investigation Report",
              source: "client_pdf_renderer",
              error: buildError instanceof Error ? buildError.message : String(buildError),
            },
          });
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
  }, [map?.title, params.id, report, reportId, stablePdfDocument]);

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
      reportSiteIssue({
        action: "emailing report",
        error: emailError,
        source: "resend",
      });
      void reportUserActivity({
        action: "pdf_report_email",
        status: "failed",
        summary: "PDF report email failed.",
        metadata: {
          mapId: params.id,
          reportId: report.saved_report?.id || reportId || null,
          reportTitle: report.report.cover_page.incident_name || map?.title || "Investigation Report",
          to: emailTo.trim(),
          source: "client",
          error: emailError instanceof Error ? emailError.message : String(emailError),
        },
      });
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
            helperText="This may take a few minutes for larger reports."
            activityLog={activityLog}
            progressPercent={liveProgressPercent}
            statusText={latestActivityMessage || undefined}
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
          {error ? (
            <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{error}</p>
          ) : null}
          {errorDiagnostic ? (
            <div className={shellStyles.accountSection}>
              <h2 className={pageStyles.readinessHeading}>Generation Diagnostic</h2>
              <dl className={shellStyles.reportList}>
                <div><dt>Response Status</dt><dd>{errorDiagnostic.status || "-"}</dd></div>
                <div><dt>Incomplete Reason</dt><dd>{errorDiagnostic.incompleteReason || "-"}</dd></div>
                <div><dt>Refusal</dt><dd>{errorDiagnostic.refusal || "-"}</dd></div>
                <div><dt>Output Preview</dt><dd>{errorDiagnostic.outputTextPreview || "-"}</dd></div>
              </dl>
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
