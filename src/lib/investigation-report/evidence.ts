export function getConfigValue(config: Record<string, unknown> | null | undefined, ...keys: string[]) {
  if (!config) return "";
  for (const key of keys) {
    const value = config[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function getEvidenceMediaPath(config: Record<string, unknown> | null | undefined) {
  return getConfigValue(config, "media_storage_path", "mediaStoragePath", "storage_path", "storagePath");
}

export function getEvidenceMediaUrl(config: Record<string, unknown> | null | undefined) {
  return getConfigValue(config, "preview_url", "previewUrl", "file_url", "fileUrl", "public_url", "publicUrl", "url");
}

export function getEvidenceMediaMime(config: Record<string, unknown> | null | undefined) {
  return getConfigValue(config, "media_mime", "mediaMime", "mime_type", "mimeType");
}

export function getEvidenceMediaName(config: Record<string, unknown> | null | undefined) {
  return getConfigValue(config, "media_name", "mediaName", "file_name", "fileName");
}

export function isPdfEvidence(config: Record<string, unknown> | null | undefined) {
  const mime = getEvidenceMediaMime(config).toLowerCase();
  const name = getEvidenceMediaName(config).toLowerCase();
  const path = getEvidenceMediaPath(config).toLowerCase();
  return mime.includes("pdf") || name.endsWith(".pdf") || path.endsWith(".pdf");
}

export function getEvidenceFileType(config: Record<string, unknown> | null | undefined) {
  const mime = getEvidenceMediaMime(config).toLowerCase();
  if (mime.includes("/")) {
    return mime.split("/").pop()?.toUpperCase() || "FILE";
  }

  const name = getEvidenceMediaName(config).toLowerCase();
  const path = getEvidenceMediaPath(config).toLowerCase();
  const source = name || path;
  const match = source.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toUpperCase() || "FILE";
}

export function cleanEvidenceDescription(value: string | null | undefined) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";

  const sourceStripped = trimmed
    .replace(/source:\s*.*?(?=(media:|description:|storage path:|$))/i, "")
    .replace(/media:\s*.*?(?=(description:|storage path:|$))/i, "")
    .replace(/storage path:\s*.*$/i, "")
    .trim();

  const descriptionMatch = sourceStripped.match(/description:\s*(.*)$/i);
  if (descriptionMatch?.[1]?.trim()) {
    return descriptionMatch[1].trim();
  }

  return sourceStripped
    .replace(/\([^)]*\/[^)]*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
