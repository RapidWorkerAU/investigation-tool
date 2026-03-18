"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import DashboardShell from "@/components/dashboard/DashboardShell";
import shellStyles from "@/components/dashboard/DashboardShell.module.css";
import { accessIsReadOnlyRestricted, accessRequiresSelection, fetchAccessState, isExpiredTrialAccess, type BillingAccessState } from "@/lib/access";
import {
  hasActiveTemplateAccess,
  listInvestigationTemplates,
  templateCreateDisabledReason,
  type InvestigationTemplateOption,
} from "@/lib/investigationTemplates";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type MapRecord = {
  id: string;
  title: string;
  description: string | null;
  map_code: string | null;
  owner_id: string;
  updated_by_user_id: string | null;
  owner_email: string | null;
  access_count: number;
  updated_by_email: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

type LegacyMapRow = {
  id: string;
  title: string;
  description: string | null;
  map_code: string | null;
  owner_id: string;
  updated_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

type LegacyProfileRow = {
  map_id: string;
  user_id: string;
  role: string;
  email: string | null;
};

type DocumentTypeRow = {
  id: string;
  map_id: string | null;
  name: string;
  level_rank: number;
  band_y_min: number | null;
  band_y_max: number | null;
  is_active: boolean;
};

type DocumentNodeRow = {
  id: string;
  map_id: string;
  type_id: string;
  title: string;
  document_number: string | null;
  discipline: string | null;
  owner_user_id: string | null;
  owner_name: string | null;
  user_group: string | null;
  pos_x: number;
  pos_y: number;
  width: number | null;
  height: number | null;
  is_archived: boolean;
};

type CanvasElementRow = {
  id: string;
  map_id: string;
  element_type: string;
  heading: string;
  color_hex: string | null;
  created_by_user_id: string | null;
  element_config: Record<string, unknown> | null;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
};

type NodeRelationRow = {
  id: string;
  map_id: string;
  from_node_id: string | null;
  to_node_id: string | null;
  source_grouping_element_id: string | null;
  target_grouping_element_id: string | null;
  source_system_element_id: string | null;
  target_system_element_id: string | null;
  relation_type: string;
  relationship_description: string | null;
  relationship_disciplines: string[] | null;
  relationship_category: string | null;
  relationship_custom_type: string | null;
};

type DocumentOutlineItemRow = {
  id: string;
  map_id: string;
  node_id: string;
  kind: "heading" | "content";
  heading_level: 1 | 2 | 3 | null;
  parent_heading_id: string | null;
  heading_id: string | null;
  title: string | null;
  content_text: string | null;
  sort_order: number;
};

type ProgressState = {
  percent: number;
  message: string;
  status: "idle" | "running" | "success" | "error" | "aborted";
};

type AccessRestrictionTile = {
  title: string;
  description: string;
};

const disabledActionTitle = (reason: string | null) => reason ?? undefined;

const formatSupabaseLikeError = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") return fallback;
  const message = "message" in error && typeof error.message === "string" ? error.message.trim() : "";
  const details = "details" in error && typeof error.details === "string" ? error.details.trim() : "";
  const hint = "hint" in error && typeof error.hint === "string" ? error.hint.trim() : "";
  const combined = [message, details, hint ? `Hint: ${hint}` : ""].filter(Boolean).join(" ");
  return combined || fallback;
};

const supportContactMessage = "Please contact the Investigation Tool team at support@investigationtool.com.au.";

const summarizeDashboardError = (error: unknown, fallback: string) => {
  const raw = formatSupabaseLikeError(error, fallback);
  const normalized = raw.toLowerCase();

  if (normalized.includes("not authenticated")) {
    return "Your session has expired. Please sign in again and try once more.";
  }
  if (normalized.includes("no active access period")) {
    return `You do not currently have an active access period for creating investigations. ${supportContactMessage}`;
  }
  if (normalized.includes("map creation is not allowed for this access type")) {
    return `Your current access type does not allow creating new investigations. ${supportContactMessage}`;
  }
  if (normalized.includes("no remaining map allocations")) {
    return `You have used all investigation allocations included with your current access. ${supportContactMessage}`;
  }
  if (normalized.includes("already has an active investigation map")) {
    return `Your current access allows one active investigation at a time. Delete the current map to create a new one while the access period is still active. ${supportContactMessage}`;
  }
  if (normalized.includes("active access period not found")) {
    return `We could not confirm your current access period. ${supportContactMessage}`;
  }
  if (normalized.includes("invalid input syntax for type uuid")) {
    return `We hit an internal setup issue while creating your investigation. ${supportContactMessage}`;
  }

  return `${fallback} ${supportContactMessage}`;
};

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

const formatAccessExpiry = (value: string) =>
  new Date(value).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatAccessStatus = (value: BillingAccessState["currentAccessStatus"] | null) => {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getAccessStatusToneClass = (value: BillingAccessState["currentAccessStatus"] | null) => {
  switch (value) {
    case "active":
      return shellStyles.accessStatusPillGood;
    case "selection_required":
    case "checkout_required":
    case "pending_activation":
      return shellStyles.accessStatusPillWarn;
    case "expired":
    case "payment_failed":
    case "cancelled":
    default:
      return shellStyles.accessStatusPillBad;
  }
};

export default function DashboardWorkspace() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const duplicateAbortRef = useRef(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [maps, setMaps] = useState<MapRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showCreateInvestigationModal, setShowCreateInvestigationModal] = useState(false);
  const [newInvestigationTitle, setNewInvestigationTitle] = useState("");
  const [newInvestigationDescription, setNewInvestigationDescription] = useState("");
  const [newInvestigationTemplateQuery, setNewInvestigationTemplateQuery] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateOptions, setTemplateOptions] = useState<InvestigationTemplateOption[]>([]);
  const [showTemplateOptions, setShowTemplateOptions] = useState(false);
  const [loadingTemplateOptions, setLoadingTemplateOptions] = useState(false);
  const [mapCodeInput, setMapCodeInput] = useState("");
  const [deletingMapId, setDeletingMapId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [duplicatingMapId, setDuplicatingMapId] = useState<string | null>(null);
  const [duplicateCancelRequested, setDuplicateCancelRequested] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [selectedMapIds, setSelectedMapIds] = useState<string[]>([]);
  const [accessState, setAccessState] = useState<BillingAccessState | null>(null);
  const [showAccessRestrictedModal, setShowAccessRestrictedModal] = useState(false);
  const [openingBillingPortal, setOpeningBillingPortal] = useState(false);
  const [pendingDuplicateRow, setPendingDuplicateRow] = useState<MapRecord | null>(null);
  const [pendingDeleteRow, setPendingDeleteRow] = useState<MapRecord | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [duplicateProgress, setDuplicateProgress] = useState<ProgressState>({
    percent: 0,
    message: "",
    status: "idle",
  });
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState<ProgressState>({
    percent: 0,
    message: "",
    status: "idle",
  });
  const [error, setError] = useState<string | null>(null);
  const [expandedMobileMapId, setExpandedMobileMapId] = useState<string | null>(null);
  const [mapAccessBlocked, setMapAccessBlocked] = useState(false);

  const loadMaps = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !session?.access_token) {
      router.push("/login?returnTo=%2Fdashboard");
      return;
    }

    setUserId(user.id);
    setUserEmail(user.email ?? null);

    const nextAccessState = await fetchAccessState(session.access_token);
    setAccessState(nextAccessState);

    if (accessRequiresSelection(nextAccessState)) {
      router.push("/subscribe");
      return;
    }

    const readOnlyRestricted = accessIsReadOnlyRestricted(nextAccessState);
    setShowAccessRestrictedModal(readOnlyRestricted);

    const { data: rpcRows, error: rpcError } = await supabase.rpc("list_investigation_maps");

    if (!rpcError && rpcRows) {
      setMaps(
        (rpcRows as MapRecord[]).map((row) => ({
          ...row,
          access_count: Number(row.access_count ?? 0),
        }))
      );
      return;
    }

    const isMissingRpc =
      rpcError?.message?.includes("list_investigation_maps") ||
      rpcError?.message?.includes("schema cache");

    if (!isMissingRpc && rpcError) {
      throw rpcError;
    }

    const [{ data: legacyMaps, error: mapsError }, { data: memberProfiles, error: membersError }] =
      await Promise.all([
        supabase
          .schema("ms")
          .from("system_maps")
          .select("id,title,description,map_code,owner_id,updated_by_user_id,created_at,updated_at")
          .order("updated_at", { ascending: false }),
        supabase
          .schema("ms")
          .from("map_member_profiles")
          .select("map_id,user_id,role,email"),
      ]);

    if (mapsError) throw mapsError;
    if (membersError) throw membersError;

    const profiles = memberProfiles ?? [];
    const byMap = new Map<string, LegacyProfileRow[]>();
    for (const row of profiles as LegacyProfileRow[]) {
      byMap.set(row.map_id, [...(byMap.get(row.map_id) ?? []), row]);
    }

    const merged = ((legacyMaps ?? []) as LegacyMapRow[]).map((row) => {
      const members = byMap.get(row.id) ?? [];
      const ownerEmail = members.find((member) => member.user_id === row.owner_id)?.email ?? null;
      const updatedByEmail = members.find((member) => member.user_id === row.updated_by_user_id)?.email ?? null;
      const currentRole =
        row.owner_id === user.id ? "full_write" : members.find((member) => member.user_id === user.id)?.role ?? "read";

      return {
        ...row,
        owner_email: ownerEmail,
        updated_by_email: updatedByEmail,
        access_count: members.length,
        role: currentRole,
      };
    });

    setMaps(merged);

    if (isMissingRpc) {
      setError("Dashboard RPC not installed yet. Run migration 20260312_010_list_investigation_maps_rpc.sql for full email support.");
    }
  }, [router, supabase]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        await loadMaps();
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load investigation maps.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [loadMaps]);

  const refreshMaps = useCallback(async () => {
    try {
      await loadMaps();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to refresh investigation maps.");
    }
  }, [loadMaps]);

  const refreshAccessStateLocal = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return;

    const nextAccessState = await fetchAccessState(session.access_token);
    setAccessState(nextAccessState);
    setShowAccessRestrictedModal(accessIsReadOnlyRestricted(nextAccessState));
  }, [supabase]);

  const selectedOwnedMaps = useMemo(
    () => maps.filter((map) => selectedMapIds.includes(map.id) && map.owner_id === userId),
    [maps, selectedMapIds, userId]
  );

  const canCreateMaps = accessState?.canCreateMaps ?? false;
  const canEditMaps = accessState?.canEditMaps ?? false;
  const canShareMaps = accessState?.canShareMaps ?? false;
  const canDuplicateMaps = accessState?.canDuplicateMaps ?? false;
  const canUseTemplates = hasActiveTemplateAccess(accessState);
  const accessStatus = accessState?.currentAccessStatus ?? null;
  const expiredTrialAccess = isExpiredTrialAccess(accessState);
  const accountAccessSummary =
    accessState?.currentAccessStatus === "active" &&
    accessState.currentPeriodEndsAt &&
    (accessState.currentAccessType === "trial_7d" || accessState.currentAccessType === "pass_30d")
      ? `${
          accessState.currentAccessType === "trial_7d" ? "7 Day Trial" : "30 Day Access"
        } until ${formatAccessExpiry(accessState.currentPeriodEndsAt)}`
      : null;
  const bulkDeleteEnabled = selectedOwnedMaps.length > 0 && !bulkDeleting && canEditMaps;
  const accessRestrictionHeading =
    accessStatus === "payment_failed"
      ? "Payment needed"
      : accessStatus === "cancelled"
        ? "Access cancelled"
        : "Access expired";
  const restrictedModalActionLabel =
    accessStatus === "payment_failed"
      ? "Update payment information"
      : expiredTrialAccess
        ? "View paid access"
        : "Choose access type";
  const restrictedModalText =
    accessStatus === "payment_failed"
      ? "Your maps are currently read only because the latest subscription payment did not complete. Update your payment information to restore full access."
      : expiredTrialAccess
        ? "Your 7 day trial has expired. Your investigation data is still retained, but this map is locked until you move to paid access. Choose 30 day access to keep working in this map, or upgrade to monthly access for unlimited maps and continued access to your existing investigation."
        : "Your maps are currently read only because your access is no longer active. Choose a new access type to restore editing, duplication, sharing, and export.";
  const restrictedModalSecondaryLabel = mapAccessBlocked ? "Back to dashboard" : "Continue read only";
  const accessRestrictionTiles: AccessRestrictionTile[] =
    accessStatus === "payment_failed"
      ? [
          {
            title: "Update Payment Details",
            description: "Open the billing portal and restore your current monthly access.",
          },
          {
            title: "Unlimited Maps Return",
            description: "Once payment is resolved, your existing investigation and unlimited maps are available again.",
          },
          {
            title: "Data Retained",
            description: "Your investigation content is still there while billing is brought back into good standing.",
          },
        ]
      : expiredTrialAccess
        ? [
            {
              title: "30 Day Access",
              description: "Move this investigation onto paid access and continue working in the same map.",
            },
            {
              title: "Monthly Access",
              description: "Restore this map, remove the one-map cap, and create unlimited investigations.",
            },
            {
              title: "Data Retained",
              description: "Your trial map is still stored, but it stays locked until you move to paid access.",
            },
          ]
        : accessState?.currentAccessType === "pass_30d"
          ? [
              {
                title: "30 Day Access",
                description: "Start a fresh paid access window so you can continue working without rebuilding the map.",
              },
              {
                title: "Monthly Access",
                description: "Restore this investigation and move to unlimited maps, sharing, and ongoing access.",
              },
              {
                title: "Data Retained",
                description: "Your investigation content is still stored and can be reopened once access is active again.",
              },
            ]
          : accessState?.currentAccessType === "subscription_monthly" && accessStatus === "cancelled"
            ? [
                {
                  title: "Restart Monthly Access",
                  description: "Return to ongoing access for this investigation and any future maps you need to create.",
                },
                {
                  title: "30 Day Access",
                  description: "Choose a shorter paid access window if you only need access for one investigation cycle.",
                },
                {
                  title: "Data Retained",
                  description: "Your current map remains stored and can be reopened once paid access is active again.",
                },
              ]
            : [
                {
                  title: "30 Day Access",
                  description: "Restore access to the investigation through a focused paid access period.",
                },
                {
                  title: "Monthly Access",
                  description: "Return to full ongoing access with unlimited maps and continued access to this investigation.",
                },
                {
                  title: "Data Retained",
                  description: "Your investigation content is still stored, but access remains locked until billing is active again.",
                },
              ];
  const linkMapDisabledReason = (() => {
    if (canShareMaps) return null;
    if (accessStatus === "expired") return "Map linking is unavailable because your access has expired.";
    if (accessStatus === "payment_failed") return "Map linking is unavailable until your payment details are updated.";
    if (accessStatus === "cancelled") return "Map linking is unavailable because your access has been cancelled.";
    if (accessState?.currentAccessType === "trial_7d") return "Map linking is not included with 7 Day Trial access.";
    return "Map linking is not available for your current access.";
  })();
  const createMapDisabledReason = (() => {
    if (creating) return "An investigation is already being created.";
    if (canCreateMaps) return null;
    if (accessStatus === "expired") return "Map creation is unavailable because your access has expired.";
    if (accessStatus === "payment_failed") return "Map creation is unavailable until your payment details are updated.";
    if (accessStatus === "cancelled") return "Map creation is unavailable because your access has been cancelled.";
    return "Map creation is not available for your current access.";
  })();
  const getCopyCodeDisabledReason = (map: MapRecord) => {
    if (!map.map_code) return "No map code is available for this investigation.";
    if (accessStatus === "expired") return "Map code copying is unavailable because your access has expired.";
    if (accessStatus === "payment_failed") return "Map code copying is unavailable until your payment details are updated.";
    if (accessStatus === "cancelled") return "Map code copying is unavailable because your access has been cancelled.";
    if (accessState?.currentAccessType === "trial_7d") return "Map code copying is not included with 7 Day Trial access.";
    return "Map code copying is not available for your current access.";
  };
  const getDuplicateDisabledReason = (map: MapRecord) => {
    if (duplicatingMapId === map.id) return "This investigation is currently being duplicated.";
    if ((Boolean(map.role) || map.owner_id === userId) && canDuplicateMaps) return null;
    if (accessStatus === "expired") return "Map duplication is unavailable because your access has expired.";
    if (accessStatus === "payment_failed") return "Map duplication is unavailable until your payment details are updated.";
    if (accessStatus === "cancelled") return "Map duplication is unavailable because your access has been cancelled.";
    if (accessState?.currentAccessType === "trial_7d") return "Map duplication is not included with 7 Day Trial access.";
    return "You do not have permission to duplicate this map.";
  };
  const getDeleteDisabledReason = (map: MapRecord) => {
    if (deletingMapId === map.id) return "This investigation is currently being deleted.";
    if (map.owner_id === userId && canEditMaps) return null;
    if (accessStatus === "expired") return "Map deletion is unavailable because your access has expired.";
    if (accessStatus === "payment_failed") return "Map deletion is unavailable until your payment details are updated.";
    if (accessStatus === "cancelled") return "Map deletion is unavailable because your access has been cancelled.";
    return "Only the owner can delete this map.";
  };
  const canViewMapCode = accessStatus === "active";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setMapAccessBlocked(params.get("mapAccess") === "blocked");
  }, []);

  useEffect(() => {
    if (mapAccessBlocked && accessIsReadOnlyRestricted(accessState)) {
      setShowAccessRestrictedModal(true);
    }
  }, [accessState, mapAccessBlocked]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const anyDashboardModalOpen =
      showAccessRestrictedModal ||
      showCreateInvestigationModal ||
      !!pendingDuplicateRow ||
      !!pendingDeleteRow ||
      showBulkDeleteModal;

    if (!anyDashboardModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [
    pendingDeleteRow,
    pendingDuplicateRow,
    showAccessRestrictedModal,
    showBulkDeleteModal,
    showCreateInvestigationModal,
  ]);

  const renderViewportModal = (content: React.ReactNode) =>
    portalReady && content ? createPortal(content, document.body) : null;

  const handleRestrictedAccessAction = async () => {
    if (!accessState) return;

    if (accessState.currentAccessStatus === "payment_failed") {
      try {
        setOpeningBillingPortal(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          router.push("/login?returnTo=%2Fdashboard");
          return;
        }

        const response = await fetch("/api/stripe/customer-portal", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const data = await response.json();

        if (!response.ok || !data?.url) {
          throw new Error(data?.error || "Unable to open billing portal.");
        }

        window.location.href = data.url;
      } catch (portalError) {
        setError(portalError instanceof Error ? portalError.message : "Unable to open billing portal.");
      } finally {
        setOpeningBillingPortal(false);
      }

      return;
    }

    router.push("/subscribe");
  };

  const renderBrandedModalHeader = (title: string, eyebrow = "Investigation Tool", pillLabel?: string, pillToneClass?: string) => (
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
          <span className={shellStyles.dashboardModalEyebrow}>{eyebrow}</span>
          <h3 className={`${shellStyles.modalTitle} ${shellStyles.dashboardModalTitle}`}>{title}</h3>
        </div>
      </div>
      {pillLabel && pillToneClass ? (
        <span className={`${shellStyles.accessStatusPill} ${pillToneClass}`}>{pillLabel}</span>
      ) : null}
    </div>
  );

  const resetCreateInvestigationState = useCallback(() => {
    setShowCreateInvestigationModal(false);
    setNewInvestigationTitle("");
    setNewInvestigationDescription("");
    setNewInvestigationTemplateQuery("");
    setSelectedTemplateId(null);
    setTemplateOptions([]);
    setShowTemplateOptions(false);
  }, []);

  const loadCreateTemplateOptions = useCallback(
    async (query: string) => {
      if (!canUseTemplates) return;

      try {
        setLoadingTemplateOptions(true);
        const options = await listInvestigationTemplates(supabase, query, 24);
        setTemplateOptions(options);
      } catch (templateError) {
        setError(templateError instanceof Error ? templateError.message : "Unable to load templates.");
      } finally {
        setLoadingTemplateOptions(false);
      }
    },
    [canUseTemplates, supabase]
  );

  useEffect(() => {
    if (!showCreateInvestigationModal || !canUseTemplates) return;
    void loadCreateTemplateOptions("");
  }, [showCreateInvestigationModal, canUseTemplates, loadCreateTemplateOptions]);

  const handleAddInvestigation = async () => {
    if (!canCreateMaps) return;

    try {
      setCreating(true);
      setError(null);

      const normalizedTitle = newInvestigationTitle.trim();
      const normalizedDescription = newInvestigationDescription.trim();
      const normalizedTemplateQuery = newInvestigationTemplateQuery.trim();

      if (canUseTemplates && normalizedTemplateQuery && !selectedTemplateId) {
        setError("Select a template from the list or clear the template field before creating the investigation.");
        return;
      }

      let mapId: string | null = null;

      if (canUseTemplates && selectedTemplateId) {
        const { data, error: createError } = await supabase.rpc("create_investigation_map_from_template", {
          p_template_id: selectedTemplateId,
          p_title: normalizedTitle || null,
          p_description: normalizedDescription || null,
        });

        if (createError) throw createError;
        if (!data) throw new Error("Investigation created, but no map id was returned.");
        mapId = data as string;
      } else {
        const { data, error: createError } = await supabase.rpc("create_investigation_map", {
          p_title: normalizedTitle || null,
        });
        if (createError) throw createError;
        if (!data) throw new Error("Investigation created, but no map id was returned.");

        if (normalizedDescription) {
          const { error: updateError } = await supabase
            .schema("ms")
            .from("system_maps")
            .update({ description: normalizedDescription })
            .eq("id", data);

          if (updateError) throw updateError;
        }

        mapId = data as string;
      }

      resetCreateInvestigationState();
      router.push(`/investigations/${mapId}/canvas?welcome=1`);
    } catch (createError) {
      setError(summarizeDashboardError(createError, "We could not create your investigation."));
    } finally {
      setCreating(false);
    }
  };

  const handleLinkMapToProfile = async () => {
    if (!canShareMaps) return;

    try {
      const code = mapCodeInput.trim().toUpperCase();
      if (!code) {
        setError("Enter a valid map code.");
        return;
      }

      setIsLinking(true);
      setError(null);
      const { error: linkError } = await supabase.schema("ms").rpc("link_map_to_profile_by_code", { p_map_code: code });
      if (linkError) throw linkError;

      setMapCodeInput("");
      setShowLinkForm(false);
      await refreshMaps();
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : "Unable to link map to your profile.");
    } finally {
      setIsLinking(false);
    }
  };

  const handleCopyCode = async (row: MapRecord) => {
    if (!row.map_code) return;
    if (accessState?.currentAccessType === "trial_7d" || accessStatus !== "active") return;

    try {
      await navigator.clipboard.writeText(row.map_code);
      setCopiedMessage(`Map code copied for "${row.title}"`);
      window.setTimeout(() => setCopiedMessage(null), 1600);
    } catch {
      setError("Unable to copy map code.");
    }
  };

  const openDuplicateConfirm = (row: MapRecord) => {
    setDuplicateProgress({ percent: 0, message: "", status: "idle" });
    setDuplicateCancelRequested(false);
    window.requestAnimationFrame(() => {
      setPendingDuplicateRow(row);
    });
  };

  const handleDeleteMap = async (row: MapRecord) => {
    if (!userId || row.owner_id !== userId) return;

    try {
      setDeletingMapId(row.id);
      setError(null);

      const { error: deleteError } = await supabase
        .schema("ms")
        .from("system_maps")
        .delete()
        .eq("id", row.id)
        .eq("owner_id", userId);

      if (deleteError) throw deleteError;

      setPendingDeleteRow(null);
      setMaps((current) => current.filter((map) => map.id !== row.id));
      await refreshAccessStateLocal();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete map.");
    } finally {
      setDeletingMapId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedOwnedMaps.length || !userId) return;

    try {
      setBulkDeleting(true);
      setError(null);
      setBulkDeleteProgress({
        percent: 8,
        message: `Deleting 0 of ${selectedOwnedMaps.length} selected maps...`,
        status: "running",
      });

      let completed = 0;
      for (const map of selectedOwnedMaps) {
        const { error: deleteError } = await supabase
          .schema("ms")
          .from("system_maps")
          .delete()
          .eq("id", map.id)
          .eq("owner_id", userId);

        if (deleteError) throw deleteError;

        completed += 1;
        const percent = Math.round((completed / selectedOwnedMaps.length) * 100);
        setBulkDeleteProgress({
          percent,
          message: `Deleting ${completed} of ${selectedOwnedMaps.length} selected maps...`,
          status: "running",
        });
      }

      setBulkDeleteProgress({
        percent: 100,
        message: `${selectedOwnedMaps.length} map${selectedOwnedMaps.length === 1 ? "" : "s"} deleted.`,
        status: "success",
      });

      setMaps((current) => current.filter((map) => !selectedMapIds.includes(map.id)));
      setSelectedMapIds([]);
      await refreshAccessStateLocal();

      await new Promise((resolve) => setTimeout(resolve, 900));
      setShowBulkDeleteModal(false);
    } catch (bulkDeleteError) {
      setBulkDeleteProgress({
        percent: 100,
        message: "Bulk delete failed.",
        status: "error",
      });
      setError(bulkDeleteError instanceof Error ? bulkDeleteError.message : "Unable to bulk delete maps.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDuplicateMap = async (row: MapRecord) => {
    if (!userId) return;

    const cancellationError = new Error("DUPLICATION_CANCELLED");
    let createdMapId: string | null = null;

    const setProgress = (percent: number, message: string, status: ProgressState["status"] = "running") => {
      setDuplicateProgress({ percent, message, status });
    };

    const throwIfCancelled = () => {
      if (duplicateAbortRef.current) throw cancellationError;
    };

    const cleanupDuplicatedMap = async (mapId: string) => {
      await supabase.schema("ms").from("document_outline_items").delete().eq("map_id", mapId);
      await supabase.schema("ms").from("node_relations").delete().eq("map_id", mapId);
      await supabase.schema("ms").from("canvas_elements").delete().eq("map_id", mapId);
      await supabase.schema("ms").from("document_nodes").delete().eq("map_id", mapId);
      await supabase.schema("ms").from("document_types").delete().eq("map_id", mapId);
      await supabase.schema("ms").from("map_members").delete().eq("map_id", mapId);
      await supabase.schema("ms").from("map_view_state").delete().eq("map_id", mapId);
      await supabase.schema("ms").from("system_maps").delete().eq("id", mapId);
    };

    try {
      setDuplicatingMapId(row.id);
      setDuplicateCancelRequested(false);
      duplicateAbortRef.current = false;
      setError(null);
      setProgress(4, "Checking access...");

      const duplicateTitle = `${row.title} (Copy)`;
      throwIfCancelled();

      setProgress(10, "Creating duplicate map...");
      const { data: createdMap, error: createMapError } = await supabase.rpc("create_investigation_map", {
        p_title: duplicateTitle,
      });

      if (createMapError || !createdMap) throw createMapError ?? new Error("Unable to create duplicate map.");
      createdMapId = createdMap;

      if (row.description) {
        const { error: descriptionError } = await supabase
          .schema("ms")
          .from("system_maps")
          .update({ description: row.description })
          .eq("id", createdMapId);

        if (descriptionError) throw descriptionError;
      }

      setProgress(16, "Loading source map data...");
      const [typesRes, nodesRes, elementsRes, relationsRes, outlineRes] = await Promise.all([
        supabase
          .schema("ms")
          .from("document_types")
          .select("id,map_id,name,level_rank,band_y_min,band_y_max,is_active")
          .eq("map_id", row.id),
        supabase
          .schema("ms")
          .from("document_nodes")
          .select("id,map_id,type_id,title,document_number,discipline,owner_user_id,owner_name,user_group,pos_x,pos_y,width,height,is_archived")
          .eq("map_id", row.id),
        supabase
          .schema("ms")
          .from("canvas_elements")
          .select("id,map_id,element_type,heading,color_hex,created_by_user_id,element_config,pos_x,pos_y,width,height")
          .eq("map_id", row.id),
        supabase
          .schema("ms")
          .from("node_relations")
          .select("id,map_id,from_node_id,to_node_id,source_grouping_element_id,target_grouping_element_id,source_system_element_id,target_system_element_id,relation_type,relationship_description,relationship_disciplines,relationship_category,relationship_custom_type")
          .eq("map_id", row.id),
        supabase
          .schema("ms")
          .from("document_outline_items")
          .select("id,map_id,node_id,kind,heading_level,parent_heading_id,heading_id,title,content_text,sort_order")
          .eq("map_id", row.id),
      ]);

      if (typesRes.error || nodesRes.error || elementsRes.error || relationsRes.error || outlineRes.error) {
        throw (
          typesRes.error ??
          nodesRes.error ??
          elementsRes.error ??
          relationsRes.error ??
          outlineRes.error ??
          new Error("Unable to load source map data.")
        );
      }

      const sourceTypes = (typesRes.data ?? []) as DocumentTypeRow[];
      const sourceNodes = (nodesRes.data ?? []) as DocumentNodeRow[];
      const sourceElements = (elementsRes.data ?? []) as CanvasElementRow[];
      const sourceRelations = (relationsRes.data ?? []) as NodeRelationRow[];
      const sourceOutlineItems = (outlineRes.data ?? []) as DocumentOutlineItemRow[];

      const typeIdMap = new Map<string, string>();
      const nodeIdMap = new Map<string, string>();
      const elementIdMap = new Map<string, string>();
      const outlineHeadingIdMap = new Map<string, string>();

      setProgress(24, "Cloning document types...");
      for (const sourceType of sourceTypes) {
        throwIfCancelled();
        const { data, error } = await supabase
          .schema("ms")
          .from("document_types")
          .insert({
            map_id: createdMapId,
            name: sourceType.name,
            level_rank: sourceType.level_rank,
            band_y_min: sourceType.band_y_min,
            band_y_max: sourceType.band_y_max,
            is_active: sourceType.is_active,
          })
          .select("id")
          .single();

        if (error || !data?.id) throw error ?? new Error("Unable to duplicate document types.");
        typeIdMap.set(sourceType.id, data.id);
      }

      setProgress(42, "Cloning document nodes...");
      for (const sourceNode of sourceNodes) {
        throwIfCancelled();
        const { data, error } = await supabase
          .schema("ms")
          .from("document_nodes")
          .insert({
            map_id: createdMapId,
            type_id: typeIdMap.get(sourceNode.type_id) ?? sourceNode.type_id,
            title: sourceNode.title,
            document_number: sourceNode.document_number,
            discipline: sourceNode.discipline,
            owner_user_id: sourceNode.owner_user_id,
            owner_name: sourceNode.owner_name,
            user_group: sourceNode.user_group,
            pos_x: sourceNode.pos_x,
            pos_y: sourceNode.pos_y,
            width: sourceNode.width,
            height: sourceNode.height,
            is_archived: sourceNode.is_archived,
          })
          .select("id")
          .single();

        if (error || !data?.id) throw error ?? new Error("Unable to duplicate document nodes.");
        nodeIdMap.set(sourceNode.id, data.id);
      }

      setProgress(62, "Cloning canvas elements...");
      for (const sourceElement of sourceElements) {
        throwIfCancelled();
        const { data, error } = await supabase
          .schema("ms")
          .from("canvas_elements")
          .insert({
            map_id: createdMapId,
            element_type: sourceElement.element_type,
            heading: sourceElement.heading,
            color_hex: sourceElement.color_hex,
            created_by_user_id: sourceElement.created_by_user_id,
            element_config: sourceElement.element_config,
            pos_x: sourceElement.pos_x,
            pos_y: sourceElement.pos_y,
            width: sourceElement.width,
            height: sourceElement.height,
          })
          .select("id")
          .single();

        if (error || !data?.id) throw error ?? new Error("Unable to duplicate canvas elements.");
        elementIdMap.set(sourceElement.id, data.id);
      }

      setProgress(78, "Cloning relationships...");
      for (const sourceRelation of sourceRelations) {
        throwIfCancelled();
        const { error } = await supabase.schema("ms").from("node_relations").insert({
          map_id: createdMapId,
          from_node_id: sourceRelation.from_node_id ? nodeIdMap.get(sourceRelation.from_node_id) ?? null : null,
          to_node_id: sourceRelation.to_node_id ? nodeIdMap.get(sourceRelation.to_node_id) ?? null : null,
          source_grouping_element_id: sourceRelation.source_grouping_element_id
            ? elementIdMap.get(sourceRelation.source_grouping_element_id) ?? null
            : null,
          target_grouping_element_id: sourceRelation.target_grouping_element_id
            ? elementIdMap.get(sourceRelation.target_grouping_element_id) ?? null
            : null,
          source_system_element_id: sourceRelation.source_system_element_id
            ? elementIdMap.get(sourceRelation.source_system_element_id) ?? null
            : null,
          target_system_element_id: sourceRelation.target_system_element_id
            ? elementIdMap.get(sourceRelation.target_system_element_id) ?? null
            : null,
          relation_type: sourceRelation.relation_type,
          relationship_description: sourceRelation.relationship_description,
          relationship_disciplines: sourceRelation.relationship_disciplines,
          relationship_category: sourceRelation.relationship_category,
          relationship_custom_type: sourceRelation.relationship_custom_type,
        });

        if (error) throw error;
      }

      setProgress(88, "Cloning outline content...");
      for (const heading of sourceOutlineItems.filter((item) => item.kind === "heading")) {
        throwIfCancelled();
        const { data, error } = await supabase
          .schema("ms")
          .from("document_outline_items")
          .insert({
            map_id: createdMapId,
            node_id: nodeIdMap.get(heading.node_id) ?? heading.node_id,
            kind: heading.kind,
            heading_level: heading.heading_level,
            parent_heading_id: heading.parent_heading_id ? outlineHeadingIdMap.get(heading.parent_heading_id) ?? null : null,
            heading_id: null,
            title: heading.title,
            content_text: heading.content_text,
            sort_order: heading.sort_order,
          })
          .select("id")
          .single();

        if (error || !data?.id) throw error ?? new Error("Unable to duplicate outline headings.");
        outlineHeadingIdMap.set(heading.id, data.id);
      }

      for (const content of sourceOutlineItems.filter((item) => item.kind === "content")) {
        throwIfCancelled();
        const { error } = await supabase.schema("ms").from("document_outline_items").insert({
          map_id: createdMapId,
          node_id: nodeIdMap.get(content.node_id) ?? content.node_id,
          kind: content.kind,
          heading_level: content.heading_level,
          parent_heading_id: content.parent_heading_id ? outlineHeadingIdMap.get(content.parent_heading_id) ?? null : null,
          heading_id: content.heading_id ? outlineHeadingIdMap.get(content.heading_id) ?? null : null,
          title: content.title,
          content_text: content.content_text,
          sort_order: content.sort_order,
        });

        if (error) throw error;
      }

      setProgress(100, "Duplicate complete. Opening map...", "success");
      await new Promise((resolve) => setTimeout(resolve, 900));
      setPendingDuplicateRow(null);
      router.push(`/investigations/${createdMapId}/canvas`);
    } catch (duplicateError) {
      if (duplicateError === cancellationError) {
        if (createdMapId) {
          setProgress(92, "Cancellation requested. Cleaning up...");
          await cleanupDuplicatedMap(createdMapId);
          setDuplicateProgress({
            percent: 100,
            message: "Duplication cancelled. No duplicated items remain.",
            status: "aborted",
          });
        } else {
          setDuplicateProgress({
            percent: 100,
            message: "Duplication cancelled before a new map was created.",
            status: "aborted",
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 900));
        setPendingDuplicateRow(null);
      } else {
        setDuplicateProgress({
          percent: 100,
          message: "Duplicate failed.",
          status: "error",
        });
        setError(duplicateError instanceof Error ? duplicateError.message : "Unable to duplicate map.");
      }
    } finally {
      duplicateAbortRef.current = false;
      setDuplicateCancelRequested(false);
      setDuplicatingMapId(null);
    }
  };

  return (
    <DashboardShell
      activeNav="dashboard"
      eyebrow="Investigation Tool"
      title="Dashboard"
      subtitle="Manage your investigation maps from one central workspace."
      headerRight={
        <div className={shellStyles.accountSummary}>
          <div className={shellStyles.accountSummaryText}>
            <div className={shellStyles.accountSummaryPrimary}>
              <span className={shellStyles.accountSummaryLabel}>My account</span>
              <strong>{userEmail ?? "Signed in"}</strong>
            </div>
            {accountAccessSummary ? <div className={shellStyles.accountSummaryMeta}>{accountAccessSummary}</div> : null}
          </div>
        </div>
      }
    >
      <section className={shellStyles.accountCard}>
        <div className={shellStyles.tableToolbar}>
          <span title={disabledActionTitle(!bulkDeleteEnabled ? "Bulk delete is only available for maps you own and can edit." : null)}>
            <button
              type="button"
              className={`${shellStyles.button} ${shellStyles.buttonDanger} ${shellStyles.bulkDeleteButton}`}
              disabled={!bulkDeleteEnabled}
              onClick={() => {
                setBulkDeleteProgress({ percent: 0, message: "", status: "idle" });
                setShowBulkDeleteModal(true);
              }}
            >
              <Image src="/icons/delete.svg" alt="" width={16} height={16} className={shellStyles.buttonIconDanger} />
              Bulk Delete
            </button>
          </span>
          <div className={shellStyles.toolbarControls}>
            <div className={shellStyles.headerButtons}>
              <span title={disabledActionTitle(linkMapDisabledReason)}>
                <button
                  type="button"
                  className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                  onClick={() => setShowLinkForm((current) => !current)}
                  disabled={!canShareMaps}
                >
                  <Image src="/icons/relationship.svg" alt="" width={18} height={18} className={shellStyles.buttonIconDark} />
                  <span className={shellStyles.desktopToolbarLabel}>Link Map Code</span>
                  <span className={shellStyles.mobileToolbarLabel}>Link Map</span>
                </button>
              </span>
              <span title={disabledActionTitle(createMapDisabledReason)}>
                <button
                  type="button"
                  className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                  onClick={() => setShowCreateInvestigationModal(true)}
                  disabled={creating || !canCreateMaps}
                >
                  <Image src="/icons/addcomponent.svg" alt="" width={18} height={18} className={shellStyles.buttonIcon} />
                  <span className={shellStyles.desktopToolbarLabel}>{creating ? "Creating..." : "Add Investigation"}</span>
                  <span className={shellStyles.mobileToolbarLabel}>{creating ? "Creating..." : "Add New"}</span>
                </button>
              </span>
            </div>

            {showLinkForm ? (
              <div className={shellStyles.linkBar}>
                <input
                  className={shellStyles.input}
                  type="text"
                  placeholder="Enter map code"
                  value={mapCodeInput}
                  onChange={(event) => setMapCodeInput(event.target.value)}
                />
                <span title={disabledActionTitle(isLinking ? "Map linking is in progress." : linkMapDisabledReason)}>
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                    onClick={() => void handleLinkMapToProfile()}
                    disabled={isLinking || !canShareMaps}
                  >
                    {isLinking ? "Linking..." : "Link"}
                  </button>
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {error ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{error}</p> : null}
        {copiedMessage ? <p className={`${shellStyles.message} ${shellStyles.messageSuccess}`}>{copiedMessage}</p> : null}

        <div className={`${shellStyles.tableWrap} ${shellStyles.reportDataTableWrap}`}>
          <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className={shellStyles.tableCheckbox}
                    aria-label="Select all investigations"
                    checked={maps.length > 0 && selectedMapIds.length === maps.length}
                    onChange={(event) =>
                      setSelectedMapIds(event.target.checked ? maps.map((map) => map.id) : [])
                    }
                  />
                </th>
                <th>Map name</th>
                <th>Owner</th>
                <th>Code</th>
                <th>Last updated by</th>
                <th>Updated date</th>
                <th>Created date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className={shellStyles.tableStateCell}>
                    <div className={shellStyles.tableLoadingState}>
                      <div className={shellStyles.tableLoadingBar} aria-hidden="true" />
                      <span>Loading investigations...</span>
                    </div>
                  </td>
                </tr>
              ) : maps.length === 0 ? (
                <tr>
                  <td colSpan={8} className={shellStyles.tableStateCell}>
                    <div className={shellStyles.tableEmptyState}>Clear the search or create a new map.</div>
                  </td>
                </tr>
              ) : (
                maps.map((map) => {
                  const canDelete = map.owner_id === userId && canEditMaps;
                  const canDuplicate = (Boolean(map.role) || map.owner_id === userId) && canDuplicateMaps;
                  const canCopy = Boolean(map.map_code) && accessState?.currentAccessType !== "trial_7d" && accessStatus === "active";
                  const isSelected = selectedMapIds.includes(map.id);
                  const copyDisabledReason = canCopy ? null : getCopyCodeDisabledReason(map);
                  const duplicateDisabledReason = canDuplicate && duplicatingMapId !== map.id ? null : getDuplicateDisabledReason(map);
                  const deleteDisabledReason = canDelete && deletingMapId !== map.id ? null : getDeleteDisabledReason(map);

                  return (
                    <tr
                      key={map.id}
                      className={shellStyles.clickableRow}
                      tabIndex={0}
                      onClick={() => router.push(`/investigations/${map.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/investigations/${map.id}`);
                        }
                      }}
                    >
                      <td onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          className={shellStyles.tableCheckbox}
                          aria-label={`Select ${map.title}`}
                          checked={isSelected}
                          onChange={(event) => {
                            setSelectedMapIds((current) =>
                              event.target.checked ? [...current, map.id] : current.filter((id) => id !== map.id)
                            );
                          }}
                        />
                      </td>
                      <td>
                        <div className={shellStyles.mapCell}>
                          <div className={shellStyles.mapCellText}>
                            <strong className={shellStyles.tableClamp}>{map.title}</strong>
                            <span className={shellStyles.tableClamp}>{map.description || "-"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={shellStyles.tableClamp}>{map.owner_email ?? "Unknown"}</span>
                      </td>
                      <td>
                        <span className={shellStyles.tableClamp}>{canViewMapCode ? map.map_code ?? "-" : "Restricted"}</span>
                      </td>
                      <td>
                        <span className={shellStyles.tableClamp}>{map.updated_by_email ?? "Unknown"}</span>
                      </td>
                      <td>
                        <span className={shellStyles.tableDate}>{formatDate(map.updated_at)}</span>
                      </td>
                      <td>
                        <span className={shellStyles.tableDate}>{formatDate(map.created_at)}</span>
                      </td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <div className={shellStyles.actionButtons}>
                          <span title={disabledActionTitle(copyDisabledReason)}>
                            <button
                              type="button"
                              className={shellStyles.actionButton}
                              disabled={!canCopy}
                              onClick={() => void handleCopyCode(map)}
                            >
                              <Image src="/icons/structure.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                            </button>
                          </span>
                          <span title={disabledActionTitle(duplicateDisabledReason)}>
                            <button
                              type="button"
                              className={shellStyles.actionButton}
                              disabled={!canDuplicate || duplicatingMapId === map.id}
                              onClick={() => openDuplicateConfirm(map)}
                            >
                              <Image src="/icons/addcomponent.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                            </button>
                          </span>
                          <span title={disabledActionTitle(deleteDisabledReason)}>
                            <button
                              type="button"
                              className={`${shellStyles.actionButton} ${shellStyles.actionButtonDanger}`}
                              disabled={!canDelete || deletingMapId === map.id}
                              onClick={() => setPendingDeleteRow(map)}
                            >
                              <Image src="/icons/delete.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                            </button>
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className={shellStyles.dashboardMobileList}>
          {loading ? (
            <div className={shellStyles.dashboardMobileState}>
              <div className={shellStyles.tableLoadingBar} aria-hidden="true" />
              <span>Loading investigations...</span>
            </div>
          ) : maps.length === 0 ? (
            <div className={shellStyles.dashboardMobileState}>Create a new map or link an existing one.</div>
          ) : (
            maps.map((map) => {
              const canDelete = map.owner_id === userId && canEditMaps;
              const canDuplicate = (Boolean(map.role) || map.owner_id === userId) && canDuplicateMaps;
              const canCopy = Boolean(map.map_code) && accessState?.currentAccessType !== "trial_7d" && accessStatus === "active";
              const isSelected = selectedMapIds.includes(map.id);
              const copyDisabledReason = canCopy ? null : getCopyCodeDisabledReason(map);
              const duplicateDisabledReason = canDuplicate && duplicatingMapId !== map.id ? null : getDuplicateDisabledReason(map);
              const deleteDisabledReason = canDelete && deletingMapId !== map.id ? null : getDeleteDisabledReason(map);

              return (
                <article
                  key={`mobile-${map.id}`}
                  className={shellStyles.dashboardMobileCard}
                >
                  <button
                    type="button"
                    className={shellStyles.dashboardMobileCardToggle}
                    aria-expanded={expandedMobileMapId === map.id}
                    onClick={() =>
                      setExpandedMobileMapId((current) => (current === map.id ? null : map.id))
                    }
                  >
                    <div className={shellStyles.dashboardMobileCardHeader}>
                      <label
                        className={shellStyles.dashboardMobileCheckbox}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className={shellStyles.tableCheckbox}
                          aria-label={`Select ${map.title}`}
                          checked={isSelected}
                          onChange={(event) => {
                            setSelectedMapIds((current) =>
                              event.target.checked ? [...current, map.id] : current.filter((id) => id !== map.id)
                            );
                          }}
                        />
                      </label>
                      <div className={shellStyles.dashboardMobileCardTitleBlock}>
                        <strong>{map.title}</strong>
                        <span>{map.description || "No description"}</span>
                      </div>
                      <span className={shellStyles.dashboardMobileChevron} aria-hidden="true">
                        {expandedMobileMapId === map.id ? "−" : "+"}
                      </span>
                    </div>
                  </button>

                  {expandedMobileMapId === map.id ? (
                    <>
                      <dl className={shellStyles.dashboardMobileMeta}>
                        <div>
                          <dt>Owner</dt>
                          <dd>{map.owner_email ?? "Unknown"}</dd>
                        </div>
                        <div>
                          <dt>Code</dt>
                          <dd>{canViewMapCode ? map.map_code ?? "-" : "Restricted"}</dd>
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
                            router.push(`/investigations/${map.id}`);
                          }}
                        >
                          Open Investigation
                        </button>
                      </div>

                      <div className={shellStyles.dashboardMobileActions}>
                        <span title={disabledActionTitle(copyDisabledReason)}>
                          <button
                            type="button"
                            className={`${shellStyles.button} ${shellStyles.buttonSecondary} ${shellStyles.dashboardMobileActionButton}`}
                            disabled={!canCopy}
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleCopyCode(map);
                            }}
                          >
                            <Image src="/icons/structure.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                            Copy Code
                          </button>
                        </span>
                        <span title={disabledActionTitle(duplicateDisabledReason)}>
                          <button
                            type="button"
                            className={`${shellStyles.button} ${shellStyles.buttonSecondary} ${shellStyles.dashboardMobileActionButton}`}
                            disabled={!canDuplicate || duplicatingMapId === map.id}
                            onTouchEnd={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              openDuplicateConfirm(map);
                            }}
                            onClick={(event) => {
                              event.stopPropagation();
                              openDuplicateConfirm(map);
                            }}
                          >
                            <Image src="/icons/addcomponent.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                            {duplicatingMapId === map.id ? "Duplicating..." : "Duplicate"}
                          </button>
                        </span>
                        <span title={disabledActionTitle(deleteDisabledReason)}>
                          <button
                            type="button"
                            className={`${shellStyles.button} ${shellStyles.buttonDanger} ${shellStyles.dashboardMobileActionButton}`}
                            disabled={!canDelete || deletingMapId === map.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              setPendingDeleteRow(map);
                            }}
                          >
                            <Image src="/icons/delete.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                            {deletingMapId === map.id ? "Deleting..." : "Delete"}
                          </button>
                        </span>
                      </div>
                    </>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>

      {renderViewportModal(showAccessRestrictedModal && accessState ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.accessRestrictionModal}`}>
            <div className={shellStyles.accessRestrictionHeader}>
              {renderBrandedModalHeader(
                accessRestrictionHeading,
                "Investigation Tool",
                formatAccessStatus(accessState.currentAccessStatus),
                getAccessStatusToneClass(accessState.currentAccessStatus),
              )}
            </div>

            <p className={`${shellStyles.modalText} ${shellStyles.accessRestrictionLead}`}>{restrictedModalText}</p>

            <div className={shellStyles.accessRestrictionOptions}>
              {accessRestrictionTiles.map((tile) => (
                <div key={tile.title} className={shellStyles.accessRestrictionOptionCard}>
                  <strong>{tile.title}</strong>
                  <p>{tile.description}</p>
                </div>
              ))}
            </div>

            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                onClick={() => {
                  setShowAccessRestrictedModal(false);
                  if (mapAccessBlocked) {
                    router.replace("/dashboard");
                  }
                }}
              >
                {restrictedModalSecondaryLabel}
              </button>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                onClick={() => void handleRestrictedAccessAction()}
                disabled={openingBillingPortal}
              >
                {openingBillingPortal ? "Opening..." : restrictedModalActionLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null)}

      {renderViewportModal(showCreateInvestigationModal ? (
        <div className={`${shellStyles.modalBackdrop} ${shellStyles.createInvestigationBackdrop}`}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard} ${shellStyles.createInvestigationCard}`}>
            <div className={shellStyles.createInvestigationHeader}>
              <div>
                {renderBrandedModalHeader("Create your investigation", "New investigation")}
                <p className={shellStyles.modalText}>
                  Give the investigation a clear working title and a short description so your team can identify the purpose straight away.
                </p>
              </div>
            </div>

            <div className={shellStyles.createInvestigationForm}>
              <label className={shellStyles.accountField}>
                <span>Investigation Title</span>
                <input
                  className={shellStyles.input}
                  type="text"
                  value={newInvestigationTitle}
                  onChange={(event) => setNewInvestigationTitle(event.target.value)}
                  placeholder="Example: Forklift collision in warehouse"
                  maxLength={120}
                />
                <span className={shellStyles.createInvestigationHint}>
                  Use a short title that identifies the event, location, or incident being examined.
                </span>
              </label>

              <label className={shellStyles.accountField}>
                <span>Start From Template</span>
                <div
                  className={shellStyles.templatePickerField}
                  title={canUseTemplates ? undefined : templateCreateDisabledReason}
                >
                  <div className={shellStyles.templatePickerControl}>
                    <input
                      className={`${shellStyles.input} ${shellStyles.templatePickerInput}`}
                      type="text"
                      value={newInvestigationTemplateQuery}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setNewInvestigationTemplateQuery(nextValue);
                        setSelectedTemplateId(null);
                        if (!canUseTemplates) return;
                        if (nextValue.trim().length >= 4) {
                          setShowTemplateOptions(true);
                          void loadCreateTemplateOptions(nextValue);
                        }
                      }}
                      onFocus={() => {
                        if (!canUseTemplates) return;
                        if (newInvestigationTemplateQuery.trim().length >= 4) {
                          setShowTemplateOptions(true);
                          void loadCreateTemplateOptions(newInvestigationTemplateQuery);
                        }
                      }}
                      placeholder={canUseTemplates ? "Browse or type to find a template" : "Templates require active subscription access"}
                      disabled={!canUseTemplates || creating}
                    />
                    <button
                      type="button"
                      className={`${shellStyles.button} ${shellStyles.buttonSecondary} ${shellStyles.templatePickerToggle}`}
                      onClick={() => {
                        if (!canUseTemplates) return;
                        setShowTemplateOptions((current) => {
                          const nextOpen = !current;
                          if (nextOpen) {
                            void loadCreateTemplateOptions(newInvestigationTemplateQuery.trim().length >= 4 ? newInvestigationTemplateQuery : "");
                          }
                          return nextOpen;
                        });
                      }}
                      disabled={!canUseTemplates || creating}
                      title={canUseTemplates ? "Browse templates" : undefined}
                    >
                      Browse
                    </button>
                  </div>

                  {showTemplateOptions && canUseTemplates ? (
                    <div className={shellStyles.templatePickerMenu}>
                      {loadingTemplateOptions ? (
                        <div className={shellStyles.templatePickerStatus}>Loading templates...</div>
                      ) : templateOptions.length ? (
                        templateOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            className={`${shellStyles.templatePickerOption} ${
                              selectedTemplateId === option.id ? shellStyles.templatePickerOptionActive : ""
                            }`}
                            onClick={() => {
                              setSelectedTemplateId(option.id);
                              setNewInvestigationTemplateQuery(option.name);
                              setShowTemplateOptions(false);
                            }}
                          >
                            <strong>{option.name}</strong>
                            <span>Updated {formatMobileDate(option.updated_at)}</span>
                          </button>
                        ))
                      ) : (
                        <div className={shellStyles.templatePickerStatus}>
                          {newInvestigationTemplateQuery.trim().length >= 4
                            ? "No templates match that search."
                            : "Open the list or type 4 characters to start filtering templates."}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
                <span className={shellStyles.createInvestigationHint}>
                  {canUseTemplates
                    ? "Optional. Browse the list or type 4 characters to filter your saved templates, then select one to start from that layout."
                    : "Template-based map creation is available to active subscription holders."}
                </span>
              </label>

              <label className={shellStyles.accountField}>
                <span>Description</span>
                <textarea
                  className={`${shellStyles.input} ${shellStyles.createInvestigationTextarea}`}
                  value={newInvestigationDescription}
                  onChange={(event) => setNewInvestigationDescription(event.target.value)}
                  placeholder="Example: Review the sequence of events, contributing factors, controls, and corrective actions for the warehouse forklift collision."
                  rows={5}
                  maxLength={600}
                />
                <span className={shellStyles.createInvestigationHint}>
                  Add context such as what happened, who is involved, or what the investigation needs to establish.
                </span>
              </label>
            </div>

            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                onClick={() => {
                  if (creating) return;
                  resetCreateInvestigationState();
                }}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                onClick={() => void handleAddInvestigation()}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create investigation"}
              </button>
            </div>
          </div>
        </div>
      ) : null)}

      {renderViewportModal(pendingDuplicateRow ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard}`}>
            {renderBrandedModalHeader("Duplicate map?", "Investigation Tool")}
            <p className={shellStyles.modalText}>
              You are about to duplicate <strong>{pendingDuplicateRow.title}</strong>.
            </p>
            <p className={shellStyles.modalText}>
              The duplicate will include nodes, components, relationships and outline content. You will become the owner of the new map.
            </p>

            {duplicateProgress.status !== "idle" ? (
              <div className={shellStyles.progressBlock}>
                <div className={shellStyles.progressHeader}>
                  <span>{duplicateProgress.message}</span>
                  <span>{duplicateProgress.percent}%</span>
                </div>
                <div className={shellStyles.progressTrack}>
                  <div
                    className={`${shellStyles.progressFill} ${
                      duplicateProgress.status === "error"
                        ? shellStyles.progressError
                        : duplicateProgress.status === "success"
                          ? shellStyles.progressSuccess
                          : duplicateProgress.status === "aborted"
                            ? shellStyles.progressAborted
                            : ""
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, duplicateProgress.percent))}%` }}
                  />
                </div>
              </div>
            ) : null}

            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                onClick={() => {
                  if (duplicatingMapId === pendingDuplicateRow.id) {
                    duplicateAbortRef.current = true;
                    setDuplicateCancelRequested(true);
                    return;
                  }
                  setPendingDuplicateRow(null);
                }}
                disabled={duplicatingMapId === pendingDuplicateRow.id && duplicateCancelRequested}
              >
                {duplicatingMapId === pendingDuplicateRow.id ? (duplicateCancelRequested ? "Stopping..." : "Cancel duplication") : "Cancel"}
              </button>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                onClick={() => void handleDuplicateMap(pendingDuplicateRow)}
                disabled={duplicatingMapId === pendingDuplicateRow.id}
              >
                {duplicatingMapId === pendingDuplicateRow.id ? "Duplicating..." : "Duplicate map"}
              </button>
            </div>
          </div>
        </div>
      ) : null)}

      {renderViewportModal(pendingDeleteRow ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard}`}>
            {renderBrandedModalHeader("Delete map?", "Investigation Tool")}
            <p className={shellStyles.modalText}>
              You are about to permanently delete <strong>{pendingDeleteRow.title}</strong>.
            </p>
            <div className={shellStyles.modalListWrap}>
              <ul className={shellStyles.modalList}>
                <li>The investigation map</li>
                <li>All nodes and canvas components</li>
                <li>All relationships and outline content</li>
                <li>All linked map member access for this map</li>
              </ul>
            </div>
            <p className={shellStyles.modalWarning}>This cannot be undone.</p>
            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                onClick={() => setPendingDeleteRow(null)}
                disabled={deletingMapId === pendingDeleteRow.id}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonDanger}`}
                onClick={() => void handleDeleteMap(pendingDeleteRow)}
                disabled={deletingMapId === pendingDeleteRow.id}
              >
                {deletingMapId === pendingDeleteRow.id ? "Deleting..." : "Delete map"}
              </button>
            </div>
          </div>
        </div>
      ) : null)}

      {renderViewportModal(showBulkDeleteModal ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard}`}>
            {renderBrandedModalHeader("Bulk delete selected maps?", "Investigation Tool")}
            <p className={shellStyles.modalText}>
              You are about to permanently delete <strong>{selectedOwnedMaps.length}</strong> selected map
              {selectedOwnedMaps.length === 1 ? "" : "s"}.
            </p>
            <div className={shellStyles.modalListWrap}>
              <ul className={shellStyles.modalList}>
                <li>Only maps you own will be deleted</li>
                <li>Nodes, components, relationships and outline content will be removed</li>
                <li>This cannot be undone</li>
              </ul>
            </div>

            {bulkDeleteProgress.status !== "idle" ? (
              <div className={shellStyles.progressBlock}>
                <div className={shellStyles.progressHeader}>
                  <span>{bulkDeleteProgress.message}</span>
                  <span>{bulkDeleteProgress.percent}%</span>
                </div>
                <div className={shellStyles.progressTrack}>
                  <div
                    className={`${shellStyles.progressFill} ${
                      bulkDeleteProgress.status === "error" ? shellStyles.progressError : shellStyles.progressSuccess
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, bulkDeleteProgress.percent))}%` }}
                  />
                </div>
              </div>
            ) : null}

            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={bulkDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonDanger}`}
                onClick={() => void handleBulkDelete()}
                disabled={!bulkDeleteEnabled}
              >
                {bulkDeleting ? "Deleting..." : "Delete selected"}
              </button>
            </div>
          </div>
        </div>
      ) : null)}
    </DashboardShell>
  );
}
