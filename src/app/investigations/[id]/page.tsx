"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import styles from "@/components/dashboard/DashboardShell.module.css";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardTableLoadingState";
import { accessBlocksInvestigationEntry, accessRequiresSelection, fetchAccessState, type BillingAccessState } from "@/lib/access";
import { createSupabaseBrowser } from "@/lib/supabase/client";

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

type ScopeFormState = {
  incident_long_description: string;
  incident_occurred_at: string;
  incident_location: string;
  responsible_person_name: string;
  investigation_lead_name: string;
  items_of_interest: string;
};

type MemberProfileRow = {
  map_id: string;
  user_id: string;
  role: string;
  email: string | null;
};

type SequenceElementRow = {
  id: string;
  heading: string;
  element_config: Record<string, unknown> | null;
  pos_x: number;
  pos_y: number;
  created_at: string;
};

type SequenceReportRow = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  location: string;
  sortTime: number;
  pos_x: number;
  pos_y: number;
  created_at: string;
};

type PersonElementRow = {
  id: string;
  heading: string;
  element_config: Record<string, unknown> | null;
  created_at: string;
};

type PeopleReportRow = {
  id: string;
  role_name: string;
  person_name: string;
};

type FactorElementRow = {
  id: string;
  element_type: "incident_factor" | "incident_system_factor";
  heading: string;
  element_config: Record<string, unknown> | null;
  created_at: string;
};

type FactorReportRow = {
  id: string;
  type: "Factor" | "System Factor";
  title: string;
  description: string;
  factor_presence: string;
  classification: string;
  category: string;
  created_at: string;
};

type TaskConditionElementRow = {
  id: string;
  heading: string;
  element_config: Record<string, unknown> | null;
  created_at: string;
};

type TaskConditionReportRow = {
  id: string;
  title: string;
  description: string;
  state: string;
  environmental_context: string;
  created_at: string;
};

type ControlBarrierElementRow = {
  id: string;
  heading: string;
  element_config: Record<string, unknown> | null;
  created_at: string;
};

type ControlBarrierReportRow = {
  id: string;
  title: string;
  description: string;
  barrier_state: string;
  barrier_role: string;
  control_type: string;
  owner_text: string;
  created_at: string;
};

type EvidenceElementRow = {
  id: string;
  heading: string;
  element_config: Record<string, unknown> | null;
  created_at: string;
};

type EvidenceReportRow = {
  id: string;
  title: string;
  description: string;
  evidence_type: string;
  source: string;
  attachment_name: string;
  attachment_url: string;
  created_at: string;
};

type FindingElementRow = {
  id: string;
  heading: string;
  element_config: Record<string, unknown> | null;
  created_at: string;
};

type FindingReportRow = {
  id: string;
  title: string;
  description: string;
  confidence_level: string;
  created_at: string;
};

type RecommendationElementRow = {
  id: string;
  heading: string;
  element_config: Record<string, unknown> | null;
  created_at: string;
};

type RecommendationReportRow = {
  id: string;
  title: string;
  description: string;
  action_type: string;
  owner_text: string;
  due_date: string;
  created_at: string;
};

type ReportTab =
  | "setup-scope"
  | "sequence"
  | "people"
  | "factors"
  | "task-condition"
  | "control-barrier"
  | "evidence"
  | "finding"
  | "recommendation";

type FactorFilterKey = "presence" | "classification" | "category";
type ColumnFilterKey =
  | FactorFilterKey
  | "taskState"
  | "barrierState"
  | "barrierRole"
  | "controlType"
  | "evidenceType"
  | "findingConfidence"
  | "recommendationActionType";

type FactorFilterMenuPosition = {
  top: number;
  left: number;
};

type MobileFilterSection = {
  key: string;
  label: string;
  options: string[];
  selected: string[] | null;
  onToggle: (value: string) => void;
  onClear: () => void;
};

const reportTabs: Array<{ id: ReportTab; label: string }> = [
  { id: "setup-scope", label: "Scope" },
  { id: "sequence", label: "Sequence" },
  { id: "people", label: "People" },
  { id: "factors", label: "Factors" },
  { id: "task-condition", label: "Task/Condition" },
  { id: "control-barrier", label: "Control/ Barrier" },
  { id: "evidence", label: "Evidence" },
  { id: "finding", label: "Finding" },
  { id: "recommendation", label: "Recommendation" },
];

const TABLE_PAGE_SIZE = 5;

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatShortDate = (value: string) =>
  new Date(value).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatLabel = (value: string) =>
  value
    .trim()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getFactorPresencePillClass = (value: string) => {
  switch (value) {
    case "Present":
      return styles.factorPillPresent;
    case "Absent":
      return styles.factorPillAbsent;
    default:
      return styles.factorPillNeutral;
  }
};

const getFactorClassificationPillClass = (value: string) => {
  switch (value) {
    case "Essential":
      return styles.factorPillEssential;
    case "Contributing":
      return styles.factorPillContributing;
    case "Predisposing":
      return styles.factorPillPredisposing;
    case "Neutral":
    default:
      return styles.factorPillNeutral;
  }
};

const getTaskConditionStatePillClass = (value: string) => {
  switch (value) {
    case "Normal":
      return styles.factorPillPresent;
    case "Abnormal":
      return styles.factorPillAbsent;
    default:
      return styles.factorPillNeutral;
  }
};

const getBarrierStatePillClass = (value: string) => {
  switch (value) {
    case "Effective":
      return styles.factorPillPresent;
    case "Failed":
    case "Missing":
      return styles.factorPillAbsent;
    default:
      return styles.factorPillNeutral;
  }
};

const getBarrierRolePillClass = (value: string) => {
  switch (value) {
    case "Preventive":
      return styles.factorPillPresent;
    case "Mitigative":
      return styles.factorPillContributing;
    case "Recovery":
      return styles.factorPillPredisposing;
    default:
      return styles.factorPillNeutral;
  }
};

const getFindingConfidencePillClass = (value: string) => {
  switch (value) {
    case "High":
      return styles.factorPillPresent;
    case "Medium":
      return styles.factorPillContributing;
    case "Low":
      return styles.factorPillAbsent;
    default:
      return styles.factorPillNeutral;
  }
};

const getRecommendationActionTypePillClass = (value: string) => {
  switch (value) {
    case "Preventive":
      return styles.factorPillPresent;
    case "Corrective":
      return styles.factorPillContributing;
    default:
      return styles.factorPillNeutral;
  }
};

