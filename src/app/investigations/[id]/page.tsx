"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import styles from "@/components/dashboard/DashboardShell.module.css";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type MapRow = {
  id: string;
  title: string;
  description: string | null;
  map_code: string | null;
  owner_id: string;
  updated_by_user_id: string | null;
  created_at: string;
  updated_at: string;
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
  department: string;
  role_id: string;
  occupant_name: string;
  start_date: string;
  employment_type: string;
  acting_name: string;
  acting_start_date: string;
  recruiting: boolean;
  proposed_role: boolean;
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

const reportTabs: Array<{ id: ReportTab; label: string }> = [
  { id: "setup-scope", label: "Setup/ Scope" },
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

export default function InvestigationReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<MapRow | null>(null);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [updatedByEmail, setUpdatedByEmail] = useState<string | null>(null);
  const [accessCount, setAccessCount] = useState<number>(0);
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
  const [tablePages, setTablePages] = useState<Record<string, number>>({
    sequence: 1,
    factors: 1,
    "task-condition": 1,
    "control-barrier": 1,
    evidence: 1,
    finding: 1,
    recommendation: 1,
  });

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

    return [...factorRows].sort((a, b) => {
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
  }, [factorRows]);

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
    if (totalRows <= TABLE_PAGE_SIZE) return null;

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
          .select("id,title,description,map_code,owner_id,updated_by_user_id,created_at,updated_at")
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
        const department = String(config.department ?? headingLines.slice(1).join(" ") ?? "").trim();

        return {
          id: row.id,
          role_name: roleName,
          department,
          role_id: String(config.role_id ?? "").trim(),
          occupant_name: String(config.occupant_name ?? "").trim(),
          start_date: String(config.start_date ?? "").trim(),
          employment_type: String(config.employment_type ?? "").trim(),
          acting_name: String(config.acting_name ?? "").trim(),
          acting_start_date: String(config.acting_start_date ?? "").trim(),
          recruiting: Boolean(config.recruiting),
          proposed_role: Boolean(config.proposed_role),
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
      setAccessCount(members.length);
      setOwnerEmail(members.find((member) => member.user_id === currentMap.owner_id)?.email ?? null);
      setUpdatedByEmail(members.find((member) => member.user_id === currentMap.updated_by_user_id)?.email ?? null);
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

  const pagedSequence = getPagedRows(sortedSequenceRows, "sequence");
  const pagedFactors = getPagedRows(sortedFactorRows, "factors");
  const pagedTaskConditions = getPagedRows(taskConditionRows, "task-condition");
  const pagedControlBarriers = getPagedRows(controlBarrierRows, "control-barrier");
  const pagedEvidence = getPagedRows(evidenceRows, "evidence");
  const pagedFindings = getPagedRows(findingRows, "finding");
  const pagedRecommendations = getPagedRows(recommendationRows, "recommendation");

  return (
    <DashboardShell
      activeNav="dashboard"
      eyebrow="Investigation Tool"
      title={loading ? "Investigation Report" : map?.title ?? "Investigation Report"}
      subtitle={loading ? "Loading investigation summary..." : "Review the investigation record before opening the incident map."}
      headerRight={
        !loading && !error && map ? (
          <button
            type="button"
            className={`${styles.button} ${styles.buttonAccent}`}
            onClick={() => router.push(`/investigations/${map.id}/canvas`)}
          >
            Open Incident Map
          </button>
        ) : null
      }
    >
      <section className={styles.accountCard}>
        {loading ? <p className={styles.message}>Loading investigation report...</p> : null}
        {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}

        {!loading && !error && map ? (
          <div className={styles.accountCard}>
            <div className={styles.accountTabs} role="tablist" aria-label="Investigation report sections">
              {reportTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`${styles.accountTab} ${
                    tab.id === "task-condition" || tab.id === "control-barrier" || tab.id === "recommendation"
                      ? styles.accountTabWide
                      : ""
                  } ${activeTab === tab.id ? styles.accountTabActive : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className={styles.accountSection}>
              {activeTab === "setup-scope" ? (
                <div className={styles.reportLayout}>
                  <div className={styles.reportCard}>
                    <h3>Incident Information</h3>
                    <dl className={styles.reportList}>
                      <div>
                        <dt>Investigation name</dt>
                        <dd>{map.title}</dd>
                      </div>
                      <div>
                        <dt>Description</dt>
                        <dd>{map.description?.trim() || "No investigation summary has been added yet."}</dd>
                      </div>
                      <div>
                        <dt>Owner</dt>
                        <dd>{ownerEmail ?? "Unknown"}</dd>
                      </div>
                      <div>
                        <dt>Users with access</dt>
                        <dd>{accessCount}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className={styles.reportCard}>
                    <h3>Scope and Activity</h3>
                    <dl className={styles.reportList}>
                      <div>
                        <dt>Map code</dt>
                        <dd>{map.map_code ?? "-"}</dd>
                      </div>
                      <div>
                        <dt>Last updated by</dt>
                        <dd>{updatedByEmail ?? "Unknown"}</dd>
                      </div>
                      <div>
                        <dt>Updated</dt>
                        <dd>{formatDate(map.updated_at)}</dd>
                      </div>
                      <div>
                        <dt>Created</dt>
                        <dd>{formatDate(map.created_at)}</dd>
                      </div>
                      <div>
                        <dt>Map ID</dt>
                        <dd className={styles.reportCode}>{map.id}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              ) : activeTab === "sequence" ? (
                <>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <colgroup>
                        <col style={{ width: "8%" }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "32%" }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "20%" }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>No.</th>
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
                                {sequenceSortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            </button>
                          </th>
                          <th>Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSequenceRows.length === 0 ? (
                          <tr>
                            <td colSpan={5} className={styles.emptyState}>No sequence steps have been added yet.</td>
                        </tr>
                      ) : (
                          pagedSequence.rows.map((row, index) => (
                            <tr key={row.id}>
                              <td>
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
                          <p>{row.department || "No department recorded"}</p>
                          {row.occupant_name ? <p><strong>Occupant:</strong> {row.occupant_name}</p> : null}
                          {row.role_id ? <p><strong>Role ID:</strong> {row.role_id}</p> : null}
                          {row.employment_type ? <p><strong>Employment:</strong> {row.employment_type}</p> : null}
                          {row.start_date ? <p><strong>Start:</strong> {formatShortDate(row.start_date)}</p> : null}
                          {row.acting_name ? <p><strong>Acting:</strong> {row.acting_name}</p> : null}
                          {row.acting_start_date ? <p><strong>Acting Start:</strong> {formatShortDate(row.acting_start_date)}</p> : null}
                          {row.recruiting ? <p><strong>Recruiting</strong></p> : null}
                          {row.proposed_role ? <p><strong>Proposed Role</strong></p> : null}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              ) : activeTab === "factors" ? (
                <>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <colgroup>
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "30%" }} />
                        <col style={{ width: "30%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "10%" }} />
                      </colgroup>
                      <thead>
                      <tr>
                        <th>Type</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Presence</th>
                        <th>Classification</th>
                        <th>Category</th>
                      </tr>
                      </thead>
                      <tbody>
                      {sortedFactorRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className={styles.emptyState}>No factors have been added yet.</td>
                        </tr>
                      ) : (
                        pagedFactors.rows.map((row) => (
                          <tr key={row.id}>
                            <td><span className={styles.tableClamp}>{row.type}</span></td>
                            <td><span className={styles.tableWrapText}>{row.title}</span></td>
                            <td><span className={styles.tableWrapText}>{row.description || "-"}</span></td>
                            <td><span className={styles.tableClamp}>{row.factor_presence || "-"}</span></td>
                            <td><span className={styles.tableClamp}>{row.classification || "-"}</span></td>
                            <td><span className={styles.tableClamp}>{row.category || "-"}</span></td>
                          </tr>
                        ))
                      )}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination("factors", sortedFactorRows.length, pagedFactors.currentPage, pagedFactors.totalPages)}
                </>
              ) : activeTab === "task-condition" ? (
                <>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <colgroup>
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "30%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "35%" }} />
                      </colgroup>
                      <thead>
                      <tr>
                        <th>Task/Condition</th>
                        <th>Description</th>
                        <th>State</th>
                        <th>Environmental Context</th>
                      </tr>
                      </thead>
                      <tbody>
                      {taskConditionRows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className={styles.emptyState}>No task/condition nodes have been added yet.</td>
                        </tr>
                      ) : (
                        pagedTaskConditions.rows.map((row) => (
                          <tr key={row.id}>
                            <td><span className={styles.tableWrapText}>{row.title}</span></td>
                            <td><span className={styles.tableWrapText}>{row.description || "-"}</span></td>
                            <td><span className={styles.tableClamp}>{row.state || "-"}</span></td>
                            <td><span className={styles.tableWrapText}>{row.environmental_context || "-"}</span></td>
                          </tr>
                        ))
                      )}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(
                    "task-condition",
                    taskConditionRows.length,
                    pagedTaskConditions.currentPage,
                    pagedTaskConditions.totalPages
                  )}
                </>
              ) : activeTab === "control-barrier" ? (
                <>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <colgroup>
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "30%" }} />
                        <col style={{ width: "12.5%" }} />
                        <col style={{ width: "12.5%" }} />
                        <col style={{ width: "12.5%" }} />
                        <col style={{ width: "12.5%" }} />
                      </colgroup>
                      <thead>
                      <tr>
                        <th>Control/Barrier</th>
                        <th>Description</th>
                        <th>Barrier State</th>
                        <th>Barrier Role</th>
                        <th>Control Type</th>
                        <th>Owner</th>
                      </tr>
                      </thead>
                      <tbody>
                      {controlBarrierRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className={styles.emptyState}>No control/barrier nodes have been added yet.</td>
                        </tr>
                      ) : (
                        pagedControlBarriers.rows.map((row) => (
                          <tr key={row.id}>
                            <td><span className={styles.tableWrapText}>{row.title}</span></td>
                            <td><span className={styles.tableWrapText}>{row.description || "-"}</span></td>
                            <td><span className={styles.tableClamp}>{row.barrier_state || "-"}</span></td>
                            <td><span className={styles.tableClamp}>{row.barrier_role || "-"}</span></td>
                            <td><span className={styles.tableClamp}>{row.control_type || "-"}</span></td>
                            <td><span className={styles.tableWrapText}>{row.owner_text || "-"}</span></td>
                          </tr>
                        ))
                      )}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(
                    "control-barrier",
                    controlBarrierRows.length,
                    pagedControlBarriers.currentPage,
                    pagedControlBarriers.totalPages
                  )}
                </>
              ) : activeTab === "evidence" ? (
                <>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
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
                        <th>Type</th>
                        <th>Source</th>
                        <th>Attachment</th>
                      </tr>
                      </thead>
                      <tbody>
                      {evidenceRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className={styles.emptyState}>No evidence nodes have been added yet.</td>
                        </tr>
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
                  {renderPagination("evidence", evidenceRows.length, pagedEvidence.currentPage, pagedEvidence.totalPages)}
                </>
              ) : activeTab === "finding" ? (
                <>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <colgroup>
                        <col style={{ width: "25%" }} />
                        <col style={{ width: "55%" }} />
                        <col style={{ width: "20%" }} />
                      </colgroup>
                      <thead>
                      <tr>
                        <th>Finding</th>
                        <th>Description</th>
                        <th>Confidence Level</th>
                      </tr>
                      </thead>
                      <tbody>
                      {findingRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className={styles.emptyState}>No finding nodes have been added yet.</td>
                        </tr>
                      ) : (
                        pagedFindings.rows.map((row) => (
                          <tr key={row.id}>
                            <td><span className={styles.tableWrapText}>{row.title}</span></td>
                            <td><span className={styles.tableWrapText}>{row.description || "-"}</span></td>
                            <td><span className={styles.tableClamp}>{row.confidence_level || "-"}</span></td>
                          </tr>
                        ))
                      )}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination("finding", findingRows.length, pagedFindings.currentPage, pagedFindings.totalPages)}
                </>
              ) : activeTab === "recommendation" ? (
                <>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <colgroup>
                        <col style={{ width: "22%" }} />
                        <col style={{ width: "38%" }} />
                        <col style={{ width: "12%" }} />
                        <col style={{ width: "16%" }} />
                        <col style={{ width: "12%" }} />
                      </colgroup>
                      <thead>
                      <tr>
                        <th>Recommendation</th>
                        <th>Description</th>
                        <th>Action Type</th>
                        <th>Owner</th>
                        <th>Due Date</th>
                      </tr>
                      </thead>
                      <tbody>
                      {recommendationRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className={styles.emptyState}>No recommendation nodes have been added yet.</td>
                        </tr>
                      ) : (
                        pagedRecommendations.rows.map((row) => (
                          <tr key={row.id}>
                            <td><span className={styles.tableWrapText}>{row.title}</span></td>
                            <td><span className={styles.tableWrapText}>{row.description || "-"}</span></td>
                            <td><span className={styles.tableClamp}>{row.action_type || "-"}</span></td>
                            <td><span className={styles.tableWrapText}>{row.owner_text || "-"}</span></td>
                            <td><span className={styles.tableClamp}>{row.due_date ? formatShortDate(row.due_date) : "-"}</span></td>
                          </tr>
                        ))
                      )}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(
                    "recommendation",
                    recommendationRows.length,
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
