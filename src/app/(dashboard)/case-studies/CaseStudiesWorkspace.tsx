"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import shellStyles from "@/components/dashboard/DashboardShell.module.css";
import { DashboardMobileLoadingState, DashboardPageSkeleton, DashboardTableLoadingState } from "@/components/dashboard/DashboardTableLoadingState";
import DashboardTableFooter from "@/components/dashboard/DashboardTableFooter";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type CaseStudyMapRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  campaign_title: string;
  campaign_description: string | null;
  owner_id: string;
  owner_email: string | null;
  updated_by_user_id: string | null;
  updated_by_email: string | null;
  session_duration_hours: number;
  created_at: string;
  updated_at: string;
};

const pageSize = 7;

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatMobileDate = (value: string) =>
  new Date(value).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function CaseStudiesWorkspace() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [maps, setMaps] = useState<CaseStudyMapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedMobileMapId, setExpandedMobileMapId] = useState<string | null>(null);

  const loadCaseStudies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login?returnTo=%2Fcase-studies");
        return;
      }

      setUserEmail(user.email ?? null);

      const { data, error: listError } = await supabase.rpc("list_case_study_maps");
      if (listError) {
        throw listError;
      }

      setMaps(((data ?? []) as CaseStudyMapRow[]).map((row) => ({
        ...row,
        session_duration_hours: Number(row.session_duration_hours ?? 0),
      })));
      setPage(1);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load case studies.");
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    void loadCaseStudies();
  }, [loadCaseStudies]);

  const safePage = Math.min(Math.max(1, page), Math.max(1, Math.ceil(maps.length / pageSize)));
  const paginatedMaps = maps.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openCaseStudy = (mapId: string) => {
    router.push(`/investigations/${mapId}?from=case-studies`);
  };

  if (loading) {
    return (
      <DashboardPageSkeleton
        activeNav="case-studies"
        title="Case Studies"
        subtitle="Open public investigation maps in read-only mode."
        rows={5}
        columns="24% 18% 16% 12% 14% 10% 6%"
      />
    );
  }

  return (
    <DashboardShell
      activeNav="case-studies"
      eyebrow="Investigation Tool"
      title="Case Studies"
      subtitle="Open public investigation maps in read-only mode."
      headerRight={
        <div className={shellStyles.accountSummary}>
          <div className={shellStyles.accountSummaryText}>
            <div className={shellStyles.accountSummaryPrimary}>
              <span className={shellStyles.accountSummaryLabel}>My account</span>
              <strong>{userEmail ?? "Signed in"}</strong>
            </div>
            <div className={shellStyles.accountSummaryMeta}>Read-only public maps</div>
          </div>
        </div>
      }
    >
      <section className={shellStyles.accountCard}>
        {error ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{error}</p> : null}

        <div className={`${shellStyles.tableWrap} ${shellStyles.reportDataTableWrap}`}>
          <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
            <colgroup>
              <col style={{ width: "24%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "6%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Map name</th>
                <th>Case study</th>
                <th>Owner</th>
                <th>Mode</th>
                <th>Last updated by</th>
                <th>Updated date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className={shellStyles.tableStateCell}>
                    <DashboardTableLoadingState message="Loading case studies..." />
                  </td>
                </tr>
              ) : maps.length === 0 ? (
                <tr>
                  <td colSpan={7} className={shellStyles.tableStateCell}>
                    <div className={shellStyles.tableEmptyState}>No case studies are available yet.</div>
                  </td>
                </tr>
              ) : (
                paginatedMaps.map((map) => (
                  <tr
                    key={map.id}
                    className={shellStyles.clickableRow}
                    tabIndex={0}
                    onClick={() => openCaseStudy(map.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openCaseStudy(map.id);
                      }
                    }}
                  >
                    <td>
                      <div className={shellStyles.mapCell}>
                        <div className={shellStyles.mapCellText}>
                          <strong className={shellStyles.tableClamp}>{map.title}</strong>
                          <span className={shellStyles.tableClamp}>{map.description || map.campaign_description || "-"}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={shellStyles.tableClamp}>{map.campaign_title || map.slug}</span>
                    </td>
                    <td>
                      <span className={shellStyles.tableClamp}>{map.owner_email ?? "Unknown"}</span>
                    </td>
                    <td>
                      <span className={shellStyles.tableClamp}>Read only</span>
                    </td>
                    <td>
                      <span className={shellStyles.tableClamp}>{map.updated_by_email ?? "Unknown"}</span>
                    </td>
                    <td>
                      <span className={shellStyles.tableDate}>{formatDate(map.updated_at)}</span>
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                        onClick={() => openCaseStudy(map.id)}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={shellStyles.dashboardMobileList}>
          {loading ? (
            <DashboardMobileLoadingState message="Loading case studies..." />
          ) : maps.length === 0 ? (
            <div className={shellStyles.dashboardMobileState}>No case studies are available yet.</div>
          ) : (
            paginatedMaps.map((map) => (
              <article key={`mobile-${map.id}`} className={shellStyles.dashboardMobileCard}>
                <button
                  type="button"
                  className={shellStyles.dashboardMobileCardToggle}
                  aria-expanded={expandedMobileMapId === map.id}
                  onClick={() => setExpandedMobileMapId((current) => (current === map.id ? null : map.id))}
                >
                  <div className={shellStyles.dashboardMobileCardHeader}>
                    <div className={shellStyles.dashboardMobileCardTitleBlock}>
                      <strong>{map.title}</strong>
                      <span>{map.description || map.campaign_description || "Read-only case study"}</span>
                    </div>
                    <span className={shellStyles.dashboardMobileChevron} aria-hidden="true">
                      {expandedMobileMapId === map.id ? "-" : "+"}
                    </span>
                  </div>
                </button>

                {expandedMobileMapId === map.id ? (
                  <>
                    <dl className={shellStyles.dashboardMobileMeta}>
                      <div>
                        <dt>Case Study</dt>
                        <dd>{map.campaign_title || map.slug}</dd>
                      </div>
                      <div>
                        <dt>Mode</dt>
                        <dd>Read only</dd>
                      </div>
                      <div className={shellStyles.dashboardMobileMetaDate}>
                        <dt>Updated</dt>
                        <dd>{formatMobileDate(map.updated_at)}</dd>
                      </div>
                      <div className={shellStyles.dashboardMobileMetaDate}>
                        <dt>Created</dt>
                        <dd>{formatMobileDate(map.created_at)}</dd>
                      </div>
                    </dl>

                    <div className={shellStyles.dashboardMobilePrimaryAction}>
                      <button
                        type="button"
                        className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          openCaseStudy(map.id);
                        }}
                      >
                        <Image src="/icons/mapicon.svg" alt="" width={16} height={16} className={shellStyles.buttonIcon} />
                        Open Case Study
                      </button>
                    </div>
                  </>
                ) : null}
              </article>
            ))
          )}
        </div>

        <DashboardTableFooter
          total={maps.length}
          page={safePage}
          pageSize={pageSize}
          onPageChange={setPage}
          label="case studies"
        />
      </section>
    </DashboardShell>
  );
}
