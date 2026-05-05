"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardTableLoadingState";
import shellStyles from "@/components/dashboard/DashboardShell.module.css";
import {
  DEFAULT_REPORT_SECTION_HEADING_COLOR,
  DEFAULT_REPORT_TABLE_HEADING_COLOR,
  normalizeHexColor,
  slugifyOrganisationName,
} from "@/lib/organisationBranding";
import { isPlatformAdminEmail } from "@/lib/platformAdmin";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";

type OrganisationRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  memberCount: number;
};

type CreateOrganisationStep = "details" | "branding" | "structure" | "review";

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Australia/Perth",
  }).format(new Date(value));

export default function AdminOrganisationsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [organisations, setOrganisations] = useState<OrganisationRow[]>([]);
  const [selectedOrganisationIds, setSelectedOrganisationIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [billingPlanName, setBillingPlanName] = useState("");
  const [billingNotes, setBillingNotes] = useState("");
  const [departmentNames, setDepartmentNames] = useState("");
  const [siteNames, setSiteNames] = useState("");
  const [sectionHeadingColor, setSectionHeadingColor] = useState(DEFAULT_REPORT_SECTION_HEADING_COLOR);
  const [tableHeadingColor, setTableHeadingColor] = useState(DEFAULT_REPORT_TABLE_HEADING_COLOR);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [createStep, setCreateStep] = useState<CreateOrganisationStep>("details");

  const generatedSlug = useMemo(() => slugifyOrganisationName(name), [name]);
  const allSelected = organisations.length > 0 && selectedOrganisationIds.length === organisations.length;
  const createSteps: Array<{
    id: CreateOrganisationStep;
    label: string;
    description: string;
  }> = [
    { id: "details", label: "Details", description: "Organisation identity and billing context." },
    { id: "branding", label: "Branding", description: "Default logo and colours for reports." },
    { id: "structure", label: "Structure", description: "Optional departments and sites." },
    { id: "review", label: "Review", description: "Confirm before creating the organisation." },
  ];
  const createStepIndex = createSteps.findIndex((step) => step.id === createStep);

  const loadOrganisations = async (accessToken: string) => {
    const response = await fetch("/api/admin/organisations/list", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = (await response.json()) as { organisations?: OrganisationRow[]; error?: string };
    if (!response.ok) {
      throw new Error(payload.error || "Unable to load organisations.");
    }

    const nextOrganisations = payload.organisations ?? [];
    setOrganisations(nextOrganisations);
    setSelectedOrganisationIds((current) =>
      current.filter((organisationId) => nextOrganisations.some((organisation) => organisation.id === organisationId))
    );
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const user = await ensurePortalSupabaseUser();
        if (!user) {
          router.push("/login?returnTo=%2Fadmin%2Forganisations");
          return;
        }

        setCurrentUserEmail(user.email ?? null);
        const isAdmin = isPlatformAdminEmail(user.email);
        setAuthorized(isAdmin);

        if (!isAdmin) {
          setLoading(false);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          router.push("/login?returnTo=%2Fadmin%2Forganisations");
          return;
        }

        await loadOrganisations(session.access_token);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load organisations.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [router, supabase]);

  const resetCreateForm = () => {
    setCreateModalOpen(false);
    setCreateSubmitting(false);
    setCreateError(null);
    setName("");
    setDescription("");
    setBillingPlanName("");
    setBillingNotes("");
    setDepartmentNames("");
    setSiteNames("");
    setSectionHeadingColor(DEFAULT_REPORT_SECTION_HEADING_COLOR);
    setTableHeadingColor(DEFAULT_REPORT_TABLE_HEADING_COLOR);
    setCreateStep("details");
    setLogoFile(null);
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setLogoPreviewUrl("");
  };

  const handleCreateOrganisation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateSubmitting(true);
    setCreateError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const formData = new FormData();
      formData.set("name", name);
      formData.set("slug", generatedSlug);
      formData.set("description", description);
      formData.set("billingPlanName", billingPlanName);
      formData.set("billingNotes", billingNotes);
      formData.set("departmentNames", departmentNames);
      formData.set("siteNames", siteNames);
      formData.set("sectionHeadingColor", normalizeHexColor(sectionHeadingColor, DEFAULT_REPORT_SECTION_HEADING_COLOR));
      formData.set("tableHeadingColor", normalizeHexColor(tableHeadingColor, DEFAULT_REPORT_TABLE_HEADING_COLOR));
      if (logoFile) {
        formData.set("logo", logoFile);
      }

      const response = await fetch("/api/admin/organisations/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const payload = (await response.json()) as { organisation?: { id: string }; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to create organisation.");
      }

      await loadOrganisations(session.access_token);
      resetCreateForm();

      if (payload.organisation?.id) {
        router.push(`/admin/organisations/${payload.organisation.id}`);
      }
    } catch (submitError) {
      setCreateError(submitError instanceof Error ? submitError.message : "Unable to create organisation.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const response = await fetch("/api/admin/organisations/bulk-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          organisationIds: selectedOrganisationIds,
        }),
      });

      const payload = (await response.json()) as { deletedIds?: string[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to bulk delete organisations.");
      }

      await loadOrganisations(session.access_token);
      setSelectedOrganisationIds((current) =>
        current.filter((organisationId) => !(payload.deletedIds ?? []).includes(organisationId))
      );
      setBulkDeleteModalOpen(false);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to bulk delete organisations.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const goToNextCreateStep = () => {
    setCreateStep((current) => {
      if (current === "details") return "branding";
      if (current === "branding") return "structure";
      if (current === "structure") return "review";
      return current;
    });
  };

  const goToPreviousCreateStep = () => {
    setCreateStep((current) => {
      if (current === "review") return "structure";
      if (current === "structure") return "branding";
      if (current === "branding") return "details";
      return current;
    });
  };

  if (loading) {
    return (
      <DashboardPageSkeleton
        mode="admin"
        activeNav="admin-organisations"
        eyebrow="Admin"
        title="Organisations"
        subtitle="View the organisations available for grouping users."
        rows={6}
        columns="8% 6% 21% 17% 28% 8% 12%"
        showToolbar
      />
    );
  }

  return (
    <DashboardShell
      mode="admin"
      activeNav="admin-organisations"
      eyebrow="Admin"
      title="Organisations"
      subtitle="View the organisations available for grouping users."
      headerRight={
        currentUserEmail ? (
          <div className={shellStyles.accountSummary}>
            <div className={shellStyles.accountSummaryText}>
              <div className={shellStyles.accountSummaryPrimary}>
                <span className={shellStyles.accountSummaryLabel}>Admin account</span>
                <strong>{currentUserEmail}</strong>
              </div>
            </div>
          </div>
        ) : undefined
      }
    >
      <section className={shellStyles.accountCard}>
        {error ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{error}</p> : null}
        {!authorized ? (
          <p className={`${shellStyles.message} ${shellStyles.messageError}`}>This page is restricted to the admin account.</p>
        ) : (
          <>
            <div className={shellStyles.tableToolbar}>
              <span title={!selectedOrganisationIds.length ? "Select one or more organisations to bulk delete." : undefined}>
                <button
                  type="button"
                  className={`${shellStyles.button} ${shellStyles.buttonDanger} ${shellStyles.bulkDeleteButton}`}
                  onClick={() => setBulkDeleteModalOpen(true)}
                  disabled={!selectedOrganisationIds.length || bulkDeleting}
                >
                  <Image src="/icons/delete.svg" alt="" width={16} height={16} className={shellStyles.buttonIconDanger} />
                  Bulk Delete
                </button>
              </span>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                onClick={() => setCreateModalOpen(true)}
              >
                Create organisation
              </button>
            </div>

            <div className={`${shellStyles.tableWrap} ${shellStyles.reportDataTableWrap}`}>
              <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
                <colgroup>
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "21%" }} />
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "12%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>
                      <input
                        className={shellStyles.tableCheckbox}
                        type="checkbox"
                        checked={allSelected}
                        onChange={() =>
                          setSelectedOrganisationIds(allSelected ? [] : organisations.map((organisation) => organisation.id))
                        }
                        aria-label="Select all organisations"
                      />
                    </th>
                    <th>#</th>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Description</th>
                    <th>Users</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {organisations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={shellStyles.tableStateCell}>
                        <div className={shellStyles.tableEmptyState}>No organisations have been created yet.</div>
                      </td>
                    </tr>
                  ) : (
                    organisations.map((organisation, index) => (
                      <tr
                        key={organisation.id}
                        className={shellStyles.clickableRow}
                        tabIndex={0}
                        onClick={() => router.push(`/admin/organisations/${organisation.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            router.push(`/admin/organisations/${organisation.id}`);
                          }
                        }}
                      >
                        <td onClick={(event) => event.stopPropagation()}>
                          <input
                            className={shellStyles.tableCheckbox}
                            type="checkbox"
                            checked={selectedOrganisationIds.includes(organisation.id)}
                            onChange={(event) =>
                              setSelectedOrganisationIds((current) =>
                                event.target.checked
                                  ? [...current, organisation.id]
                                  : current.filter((id) => id !== organisation.id)
                              )
                            }
                            aria-label={`Select ${organisation.name}`}
                          />
                        </td>
                        <td><span className={shellStyles.tableValue}>{index + 1}</span></td>
                        <td>
                          <div className={shellStyles.mapCell}>
                            <div className={shellStyles.mapCellText}>
                              <strong className={shellStyles.tableClamp}>{organisation.name}</strong>
                              <span className={shellStyles.tableClamp}>{organisation.id}</span>
                            </div>
                          </div>
                        </td>
                        <td><span className={shellStyles.tableValue}>{organisation.slug || "-"}</span></td>
                        <td><span className={shellStyles.tableWrapText}>{organisation.description || "No description set"}</span></td>
                        <td><span className={shellStyles.tableValue}>{organisation.memberCount}</span></td>
                        <td><span className={shellStyles.tableDate}>{formatDateTime(organisation.createdAt)}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={shellStyles.dashboardMobileList}>
              {organisations.length === 0 ? (
                <div className={shellStyles.dashboardMobileState}>No organisations have been created yet.</div>
              ) : (
                organisations.map((organisation, index) => (
                  <article
                    key={`mobile-${organisation.id}`}
                    className={shellStyles.dashboardMobileCard}
                    onClick={() => router.push(`/admin/organisations/${organisation.id}`)}
                  >
                    <div className={shellStyles.dashboardMobileCardHeader}>
                      <label
                        className={shellStyles.dashboardMobileCheckbox}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className={shellStyles.tableCheckbox}
                          checked={selectedOrganisationIds.includes(organisation.id)}
                          onChange={(event) =>
                            setSelectedOrganisationIds((current) =>
                              event.target.checked
                                ? [...current, organisation.id]
                                : current.filter((id) => id !== organisation.id)
                            )
                          }
                          aria-label={`Select ${organisation.name}`}
                        />
                      </label>
                      <div className={shellStyles.dashboardMobileCardTitleBlock}>
                        <strong>{index + 1}. {organisation.name}</strong>
                        <span>{organisation.slug || "No slug set"}</span>
                      </div>
                    </div>
                    <dl className={shellStyles.dashboardMobileMeta}>
                      <div>
                        <dt>Description</dt>
                        <dd>{organisation.description || "No description set"}</dd>
                      </div>
                      <div>
                        <dt>Users</dt>
                        <dd>{organisation.memberCount}</dd>
                      </div>
                      <div className={shellStyles.dashboardMobileMetaDate}>
                        <dt>Created</dt>
                        <dd>{formatDateTime(organisation.createdAt)}</dd>
                      </div>
                    </dl>
                  </article>
                ))
              )}
            </div>
          </>
        )}
      </section>

      {createModalOpen ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard} ${shellStyles.adminWizardModalCard}`}>
            <div className={shellStyles.dashboardModalHeader}>
              <div className={shellStyles.dashboardModalBrand}>
                <Image
                  src="/images/investigation-tool.png"
                  alt="Investigation Tool"
                  width={40}
                  height={40}
                  className={shellStyles.dashboardModalLogo}
                />
                <div className={shellStyles.dashboardModalBrandCopy}>
                  <span className={shellStyles.dashboardModalEyebrow}>Admin</span>
                  <h3 className={`${shellStyles.modalTitle} ${shellStyles.dashboardModalTitle}`}>Create organisation</h3>
                </div>
              </div>
              <button
                type="button"
                className={shellStyles.adminWizardClose}
                onClick={resetCreateForm}
                aria-label="Close create organisation modal"
              >
                x
              </button>
            </div>
            <div className={shellStyles.adminWizardIntro}>
              <p className={shellStyles.modalText}>Set up a new customer organisation, then define the default branding that report builder should use for its users.</p>
              <div className={shellStyles.adminWizardStepRail}>
                {createSteps.map((step, index) => {
                  const isActive = step.id === createStep;
                  const isComplete = index < createStepIndex;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      className={`${shellStyles.adminWizardStep} ${isActive ? shellStyles.adminWizardStepActive : ""} ${isComplete ? shellStyles.adminWizardStepComplete : ""}`}
                      onClick={() => setCreateStep(step.id)}
                    >
                      <span className={shellStyles.adminWizardStepIndex}>{index + 1}</span>
                      <span className={shellStyles.adminWizardStepCopy}>
                        <strong>{step.label}</strong>
                        <span>{step.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <form onSubmit={handleCreateOrganisation} className={shellStyles.adminWizardForm}>
              <div className={shellStyles.adminWizardBody}>
                {createStep === "details" ? (
                  <div className={shellStyles.adminModalStack}>
                    <label className={`${shellStyles.accountField} ${shellStyles.adminCompactField}`}>
                      <span>Organisation name</span>
                      <input className={`${shellStyles.input} ${shellStyles.adminCompactInput}`} value={name} onChange={(event) => setName(event.target.value)} required />
                    </label>
                    <label className={`${shellStyles.accountField} ${shellStyles.adminCompactField}`}>
                      <span>Slug</span>
                      <input className={`${shellStyles.input} ${shellStyles.adminCompactInput}`} value={generatedSlug} readOnly aria-readonly="true" />
                    </label>
                    <label className={`${shellStyles.accountField} ${shellStyles.adminCompactField}`}>
                      <span>Description</span>
                      <textarea
                        className={`${shellStyles.input} ${shellStyles.reportScopeTextarea} ${shellStyles.adminCompactTextarea}`}
                        rows={2}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                      />
                    </label>
                    <label className={`${shellStyles.accountField} ${shellStyles.adminCompactField}`}>
                      <span>Billing plan name</span>
                      <input className={`${shellStyles.input} ${shellStyles.adminCompactInput}`} value={billingPlanName} onChange={(event) => setBillingPlanName(event.target.value)} />
                    </label>
                    <label className={`${shellStyles.accountField} ${shellStyles.adminCompactField}`}>
                      <span>Billing notes</span>
                      <textarea className={`${shellStyles.input} ${shellStyles.reportScopeTextarea} ${shellStyles.adminCompactTextarea}`} rows={2} value={billingNotes} onChange={(event) => setBillingNotes(event.target.value)} />
                    </label>
                  </div>
                ) : null}

                {createStep === "branding" ? (
                  <div className={shellStyles.adminBrandingGroup}>
                    <div className={shellStyles.adminBrandingHeader}>
                      <strong>Organisation branding</strong>
                      <span>These values become the default report branding for organisation users.</span>
                    </div>
                    <div className={shellStyles.adminUploadField}>
                      <span>Logo</span>
                      <span className={shellStyles.adminUploadHint}>PNG, JPG, or SVG. This will become the default report logo.</span>
                      <label className={shellStyles.adminUploadButton}>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                          className={shellStyles.adminFileInput}
                          onChange={(event) => {
                            const nextFile = event.target.files?.[0] ?? null;
                            setLogoFile(nextFile);
                            if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
                            setLogoPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : "");
                          }}
                        />
                        <span>{logoFile ? "Replace Logo" : "Upload Logo"}</span>
                      </label>
                      {logoPreviewUrl ? (
                        <div className={shellStyles.adminLogoPreviewWrap}>
                          <Image
                            src={logoPreviewUrl}
                            alt="Organisation logo preview"
                            width={160}
                            height={56}
                            unoptimized
                            className={shellStyles.adminLogoPreview}
                          />
                        </div>
                      ) : (
                        <div className={shellStyles.adminLogoEmpty}>No logo selected.</div>
                      )}
                    </div>
                    <label className={`${shellStyles.accountField} ${shellStyles.adminCompactField}`}>
                      <span>Section heading colour</span>
                      <div className={shellStyles.adminColorField}>
                        <input
                          type="color"
                          className={shellStyles.adminColorInput}
                          value={normalizeHexColor(sectionHeadingColor, DEFAULT_REPORT_SECTION_HEADING_COLOR)}
                          onChange={(event) => setSectionHeadingColor(event.target.value.toUpperCase())}
                        />
                        <input
                          className={`${shellStyles.input} ${shellStyles.adminCompactInput}`}
                          value={sectionHeadingColor}
                          onChange={(event) => setSectionHeadingColor(event.target.value)}
                        />
                      </div>
                    </label>
                    <label className={`${shellStyles.accountField} ${shellStyles.adminCompactField}`}>
                      <span>Table heading colour</span>
                      <div className={shellStyles.adminColorField}>
                        <input
                          type="color"
                          className={shellStyles.adminColorInput}
                          value={normalizeHexColor(tableHeadingColor, DEFAULT_REPORT_TABLE_HEADING_COLOR)}
                          onChange={(event) => setTableHeadingColor(event.target.value.toUpperCase())}
                        />
                        <input
                          className={`${shellStyles.input} ${shellStyles.adminCompactInput}`}
                          value={tableHeadingColor}
                          onChange={(event) => setTableHeadingColor(event.target.value)}
                        />
                      </div>
                    </label>
                  </div>
                ) : null}

                {createStep === "structure" ? (
                  <div className={shellStyles.adminModalStack}>
                    <label className={`${shellStyles.accountField} ${shellStyles.adminCompactField}`}>
                      <span>Departments</span>
                      <textarea
                        className={`${shellStyles.input} ${shellStyles.reportScopeTextarea} ${shellStyles.adminCompactTextarea}`}
                        rows={4}
                        value={departmentNames}
                        onChange={(event) => setDepartmentNames(event.target.value)}
                        placeholder="One per line or comma separated"
                      />
                    </label>
                    <label className={`${shellStyles.accountField} ${shellStyles.adminCompactField}`}>
                      <span>Sites</span>
                      <textarea
                        className={`${shellStyles.input} ${shellStyles.reportScopeTextarea} ${shellStyles.adminCompactTextarea}`}
                        rows={4}
                        value={siteNames}
                        onChange={(event) => setSiteNames(event.target.value)}
                        placeholder="One per line or comma separated"
                      />
                    </label>
                  </div>
                ) : null}

                {createStep === "review" ? (
                  <div className={shellStyles.adminModalStack}>
                    <div className={shellStyles.adminBrandingGroup}>
                      <div className={shellStyles.adminBrandingHeader}>
                        <strong>{name}</strong>
                        <span>{generatedSlug}</span>
                      </div>
                      <div className={shellStyles.adminDetailMetaGrid}>
                        <div className={shellStyles.adminDetailMetaItem}>
                          <dt>Description</dt>
                          <dd>{description || "-"}</dd>
                        </div>
                        <div className={shellStyles.adminDetailMetaItem}>
                          <dt>Departments</dt>
                          <dd>{departmentNames.trim() ? departmentNames : "-"}</dd>
                        </div>
                        <div className={shellStyles.adminDetailMetaItem}>
                          <dt>Sites</dt>
                          <dd>{siteNames.trim() ? siteNames : "-"}</dd>
                        </div>
                      </div>
                    </div>
                    <p className={shellStyles.modalText}>
                      Review the setup above, then create the organisation when ready.
                    </p>
                  </div>
                ) : null}
              </div>
              {createError ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{createError}</p> : null}
              <div className={shellStyles.modalActions}>
                <button type="button" className={`${shellStyles.button} ${shellStyles.buttonSecondary}`} onClick={resetCreateForm} disabled={createSubmitting}>
                  Cancel
                </button>
                {createStep !== "details" ? (
                  <button type="button" className={`${shellStyles.button} ${shellStyles.buttonSecondary}`} onClick={goToPreviousCreateStep} disabled={createSubmitting}>
                    Back
                  </button>
                ) : null}
                {createStep !== "review" ? (
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                    onClick={goToNextCreateStep}
                    disabled={createStep === "details" && !name.trim()}
                  >
                    Next
                  </button>
                ) : (
                  <button type="submit" className={`${shellStyles.button} ${shellStyles.buttonAccent}`} disabled={createSubmitting}>
                    {createSubmitting ? "Creating..." : "Create organisation"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {bulkDeleteModalOpen ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard}`}>
            <div className={shellStyles.dashboardModalHeader}>
              <div className={shellStyles.dashboardModalBrand}>
                <Image
                  src="/images/investigation-tool.png"
                  alt="Investigation Tool"
                  width={40}
                  height={40}
                  className={shellStyles.dashboardModalLogo}
                />
                <div className={shellStyles.dashboardModalBrandCopy}>
                  <span className={shellStyles.dashboardModalEyebrow}>Admin</span>
                  <h3 className={`${shellStyles.modalTitle} ${shellStyles.dashboardModalTitle}`}>Bulk delete organisations</h3>
                </div>
              </div>
            </div>
            <p className={shellStyles.modalText}>
              Delete {selectedOrganisationIds.length} selected organisation{selectedOrganisationIds.length === 1 ? "" : "s"} and all related membership, invite, site, and department records.
            </p>
            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                onClick={() => setBulkDeleteModalOpen(false)}
                disabled={bulkDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonDanger}`}
                onClick={() => void handleBulkDelete()}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? "Deleting..." : "Delete organisations"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
