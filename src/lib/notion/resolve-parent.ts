import { extractNotionPageId } from "./notion-id"

/**
 * Resolves the Notion parent page ID for an entity based on jurisdiction.
 * Use NOTION_PARENT_PAGE_IDS_BY_JURISDICTION (JSON: country_code → page_id or URL) for per-jurisdiction parents;
 * fallback to default when no mapping exists. Values can be full Notion URLs or raw 32-char IDs.
 */

export type JurisdictionLike = { country_code?: string | null } | null

/**
 * Returns the Notion page ID under which to create an entity page.
 * @param defaultParentIdOrUrl - NOTION_PARENT_PAGE_ID or OUR_DEFAULT_PARENT_PAGE_ID (URL or raw ID)
 * @param jurisdiction - entity.jurisdiction (may have country_code)
 * @returns 32-char page ID to use as parent
 */
export function resolveNotionParentPageId(
  defaultParentIdOrUrl: string,
  jurisdiction: JurisdictionLike
): string {
  const defaultId = extractNotionPageId(defaultParentIdOrUrl)
  const raw = process.env.NOTION_PARENT_PAGE_IDS_BY_JURISDICTION
  if (!raw || typeof raw !== "string") {
    return defaultId
  }
  let map: Record<string, string>
  try {
    map = JSON.parse(raw) as Record<string, string>
  } catch {
    return defaultId
  }
  const code = jurisdiction?.country_code?.trim()
  if (code && typeof map[code] === "string") {
    return extractNotionPageId(map[code])
  }
  return defaultId
}