export default function InvestigationReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<MapRow | null>(null);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [scopeForm, setScopeForm] = useState<ScopeFormState>({
    incident_long_description: "",
    incident_occurred_at: "",
    incident_location: "",
    responsible_person_name: "",
    investigation_lead_name: "",
    items_of_interest: "",
  });
  const [scopeSaving, setScopeSaving] = useState(false);
  const [scopeEditing, setScopeEditing] = useState(false);
  const [scopeMessage, setScopeMessage] = useState<string | null>(null);
  const [scopeMessageIsError, setScopeMessageIsError] = useState(false);
  const [sequenceRows, setSequenceRows] = useState<SequenceReportRow[]>([]);
  const [peopleRows, setPeopleRows] = useState<PeopleReportRow[]>([]);
  const [factorRows, setFactorRows] = useState<FactorReportRow[]>([]);
  const [taskConditionRows, setTaskConditionRows] = useState<TaskConditionReportRow[]>([]);
  const [controlBarrierRows, setControlBarrierRows] = useState<ControlBarrierReportRow[]>([]);
  const [evidenceRows, setEvidenceRows] = useState<EvidenceReportRow[]>([]);
  const [findingRows, setFindingRows] = useState<FindingReportRow[]>([]);
  const [recommendationRows, setRecommendationRows] = useState<RecommendationReportRow[]>([]);
  const [activeTab, setActiveTab] = useState<ReportTab>("setup-scope");
  const [sequenceSortDirection, setSequenceSortDirection] = useState<"asc" | "desc">("asc");
  const [factorFilters, setFactorFilters] = useState<Record<FactorFilterKey, string[] | null>>({
    presence: null,
    classification: null,
    category: null,
  });
  const [taskConditionStateFilter, setTaskConditionStateFilter] = useState<string[] | null>(null);
  const [controlBarrierFilters, setControlBarrierFilters] = useState<{
    barrierState: string[] | null;
    barrierRole: string[] | null;
    controlType: string[] | null;
  }>({
    barrierState: null,
    barrierRole: null,
    controlType: null,
  });
  const [evidenceTypeFilter, setEvidenceTypeFilter] = useState<string[] | null>(null);
  const [findingConfidenceFilter, setFindingConfidenceFilter] = useState<string[] | null>(null);
  const [recommendationActionTypeFilter, setRecommendationActionTypeFilter] = useState<string[] | null>(null);
  const [openFactorFilter, setOpenFactorFilter] = useState<ColumnFilterKey | null>(null);
  const [factorFilterMenuPosition, setFactorFilterMenuPosition] = useState<FactorFilterMenuPosition | null>(null);
  const [mobileFilterOverlayOpen, setMobileFilterOverlayOpen] = useState(false);
  const [accessState, setAccessState] = useState<BillingAccessState | null>(null);
  const [tablePages, setTablePages] = useState<Record<string, number>>({
    sequence: 1,
    factors: 1,
    "task-condition": 1,
    "control-barrier": 1,
    evidence: 1,
    finding: 1,
    recommendation: 1,
  });
  const factorFilterRef = useRef<HTMLDivElement | null>(null);

  const sortedSequenceRows = useMemo(() => {
    const rows = [...sequenceRows];
    rows.sort((a, b) => {
      const timeCompare = a.sortTime - b.sortTime;
      if (timeCompare !== 0) return sequenceSortDirection === "asc" ? timeCompare : -timeCompare;
      if (a.pos_x !== b.pos_x) return a.pos_x - b.pos_x;
      if (a.pos_y !== b.pos_y) return a.pos_y - b.pos_y;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    return rows;
  }, [sequenceRows, sequenceSortDirection]);

  const factorFilterOptions = useMemo(
    () => ({
      presence: Array.from(new Set(factorRows.map((row) => row.factor_presence).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
      classification: Array.from(new Set(factorRows.map((row) => row.classification).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
      category: Array.from(new Set(factorRows.map((row) => row.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    }),
    [factorRows]
  );

  const taskConditionStateOptions = useMemo(
    () => Array.from(new Set(taskConditionRows.map((row) => row.state).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [taskConditionRows]
  );

  const controlBarrierFilterOptions = useMemo(
    () => ({
      barrierState: Array.from(new Set(controlBarrierRows.map((row) => row.barrier_state).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
      barrierRole: Array.from(new Set(controlBarrierRows.map((row) => row.barrier_role).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
      controlType: Array.from(new Set(controlBarrierRows.map((row) => row.control_type).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    }),
    [controlBarrierRows]
  );

  const evidenceTypeOptions = useMemo(
    () => Array.from(new Set(evidenceRows.map((row) => row.evidence_type).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [evidenceRows]
  );

  const findingConfidenceOptions = useMemo(
    () => Array.from(new Set(findingRows.map((row) => row.confidence_level).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [findingRows]
  );

  const recommendationActionTypeOptions = useMemo(
    () =>
      Array.from(new Set(recommendationRows.map((row) => row.action_type).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [recommendationRows]
  );

  const filteredFactorRows = useMemo(
    () =>
      factorRows.filter((row) => {
        const presenceMatch =
          factorFilters.presence === null || factorFilters.presence.includes(row.factor_presence);
        const classificationMatch =
          factorFilters.classification === null || factorFilters.classification.includes(row.classification);
        const categoryMatch =
          factorFilters.category === null || factorFilters.category.includes(row.category);

        return presenceMatch && classificationMatch && categoryMatch;
      }),
    [factorFilters, factorRows]
  );

  const sortedFactorRows = useMemo(() => {
    const classificationOrder = new Map([
      ["Essential", 0],
      ["Contributing", 1],
      ["Predisposing", 2],
      ["Neutral", 3],
    ]);
    const presenceOrder = new Map([
      ["Absent", 0],
      ["Present", 1],
    ]);

    return [...filteredFactorRows].sort((a, b) => {
      const classificationCompare =
        (classificationOrder.get(a.classification) ?? Number.MAX_SAFE_INTEGER) -
        (classificationOrder.get(b.classification) ?? Number.MAX_SAFE_INTEGER);
      if (classificationCompare !== 0) return classificationCompare;

      const presenceCompare =
        (presenceOrder.get(a.factor_presence) ?? Number.MAX_SAFE_INTEGER) -
        (presenceOrder.get(b.factor_presence) ?? Number.MAX_SAFE_INTEGER);
      if (presenceCompare !== 0) return presenceCompare;

      return a.title.localeCompare(b.title);
    });
  }, [filteredFactorRows]);

  const hasActiveFactorFilters = Object.values(factorFilters).some((value) => value !== null);

  const filteredTaskConditionRows = useMemo(
    () =>
      taskConditionRows.filter(
        (row) => taskConditionStateFilter === null || taskConditionStateFilter.includes(row.state)
      ),
    [taskConditionRows, taskConditionStateFilter]
  );

  const hasActiveTaskConditionStateFilter = taskConditionStateFilter !== null;

  const filteredControlBarrierRows = useMemo(
    () =>
      controlBarrierRows.filter((row) => {
        const barrierStateMatch =
          controlBarrierFilters.barrierState === null || controlBarrierFilters.barrierState.includes(row.barrier_state);
        const barrierRoleMatch =
          controlBarrierFilters.barrierRole === null || controlBarrierFilters.barrierRole.includes(row.barrier_role);
        const controlTypeMatch =
          controlBarrierFilters.controlType === null || controlBarrierFilters.controlType.includes(row.control_type);

        return barrierStateMatch && barrierRoleMatch && controlTypeMatch;
      }),
    [controlBarrierFilters, controlBarrierRows]
  );

  const hasActiveControlBarrierFilters = Object.values(controlBarrierFilters).some((value) => value !== null);

  const filteredEvidenceRows = useMemo(
    () =>
      evidenceRows.filter(
        (row) => evidenceTypeFilter === null || evidenceTypeFilter.includes(row.evidence_type)
      ),
    [evidenceRows, evidenceTypeFilter]
  );

  const hasActiveEvidenceTypeFilter = evidenceTypeFilter !== null;

  const filteredFindingRows = useMemo(
    () =>
      findingRows.filter(
        (row) => findingConfidenceFilter === null || findingConfidenceFilter.includes(row.confidence_level)
      ),
    [findingRows, findingConfidenceFilter]
  );

  const hasActiveFindingConfidenceFilter = findingConfidenceFilter !== null;

  const filteredRecommendationRows = useMemo(
    () =>
      recommendationRows.filter(
        (row) =>
          recommendationActionTypeFilter === null || recommendationActionTypeFilter.includes(row.action_type)
      ),
    [recommendationRows, recommendationActionTypeFilter]
  );

  const hasActiveRecommendationActionTypeFilter = recommendationActionTypeFilter !== null;

  const getPagedRows = <T,>(rows: T[], key: keyof typeof tablePages) => {
    const totalPages = Math.max(1, Math.ceil(rows.length / TABLE_PAGE_SIZE));
    const currentPage = Math.min(tablePages[key] ?? 1, totalPages);
    const start = (currentPage - 1) * TABLE_PAGE_SIZE;
    return {
      rows: rows.slice(start, start + TABLE_PAGE_SIZE),
      currentPage,
      totalPages,
    };
  };

  const renderPagination = (key: keyof typeof tablePages, totalRows: number, currentPage: number, totalPages: number) => {
    return (
      <div className={styles.tablePagination}>
        <button
          type="button"
          className={styles.tablePageButton}
          onClick={() =>
            setTablePages((current) => ({
              ...current,
              [key]: Math.max(1, (current[key] ?? 1) - 1),
            }))
          }
          disabled={currentPage <= 1}
        >
          Previous
        </button>
        <span className={styles.tablePageStatus}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          className={styles.tablePageButton}
          onClick={() =>
            setTablePages((current) => ({
              ...current,
              [key]: Math.min(totalPages, (current[key] ?? 1) + 1),
            }))
          }
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  useEffect(() => {
    setMobileFilterOverlayOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (!openFactorFilter) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!factorFilterRef.current?.contains(event.target as Node)) {
        setOpenFactorFilter(null);
        setFactorFilterMenuPosition(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenFactorFilter(null);
        setFactorFilterMenuPosition(null);
      }
    };

    const handleViewportChange = () => {
      setOpenFactorFilter(null);
      setFactorFilterMenuPosition(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [openFactorFilter]);

  useEffect(() => {
    setTablePages((current) => ({
      ...current,
      factors: 1,
    }));
  }, [factorFilters]);

  useEffect(() => {
    setTablePages((current) => ({
      ...current,
      "task-condition": 1,
    }));
  }, [taskConditionStateFilter]);

  useEffect(() => {
    setTablePages((current) => ({
      ...current,
      "control-barrier": 1,
    }));
  }, [controlBarrierFilters]);

  useEffect(() => {
    setTablePages((current) => ({
      ...current,
      evidence: 1,
    }));
  }, [evidenceTypeFilter]);

  useEffect(() => {
    setTablePages((current) => ({
      ...current,
      finding: 1,
    }));
  }, [findingConfidenceFilter]);

  useEffect(() => {
    setTablePages((current) => ({
      ...current,
      recommendation: 1,
    }));
  }, [recommendationActionTypeFilter]);

  const toggleFactorFilterValue = (key: FactorFilterKey, value: string) => {
    const options = factorFilterOptions[key];

    setFactorFilters((current) => {
      const existing = current[key];
      const next = new Set(existing ?? options);

      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }

      return {
        ...current,
        [key]: next.size === options.length ? null : Array.from(next),
      };
    });
  };

  const clearFactorFilter = (key: FactorFilterKey) => {
    setFactorFilters((current) => ({
      ...current,
      [key]: null,
    }));
  };

  const toggleTaskConditionStateFilterValue = (value: string) => {
    setTaskConditionStateFilter((current) => {
      const next = new Set(current ?? taskConditionStateOptions);

      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }

      return next.size === taskConditionStateOptions.length ? null : Array.from(next);
    });
  };

  const toggleControlBarrierFilterValue = (
    key: keyof typeof controlBarrierFilters,
    value: string
  ) => {
    const options = controlBarrierFilterOptions[key];

    setControlBarrierFilters((current) => {
      const next = new Set(current[key] ?? options);

      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }

      return {
        ...current,
        [key]: next.size === options.length ? null : Array.from(next),
      };
    });
  };

  const toggleEvidenceTypeFilterValue = (value: string) => {
    setEvidenceTypeFilter((current) => {
      const next = new Set(current ?? evidenceTypeOptions);

      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }

      return next.size === evidenceTypeOptions.length ? null : Array.from(next);
    });
  };

  const toggleFindingConfidenceFilterValue = (value: string) => {
    setFindingConfidenceFilter((current) => {
      const next = new Set(current ?? findingConfidenceOptions);

      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }

      return next.size === findingConfidenceOptions.length ? null : Array.from(next);
    });
  };

  const toggleRecommendationActionTypeFilterValue = (value: string) => {
    setRecommendationActionTypeFilter((current) => {
      const next = new Set(current ?? recommendationActionTypeOptions);

      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }

      return next.size === recommendationActionTypeOptions.length ? null : Array.from(next);
    });
  };

  const clearAllFactorFilters = () => {
    setFactorFilters({
      presence: null,
      classification: null,
      category: null,
    });
    setOpenFactorFilter(null);
    setFactorFilterMenuPosition(null);
  };

  const clearTaskConditionStateFilter = () => {
    setTaskConditionStateFilter(null);
    setOpenFactorFilter(null);
    setFactorFilterMenuPosition(null);
  };

  const clearControlBarrierFilter = (key: keyof typeof controlBarrierFilters) => {
    setControlBarrierFilters((current) => ({
      ...current,
      [key]: null,
    }));
  };

  const clearAllControlBarrierFilters = () => {
    setControlBarrierFilters({
      barrierState: null,
      barrierRole: null,
      controlType: null,
    });
    setOpenFactorFilter(null);
    setFactorFilterMenuPosition(null);
  };

  const clearEvidenceTypeFilter = () => {
    setEvidenceTypeFilter(null);
    setOpenFactorFilter(null);
    setFactorFilterMenuPosition(null);
  };

  const clearFindingConfidenceFilter = () => {
    setFindingConfidenceFilter(null);
    setOpenFactorFilter(null);
    setFactorFilterMenuPosition(null);
  };

  const clearRecommendationActionTypeFilter = () => {
    setRecommendationActionTypeFilter(null);
    setOpenFactorFilter(null);
    setFactorFilterMenuPosition(null);
  };

  const renderActiveFactorFilterMenu = () => {
    if (!openFactorFilter || !factorFilterMenuPosition) return null;

    const key = openFactorFilter;
    const isTaskState = key === "taskState";
    const isControlBarrierKey =
      key === "barrierState" || key === "barrierRole" || key === "controlType";
    const isEvidenceType = key === "evidenceType";
    const isFindingConfidence = key === "findingConfidence";
    const isRecommendationActionType = key === "recommendationActionType";
    const options = isTaskState
      ? taskConditionStateOptions
      : isControlBarrierKey
        ? controlBarrierFilterOptions[key]
        : isEvidenceType
          ? evidenceTypeOptions
          : isFindingConfidence
            ? findingConfidenceOptions
            : isRecommendationActionType
              ? recommendationActionTypeOptions
          : factorFilterOptions[key];
    const selected = isTaskState
      ? taskConditionStateFilter
      : isControlBarrierKey
        ? controlBarrierFilters[key]
        : isEvidenceType
          ? evidenceTypeFilter
          : isFindingConfidence
            ? findingConfidenceFilter
            : isRecommendationActionType
              ? recommendationActionTypeFilter
          : factorFilters[key];
    const isFiltered = selected !== null;
    const label =
      key === "presence"
        ? "Presence"
        : key === "classification"
          ? "Classification"
          : key === "category"
            ? "Category"
            : key === "taskState"
              ? "State"
              : key === "barrierState"
                ? "Barrier State"
                : key === "barrierRole"
                  ? "Barrier Role"
                  : key === "controlType"
                    ? "Control Type"
                    : key === "evidenceType"
                      ? "Type"
                      : key === "findingConfidence"
                        ? "Confidence Level"
                        : "Action Type";

    return (
      <div
        ref={factorFilterRef}
        className={styles.tableFilterMenu}
        role="dialog"
        aria-label={`${label} filter`}
        style={{
          position: "fixed",
          top: factorFilterMenuPosition.top,
          left: factorFilterMenuPosition.left,
        }}
      >
        <div className={styles.tableFilterMenuHeader}>
          <strong>{label}</strong>
          <button
            type="button"
            className={styles.tableFilterClearButton}
            onClick={() => {
              if (isTaskState) {
                clearTaskConditionStateFilter();
              } else if (isControlBarrierKey) {
                clearControlBarrierFilter(key);
              } else if (isEvidenceType) {
                clearEvidenceTypeFilter();
              } else if (isFindingConfidence) {
                clearFindingConfidenceFilter();
              } else if (isRecommendationActionType) {
                clearRecommendationActionTypeFilter();
              } else {
                clearFactorFilter(key);
              }
            }}
            disabled={!isFiltered}
          >
            Clear
          </button>
        </div>

        <div className={styles.tableFilterOptions}>
          {options.length === 0 ? (
            <span className={styles.tableFilterEmpty}>No values available</span>
          ) : (
            options.map((option) => (
              <label key={option} className={styles.tableFilterOption}>
                <input
                  type="checkbox"
                  checked={selected === null ? true : selected.includes(option)}
                  onChange={() => {
                    if (isTaskState) {
                      toggleTaskConditionStateFilterValue(option);
                    } else if (isControlBarrierKey) {
                      toggleControlBarrierFilterValue(key, option);
                    } else if (isEvidenceType) {
                      toggleEvidenceTypeFilterValue(option);
                    } else if (isFindingConfidence) {
                      toggleFindingConfidenceFilterValue(option);
                    } else if (isRecommendationActionType) {
                      toggleRecommendationActionTypeFilterValue(option);
                    } else {
                      toggleFactorFilterValue(key, option);
                    }
                  }}
                />
                <span>{option}</span>
              </label>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderFactorFilterHeader = (key: ColumnFilterKey, label: string) => {
    const selected =
      key === "taskState"
        ? taskConditionStateFilter
        : key === "barrierState" || key === "barrierRole" || key === "controlType"
          ? controlBarrierFilters[key]
          : key === "evidenceType"
            ? evidenceTypeFilter
            : key === "findingConfidence"
              ? findingConfidenceFilter
              : key === "recommendationActionType"
                ? recommendationActionTypeFilter
          : factorFilters[key];
    const isOpen = openFactorFilter === key;
    const isFiltered = selected !== null;

    return (
      <div className={styles.tableFilter}>
        <button
          type="button"
          className={`${styles.tableFilterButton} ${isFiltered ? styles.tableFilterButtonActive : ""}`}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const menuWidth = 220;
            const viewportPadding = 12;
            const left = Math.max(
              viewportPadding,
              Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - viewportPadding)
            );

            if (isOpen) {
              setOpenFactorFilter(null);
              setFactorFilterMenuPosition(null);
              return;
            }

            setOpenFactorFilter(key);
            setFactorFilterMenuPosition({
              top: rect.bottom + 10,
              left,
            });
          }}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <span>{label}</span>
          <span className={styles.tableFilterIcon} aria-hidden="true" />
        </button>
      </div>
    );
  };

  const mobileFilterSections: MobileFilterSection[] = useMemo(() => {
    switch (activeTab) {
      case "factors":
        return [
          {
            key: "presence",
            label: "Presence",
            options: factorFilterOptions.presence,
            selected: factorFilters.presence,
            onToggle: (value) => toggleFactorFilterValue("presence", value),
            onClear: () => clearFactorFilter("presence"),
          },
          {
            key: "classification",
            label: "Classification",
            options: factorFilterOptions.classification,
            selected: factorFilters.classification,
            onToggle: (value) => toggleFactorFilterValue("classification", value),
            onClear: () => clearFactorFilter("classification"),
          },
          {
            key: "category",
            label: "Category",
            options: factorFilterOptions.category,
            selected: factorFilters.category,
            onToggle: (value) => toggleFactorFilterValue("category", value),
            onClear: () => clearFactorFilter("category"),
          },
        ];
      case "task-condition":
        return [
          {
            key: "taskState",
            label: "State",
            options: taskConditionStateOptions,
            selected: taskConditionStateFilter,
            onToggle: toggleTaskConditionStateFilterValue,
            onClear: clearTaskConditionStateFilter,
          },
        ];
      case "control-barrier":
        return [
          {
            key: "barrierState",
            label: "Barrier State",
            options: controlBarrierFilterOptions.barrierState,
            selected: controlBarrierFilters.barrierState,
            onToggle: (value) => toggleControlBarrierFilterValue("barrierState", value),
            onClear: () => clearControlBarrierFilter("barrierState"),
          },
          {
            key: "barrierRole",
            label: "Barrier Role",
            options: controlBarrierFilterOptions.barrierRole,
            selected: controlBarrierFilters.barrierRole,
            onToggle: (value) => toggleControlBarrierFilterValue("barrierRole", value),
            onClear: () => clearControlBarrierFilter("barrierRole"),
          },
          {
            key: "controlType",
            label: "Control Type",
            options: controlBarrierFilterOptions.controlType,
            selected: controlBarrierFilters.controlType,
            onToggle: (value) => toggleControlBarrierFilterValue("controlType", value),
            onClear: () => clearControlBarrierFilter("controlType"),
          },
        ];
      case "evidence":
        return [
          {
            key: "evidenceType",
            label: "Type",
            options: evidenceTypeOptions,
            selected: evidenceTypeFilter,
            onToggle: toggleEvidenceTypeFilterValue,
            onClear: clearEvidenceTypeFilter,
          },
        ];
      case "finding":
        return [
          {
            key: "findingConfidence",
            label: "Confidence Level",
            options: findingConfidenceOptions,
            selected: findingConfidenceFilter,
            onToggle: toggleFindingConfidenceFilterValue,
            onClear: clearFindingConfidenceFilter,
          },
        ];
      case "recommendation":
        return [
          {
            key: "recommendationActionType",
            label: "Action Type",
            options: recommendationActionTypeOptions,
            selected: recommendationActionTypeFilter,
            onToggle: toggleRecommendationActionTypeFilterValue,
            onClear: clearRecommendationActionTypeFilter,
          },
        ];
      default:
        return [];
    }
  }, [
    activeTab,
    controlBarrierFilterOptions.barrierRole,
    controlBarrierFilterOptions.barrierState,
    controlBarrierFilterOptions.controlType,
    controlBarrierFilters.barrierRole,
    controlBarrierFilters.barrierState,
    controlBarrierFilters.controlType,
    evidenceTypeFilter,
    evidenceTypeOptions,
    factorFilterOptions.category,
    factorFilterOptions.classification,
    factorFilterOptions.presence,
    factorFilters.category,
    factorFilters.classification,
    factorFilters.presence,
    findingConfidenceFilter,
    findingConfidenceOptions,
    recommendationActionTypeFilter,
    recommendationActionTypeOptions,
    taskConditionStateFilter,
    taskConditionStateOptions,
  ]);

  const hasMobileFilterSections = mobileFilterSections.length > 0;
  const mobileActiveFilterCount = mobileFilterSections.filter((section) => section.selected !== null).length;

  const clearAllMobileFilters = () => {
    switch (activeTab) {
      case "factors":
        clearAllFactorFilters();
        break;
      case "task-condition":
        clearTaskConditionStateFilter();
        break;
      case "control-barrier":
        clearAllControlBarrierFilters();
        break;
      case "evidence":
        clearEvidenceTypeFilter();
        break;
      case "finding":
        clearFindingConfidenceFilter();
        break;
      case "recommendation":
        clearRecommendationActionTypeFilter();
        break;
      default:
        break;
    }
  };

  const renderMobileFiltersButton = () =>
    hasMobileFilterSections ? (
      <div className={styles.reportMobileFiltersButtonWrap}>
        <button
          type="button"
          className={styles.reportMobileFiltersButton}
          onClick={() => setMobileFilterOverlayOpen(true)}
        >
          <span className={styles.reportMobileFiltersButtonLabel}>
            <span className={styles.tableFilterIcon} aria-hidden="true" />
            <span>Filters</span>
          </span>
          {mobileActiveFilterCount > 0 ? (
            <span className={styles.reportMobileFiltersCount}>{mobileActiveFilterCount}</span>
          ) : null}
        </button>
      </div>
    ) : null;

  const renderMobileFilterOverlay = () => {
    if (!mobileFilterOverlayOpen || !hasMobileFilterSections) return null;

    return (
      <div
        className={styles.reportMobileFilterOverlay}
        role="dialog"
        aria-modal="true"
        aria-label="Filter options"
      >
        <div className={styles.reportMobileFilterOverlayCard}>
          <div className={styles.reportMobileFilterOverlayHeader}>
            <div>
              <p className={styles.reportMobileFilterOverlayEyebrow}>Filters</p>
              <h3 className={styles.reportMobileFilterOverlayTitle}>
                {reportTabs.find((tab) => tab.id === activeTab)?.label}
              </h3>
            </div>
            <button
              type="button"
              className={styles.reportMobileFilterOverlayClose}
              onClick={() => setMobileFilterOverlayOpen(false)}
            >
              Close
            </button>
          </div>

          <div className={styles.reportMobileFilterOverlayBody}>
            {mobileFilterSections.map((section) => (
              <section key={section.key} className={styles.reportMobileFilterSection}>
                <div className={styles.reportMobileFilterSectionHeader}>
                  <strong>{section.label}</strong>
                  <button
                    type="button"
                    className={styles.tableFilterClearButton}
                    onClick={section.onClear}
                    disabled={section.selected === null}
                  >
                    Clear
                  </button>
                </div>
                <div className={styles.reportMobileFilterOptions}>
                  {section.options.length === 0 ? (
                    <span className={styles.tableFilterEmpty}>No values available</span>
                  ) : (
                    section.options.map((option) => (
                      <label key={option} className={styles.tableFilterOption}>
                        <input
                          type="checkbox"
                          checked={section.selected === null ? true : section.selected.includes(option)}
                          onChange={() => section.onToggle(option)}
                        />
                        <span>{option}</span>
                      </label>
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>

          <div className={styles.reportMobileFilterOverlayActions}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={clearAllMobileFilters}
            >
              Clear All
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonAccent}`}
              onClick={() => setMobileFilterOverlayOpen(false)}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMobileEmptyState = (message: string) => (
    <div className={styles.reportMobileEmptyState}>
      <p className={styles.subtitle}>{message}</p>
    </div>
  );

  const getEmptyTableMessage = (subject: string) =>
    `No ${subject} yet. Add information on your system map for items to appear here.`;

  const renderTableEmptyRow = (colSpan: number, message: string) => (
    <tr>
      <td colSpan={colSpan} className={styles.emptyState}>
        <div className={styles.tableEmptyState}>{message}</div>
      </td>
    </tr>
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push(`/login?returnTo=${encodeURIComponent(`/investigations/${params.id}`)}`);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push(`/login?returnTo=${encodeURIComponent(`/investigations/${params.id}`)}`);
        return;
      }

      const accessState = await fetchAccessState(session.access_token);
      setAccessState(accessState);

      if (accessRequiresSelection(accessState)) {
        router.push("/subscribe");
        return;
      }

      if (accessBlocksInvestigationEntry(accessState)) {
        router.push("/dashboard?mapAccess=blocked");
        return;
      }

      const [
        { data: mapRow, error: mapError },
        { data: memberRows, error: memberError },
        { data: sequenceElements, error: sequenceError },
        { data: personElements, error: peopleError },
        { data: factorElements, error: factorError },
        { data: taskConditionElements, error: taskConditionError },
        { data: controlBarrierElements, error: controlBarrierError },
        { data: evidenceElements, error: evidenceError },
        { data: findingElements, error: findingError },
        { data: recommendationElements, error: recommendationError },
      ] = await Promise.all([
        supabase
          .schema("ms")
          .from("system_maps")
          .select(
            "id,title,owner_id,created_at,incident_long_description,incident_occurred_at,incident_location,responsible_person_name,investigation_lead_name,items_of_interest"
          )
          .eq("id", params.id)
          .single(),
        supabase.schema("ms").from("map_member_profiles").select("map_id,user_id,role,email").eq("map_id", params.id),
        supabase
          .schema("ms")
          .from("canvas_elements")
          .select("id,heading,element_config,pos_x,pos_y,created_at")
          .eq("map_id", params.id)
          .eq("element_type", "incident_sequence_step")
          .order("created_at", { ascending: true }),
        supabase
          .schema("ms")
          .from("canvas_elements")
          .select("id,heading,element_config,created_at")
          .eq("map_id", params.id)
          .eq("element_type", "person")
          .order("created_at", { ascending: true }),
        supabase
          .schema("ms")
          .from("canvas_elements")
          .select("id,element_type,heading,element_config,created_at")
          .eq("map_id", params.id)
          .in("element_type", ["incident_factor", "incident_system_factor"])
          .order("created_at", { ascending: true }),
        supabase
          .schema("ms")
          .from("canvas_elements")
          .select("id,heading,element_config,created_at")
          .eq("map_id", params.id)
          .eq("element_type", "incident_task_condition")
          .order("created_at", { ascending: true }),
        supabase
          .schema("ms")
          .from("canvas_elements")
          .select("id,heading,element_config,created_at")
          .eq("map_id", params.id)
          .eq("element_type", "incident_control_barrier")
          .order("created_at", { ascending: true }),
        supabase
          .schema("ms")
          .from("canvas_elements")
          .select("id,heading,element_config,created_at")
          .eq("map_id", params.id)
          .eq("element_type", "incident_evidence")
          .order("created_at", { ascending: true }),
        supabase
          .schema("ms")
          .from("canvas_elements")
          .select("id,heading,element_config,created_at")
          .eq("map_id", params.id)
          .eq("element_type", "incident_finding")
          .order("created_at", { ascending: true }),
        supabase
          .schema("ms")
          .from("canvas_elements")
          .select("id,heading,element_config,created_at")
          .eq("map_id", params.id)
          .eq("element_type", "incident_recommendation")
          .order("created_at", { ascending: true }),
      ]);

      if (mapError) {
        setError(mapError.message);
        setLoading(false);
        return;
      }

      if (memberError) {
        setError(memberError.message);
        setLoading(false);
        return;
      }

      if (sequenceError) {
        setError(sequenceError.message);
        setLoading(false);
        return;
      }

      if (peopleError) {
        setError(peopleError.message);
        setLoading(false);
        return;
      }

      if (factorError) {
        setError(factorError.message);
        setLoading(false);
        return;
      }

      if (taskConditionError) {
        setError(taskConditionError.message);
        setLoading(false);
        return;
      }

      if (controlBarrierError) {
        setError(controlBarrierError.message);
        setLoading(false);
        return;
      }

      if (evidenceError) {
        setError(evidenceError.message);
        setLoading(false);
        return;
      }

      if (findingError) {
        setError(findingError.message);
        setLoading(false);
        return;
      }

      if (recommendationError) {
        setError(recommendationError.message);
        setLoading(false);
        return;
      }

      const members = (memberRows ?? []) as MemberProfileRow[];
      const currentMap = mapRow as MapRow;
      const sequenceData = ((sequenceElements ?? []) as SequenceElementRow[])
        .map((row) => {
          const config = row.element_config ?? {};
          const timestamp = String(config.timestamp ?? "").trim();
          const description = String(config.description ?? "").trim();
          const location = String(config.location ?? "").trim();
          const parsedTime = timestamp ? new Date(timestamp).getTime() : Number.NaN;

          return {
            id: row.id,
            title: row.heading?.trim() || "Sequence Step",
            description,
            timestamp,
            location,
            sortTime: Number.isFinite(parsedTime) ? parsedTime : Number.MAX_SAFE_INTEGER,
            pos_x: row.pos_x,
            pos_y: row.pos_y,
            created_at: row.created_at,
          };
        })
        .sort((a, b) => {
          if (a.sortTime !== b.sortTime) return a.sortTime - b.sortTime;
          if (a.pos_x !== b.pos_x) return a.pos_x - b.pos_x;
          if (a.pos_y !== b.pos_y) return a.pos_y - b.pos_y;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

      const peopleData = ((personElements ?? []) as PersonElementRow[]).map((row) => {
        const config = row.element_config ?? {};
        const normalizedHeading = String(row.heading ?? "").replace(/\\n/g, "\n");
        const headingLines = normalizedHeading.split("\n");
        const roleName = String(config.position_title ?? headingLines[0] ?? "").trim() || "Person";
        const personName = String(config.occupant_name ?? headingLines.slice(1).join(" ") ?? "").trim();

        return {
          id: row.id,
          role_name: roleName,
          person_name: personName,
        };
      });

      const factorData: FactorReportRow[] = ((factorElements ?? []) as FactorElementRow[]).map((row) => {
        const config = row.element_config ?? {};
        const isSystemFactor = row.element_type === "incident_system_factor";
        const rawPresence = String(
          config.factor_presence ??
            config.factorPresence ??
            config.presence ??
            config.factor_presence_state ??
            config.factorPresenceState ??
            ""
        ).trim();
        const rawClassification = String(
          config.factor_classification ??
            config.factorClassification ??
            config.cause_level ??
            config.causeLevel ??
            ""
        ).trim();

        return {
          id: row.id,
          type: isSystemFactor ? "System Factor" : "Factor",
          title: String(row.heading ?? "").trim() || (isSystemFactor ? "System Factor" : "Factor"),
          description: String(config.description ?? "").trim(),
          factor_presence: formatLabel(rawPresence),
          classification: formatLabel(rawClassification),
          category: isSystemFactor
            ? formatLabel(String(config.category ?? config.system_category ?? "").trim())
            : formatLabel(
                String(
                  config.influence_type ??
                    config.influenceType ??
                    config.category ??
                    ""
                ).trim()
              ),
          created_at: row.created_at,
        };
      });

      const taskConditionData: TaskConditionReportRow[] = ((taskConditionElements ?? []) as TaskConditionElementRow[]).map(
        (row) => {
          const config = row.element_config ?? {};
          return {
            id: row.id,
            title: String(row.heading ?? "").trim() || "Task / Condition",
            description: String(config.description ?? "").trim(),
            state: formatLabel(String(config.state ?? "").trim()),
            environmental_context: String(config.environmental_context ?? config.environmentalContext ?? "").trim(),
            created_at: row.created_at,
          };
        }
      );

      const controlBarrierData: ControlBarrierReportRow[] = (
        (controlBarrierElements ?? []) as ControlBarrierElementRow[]
      ).map((row) => {
        const config = row.element_config ?? {};
        return {
          id: row.id,
          title: String(row.heading ?? "").trim() || "Control / Barrier",
          description: String(config.description ?? "").trim(),
          barrier_state: formatLabel(String(config.barrier_state ?? "").trim()),
          barrier_role: formatLabel(String(config.barrier_role ?? "").trim()),
          control_type: formatLabel(String(config.control_type ?? "").trim()),
          owner_text: String(config.owner_text ?? "").trim(),
          created_at: row.created_at,
        };
      });

      const evidenceData: EvidenceReportRow[] = ((evidenceElements ?? []) as EvidenceElementRow[]).map((row) => {
        const config = row.element_config ?? {};
        return {
          id: row.id,
          title: String(row.heading ?? "").trim() || "Evidence",
          description: String(config.description ?? "").trim(),
          evidence_type: formatLabel(String(config.evidence_type ?? "").trim()),
          source: String(config.source ?? "").trim(),
          attachment_name: String(config.media_name ?? config.mediaName ?? "").trim(),
          attachment_url: "",
          created_at: row.created_at,
        };
      });

      const findingData: FindingReportRow[] = ((findingElements ?? []) as FindingElementRow[]).map((row) => {
        const config = row.element_config ?? {};
        return {
          id: row.id,
          title: String(row.heading ?? "").trim() || "Finding",
          description: String(config.description ?? "").trim(),
          confidence_level: formatLabel(String(config.confidence_level ?? "").trim()),
          created_at: row.created_at,
        };
      });

      const recommendationData: RecommendationReportRow[] = (
        (recommendationElements ?? []) as RecommendationElementRow[]
      ).map((row) => {
        const config = row.element_config ?? {};
        return {
          id: row.id,
          title: String(row.heading ?? "").trim() || "Recommendation",
          description: String(config.description ?? "").trim(),
          action_type: formatLabel(String(config.action_type ?? "").trim()),
          owner_text: String(config.owner_text ?? "").trim(),
          due_date: String(config.due_date ?? "").trim(),
          created_at: row.created_at,
        };
      });

      const evidencePathPairs = ((evidenceElements ?? []) as EvidenceElementRow[])
        .map((row) => {
          const config = row.element_config ?? {};
          const path = String(config.media_storage_path ?? "").trim();
          return {
            id: row.id,
            path,
          };
        })
        .filter((row) => row.path);

      if (evidencePathPairs.length > 0) {
        const { data: signedRows } = await supabase.storage
          .from("systemmap")
          .createSignedUrls(
            evidencePathPairs.map((row) => row.path),
            3600
          );

        const signedUrlByPath = new Map<string, string>();
        signedRows?.forEach((row) => {
          if (row.path && row.signedUrl) signedUrlByPath.set(row.path, row.signedUrl);
        });

        evidenceData.forEach((row) => {
          const pair = evidencePathPairs.find((entry) => entry.id === row.id);
          if (!pair) return;
          row.attachment_url = signedUrlByPath.get(pair.path) ?? "";
        });
      }

      setMap(currentMap);
      setOwnerEmail(members.find((member) => member.user_id === currentMap.owner_id)?.email ?? null);
      setScopeForm({
        incident_long_description: currentMap.incident_long_description ?? "",
        incident_occurred_at: currentMap.incident_occurred_at
          ? new Date(currentMap.incident_occurred_at).toISOString().slice(0, 16)
          : "",
        incident_location: currentMap.incident_location ?? "",
        responsible_person_name: currentMap.responsible_person_name ?? "",
        investigation_lead_name: currentMap.investigation_lead_name ?? "",
        items_of_interest: currentMap.items_of_interest ?? "",
      });
      setScopeEditing(false);
      setSequenceRows(sequenceData);
      setPeopleRows(peopleData);
      setFactorRows(factorData);
      setTaskConditionRows(taskConditionData);
      setControlBarrierRows(controlBarrierData);
      setEvidenceRows(evidenceData);
      setFindingRows(findingData);
      setRecommendationRows(recommendationData);
      setLoading(false);
    };

    void load();
  }, [params.id, router, supabase]);

  const handleScopeFieldChange = (field: keyof ScopeFormState, value: string) => {
    setScopeForm((current) => ({ ...current, [field]: value }));
  };

  const canEditScope = accessState?.canEditMaps ?? true;
  const scopeEditDisabledReason = (() => {
    if (canEditScope) return null;
    if (accessState?.currentAccessStatus === "expired") return "Editing is unavailable because this access period has expired.";
    if (accessState?.currentAccessStatus === "payment_failed") return "Editing is unavailable until payment details are updated.";
    if (accessState?.currentAccessStatus === "cancelled") return "Editing is unavailable because this access has been cancelled.";
    return accessState?.readOnlyReason || "Editing is unavailable for your current access.";
  })();

  const handleScopeEdit = () => {
    if (!canEditScope) return;
    setScopeMessage(null);
    setScopeMessageIsError(false);
    setScopeEditing(true);
  };

  const handleScopeCancel = () => {
    if (!map) return;
    setScopeForm({
      incident_long_description: map.incident_long_description ?? "",
      incident_occurred_at: map.incident_occurred_at
        ? new Date(map.incident_occurred_at).toISOString().slice(0, 16)
        : "",
      incident_location: map.incident_location ?? "",
      responsible_person_name: map.responsible_person_name ?? "",
      investigation_lead_name: map.investigation_lead_name ?? "",
      items_of_interest: map.items_of_interest ?? "",
    });
    setScopeMessage(null);
    setScopeMessageIsError(false);
    setScopeEditing(false);
  };

  const handleScopeSave = async () => {
    if (!map || !canEditScope) return;

    setScopeSaving(true);
    setScopeMessage(null);
    setScopeMessageIsError(false);

    const payload = {
      incident_long_description: scopeForm.incident_long_description.trim() || null,
      incident_occurred_at: scopeForm.incident_occurred_at ? new Date(scopeForm.incident_occurred_at).toISOString() : null,
      incident_location: scopeForm.incident_location.trim() || null,
      responsible_person_name: scopeForm.responsible_person_name.trim() || null,
      investigation_lead_name: scopeForm.investigation_lead_name.trim() || null,
      items_of_interest: scopeForm.items_of_interest.trim() || null,
    };

    const { error: updateError } = await supabase.schema("ms").from("system_maps").update(payload).eq("id", map.id);

    if (updateError) {
      setScopeMessage(updateError.message);
      setScopeMessageIsError(true);
      setScopeSaving(false);
      return;
    }

    setMap((current) => (current ? { ...current, ...payload } : current));
    setScopeMessage("Scope details saved.");
    setScopeEditing(false);
    setScopeSaving(false);
  };

  const pagedSequence = getPagedRows(sortedSequenceRows, "sequence");
  const pagedFactors = getPagedRows(sortedFactorRows, "factors");
  const pagedTaskConditions = getPagedRows(filteredTaskConditionRows, "task-condition");
  const pagedControlBarriers = getPagedRows(filteredControlBarrierRows, "control-barrier");
  const pagedEvidence = getPagedRows(filteredEvidenceRows, "evidence");
  const pagedFindings = getPagedRows(filteredFindingRows, "finding");
  const pagedRecommendations = getPagedRows(filteredRecommendationRows, "recommendation");

  if (loading) {
    return <DashboardPageSkeleton title="Investigation report" />;
  }

  return (
    <DashboardShell
      activeNav="dashboard"
      eyebrow="Investigation Tool"
      title={loading ? "Investigation Report" : map?.title ?? "Investigation Report"}
      subtitle={loading ? undefined : "Review the investigation record before opening the incident map."}
      headerLead={
        !loading && !error && map ? (
          <button type="button" className={styles.reportBackButton} onClick={() => router.back()} aria-label="Go back">
            <Image src="/icons/back.svg" alt="" width={18} height={18} className={styles.reportBackIcon} />
            <span>Back</span>
          </button>
        ) : null
      }
    >
      <section className={styles.accountCard}>
        {loading ? (
          <div className={styles.tableLoadingStateInline}>
            <div className={styles.tableLoadingBar} aria-hidden="true" />
            <span>Loading investigation report...</span>
          </div>
        ) : null}
        {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}

        {!loading && !error && map ? (
          <div className={styles.accountCard}>
            {renderMobileFilterOverlay()}
            <div className={`${styles.reportToggleBar} ${styles.reportToggleBarMobileSelectOnly}`}>
              <div className={styles.reportMobileSelectWrap}>
                <label className={styles.reportMobileSelectLabel} htmlFor="investigation-view-select">
                  View
                </label>
                <select
                  id="investigation-view-select"
                  className={styles.reportMobileSelect}
                  value={activeTab}
                  onChange={(event) => setActiveTab(event.target.value as ReportTab)}
                >
                  {reportTabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.reportToggleGroup} role="tablist" aria-label="Investigation report sections">
                {reportTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={`${styles.reportToggleButton} ${
                      activeTab === tab.id ? styles.reportToggleButtonActive : ""
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {!loading && !error && map ? (
                <div className={styles.reportToggleActions}>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.buttonAccent}`}
                    onClick={() => router.push(`/investigations/${map.id}/canvas`)}
                  >
                    Open Incident Map
                  </button>
                </div>
              ) : null}
            </div>

            <div className={`${styles.accountSection} ${styles.reportSection}`}>
              {activeTab === "setup-scope" ? (
                <div className={styles.reportLayout}>
                  <div className={styles.reportScopeBlock}>
                    <dl className={`${styles.reportList} ${styles.reportListThreeCol}`}>
                      <div>
                        <dt>Investigation name</dt>
                        <dd>{map.title}</dd>
                      </div>
                      <div>
                        <dt>Owner</dt>
                        <dd>{ownerEmail ?? "Unknown"}</dd>
                      </div>
                      <div>
                        <dt>Created</dt>
                        <dd>{formatDate(map.created_at)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className={styles.reportScopeBlock}>
                    {scopeEditing ? (
                      <div className={styles.reportScopeForm}>
                        <label className={styles.reportScopeField}>
                          <span>Incident Date &amp; Time</span>
                          <input
                            type="datetime-local"
                            className={styles.input}
                            value={scopeForm.incident_occurred_at}
                            onChange={(event) => handleScopeFieldChange("incident_occurred_at", event.target.value)}
                          />
                        </label>

                        <label className={styles.reportScopeField}>
                          <span>Incident Location</span>
                          <input
                            type="text"
                            className={styles.input}
                            value={scopeForm.incident_location}
                            onChange={(event) => handleScopeFieldChange("incident_location", event.target.value)}
                          />
                        </label>

                        <label className={styles.reportScopeField}>
                          <span>Responsible Person Name</span>
                          <input
                            type="text"
                            className={styles.input}
                            value={scopeForm.responsible_person_name}
                            onChange={(event) => handleScopeFieldChange("responsible_person_name", event.target.value)}
                          />
                        </label>

                        <label className={styles.reportScopeField}>
                          <span>Investigation Lead Name</span>
                          <input
                            type="text"
                            className={styles.input}
                            value={scopeForm.investigation_lead_name}
                            onChange={(event) => handleScopeFieldChange("investigation_lead_name", event.target.value)}
                          />
                        </label>

                        <label className={`${styles.reportScopeField} ${styles.reportScopeFieldFull}`}>
                          <span>Items of Interest</span>
                          <textarea
                            className={`${styles.input} ${styles.reportScopeTextarea}`}
                            value={scopeForm.items_of_interest}
                            onChange={(event) => handleScopeFieldChange("items_of_interest", event.target.value)}
                          />
                        </label>

                        <label className={`${styles.reportScopeField} ${styles.reportScopeFieldFull}`}>
                          <span>Incident Long Description</span>
                          <textarea
                            className={`${styles.input} ${styles.reportScopeTextarea}`}
                            value={scopeForm.incident_long_description}
                            onChange={(event) => handleScopeFieldChange("incident_long_description", event.target.value)}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className={styles.reportScopeReadLayout}>
                        <div className={styles.reportScopeReadCard}>
                          <span className={styles.reportScopeReadLabel}>Incident Date &amp; Time</span>
                          <div className={styles.reportScopeReadValue}>
                            {scopeForm.incident_occurred_at ? formatDate(new Date(scopeForm.incident_occurred_at).toISOString()) : "-"}
                          </div>
                        </div>

                        <div className={styles.reportScopeReadCard}>
                          <span className={styles.reportScopeReadLabel}>Incident Location</span>
                          <div className={styles.reportScopeReadValue}>{scopeForm.incident_location || "-"}</div>
                        </div>

                        <div className={styles.reportScopeReadCard}>
                          <span className={styles.reportScopeReadLabel}>Responsible Person Name</span>
                          <div className={styles.reportScopeReadValue}>{scopeForm.responsible_person_name || "-"}</div>
                        </div>

                        <div className={styles.reportScopeReadCard}>
                          <span className={styles.reportScopeReadLabel}>Investigation Lead Name</span>
                          <div className={styles.reportScopeReadValue}>{scopeForm.investigation_lead_name || "-"}</div>
                        </div>

                        <div className={`${styles.reportScopeReadCard} ${styles.reportScopeReadCardFull}`}>
                          <span className={styles.reportScopeReadLabel}>Items of Interest</span>
                          <div className={`${styles.reportScopeReadValue} ${styles.reportScopeReadNarrative}`}>
                            {scopeForm.items_of_interest || "-"}
                          </div>
                        </div>

                        <div className={`${styles.reportScopeReadCard} ${styles.reportScopeReadCardFull}`}>
                          <span className={styles.reportScopeReadLabel}>Incident Long Description</span>
                          <div className={`${styles.reportScopeReadValue} ${styles.reportScopeReadNarrative}`}>
                            {scopeForm.incident_long_description || "-"}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className={styles.reportScopeActions}>
                      {scopeMessage ? (
                        <p className={`${styles.message} ${scopeMessageIsError ? styles.messageError : styles.messageSuccess}`}>
                          {scopeMessage}
                        </p>
                      ) : <span />}
                      <div className={styles.reportScopeActionButtons}>
                        {scopeEditing ? (
                          <>
                            <button
                              type="button"
                              className={`${styles.button} ${styles.buttonAccent}`}
                              onClick={handleScopeCancel}
                              disabled={scopeSaving}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className={`${styles.button} ${styles.buttonAccent}`}
                              onClick={() => void handleScopeSave()}
                              disabled={scopeSaving}
                            >
                              {scopeSaving ? "Saving..." : "Save Scope"}
                            </button>
                          </>
                        ) : (
                          <span title={scopeEditDisabledReason ?? undefined}>
                            <button
                              type="button"
                              className={`${styles.button} ${styles.buttonAccent}`}
                              onClick={handleScopeEdit}
                              disabled={!canEditScope}
                            >
                              Edit Scope
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === "sequence" ? (
                <>
                  <div className={styles.reportMobileToolbar}>
                    <button
                      type="button"
                      className={styles.tableSortButton}
                      onClick={() => setSequenceSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
                    >
                      <span>Sort by Timestamp</span>
                      <span className={styles.tableSortIcon} aria-hidden="true">
                        {sequenceSortDirection === "asc" ? "Asc" : "Desc"}
                      </span>
                    </button>
                  </div>
                  <div className={`${styles.tableWrap} ${styles.reportDataTableWrap}`}>
                    <table className={`${styles.table} ${styles.reportDataTable}`}>
                      <colgroup>
                        <col style={{ width: "8%" }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "32%" }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "20%" }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th className={`${styles.reportNumberHeader} ${styles.reportHeaderCenter}`}>No.</th>
                          <th>Sequence Step</th>
                          <th>Description</th>
                          <th>
                            <button
                              type="button"
                              className={styles.tableSortButton}
                              onClick={() =>
                                setSequenceSortDirection((current) => (current === "asc" ? "desc" : "asc"))
                              }
                            >
                              <span>Timestamp</span>
                              <span className={styles.tableSortIcon} aria-hidden="true">
                                {sequenceSortDirection === "asc" ? "Asc" : "Desc"}
                              </span>
                            </button>
                          </th>
                          <th>Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSequenceRows.length === 0 ? (
                          renderTableEmptyRow(5, getEmptyTableMessage("sequence steps"))
                      ) : (
                          pagedSequence.rows.map((row, index) => (
                            <tr key={row.id}>
                              <td className={`${styles.reportNumberCell} ${styles.reportCellCenter}`}>
                                <span className={styles.tableValue}>
                                  {(pagedSequence.currentPage - 1) * TABLE_PAGE_SIZE + index + 1}
                                </span>
                              </td>
                              <td>
                                <span className={styles.tableWrapText}>{row.title}</span>
                              </td>
                              <td>
                                <span className={styles.tableWrapText}>{row.description || "-"}</span>
                              </td>
                              <td>
                                <span className={styles.tableDate}>{row.timestamp ? formatDate(row.timestamp) : "-"}</span>
                              </td>
                              <td>
                                <span className={styles.tableWrapText}>{row.location || "-"}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.reportMobileList}>
                    {sortedSequenceRows.length === 0
                      ? renderMobileEmptyState(getEmptyTableMessage("sequence steps"))
                      : pagedSequence.rows.map((row, index) => (
                          <article key={row.id} className={styles.reportMobileCard}>
                            <div className={styles.reportMobileCardTop}>
                              <div className={styles.reportMobileCardBadgeWrap}>
                                <span className={styles.reportMobileCardBadge} aria-hidden="true">
                                  {(pagedSequence.currentPage - 1) * TABLE_PAGE_SIZE + index + 1}
                                </span>
                              </div>
                              <span className={styles.reportMobileCardMetaPill}>
                                {row.timestamp ? formatDate(row.timestamp) : "No Timestamp"}
                              </span>
                            </div>
                            <div className={styles.reportMobileCardHeader}>
                              <div className={styles.reportMobileTitleBlock}>
                                <strong>{row.title}</strong>
                              </div>
                            </div>
                            <div className={styles.reportMobileCardBody}>
                              <p className={styles.reportMobileCardDescription}>{row.description || "-"}</p>
                            </div>
                            <div className={styles.reportMobileCardFooter}>
                              <div className={`${styles.reportMobileCardFooterMeta} ${styles.reportMobileCardFooterMetaFull}`}>
                                <span className={styles.reportMobileLabel}>Location</span>
                                <span className={styles.reportMobileValue}>{row.location || "-"}</span>
                              </div>
                            </div>
                          </article>
                        ))}
                  </div>
                  {renderPagination("sequence", sortedSequenceRows.length, pagedSequence.currentPage, pagedSequence.totalPages)}
                </>
              ) : activeTab === "people" ? (
                <div className={styles.reportPeopleGrid}>
                  {peopleRows.length === 0 ? (
                    <div className={styles.reportCard}>
                      <p className={styles.subtitle}>No people have been added yet.</p>
                    </div>
                  ) : (
                    peopleRows.map((row) => (
                      <article key={row.id} className={styles.personCard}>
                        <div className={styles.personIconWrap}>
                          <div className={styles.personIconBadge} aria-hidden="true">
                            <span className={styles.personIconHead} />
                            <span className={styles.personIconBody} />
                          </div>
                        </div>
                        <div className={styles.personCardText}>
                          <h3>{row.role_name || "Person"}</h3>
                          <p>{row.person_name || "No person name recorded"}</p>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              ) : activeTab === "factors" ? (
                <>
                  {renderMobileFiltersButton()}
                  {hasActiveFactorFilters ? (
                    <div className={styles.tableFilterToolbar}>
                      <span className={styles.tableFilterSummary}>Filters applied to the factors view.</span>
                      <button
                        type="button"
                        className={styles.tableFilterResetButton}
                        onClick={clearAllFactorFilters}
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : null}
                  {renderActiveFactorFilterMenu()}
                  <div className={styles.reportMobileFilterRow}>
                    {renderFactorFilterHeader("presence", "Presence")}
                    {renderFactorFilterHeader("classification", "Classification")}
                    {renderFactorFilterHeader("category", "Category")}
                  </div>
                  <div className={`${styles.tableWrap} ${styles.reportDataTableWrap}`}>
                    <table className={`${styles.table} ${styles.reportDataTable}`}>
                      <colgroup>
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "27%" }} />
                        <col style={{ width: "25%" }} />
                        <col style={{ width: "12%" }} />
                        <col style={{ width: "16%" }} />
                        <col style={{ width: "10%" }} />
                      </colgroup>
                      <thead>
                      <tr>
                        <th className={styles.reportHeaderCenter}>Type</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th className={styles.reportHeaderCenter}>{renderFactorFilterHeader("presence", "Presence")}</th>
                        <th className={styles.reportHeaderCenter}>{renderFactorFilterHeader("classification", "Classification")}</th>
                        <th className={styles.reportHeaderCenter}>{renderFactorFilterHeader("category", "Category")}</th>
                      </tr>
                      </thead>
                      <tbody>
                      {sortedFactorRows.length === 0 ? (
                        renderTableEmptyRow(6, getEmptyTableMessage("factors"))
                      ) : (
                        pagedFactors.rows.map((row) => (
                          <tr key={row.id}>
                            <td className={styles.reportCellCenter}><span className={styles.tableClamp}>{row.type}</span></td>
                            <td><span className={styles.tableWrapText}>{row.title}</span></td>
                            <td><span className={styles.tableWrapText}>{row.description || "-"}</span></td>
                            <td className={styles.reportCellCenter}>
                              <span className={`${styles.statusPill} ${getFactorPresencePillClass(row.factor_presence)}`}>
                                {row.factor_presence || "-"}
                              </span>
                            </td>
                            <td className={styles.reportCellCenter}>
                              <span className={`${styles.statusPill} ${getFactorClassificationPillClass(row.classification)}`}>
                                {row.classification || "-"}
                              </span>
                            </td>
                            <td className={styles.reportCellCenter}><span className={styles.tableClamp}>{row.category || "-"}</span></td>
                          </tr>
                        ))
                      )}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.reportMobileList}>
                    {sortedFactorRows.length === 0
                      ? renderMobileEmptyState(getEmptyTableMessage("factors"))
                      : pagedFactors.rows.map((row) => (
                          <article key={row.id} className={`${styles.reportMobileCard} ${styles.factorMobileCard}`}>
                            <div className={styles.factorMobileCardTop}>
                              <div className={styles.factorMobileCardBadgeWrap}>
                                <span className={styles.factorMobileCardBadge} aria-hidden="true">
                                  {row.type === "System Factor" ? "SF" : "F"}
                                </span>
                              </div>
                              <span className={styles.factorMobileCardMetaPill}>{row.category || "Uncategorised"}</span>
                            </div>
                            <div className={styles.reportMobileCardHeader}>
                              <div className={`${styles.reportMobileTitleBlock} ${styles.factorMobileTitleBlock}`}>
                                <strong>{row.title}</strong>
                                <span>{row.type}</span>
                              </div>
                            </div>
                            <div className={styles.factorMobileCardBody}>
                              <p className={styles.factorMobileCardDescription}>{row.description || "-"}</p>
                            </div>
                            <div className={styles.factorMobileCardFooter}>
                              <div className={styles.factorMobileCardFooterMeta}>
                                <span className={styles.factorMobileCardFooterLabel}>Presence</span>
                                <span className={styles.reportMobilePillWrap}>
                                  <span className={`${styles.statusPill} ${getFactorPresencePillClass(row.factor_presence)}`}>
                                    {row.factor_presence || "-"}
                                  </span>
                                </span>
                              </div>
                              <div className={styles.factorMobileCardFooterMeta}>
                                <span className={styles.factorMobileCardFooterLabel}>Classification</span>
                                <span className={styles.reportMobilePillWrap}>
                                  <span className={`${styles.statusPill} ${getFactorClassificationPillClass(row.classification)}`}>
                                    {row.classification || "-"}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </article>
                        ))}
                  </div>
                  {renderPagination("factors", sortedFactorRows.length, pagedFactors.currentPage, pagedFactors.totalPages)}
                </>
              ) : activeTab === "task-condition" ? (
                <>
                  {renderMobileFiltersButton()}
                  {hasActiveTaskConditionStateFilter ? (
                    <div className={styles.tableFilterToolbar}>
                      <span className={styles.tableFilterSummary}>State filter applied to the task/condition view.</span>
                      <button
                        type="button"
                        className={styles.tableFilterResetButton}
                        onClick={clearTaskConditionStateFilter}
                      >
                        Clear filter
                      </button>
                    </div>
                  ) : null}
                  {renderActiveFactorFilterMenu()}
                  <div className={styles.reportMobileFilterRow}>
                    {renderFactorFilterHeader("taskState", "State")}
                  </div>
                  <div className={`${styles.tableWrap} ${styles.reportDataTableWrap}`}>
                    <table className={`${styles.table} ${styles.reportDataTable}`}>
                      <colgroup>
                        <col style={{ width: "19%" }} />
                        <col style={{ width: "28%" }} />
                        <col style={{ width: "17%" }} />
                        <col style={{ width: "35%" }} />
                      </colgroup>
                      <thead>
                      <tr>
                        <th>Task/Condition</th>
                        <th>Description</th>
                        <th className={styles.reportHeaderCenter}>{renderFactorFilterHeader("taskState", "State")}</th>
                        <th>Environmental Context</th>
                      </tr>
                      </thead>
                      <tbody>
                      {filteredTaskConditionRows.length === 0 ? (
                        renderTableEmptyRow(4, getEmptyTableMessage("task and condition items"))
                      ) : (
                        pagedTaskConditions.rows.map((row) => (
                          <tr key={row.id}>
                            <td><span className={styles.tableWrapText}>{row.title}</span></td>
                            <td><span className={styles.tableWrapText}>{row.description || "-"}</span></td>
                            <td className={styles.reportCellCenter}>
                              <span className={`${styles.statusPill} ${getTaskConditionStatePillClass(row.state)}`}>
                                {row.state || "-"}
                              </span>
                            </td>
                            <td><span className={styles.tableWrapText}>{row.environmental_context || "-"}</span></td>
                          </tr>
                        ))
                      )}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.reportMobileList}>
                    {filteredTaskConditionRows.length === 0
                      ? renderMobileEmptyState(getEmptyTableMessage("task and condition items"))
                      : pagedTaskConditions.rows.map((row) => (
                          <article key={row.id} className={styles.reportMobileCard}>
                            <div className={styles.reportMobileCardTop}>
                              <div className={styles.reportMobileCardBadgeWrap}>
                                <span className={styles.reportMobileCardBadge} aria-hidden="true">TC</span>
                              </div>
                              <span
                                className={`${styles.reportMobileCardMetaPill} ${styles.reportMobileCardMetaPillStatus} ${getTaskConditionStatePillClass(row.state)}`}
                              >
                                {row.state || "Task / Condition"}
                              </span>
                            </div>
                            <div className={styles.reportMobileCardHeader}>
                              <div className={styles.reportMobileTitleBlock}>
                                <strong>{row.title}</strong>
                              </div>
                            </div>
                            <div className={styles.reportMobileCardBody}>
                              <p className={styles.reportMobileCardDescription}>{row.description || "-"}</p>
                            </div>
                            <div className={styles.reportMobileCardFooter}>
                              <div className={`${styles.reportMobileCardFooterMeta} ${styles.reportMobileCardFooterMetaFull}`}>
                                <span className={styles.reportMobileLabel}>Environmental Context</span>
                                <span className={styles.reportMobileValue}>{row.environmental_context || "-"}</span>
                              </div>
                            </div>
                          </article>
                        ))}
                  </div>
                  {renderPagination(
                    "task-condition",
                    filteredTaskConditionRows.length,
                    pagedTaskConditions.currentPage,
                    pagedTaskConditions.totalPages
                  )}
                </>
              ) : activeTab === "control-barrier" ? (
                <>
                  {renderMobileFiltersButton()}
                  {hasActiveControlBarrierFilters ? (
                    <div className={styles.tableFilterToolbar}>
                      <span className={styles.tableFilterSummary}>Filters applied to the control/barrier view.</span>
                      <button
                        type="button"
                        className={styles.tableFilterResetButton}
                        onClick={clearAllControlBarrierFilters}
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : null}
                  {renderActiveFactorFilterMenu()}
                  <div className={styles.reportMobileFilterRow}>
                    {renderFactorFilterHeader("barrierState", "Barrier State")}
                    {renderFactorFilterHeader("barrierRole", "Barrier Role")}
                    {renderFactorFilterHeader("controlType", "Control Type")}
                  </div>
                  <div className={`${styles.tableWrap} ${styles.reportDataTableWrap}`}>
                    <table className={`${styles.table} ${styles.reportDataTable}`}>
                      <colgroup>
                        <col style={{ width: "18%" }} />
                        <col style={{ width: "26%" }} />
                        <col style={{ width: "14%" }} />
                        <col style={{ width: "14%" }} />
                        <col style={{ width: "12%" }} />
                        <col style={{ width: "16%" }} />
                      </colgroup>
                      <thead>
                      <tr>
                        <th>Control/Barrier</th>
                        <th>Description</th>
                        <th>{renderFactorFilterHeader("barrierState", "Barrier State")}</th>
                        <th>{renderFactorFilterHeader("barrierRole", "Barrier Role")}</th>
                        <th>{renderFactorFilterHeader("controlType", "Control Type")}</th>
                        <th>Owner</th>
                      </tr>
                      </thead>
                      <tbody>
                      {filteredControlBarrierRows.length === 0 ? (
                        renderTableEmptyRow(6, getEmptyTableMessage("control and barrier items"))
                      ) : (
                        pagedControlBarriers.rows.map((row) => (
                          <tr key={row.id}>
                            <td><span className={styles.tableWrapText}>{row.title}</span></td>
                            <td><span className={styles.tableWrapText}>{row.description || "-"}</span></td>
                            <td>
                              <span className={`${styles.statusPill} ${getBarrierStatePillClass(row.barrier_state)}`}>
                                {row.barrier_state || "-"}
                              </span>
                            </td>
                            <td>
                              <span className={`${styles.statusPill} ${getBarrierRolePillClass(row.barrier_role)}`}>
                                {row.barrier_role || "-"}
                              </span>
                            </td>
                            <td><span className={styles.tableClamp}>{row.control_type || "-"}</span></td>
                            <td><span className={styles.tableWrapText}>{row.owner_text || "-"}</span></td>
                          </tr>
                        ))
                      )}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.reportMobileList}>
                    {filteredControlBarrierRows.length === 0
                      ? renderMobileEmptyState(getEmptyTableMessage("control and barrier items"))
                      : pagedControlBarriers.rows.map((row) => (
                          <article key={row.id} className={styles.reportMobileCard}>
                            <div className={styles.reportMobileCardTop}>
                              <div className={styles.reportMobileCardBadgeWrap}>
                                <span className={styles.reportMobileCardBadge} aria-hidden="true">CB</span>
                              </div>
                              <span className={styles.reportMobileCardMetaPill}>{row.control_type || "Control Type"}</span>
                            </div>
                            <div className={styles.reportMobileCardHeader}>
                              <div className={styles.reportMobileTitleBlock}>
                                <strong>{row.title}</strong>
                              </div>
                            </div>
                            <div className={styles.reportMobileCardBody}>
                              <p className={styles.reportMobileCardDescription}>{row.description || "-"}</p>
                              <div className={styles.reportMobileCardBodyMeta}>
                                <span className={styles.reportMobileLabel}>Owner</span>
                                <span className={styles.reportMobileValue}>{row.owner_text || "-"}</span>
                              </div>
                            </div>
                            <div className={styles.reportMobileCardFooter}>
                              <div className={styles.reportMobileCardFooterMeta}>
                                <span className={styles.reportMobileLabel}>Barrier State</span>
                                <span className={styles.reportMobilePillWrap}>
                                  <span className={`${styles.statusPill} ${getBarrierStatePillClass(row.barrier_state)}`}>
                                    {row.barrier_state || "-"}
                                  </span>
                                </span>
                              </div>
                              <div className={styles.reportMobileCardFooterMeta}>
                                <span className={styles.reportMobileLabel}>Barrier Role</span>
                                <span className={styles.reportMobilePillWrap}>
                                  <span className={`${styles.statusPill} ${getBarrierRolePillClass(row.barrier_role)}`}>
                                    {row.barrier_role || "-"}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </article>
                        ))}
                  </div>
                  {renderPagination(
                    "control-barrier",
                    filteredControlBarrierRows.length,
                    pagedControlBarriers.currentPage,
                    pagedControlBarriers.totalPages
                  )}
                </>
              ) : activeTab === "evidence" ? (
                <>
                  {renderMobileFiltersButton()}
                  {hasActiveEvidenceTypeFilter ? (
                    <div className={styles.tableFilterToolbar}>
                      <span className={styles.tableFilterSummary}>Type filter applied to the evidence view.</span>
                      <button
                        type="button"
                        className={styles.tableFilterResetButton}
                        onClick={clearEvidenceTypeFilter}
                      >
                        Clear filter
                      </button>
                    </div>
                  ) : null}
                  {renderActiveFactorFilterMenu()}
                  <div className={styles.reportMobileFilterRow}>
                    {renderFactorFilterHeader("evidenceType", "Type")}
                  </div>
                  <div className={`${styles.tableWrap} ${styles.reportDataTableWrap}`}>
                    <table className={`${styles.table} ${styles.reportDataTable}`}>
                      <colgroup>
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "28%" }} />
                        <col style={{ width: "14%" }} />
                        <col style={{ width: "18%" }} />
                        <col style={{ width: "20%" }} />
                      </colgroup>
                      <thead>
                      <tr>
                        <th>Evidence</th>
                        <th>Description</th>
                        <th>{renderFactorFilterHeader("evidenceType", "Type")}</th>
                        <th>Source</th>
                        <th>Attachment</th>
                      </tr>
                      </thead>
                      <tbody>
                      {filteredEvidenceRows.length === 0 ? (
                        renderTableEmptyRow(5, getEmptyTableMessage("evidence items"))
                      ) : (
                        pagedEvidence.rows.map((row) => (
                          <tr key={row.id}>
                            <td><span className={styles.tableWrapText}>{row.title}</span></td>
                            <td><span className={styles.tableWrapText}>{row.description || "-"}</span></td>
                            <td><span className={styles.tableClamp}>{row.evidence_type || "-"}</span></td>
                            <td><span className={styles.tableWrapText}>{row.source || "-"}</span></td>
                            <td>
                              {row.attachment_name && row.attachment_url ? (
                                <a
                                  href={row.attachment_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={styles.tableLink}
                                >
                                  {row.attachment_name}
                                </a>
                              ) : (
                                <span className={styles.tableWrapText}>{row.attachment_name || "-"}</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.reportMobileList}>
                    {filteredEvidenceRows.length === 0
                      ? renderMobileEmptyState(getEmptyTableMessage("evidence items"))
                      : pagedEvidence.rows.map((row) => (
                          <article key={row.id} className={styles.reportMobileCard}>
                            <div className={styles.reportMobileCardTop}>
                              <div className={styles.reportMobileCardBadgeWrap}>
                                <span className={styles.reportMobileCardBadge} aria-hidden="true">E</span>
                              </div>
                              <span className={styles.reportMobileCardMetaPill}>{row.evidence_type || "Evidence"}</span>
                            </div>
                            <div className={styles.reportMobileCardHeader}>
                              <div className={styles.reportMobileTitleBlock}>
                                <strong>{row.title}</strong>
                              </div>
                            </div>
                            <div className={styles.reportMobileCardBody}>
                              <p className={styles.reportMobileCardDescription}>{row.description || "-"}</p>
                            </div>
                            <div className={styles.reportMobileCardFooter}>
                              <div className={`${styles.reportMobileCardFooterMeta} ${styles.reportMobileCardFooterMetaFull}`}>
                                <span className={styles.reportMobileLabel}>Source</span>
                                <span className={styles.reportMobileValue}>{row.source || "-"}</span>
                              </div>
                              <div className={`${styles.reportMobileCardFooterMeta} ${styles.reportMobileCardFooterMetaFull}`}>
                                <span className={styles.reportMobileLabel}>Attachment</span>
                                {row.attachment_name && row.attachment_url ? (
                                  <a href={row.attachment_url} target="_blank" rel="noreferrer" className={styles.tableLink}>
                                    {row.attachment_name}
                                  </a>
                                ) : (
                                  <span className={styles.reportMobileValue}>{row.attachment_name || "-"}</span>
                                )}
                              </div>
                            </div>
                          </article>
                        ))}
                  </div>
                  {renderPagination("evidence", filteredEvidenceRows.length, pagedEvidence.currentPage, pagedEvidence.totalPages)}
                </>
              ) : activeTab === "finding" ? (
                <>
                  {renderMobileFiltersButton()}
                  {hasActiveFindingConfidenceFilter ? (
                    <div className={styles.tableFilterToolbar}>
                      <span className={styles.tableFilterSummary}>Confidence filter applied to the findings view.</span>
                      <button
                        type="button"
                        className={styles.tableFilterResetButton}
                        onClick={clearFindingConfidenceFilter}
                      >
                        Clear filter
                      </button>
                    </div>
                  ) : null}
                  {renderActiveFactorFilterMenu()}
                  <div className={styles.reportMobileFilterRow}>
                    {renderFactorFilterHeader("findingConfidence", "Confidence Level")}
                  </div>
                  <div className={`${styles.tableWrap} ${styles.reportDataTableWrap}`}>
                    <table className={`${styles.table} ${styles.reportDataTable}`}>
                      <colgroup>
                        <col style={{ width: "8%" }} />
                        <col style={{ width: "25%" }} />
                        <col style={{ width: "45%" }} />
                        <col style={{ width: "22%" }} />
                      </colgroup>
                      <thead>
                      <tr>
                        <th className={`${styles.reportNumberHeader} ${styles.reportHeaderCenter}`}>No.</th>
                        <th>Finding</th>
                        <th>Description</th>
                        <th>{renderFactorFilterHeader("findingConfidence", "Confidence Level")}</th>
                      </tr>
                      </thead>
                      <tbody>
                      {filteredFindingRows.length === 0 ? (
                        renderTableEmptyRow(4, getEmptyTableMessage("findings"))
                      ) : (
                        pagedFindings.rows.map((row, index) => (
                          <tr key={row.id}>
                            <td className={`${styles.reportNumberCell} ${styles.reportCellCenter}`}>
                              <span className={styles.tableValue}>
                                {(pagedFindings.currentPage - 1) * TABLE_PAGE_SIZE + index + 1}
                              </span>
                            </td>
                            <td><span className={styles.tableWrapText}>{row.title}</span></td>
                            <td><span className={styles.tableWrapText}>{row.description || "-"}</span></td>
                            <td>
                              <span className={`${styles.statusPill} ${getFindingConfidencePillClass(row.confidence_level)}`}>
                                {row.confidence_level || "-"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.reportMobileList}>
                    {filteredFindingRows.length === 0
                      ? renderMobileEmptyState(getEmptyTableMessage("findings"))
                      : pagedFindings.rows.map((row, index) => (
                          <article key={row.id} className={styles.reportMobileCard}>
                            <div className={styles.reportMobileCardTop}>
                              <div className={styles.reportMobileCardBadgeWrap}>
                                <span className={styles.reportMobileCardBadge} aria-hidden="true">
                                  {(pagedFindings.currentPage - 1) * TABLE_PAGE_SIZE + index + 1}
                                </span>
                              </div>
                              <span className={styles.reportMobileCardMetaPill}>Finding</span>
                            </div>
                            <div className={styles.reportMobileCardHeader}>
                              <div className={styles.reportMobileTitleBlock}>
                                <strong>{row.title}</strong>
                              </div>
                            </div>
                            <div className={styles.reportMobileCardBody}>
                              <p className={styles.reportMobileCardDescription}>{row.description || "-"}</p>
                            </div>
                            <div className={styles.reportMobileCardFooter}>
                              <div className={styles.reportMobileCardFooterMeta}>
                                <span className={styles.reportMobileLabel}>Confidence Level</span>
                                <span className={styles.reportMobilePillWrap}>
                                  <span className={`${styles.statusPill} ${getFindingConfidencePillClass(row.confidence_level)}`}>
                                    {row.confidence_level || "-"}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </article>
                        ))}
                  </div>
                  {renderPagination("finding", filteredFindingRows.length, pagedFindings.currentPage, pagedFindings.totalPages)}
                </>
              ) : activeTab === "recommendation" ? (
                <>
                  {renderMobileFiltersButton()}
                  {hasActiveRecommendationActionTypeFilter ? (
                    <div className={styles.tableFilterToolbar}>
                      <span className={styles.tableFilterSummary}>Action type filter applied to the recommendations view.</span>
                      <button
                        type="button"
                        className={styles.tableFilterResetButton}
                        onClick={clearRecommendationActionTypeFilter}
                      >
                        Clear filter
                      </button>
                    </div>
                  ) : null}
                  {renderActiveFactorFilterMenu()}
                  <div className={styles.reportMobileFilterRow}>
                    {renderFactorFilterHeader("recommendationActionType", "Action Type")}
                  </div>
                  <div className={`${styles.tableWrap} ${styles.reportDataTableWrap}`}>
                    <table className={`${styles.table} ${styles.reportDataTable}`}>
                      <colgroup>
                        <col style={{ width: "8%" }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "28%" }} />
                        <col style={{ width: "16%" }} />
                        <col style={{ width: "16%" }} />
                        <col style={{ width: "12%" }} />
                      </colgroup>
                      <thead>
                      <tr>
                        <th className={`${styles.reportNumberHeader} ${styles.reportHeaderCenter}`}>No.</th>
                        <th>Recommendation</th>
                        <th>Description</th>
                        <th>{renderFactorFilterHeader("recommendationActionType", "Action Type")}</th>
                        <th>Owner</th>
                        <th>Due Date</th>
                      </tr>
                      </thead>
                      <tbody>
                      {filteredRecommendationRows.length === 0 ? (
                        renderTableEmptyRow(6, getEmptyTableMessage("recommendations"))
                      ) : (
                        pagedRecommendations.rows.map((row, index) => (
                          <tr key={row.id}>
                            <td className={`${styles.reportNumberCell} ${styles.reportCellCenter}`}>
                              <span className={styles.tableValue}>
                                {(pagedRecommendations.currentPage - 1) * TABLE_PAGE_SIZE + index + 1}
                              </span>
                            </td>
                            <td><span className={styles.tableWrapText}>{row.title}</span></td>
                            <td><span className={styles.tableWrapText}>{row.description || "-"}</span></td>
                            <td>
                              <span className={`${styles.statusPill} ${getRecommendationActionTypePillClass(row.action_type)}`}>
                                {row.action_type || "-"}
                              </span>
                            </td>
                            <td><span className={styles.tableWrapText}>{row.owner_text || "-"}</span></td>
                            <td><span className={styles.tableClamp}>{row.due_date ? formatShortDate(row.due_date) : "-"}</span></td>
                          </tr>
                        ))
                      )}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.reportMobileList}>
                    {filteredRecommendationRows.length === 0
                      ? renderMobileEmptyState(getEmptyTableMessage("recommendations"))
                      : pagedRecommendations.rows.map((row, index) => (
                          <article key={row.id} className={styles.reportMobileCard}>
                            <div className={styles.reportMobileCardTop}>
                              <div className={styles.reportMobileCardBadgeWrap}>
                                <span className={styles.reportMobileCardBadge} aria-hidden="true">
                                  {(pagedRecommendations.currentPage - 1) * TABLE_PAGE_SIZE + index + 1}
                                </span>
                              </div>
                              <span className={styles.reportMobileCardMetaPill}>
                                {row.due_date ? formatShortDate(row.due_date) : "Recommendation"}
                              </span>
                            </div>
                            <div className={styles.reportMobileCardHeader}>
                              <div className={styles.reportMobileTitleBlock}>
                                <strong>{row.title}</strong>
                              </div>
                            </div>
                            <div className={styles.reportMobileCardBody}>
                              <p className={styles.reportMobileCardDescription}>{row.description || "-"}</p>
                            </div>
                            <div className={styles.reportMobileCardFooter}>
                              <div className={styles.reportMobileCardFooterMeta}>
                                <span className={styles.reportMobileLabel}>Action Type</span>
                                <span className={styles.reportMobilePillWrap}>
                                  <span className={`${styles.statusPill} ${getRecommendationActionTypePillClass(row.action_type)}`}>
                                    {row.action_type || "-"}
                                  </span>
                                </span>
                              </div>
                              <div className={styles.reportMobileCardFooterMeta}>
                                <span className={styles.reportMobileLabel}>Owner</span>
                                <span className={styles.reportMobileValue}>{row.owner_text || "-"}</span>
                              </div>
                            </div>
                          </article>
                        ))}
                  </div>
                  {renderPagination(
                    "recommendation",
                    filteredRecommendationRows.length,
                    pagedRecommendations.currentPage,
                    pagedRecommendations.totalPages
                  )}
                </>
              ) : (
                <div className={styles.reportCard}>
                  <h3>{reportTabs.find((tab) => tab.id === activeTab)?.label}</h3>
                  <p className={styles.subtitle}>This section is ready for report content from the investigation map.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </DashboardShell>
  );
}


