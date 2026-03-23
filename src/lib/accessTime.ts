const ACCESS_TIME_ZONE = "Australia/Perth";
const ACCESS_TIME_ZONE_LABEL = "AWST (UTC+8, Perth time)";

export function formatAccessDateTime(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const formatted = new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ACCESS_TIME_ZONE,
  }).format(date);

  return `${formatted} ${ACCESS_TIME_ZONE_LABEL}`;
}

export function getAccessTimeZoneLabel() {
  return ACCESS_TIME_ZONE_LABEL;
}
