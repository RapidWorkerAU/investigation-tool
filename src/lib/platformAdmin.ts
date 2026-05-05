export const platformAdminEmail = "ashleigh.phillips@hses.com.au";

export const isPlatformAdminEmail = (email?: string | null) =>
  (email ?? "").trim().toLowerCase() === platformAdminEmail;
