export const DEFAULT_REPORT_LOGO_PATH = "";
export const DEFAULT_REPORT_SECTION_HEADING_COLOR = "#22344D";
export const DEFAULT_REPORT_TABLE_HEADING_COLOR = "#7C8793";

export type OrganisationBranding = {
  logo_storage_path?: string | null;
  section_heading_color?: string | null;
  table_heading_color?: string | null;
};

export type ResolvedOrganisationBranding = {
  logo_storage_path: string;
  section_heading_color: string;
  table_heading_color: string;
};

export function normalizeHexColor(value: string | null | undefined, fallback: string) {
  const trimmed = (value ?? "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  return fallback;
}

export function slugifyOrganisationName(value: string) {
  const ascii = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return ascii || "organisation";
}

export function normalizeOrganisationBranding(branding: OrganisationBranding | null | undefined): ResolvedOrganisationBranding {
  return {
    logo_storage_path: (branding?.logo_storage_path ?? "").trim(),
    section_heading_color: normalizeHexColor(
      branding?.section_heading_color,
      DEFAULT_REPORT_SECTION_HEADING_COLOR,
    ),
    table_heading_color: normalizeHexColor(
      branding?.table_heading_color,
      DEFAULT_REPORT_TABLE_HEADING_COLOR,
    ),
  };
}
