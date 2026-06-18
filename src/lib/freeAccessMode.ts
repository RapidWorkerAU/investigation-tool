export const freeAccessModeEnabled =
  (process.env.NEXT_PUBLIC_FREE_ACCESS_MODE ?? process.env.FREE_ACCESS_MODE ?? "true").toLowerCase() !== "false";

export const freeAccessModeLabel = "Free launch access";
