export function toTitleCaseLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function splitBracketedValue(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(.*?)\s*\((.*?)\)\s*$/);
  if (!match) return { main: trimmed, bracket: "" };
  return { main: match[1].trim(), bracket: toTitleCaseLabel(match[2].trim()) };
}

export function normalizeHeaderKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}
