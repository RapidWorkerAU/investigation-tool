"use client";

import Link from "next/link";
import type { RefObject } from "react";
import type { MapMemberProfileRow, SystemMap } from "./canvasShared";
import type { NodePaletteKind } from "./mapCategories";

type CanvasActionButtonsProps = {
  isMobile: boolean;
  showMapInfoAside: boolean;
  onToggleMapInfo: () => void;
  rf: {
    fitView: (opts?: { duration?: number; padding?: number }) => void;
    setViewport: (v: { x: number; y: number; zoom: number }, opts?: { duration?: number }) => void;
  } | null;
  setShowAddMenu: (updater: (prev: boolean) => boolean) => void;
  showAddMenu: boolean;
  addMenuRef: RefObject<HTMLDivElement | null>;
  showSearchMenu: boolean;
  setShowSearchMenu: (updater: (prev: boolean) => boolean) => void;
  searchMenuRef: RefObject<HTMLDivElement | null>;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  searchResults: Array<{ id: string; label: string; documentNumber: string | null; kind: string }>;
  onSelectSearchResult: (id: string) => void;
  canWriteMap: boolean;
  canUseWizard: boolean;
  addDisabledReason?: string;
  wizardDisabledReason?: string;
  canPrint: boolean;
  printDisabledReason?: string;
  onOpenWizard: () => void;
  canCreateSticky: boolean;
  handleAddBlankDocument: () => void;
  handleAddSystemCircle: () => void;
  handleAddProcessComponent: () => void;
  handleAddPerson: () => void;
  handleAddProcessHeading: () => void;
  handleAddGroupingContainer: () => void;
  handleAddStickyNote: () => void;
  handleStartAddImageAsset: () => void;
  handleAddTextBox: () => void;
  handleAddTable: () => void;
  handleAddShapeRectangle: () => void;
  handleAddShapeCircle: () => void;
  handleAddShapePill: () => void;
  handleAddShapePentagon: () => void;
  handleAddShapeChevronLeft: () => void;
  handleAddShapeArrow: () => void;
  handleAddBowtieHazard: () => void;
  handleAddBowtieTopEvent: () => void;
  handleAddBowtieThreat: () => void;
  handleAddBowtieConsequence: () => void;
  handleAddBowtieControl: () => void;
  handleAddBowtieEscalationFactor: () => void;
  handleAddBowtieRecoveryMeasure: () => void;
  handleAddBowtieDegradationIndicator: () => void;
  handleAddBowtieRiskRating: () => void;
  handleAddIncidentSequenceStep: () => void;
  handleAddIncidentOutcome: () => void;
  handleAddIncidentTaskCondition: () => void;
  handleAddIncidentFactor: () => void;
  handleAddIncidentSystemFactor: () => void;
  handleAddIncidentControlBarrier: () => void;
  handleAddIncidentEvidence: () => void;
  handleAddIncidentFinding: () => void;
  handleAddIncidentRecommendation: () => void;
  allowedNodeKinds: NodePaletteKind[];
  canSaveTemplate: boolean;
  templateDisabledReason?: string;
  showTemplateMenu: boolean;
  setShowTemplateMenu: (updater: (prev: boolean) => boolean) => void;
  templateMenuRef: RefObject<HTMLDivElement | null>;
  templateQuery: string;
  setTemplateQuery: (value: string) => void;
  templateResults: Array<{ id: string; name: string; updatedAt: string }>;
  isLoadingTemplates: boolean;
  isSavingTemplate: boolean;
  templateSaveMessage: string | null;
  onSelectTemplate: (id: string, name: string) => void;
  onSaveTemplate: () => void;
  showPrintMenu: boolean;
  setShowPrintMenu: (updater: (prev: boolean) => boolean) => void;
  printMenuRef: RefObject<HTMLDivElement | null>;
  onPrintCurrentView: () => void;
  onPrintSelectArea: () => void;
  isPreparingPrint: boolean;
};

