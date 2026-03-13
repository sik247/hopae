/**
 * Resolves the Google Drive folder ID for an entity based on jurisdiction.
 * Use DRIVE_FOLDER_IDS_BY_JURISDICTION (JSON: country_code → folder_id) for per-jurisdiction folders;
 * fallback to DRIVE_DEFAULT_FOLDER_ID when no mapping exists.
 * Entity metadata.drive_folder_id overrides when set.
 */

export type JurisdictionLike = { country_code?: string | null } | null

/**
 * Returns the Drive folder ID to use for an entity.
 * @param entityFolderId - entity.metadata.drive_folder_id (takes precedence when set)
 * @param defaultFolderId - DRIVE_DEFAULT_FOLDER_ID (optional)
 * @param jurisdiction - entity.jurisdiction (may have country_code)
 * @returns folder ID or null
 */
export function resolveDriveFolderId(
  entityFolderId: string | null | undefined,
  defaultFolderId: string | undefined,
  jurisdiction: JurisdictionLike
): string | null {
  if (entityFolderId && typeof entityFolderId === "string") {
    const trimmed = entityFolderId.trim()
    if (trimmed) return trimmed
  }
  const raw = process.env.DRIVE_FOLDER_IDS_BY_JURISDICTION
  if (!raw || typeof raw !== "string") {
    return defaultFolderId?.trim() ?? null
  }
  let map: Record<string, string>
  try {
    map = JSON.parse(raw) as Record<string, string>
  } catch {
    return defaultFolderId?.trim() ?? null
  }
  const code = jurisdiction?.country_code?.trim()
  if (code && typeof map[code] === "string") {
    const id = map[code].trim()
    return id || (defaultFolderId?.trim() ?? null)
  }
  return defaultFolderId?.trim() ?? null
}
