/**
 * Notion page IDs are 32-char hex. Env may contain full URLs; this extracts the ID.
 */

const NOTION_PAGE_ID_REGEX = /[a-f0-9]{32}/i

/**
 * Returns the Notion page ID from a string that may be a full URL or a raw ID.
 * Example: "https://www.notion.so/Entities-Parents-e3240e40db894c9288d012c4b08b8293" → "e3240e40db894c9288d012c4b08b8293"
 */
export function extractNotionPageId(value: string | undefined | null): string {
  if (!value || typeof value !== "string") return ""
  const trimmed = value.trim()
  const match = trimmed.match(NOTION_PAGE_ID_REGEX)
  return match ? match[0] : trimmed
}
