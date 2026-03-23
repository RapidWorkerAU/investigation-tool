import type { BillingAccessState } from "@/lib/access";

export type InvestigationTemplateOption = {
  id: string;
  name: string;
  updated_at: string;
  is_global: boolean;
  can_edit: boolean;
};

export type InvestigationTemplateSnapshot = {
  types: Array<Record<string, unknown>>;
  nodes: Array<Record<string, unknown>>;
  elements: Array<Record<string, unknown>>;
  relations: Array<Record<string, unknown>>;
  outlineItems: Array<Record<string, unknown>>;
};

export const templateAccessDisabledReason = "Saving templates is only available for active subscription holders.";
export const templateCreateDisabledReason = "Templates are only available when your account can create investigation maps.";

export function hasActiveTemplateAccess(state: BillingAccessState | null | undefined) {
  return state?.currentAccessType === "subscription_monthly" && state.currentAccessStatus === "active";
}

export function hasTemplateBrowseAccess(state: BillingAccessState | null | undefined) {
  return Boolean(state?.canCreateMaps);
}

export async function listInvestigationTemplates(
  supabase: { rpc: (fn: string, args?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message?: string } | null }> },
  query: string,
  limit = 20
) {
  const { data, error } = await supabase.rpc("list_investigation_templates", {
    p_query: query.trim() || null,
    p_limit: limit,
  });

  if (error) {
    throw new Error(error.message || "Unable to load templates.");
  }

  return (data ?? []) as InvestigationTemplateOption[];
}