export function CanvasActionButtons({
  isMobile,
  showMapInfoAside,
  onToggleMapInfo,
  rf,
  setShowAddMenu,
  showAddMenu,
  addMenuRef,
  showSearchMenu,
  setShowSearchMenu,
  searchMenuRef,
  searchQuery,
  setSearchQuery,
  searchResults,
  onSelectSearchResult,
  canWriteMap,
  canUseWizard,
  addDisabledReason,
  wizardDisabledReason,
  canPrint,
  printDisabledReason,
  onOpenWizard,
  canCreateSticky,
  handleAddBlankDocument,
  handleAddSystemCircle,
  handleAddProcessComponent,
  handleAddPerson,
  handleAddProcessHeading,
  handleAddGroupingContainer,
  handleAddStickyNote,
  handleStartAddImageAsset,
  handleAddTextBox,
  handleAddTable,
  handleAddShapeRectangle,
  handleAddShapeCircle,
  handleAddShapePill,
  handleAddShapePentagon,
  handleAddShapeChevronLeft,
  handleAddShapeArrow,
  handleAddBowtieHazard,
  handleAddBowtieTopEvent,
  handleAddBowtieThreat,
  handleAddBowtieConsequence,
  handleAddBowtieControl,
  handleAddBowtieEscalationFactor,
  handleAddBowtieRecoveryMeasure,
  handleAddBowtieDegradationIndicator,
  handleAddBowtieRiskRating,
  handleAddIncidentSequenceStep,
  handleAddIncidentOutcome,
  handleAddIncidentTaskCondition,
  handleAddIncidentFactor,
  handleAddIncidentSystemFactor,
  handleAddIncidentControlBarrier,
  handleAddIncidentEvidence,
  handleAddIncidentFinding,
  handleAddIncidentRecommendation,
  allowedNodeKinds,
  canSaveTemplate,
  templateDisabledReason,
  showTemplateMenu,
  setShowTemplateMenu,
  templateMenuRef,
  templateQuery,
  setTemplateQuery,
  templateResults,
  isLoadingTemplates,
  isSavingTemplate,
  templateSaveMessage,
  onSelectTemplate,
  onSaveTemplate,
  showPrintMenu,
  setShowPrintMenu,
  printMenuRef,
  onPrintCurrentView,
  onPrintSelectArea,
  isPreparingPrint,
}: CanvasActionButtonsProps) {
  const allowed = new Set<NodePaletteKind>(allowedNodeKinds);
  const addItems: Array<{ key: string; label: string; onClick: () => void }> = [];
  if (canWriteMap) {
    if (allowed.has("document")) addItems.push({ key: "document", label: "Document", onClick: handleAddBlankDocument });
    if (allowed.has("system")) addItems.push({ key: "system", label: "System", onClick: handleAddSystemCircle });
    if (allowed.has("process")) addItems.push({ key: "process", label: "Process", onClick: handleAddProcessComponent });
    if (allowed.has("person")) addItems.push({ key: "person", label: "Person", onClick: handleAddPerson });
    if (allowed.has("category")) addItems.push({ key: "category", label: "Category", onClick: handleAddProcessHeading });
    if (allowed.has("grouping_container")) {
      addItems.push({ key: "grouping_container", label: "Grouping Container", onClick: handleAddGroupingContainer });
    }
    if (allowed.has("bowtie_hazard")) addItems.push({ key: "bowtie_hazard", label: "Hazard", onClick: handleAddBowtieHazard });
    if (allowed.has("bowtie_top_event")) addItems.push({ key: "bowtie_top_event", label: "Top Event", onClick: handleAddBowtieTopEvent });
    if (allowed.has("bowtie_threat")) addItems.push({ key: "bowtie_threat", label: "Threat", onClick: handleAddBowtieThreat });
    if (allowed.has("bowtie_consequence")) {
      addItems.push({ key: "bowtie_consequence", label: "Consequence", onClick: handleAddBowtieConsequence });
    }
    if (allowed.has("bowtie_control")) addItems.push({ key: "bowtie_control", label: "Control", onClick: handleAddBowtieControl });
    if (allowed.has("bowtie_escalation_factor")) {
      addItems.push({ key: "bowtie_escalation_factor", label: "Escalation Factor", onClick: handleAddBowtieEscalationFactor });
    }
    if (allowed.has("bowtie_recovery_measure")) {
      addItems.push({ key: "bowtie_recovery_measure", label: "Recovery Measure", onClick: handleAddBowtieRecoveryMeasure });
    }
    if (allowed.has("bowtie_degradation_indicator")) {
      addItems.push({
        key: "bowtie_degradation_indicator",
        label: "Degradation Indicator",
        onClick: handleAddBowtieDegradationIndicator,
      });
    }
    if (allowed.has("bowtie_risk_rating")) {
      addItems.push({ key: "bowtie_risk_rating", label: "Risk Rating", onClick: handleAddBowtieRiskRating });
    }
    if (allowed.has("incident_sequence_step")) {
      addItems.push({ key: "incident_sequence_step", label: "Sequence Step", onClick: handleAddIncidentSequenceStep });
    }
    if (allowed.has("incident_outcome")) {
      addItems.push({ key: "incident_outcome", label: "Outcome", onClick: handleAddIncidentOutcome });
    }
    if (allowed.has("incident_task_condition")) {
      addItems.push({ key: "incident_task_condition", label: "Task / Condition", onClick: handleAddIncidentTaskCondition });
    }
    if (allowed.has("incident_factor")) {
      addItems.push({ key: "incident_factor", label: "Factor", onClick: handleAddIncidentFactor });
    }
    if (allowed.has("incident_system_factor")) {
      addItems.push({ key: "incident_system_factor", label: "System Factor", onClick: handleAddIncidentSystemFactor });
    }
    if (allowed.has("incident_control_barrier")) {
      addItems.push({ key: "incident_control_barrier", label: "Control / Barrier", onClick: handleAddIncidentControlBarrier });
    }
    if (allowed.has("incident_evidence")) {
      addItems.push({ key: "incident_evidence", label: "Evidence", onClick: handleAddIncidentEvidence });
    }
    if (allowed.has("incident_finding")) {
      addItems.push({ key: "incident_finding", label: "Finding", onClick: handleAddIncidentFinding });
    }
    if (allowed.has("incident_recommendation")) {
      addItems.push({ key: "incident_recommendation", label: "Recommendation", onClick: handleAddIncidentRecommendation });
    }
    if (allowed.has("image_asset")) addItems.push({ key: "image_asset", label: "Image", onClick: handleStartAddImageAsset });
    if (allowed.has("text_box")) addItems.push({ key: "text_box", label: "Text Box", onClick: handleAddTextBox });
    if (allowed.has("table")) addItems.push({ key: "table", label: "Table", onClick: handleAddTable });
    if (allowed.has("shape_rectangle")) {
      addItems.push({ key: "shape_rectangle", label: "Rectangle", onClick: handleAddShapeRectangle });
    }
    if (allowed.has("shape_circle")) addItems.push({ key: "shape_circle", label: "Circle", onClick: handleAddShapeCircle });
    if (allowed.has("shape_pill")) addItems.push({ key: "shape_pill", label: "Pill", onClick: handleAddShapePill });
    if (allowed.has("shape_pentagon")) {
      addItems.push({ key: "shape_pentagon", label: "Pentagon", onClick: handleAddShapePentagon });
    }
    if (allowed.has("shape_chevron_left")) {
      addItems.push({ key: "shape_chevron_left", label: "Chevron", onClick: handleAddShapeChevronLeft });
    }
    if (allowed.has("shape_arrow")) addItems.push({ key: "shape_arrow", label: "Arrow", onClick: handleAddShapeArrow });
  }
  if (canCreateSticky && allowed.has("sticky_note")) {
    addItems.push({ key: "sticky_note", label: "Sticky Note", onClick: handleAddStickyNote });
  }

  const renderMiniDocumentTile = (bannerBg: string, bannerText: string, typeLabel: string) => (
    <div className="flex h-12 w-16 flex-col overflow-hidden rounded-[10px] border border-slate-300 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.14)]">
      <div className="flex h-3 items-center justify-center px-1 text-[4px] font-semibold uppercase tracking-[0.08em]" style={{ backgroundColor: bannerBg, color: bannerText }}>
        {typeLabel}
      </div>
      <div className="flex flex-1 flex-col px-1.5 py-1">
        <div className="h-1 rounded bg-slate-800/80" />
        <div className="mt-1 h-1 w-2/3 rounded bg-slate-400" />
        <div className="mt-auto rounded border border-slate-300 px-1 py-[2px]">
          <div className="h-1 w-4/5 rounded bg-slate-300" />
          <div className="mt-[2px] h-1 w-1/2 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );

  const renderMiniBowtieCard = (accent: string, background: string, border: string, labelBackground?: string, stripeHeader?: boolean) => (
    <div className="relative flex h-14 w-16 overflow-hidden rounded-[12px] border shadow-[0_6px_16px_rgba(15,23,42,0.14)]" style={{ backgroundColor: background, borderColor: border }}>
      <div className="w-1.5 shrink-0" style={{ backgroundColor: accent }} />
      <div className="flex min-w-0 flex-1 flex-col">
        {stripeHeader ? (
          <div className="h-2.5 w-full border-b border-slate-700" style={{ backgroundImage: "repeating-linear-gradient(-45deg, #111827 0 6px, #facc15 6px 12px)" }} />
        ) : (
          <div className="h-3.5 border-b px-1" style={{ backgroundColor: labelBackground ?? accent, borderColor: "rgba(15,23,42,0.08)" }} />
        )}
        <div className="flex flex-1 items-center justify-center px-1.5">
          <div className="w-full">
            <div className="h-1 rounded bg-slate-800/75" />
            <div className="mt-1 h-1 w-2/3 rounded bg-slate-400/80" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAddItemPreview = (key: string) => {
    switch (key) {
      case "document":
        return renderMiniDocumentTile("#111827", "#ffffff", "Procedure");
      case "system":
        return (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1e3a8a] px-2 text-[7px] font-semibold text-white shadow-[0_8px_20px_rgba(30,58,138,0.35)]">
            SYS
          </div>
        );
      case "process":
        return (
          <div className="relative h-12 w-16 overflow-hidden">
            <svg viewBox="0 0 700 500" preserveAspectRatio="none" className="h-full w-full drop-shadow-[0_6px_16px_rgba(15,23,42,0.18)]">
              <path
                d="M0 0H700V500C640 458 560 450 486 485C435 510 389 509 338 484C260 447 186 446 112 479C74 496 37 503 0 500V0Z"
                fill="#ff751f"
              />
            </svg>
          </div>
        );
      case "incident_sequence_step":
        return renderMiniDocumentTile("#bfdbfe", "#111827", "Step");
      case "incident_outcome":
        return renderMiniDocumentTile("#ef4444", "#ffffff", "Outcome");
      case "incident_task_condition":
        return renderMiniDocumentTile("#fb923c", "#111827", "Task");
      case "incident_factor":
        return renderMiniDocumentTile("#fde047", "#111827", "Factor");
      case "incident_system_factor":
        return renderMiniDocumentTile("#a78bfa", "#111827", "System");
      case "incident_control_barrier":
        return renderMiniDocumentTile("#4ade80", "#111827", "Barrier");
      case "incident_evidence":
        return renderMiniDocumentTile("#cbd5e1", "#111827", "Evidence");
      case "incident_finding":
        return renderMiniDocumentTile("#1d4ed8", "#ffffff", "Finding");
      case "incident_recommendation":
        return renderMiniDocumentTile("#14b8a6", "#111827", "Recommend");
      case "person":
        return (
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.16)]">
            <img src="/icons/account.svg" alt="" className="h-full w-full object-contain" />
          </div>
        );
      case "category":
        return (
          <div className="flex h-12 w-16 flex-col border bg-[#249BC7] px-1 py-1 text-white shadow-[0_6px_20px_rgba(15,23,42,0.18)]" style={{ borderColor: "#249BC7" }}>
            <div className="text-center text-[5px] font-semibold uppercase tracking-[0.14em]">Category</div>
            <div className="flex flex-1 items-center justify-center">
              <div className="h-1.5 w-8 rounded bg-white/80" />
            </div>
          </div>
        );
      case "grouping_container":
        return (
          <div className="relative h-12 w-16 rounded-[10px] border bg-transparent shadow-[0_6px_16px_rgba(15,23,42,0.12)]" style={{ borderColor: "#000000" }}>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black bg-white px-2 py-[2px] text-[5px] text-slate-800 shadow-[0_3px_8px_rgba(15,23,42,0.12)]">
              Group
            </div>
          </div>
        );
      case "sticky_note":
        return <div className="h-14 w-14 border border-[#facc15] bg-[#fef08a] shadow-[0_10px_24px_rgba(15,23,42,0.22)]" />;
      case "image_asset":
        return (
          <div className="flex h-14 w-16 items-center justify-center overflow-hidden border border-slate-300 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.12)]">
            <img src="/icons/image.svg" alt="" className="h-8 w-8 object-contain opacity-70" />
          </div>
        );
      case "text_box":
        return (
          <div className="flex h-14 w-16 items-center justify-center">
            <img src="/icons/texticon.svg" alt="" className="h-10 w-10 object-contain" />
          </div>
        );
      case "table":
        return (
          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.14)]">
            <div className="h-3 w-full bg-[#249BC7]" />
            <div className="grid h-11 w-16 grid-cols-3 grid-rows-3 gap-0 border-t border-slate-300 p-1">
              {Array.from({ length: 9 }).map((_, index) => (
                <span key={index} className="border border-slate-300 bg-white" />
              ))}
            </div>
          </div>
        );
      case "shape_rectangle":
        return <div className="h-10 w-16 bg-[#249BC7] shadow-[0_6px_16px_rgba(15,23,42,0.14)]" />;
      case "shape_circle":
        return <div className="h-12 w-12 rounded-full bg-[#249BC7] shadow-[0_6px_16px_rgba(15,23,42,0.14)]" />;
      case "shape_pill":
        return <div className="h-10 w-16 rounded-full bg-[#249BC7] shadow-[0_6px_16px_rgba(15,23,42,0.14)]" />;
      case "shape_pentagon":
        return <div className="h-12 w-14 bg-[#249BC7] shadow-[0_6px_16px_rgba(15,23,42,0.14)]" style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }} />;
      case "shape_chevron_left":
        return <div className="h-10 w-16 bg-[#249BC7] shadow-[0_6px_16px_rgba(15,23,42,0.14)]" style={{ clipPath: "polygon(28% 0%, 100% 0%, 72% 50%, 100% 100%, 28% 100%, 0% 50%)" }} />;
      case "shape_arrow":
        return <div className="h-10 w-16 bg-[#249BC7] shadow-[0_6px_16px_rgba(15,23,42,0.14)]" style={{ clipPath: "polygon(0% 35%, 58% 35%, 58% 10%, 100% 50%, 58% 90%, 58% 65%, 0% 65%)" }} />;
      case "bowtie_hazard":
        return renderMiniBowtieCard("#facc15", "#f8fafc", "#334155", undefined, true);
      case "bowtie_top_event":
        return renderMiniBowtieCard("#22c55e", "#ecfdf5", "#16a34a", "#16a34a");
      case "bowtie_threat":
        return renderMiniBowtieCard("#f97316", "#fff7ed", "#fb923c", "#f97316");
      case "bowtie_consequence":
        return renderMiniBowtieCard("#ef4444", "#fef2f2", "#f87171", "#ef4444");
      case "bowtie_escalation_factor":
      case "bowtie_recovery_measure":
      case "bowtie_degradation_indicator":
      case "bowtie_risk_rating":
        return renderMiniBowtieCard("#8b5cf6", "#f5f3ff", "#a78bfa", "#8b5cf6");
      case "bowtie_control":
        return renderMiniBowtieCard("#16a34a", "#ecfdf5", "#4ade80", "#16a34a");
      default:
        return <div className="h-12 w-12 rounded-2xl bg-slate-300 shadow-[0_6px_16px_rgba(15,23,42,0.14)]" />;
    }
  };

  const floatingButtonClass =
    "group flex h-[56px] w-[56px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]";

  if (isMobile) {
    return (
      <>
        {showAddMenu && (canWriteMap || canCreateSticky) ? (
          <div className="fixed inset-0 z-[97] md:hidden">
            <div className="absolute inset-0 bg-white" />
            <div className="absolute inset-0 overflow-y-auto px-5 pb-28 pt-5 text-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Add</p>
                  <h2 className="text-lg font-semibold text-slate-950">New component</h2>
                </div>
                <button
                  type="button"
                  aria-label="Close add menu"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-900"
                  onClick={() => setShowAddMenu(() => false)}
                >
                  <span className="text-xl leading-none">x</span>
                </button>
              </div>
              <div ref={addMenuRef} className="grid grid-cols-2 gap-3">
                {addItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="flex min-h-[112px] flex-col items-center justify-center px-3 py-3 text-center text-sm font-semibold text-slate-900 transition-transform duration-150 hover:-translate-y-0.5"
                    onClick={() => {
                      setShowAddMenu(() => false);
                      item.onClick();
                    }}
                  >
                    <span className="mb-3 flex h-16 items-center justify-center">{renderAddItemPreview(item.key)}</span>
                    <span className="text-sm font-semibold leading-tight text-slate-900">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="fixed inset-x-0 bottom-0 z-[95] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+72px)] md:hidden">
          <div className="mx-auto flex max-w-max items-center gap-2 rounded-[24px] border border-slate-300/80 bg-white/94 px-2.5 py-2.5 shadow-[0_18px_40px_rgba(15,23,42,0.22)] backdrop-blur">
            <Link href="/dashboard" aria-label="Back to dashboard" title="Back" className={floatingButtonClass}>
              <span
                aria-hidden="true"
                className="h-6 w-6 bg-current"
                style={{ WebkitMaskImage: "url('/icons/back.svg')", maskImage: "url('/icons/back.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
            </Link>
            <button type="button" aria-label="Map information" title="Map information" className={floatingButtonClass} onClick={onToggleMapInfo}>
              <span
                aria-hidden="true"
                className="h-6 w-6 bg-current"
                style={{ WebkitMaskImage: "url('/icons/info.svg')", maskImage: "url('/icons/info.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
            </button>
            <span title={!canWriteMap && !canCreateSticky ? addDisabledReason : "Add component"}>
              <button
                type="button"
                aria-label="Add component"
                title={undefined}
                onClick={() => setShowAddMenu((prev) => !prev)}
                disabled={!canWriteMap && !canCreateSticky}
                className={floatingButtonClass}
              >
                <span
                  aria-hidden="true"
                  className="h-6 w-6 bg-current"
                  style={{ WebkitMaskImage: "url('/icons/addcomponent.svg')", maskImage: "url('/icons/addcomponent.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                />
              </button>
            </span>
            <button
              type="button"
              aria-label="Reset zoom"
              title="Reset zoom"
              onClick={() => rf?.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 })}
              className={floatingButtonClass}
            >
              <span
                aria-hidden="true"
                className="h-6 w-6 bg-current"
                style={{ WebkitMaskImage: "url('/icons/resetzoom.svg')", maskImage: "url('/icons/resetzoom.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
            </button>
            <span title={canUseWizard ? "Open wizard" : wizardDisabledReason}>
              <button
                type="button"
                aria-label="Open wizard"
                title={undefined}
                onClick={onOpenWizard}
                disabled={!canUseWizard}
                className="group flex h-[56px] w-[56px] items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb_0%,#6d28d9_52%,#db2777_100%)] text-white shadow-[0_14px_30px_rgba(79,70,229,0.26)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#1d4ed8_0%,#5b21b6_52%,#be185d_100%)] hover:shadow-[0_18px_36px_rgba(79,70,229,0.32)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-[0_14px_30px_rgba(79,70,229,0.26)]"
              >
                <span
                  aria-hidden="true"
                  className="h-6 w-6 bg-current"
                  style={{ WebkitMaskImage: "url('/icons/wizard.svg')", maskImage: "url('/icons/wizard.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                />
              </button>
            </span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Link
        href="/dashboard"
        aria-label="Back to dashboard"
        title="Dashboard"
        className="fixed left-[20px] top-[82px] z-[74] group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
      >
        <span
          aria-hidden="true"
          className="h-7 w-7 bg-current"
          style={{ WebkitMaskImage: "url('/icons/back.svg')", maskImage: "url('/icons/back.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
        />
      </Link>
      <span title={canUseWizard ? "Open wizard" : wizardDisabledReason}>
        <button
          type="button"
          aria-label="Open wizard"
          title={undefined}
          onClick={onOpenWizard}
          disabled={!canUseWizard}
          className="fixed left-[20px] top-[156px] z-[74] group flex h-[62px] w-[62px] items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb_0%,#6d28d9_52%,#db2777_100%)] text-white shadow-[0_14px_30px_rgba(79,70,229,0.26)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#1d4ed8_0%,#5b21b6_52%,#be185d_100%)] hover:shadow-[0_18px_36px_rgba(79,70,229,0.32)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-[0_14px_30px_rgba(79,70,229,0.26)]"
        >
          <span
            aria-hidden="true"
            className="h-7 w-7 bg-current"
            style={{ WebkitMaskImage: "url('/icons/wizard.svg')", maskImage: "url('/icons/wizard.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
          />
        </button>
      </span>
      <div
        className="fixed top-[82px] z-[88] transition-[right] duration-300 ease-out"
        style={{ right: showMapInfoAside ? "315px" : "20px" }}
      >
        <div className="relative flex items-center gap-3">
        <div className="relative">
          <span title={canSaveTemplate ? "Save as template" : templateDisabledReason}>
            <button
              type="button"
              aria-label="Save as template"
              title={undefined}
              onClick={() => setShowTemplateMenu((prev) => !prev)}
              disabled={!canSaveTemplate}
              className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-black disabled:hover:shadow-[0_10px_24px_rgba(15,23,42,0.14)]"
            >
              <span
                aria-hidden="true"
                className="h-7 w-7 bg-current"
                style={{ WebkitMaskImage: "url('/icons/template.svg')", maskImage: "url('/icons/template.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
            </button>
          </span>
          {showTemplateMenu && canSaveTemplate ? (
            <div
              ref={templateMenuRef}
              className="absolute left-0 top-full z-[70] mt-2 w-[358px] rounded-none border border-slate-300 bg-white p-2 text-sm shadow-xl"
            >
              <input
                type="text"
                value={templateQuery}
                onChange={(e) => setTemplateQuery(e.target.value)}
                placeholder="Enter or search template name"
                className="w-full bg-transparent px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <div className="px-2 pb-1 text-[11px] text-slate-500">
                Select an existing template to overwrite it, or enter a new name to save a fresh template.
              </div>
              {templateQuery.trim().length > 0 || isLoadingTemplates || templateResults.length > 0 ? (
                <div className="mt-1 max-h-56 overflow-auto rounded-none border border-slate-300 bg-white">
                  {isLoadingTemplates ? (
                    <div className="px-3 py-2 text-xs text-slate-500">Loading templates...</div>
                  ) : templateResults.length ? (
                    templateResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100"
                        onClick={() => onSelectTemplate(result.id, result.name)}
                      >
                        <div className="font-semibold text-slate-900">{result.name}</div>
                        <div className="text-xs text-slate-500">Updated {result.updatedAt}</div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-slate-500">
                      {templateQuery.trim().length >= 4 ? "No templates found." : "Type 4 characters to start filtering your templates."}
                    </div>
                  )}
                </div>
              ) : null}
              <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-200 pt-2">
                {templateSaveMessage ? <div className="mr-auto text-xs font-medium text-emerald-600">{templateSaveMessage}</div> : null}
                <button
                  type="button"
                  className="rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={onSaveTemplate}
                  disabled={isSavingTemplate || !templateQuery.trim()}
                >
                  {isSavingTemplate ? "Saving..." : "Save Template"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Search components"
          title="Search components"
          onClick={() => setShowSearchMenu((prev) => !prev)}
          className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
        >
          <span
            aria-hidden="true"
            className="h-7 w-7 bg-current"
            style={{ WebkitMaskImage: "url('/icons/finddocument.svg')", maskImage: "url('/icons/finddocument.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
          />
        </button>
        <button
          type="button"
          aria-label="Zoom to fit"
          title="Zoom to fit"
          onClick={() => rf?.fitView({ duration: 300, padding: 0.2 })}
          className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
        >
          <span
            aria-hidden="true"
            className="h-7 w-7 bg-current"
            style={{ WebkitMaskImage: "url('/icons/zoomfit.svg')", maskImage: "url('/icons/zoomfit.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
          />
        </button>
        <button
          type="button"
          aria-label="Reset zoom"
          title="Reset zoom"
          onClick={() => rf?.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 })}
          className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
        >
          <span
            aria-hidden="true"
            className="h-7 w-7 bg-current"
            style={{ WebkitMaskImage: "url('/icons/resetzoom.svg')", maskImage: "url('/icons/resetzoom.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
          />
        </button>
        <div className="relative">
          <span title={!canPrint ? printDisabledReason : "Print to PDF"}>
            <button
              type="button"
              aria-label="Print to PDF"
              title={undefined}
              onClick={() => setShowPrintMenu((prev) => !prev)}
              disabled={!canPrint || isPreparingPrint}
              className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-black disabled:hover:shadow-[0_10px_24px_rgba(15,23,42,0.14)]"
            >
              {isPreparingPrint ? (
                <span aria-hidden="true" className="h-6 w-6 animate-spin rounded-full border-2 border-current border-r-transparent" />
              ) : (
                <span
                  aria-hidden="true"
                  className="h-7 w-7 bg-current"
                  style={{ WebkitMaskImage: "url('/icons/printer.svg')", maskImage: "url('/icons/printer.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                />
              )}
            </button>
          </span>
          {showPrintMenu && canPrint ? (
            <div ref={printMenuRef} className="absolute right-0 top-full z-[70] mt-2 min-w-[200px] rounded-none border border-slate-300 bg-white p-1 text-sm shadow-xl">
              <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100 disabled:opacity-50" onClick={onPrintCurrentView} disabled={isPreparingPrint}>
                Current View
              </button>
              <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100 disabled:opacity-50" onClick={onPrintSelectArea} disabled={isPreparingPrint}>
                Selected Area
              </button>
            </div>
          ) : null}
        </div>
        <span title={!canWriteMap && !canCreateSticky ? addDisabledReason : "Add component"}>
          <button
            type="button"
            aria-label="Add component"
            title={undefined}
            onClick={() => setShowAddMenu((prev) => !prev)}
            disabled={!canWriteMap && !canCreateSticky}
            className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-black disabled:hover:shadow-[0_10px_24px_rgba(15,23,42,0.14)]"
          >
            <span
              aria-hidden="true"
              className="h-7 w-7 bg-current"
              style={{ WebkitMaskImage: "url('/icons/addcomponent.svg')", maskImage: "url('/icons/addcomponent.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
            />
          </button>
        </span>
        {showAddMenu && (canWriteMap || canCreateSticky) && (
          <div ref={addMenuRef} className="absolute right-0 top-full z-[70] mt-2 min-w-[180px] rounded-none border border-slate-300 bg-white p-1 text-sm shadow-xl">
            {canWriteMap ? (
              <>
                {allowed.has("document") ? <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100" onClick={handleAddBlankDocument}>Document</button> : null}
                {addItems
                  .filter((item) => item.key !== "sticky_note")
                  .map((item) => (
                    <button
                      key={item.key}
                      className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100"
                      onClick={item.onClick}
                    >
                      {item.label}
                    </button>
                  ))}
              </>
            ) : null}
            {addItems.some((item) => item.key === "sticky_note") ? (
              <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100" onClick={handleAddStickyNote}>Sticky Note</button>
            ) : null}
          </div>
        )}
        {showSearchMenu && (
          <div
            ref={searchMenuRef}
            className="absolute left-0 top-full z-[70] mt-2 w-[358px] rounded-none border border-slate-300 bg-white p-2 text-sm shadow-xl"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Start typing to search documents"
              className="w-full bg-transparent px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery.trim().length > 0 && (
              <div className="mt-1 max-h-56 overflow-auto rounded-none border border-slate-300 bg-white">
                {searchResults.length ? (
                  searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100"
                      onClick={() => onSelectSearchResult(result.id)}
                    >
                      <div className="font-semibold text-slate-900">{result.label}</div>
                      <div className="text-xs text-slate-500">
                        {result.documentNumber ? `${result.documentNumber} · ` : ""}
                        {result.kind}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-slate-500">No results found</div>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </>
  );
}

type MapInfoAsideProps = {
  isMobile: boolean;
  showMapInfoAside: boolean;
  mapInfoAsideRef: RefObject<HTMLDivElement | null>;
  handleCloseMapInfoAside: () => void;
  canManageMapMetadata: boolean;
  isEditingMapInfo: boolean;
  mapInfoNameDraft: string;
  setMapInfoNameDraft: (value: string) => void;
  mapCodeDraft: string;
  setMapCodeDraft: (value: string) => void;
  mapInfoDescriptionDraft: string;
  setMapInfoDescriptionDraft: (value: string) => void;
  map: SystemMap;
  savingMapInfo: boolean;
  handleSaveMapInfo: () => Promise<void>;
  setIsEditingMapInfo: (value: boolean) => void;
  setMapInfoDescriptionDraftFromMap: () => void;
  setMapCodeDraftFromMap: () => void;
  mapMembers: MapMemberProfileRow[];
  userId: string | null;
  userEmail: string;
  savingMemberRoleUserId: string | null;
  handleUpdateMapMemberRole: (userId: string, role: "read" | "partial_write" | "full_write") => Promise<void>;
  mapRoleLabel: (role: string) => string;
};

export function MapInfoAside({
  isMobile,
  showMapInfoAside,
  mapInfoAsideRef,
  handleCloseMapInfoAside,
  canManageMapMetadata,
  isEditingMapInfo,
  mapInfoNameDraft,
  setMapInfoNameDraft,
  mapCodeDraft,
  setMapCodeDraft,
  mapInfoDescriptionDraft,
  setMapInfoDescriptionDraft,
  map,
  savingMapInfo,
  handleSaveMapInfo,
  setIsEditingMapInfo,
  setMapInfoDescriptionDraftFromMap,
  setMapCodeDraftFromMap,
  mapMembers,
  userId,
  userEmail,
  savingMemberRoleUserId,
  handleUpdateMapMemberRole,
  mapRoleLabel,
}: MapInfoAsideProps) {
  if (!showMapInfoAside) return null;
  return (
    <aside
      ref={mapInfoAsideRef}
      className={
        isMobile
          ? "fixed inset-0 z-[98] w-full bg-white text-slate-900"
          : "fixed bottom-0 right-0 top-[70px] z-[79] w-full max-w-[294px] border-l border-slate-300 bg-white shadow-[-16px_0_30px_rgba(15,23,42,0.26),0_8px_22px_rgba(15,23,42,0.14)]"
      }
    >
      <div className={`flex h-full flex-col overflow-auto ${isMobile ? "px-5 pb-28 pt-5" : "p-4"}`}>
        <div className="flex items-center justify-between border-b border-slate-300 pb-3">
          <h2 className="text-base font-semibold text-slate-900">Map Information</h2>
          <button
            className="rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100"
            onClick={handleCloseMapInfoAside}
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="text-sm text-slate-700">System Map Name
            {isEditingMapInfo ? (
              <input
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={mapInfoNameDraft}
                onChange={(e) => setMapInfoNameDraft(e.target.value)}
              />
            ) : (
              <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">{map.title}</div>
            )}
          </label>
          {canManageMapMetadata ? (
            <label className="text-sm text-slate-700">Map Code
              {isEditingMapInfo ? (
                <input
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-semibold uppercase tracking-[0.08em] text-black"
                  value={mapCodeDraft}
                  onChange={(e) => setMapCodeDraft(e.target.value.toUpperCase())}
                  placeholder="Enter map code"
                />
              ) : (
                <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-slate-900">
                  {map.map_code || "-"}
                </div>
              )}
            </label>
          ) : null}

          <label className="text-sm text-slate-700">Description
            {isEditingMapInfo ? (
              <textarea
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                rows={6}
                value={mapInfoDescriptionDraft}
                onChange={(e) => setMapInfoDescriptionDraft(e.target.value)}
              />
            ) : (
              <div className="mt-1 min-h-[132px] rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                {map.description?.trim() || "No description"}
              </div>
            )}
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          {isEditingMapInfo ? (
            <>
              <button
                className="rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100"
                onClick={() => void handleSaveMapInfo()}
                disabled={savingMapInfo}
              >
                {savingMapInfo ? "Saving..." : "Save"}
              </button>
              <button
                className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                onClick={() => {
                  setIsEditingMapInfo(false);
                  setMapInfoNameDraft(map.title);
                  setMapInfoDescriptionDraftFromMap();
                  setMapCodeDraftFromMap();
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            canManageMapMetadata ? (
              <button
                className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                onClick={() => setIsEditingMapInfo(true)}
              >
                Edit
              </button>
            ) : null
          )}
        </div>

        <div className="mt-5 border-t border-slate-300 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">Map Access</h3>
          <div className="mt-2 space-y-2">
            {mapMembers.length ? (
              mapMembers.map((member) => {
                const canEditMemberRole = canManageMapMetadata && member.user_id !== map.owner_id;
                const displayName = member.full_name?.trim() || (member.user_id === map.owner_id ? "Map Owner" : "User");
                const displayEmail = member.email?.trim() || (member.user_id === userId ? userEmail : "");
                return (
                  <div key={member.user_id} className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-sm font-semibold text-slate-900">{displayName}</div>
                    <div className="text-xs text-slate-600">{displayEmail || member.user_id}</div>
                    <div className="mt-2">
                      {canEditMemberRole ? (
                        <select
                          className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                          value={member.role}
                          disabled={savingMemberRoleUserId === member.user_id}
                          onChange={(e) =>
                            void handleUpdateMapMemberRole(
                              member.user_id,
                              e.target.value as "read" | "partial_write" | "full_write"
                            )
                          }
                        >
                          <option value="read">Read</option>
                          <option value="partial_write">Partial write</option>
                          <option value="full_write">Full write</option>
                        </select>
                      ) : (
                        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">
                          {member.user_id === map.owner_id ? "Owner (Full write)" : mapRoleLabel(member.role)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">No linked users</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
