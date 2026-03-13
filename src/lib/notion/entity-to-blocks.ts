/**
 * Builds Notion API block children from entity + jurisdiction + directors.
 * Used when creating entity pages in Notion from Supabase data.
 */

import type { Entity, Jurisdiction, Director } from "@/lib/db/types"

const NOTION_VERSION = "2022-06-28"
const RICH_TEXT_MAX = 2000

/** Single rich text item for Notion API (type text) */
function rt(text: string): { type: "text"; text: { content: string } } {
  const content = text.slice(0, RICH_TEXT_MAX)
  return { type: "text", text: { content } }
}

/** Paragraph block */
function paragraph(text: string): { object: "block"; type: "paragraph"; paragraph: { rich_text: ReturnType<typeof rt>[] } } {
  return {
    object: "block",
    type: "paragraph",
    paragraph: { rich_text: [rt(text)] },
  }
}

/** Heading 1 block */
function heading1(text: string): { object: "block"; type: "heading_1"; heading_1: { rich_text: ReturnType<typeof rt>[] } } {
  return {
    object: "block",
    type: "heading_1",
    heading_1: { rich_text: [rt(text)] },
  }
}

/** Heading 2 block */
function heading2(text: string): { object: "block"; type: "heading_2"; heading_2: { rich_text: ReturnType<typeof rt>[] } } {
  return {
    object: "block",
    type: "heading_2",
    heading_2: { rich_text: [rt(text)] },
  }
}

/** Bulleted list item block */
function bullet(text: string): {
  object: "block"
  type: "bulleted_list_item"
  bulleted_list_item: { rich_text: ReturnType<typeof rt>[] }
} {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: { rich_text: [rt(text)] },
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export type NotionBlockRequest =
  | ReturnType<typeof paragraph>
  | ReturnType<typeof heading1>
  | ReturnType<typeof heading2>
  | ReturnType<typeof bullet>

export interface EntityWithJurisdiction extends Entity {
  jurisdiction: Jurisdiction | null
}

/**
 * Builds Notion block children for a single entity page.
 * Sections: Overview, Directors & Officers, Banking, Registered Agent, Metadata.
 */
export function entityToNotionBlocks(
  entity: EntityWithJurisdiction,
  directors: Director[]
): NotionBlockRequest[] {
  const blocks: NotionBlockRequest[] = []
  const j = entity.jurisdiction

  blocks.push(heading1("Overview"))
  blocks.push(paragraph(`Display name: ${entity.name}`))
  blocks.push(paragraph(`Legal name: ${entity.legal_name}`))
  blocks.push(paragraph(`Entity type: ${entity.entity_type}`))
  blocks.push(paragraph(`Purpose: ${entity.entity_purpose}`))
  blocks.push(paragraph(`Status: ${entity.status}`))
  if (j?.country_name) {
    blocks.push(paragraph(`Jurisdiction: ${j.country_name} (${j.country_code ?? ""})`))
  }
  if (entity.incorporation_date) {
    blocks.push(paragraph(`Incorporation date: ${formatDate(entity.incorporation_date)}`))
  }
  if (entity.registration_number) {
    blocks.push(paragraph(`Registration number: ${entity.registration_number}`))
  }
  if (entity.parent_entity_id) {
    blocks.push(paragraph(`Parent entity ID: ${entity.parent_entity_id}`))
  }

  blocks.push(heading2("Directors & Officers"))
  if (directors.length === 0) {
    blocks.push(paragraph("No directors on file."))
  } else {
    const sorted = [...directors].sort((a, b) => {
      if (a.is_current !== b.is_current) return a.is_current ? -1 : 1
      const aDate = a.start_date ? new Date(a.start_date).getTime() : 0
      const bDate = b.start_date ? new Date(b.start_date).getTime() : 0
      return bDate - aDate
    })
    for (const d of sorted) {
      const status = d.is_current ? "Active" : `Former${d.end_date ? ` (until ${formatDate(d.end_date)})` : ""}`
      blocks.push(
        bullet(
          `${d.full_name} — ${d.role}${d.nationality ? ` (${d.nationality})` : ""} | Start: ${formatDate(d.start_date)} | ${status}`
        )
      )
    }
  }

  blocks.push(heading2("Banking Information"))
  const banking = entity.banking_info
  const hasBanking = banking?.bank_name || banking?.account_number || banking?.iban
  if (!hasBanking) {
    blocks.push(paragraph("No banking details on file."))
  } else {
    if (banking?.bank_name) blocks.push(bullet(`Bank name: ${banking.bank_name}`))
    if (banking?.iban) blocks.push(bullet(`IBAN: ${banking.iban}`))
    else if (banking?.account_number) blocks.push(bullet(`Account number: ${banking.account_number}`))
    if (banking?.currency) blocks.push(bullet(`Currency: ${banking.currency}`))
  }

  blocks.push(heading2("Registered Agent"))
  const agent = entity.registered_agent
  const hasAgent = agent?.name || agent?.address || agent?.email
  if (!hasAgent) {
    blocks.push(paragraph("No registered agent on file."))
  } else {
    if (agent?.name) blocks.push(bullet(`Name: ${agent.name}`))
    if (agent?.address) blocks.push(bullet(`Address: ${agent.address}`))
    if (agent?.email) blocks.push(bullet(`Email: ${agent.email}`))
    if (agent?.renewal_date) blocks.push(bullet(`Renewal date: ${formatDate(agent.renewal_date)}`))
  }

  const meta = entity.metadata
  if (meta && typeof meta === "object" && Object.keys(meta).length > 0) {
    blocks.push(heading2("Metadata"))
    try {
      blocks.push(paragraph(JSON.stringify(meta, null, 2).slice(0, RICH_TEXT_MAX)))
    } catch {
      blocks.push(paragraph("(metadata not serializable)"))
    }
  }

  return blocks
}

/**
 * Same content as entityToNotionBlocks but as markdown for MCP create_page (content parameter).
 */
export function entityToMarkdown(
  entity: EntityWithJurisdiction,
  directors: Director[]
): string {
  const j = entity.jurisdiction
  const lines: string[] = ["# Overview", ""]
  lines.push(`- **Display name:** ${entity.name}`)
  lines.push(`- **Legal name:** ${entity.legal_name}`)
  lines.push(`- **Entity type:** ${entity.entity_type}`)
  lines.push(`- **Purpose:** ${entity.entity_purpose}`)
  lines.push(`- **Status:** ${entity.status}`)
  if (j?.country_name) lines.push(`- **Jurisdiction:** ${j.country_name} (${j.country_code ?? ""})`)
  if (entity.incorporation_date) lines.push(`- **Incorporation date:** ${formatDate(entity.incorporation_date)}`)
  if (entity.registration_number) lines.push(`- **Registration number:** ${entity.registration_number}`)
  if (entity.parent_entity_id) lines.push(`- **Parent entity ID:** ${entity.parent_entity_id}`)
  lines.push("", "## Directors & Officers", "")
  if (directors.length === 0) {
    lines.push("No directors on file.")
  } else {
    const sorted = [...directors].sort((a, b) => {
      if (a.is_current !== b.is_current) return a.is_current ? -1 : 1
      const aDate = a.start_date ? new Date(a.start_date).getTime() : 0
      const bDate = b.start_date ? new Date(b.start_date).getTime() : 0
      return bDate - aDate
    })
    for (const d of sorted) {
      const status = d.is_current ? "Active" : `Former${d.end_date ? ` (until ${formatDate(d.end_date)})` : ""}`
      lines.push(`- ${d.full_name} — ${d.role}${d.nationality ? ` (${d.nationality})` : ""} | Start: ${formatDate(d.start_date)} | ${status}`)
    }
  }
  lines.push("", "## Banking Information", "")
  const banking = entity.banking_info
  const hasBanking = banking?.bank_name || banking?.account_number || banking?.iban
  if (!hasBanking) lines.push("No banking details on file.")
  else {
    if (banking?.bank_name) lines.push(`- **Bank name:** ${banking.bank_name}`)
    if (banking?.iban) lines.push(`- **IBAN:** ${banking.iban}`)
    else if (banking?.account_number) lines.push(`- **Account number:** ${banking.account_number}`)
    if (banking?.currency) lines.push(`- **Currency:** ${banking.currency}`)
  }
  lines.push("", "## Registered Agent", "")
  const agent = entity.registered_agent
  const hasAgent = agent?.name || agent?.address || agent?.email
  if (!hasAgent) lines.push("No registered agent on file.")
  else {
    if (agent?.name) lines.push(`- **Name:** ${agent.name}`)
    if (agent?.address) lines.push(`- **Address:** ${agent.address}`)
    if (agent?.email) lines.push(`- **Email:** ${agent.email}`)
    if (agent?.renewal_date) lines.push(`- **Renewal date:** ${formatDate(agent.renewal_date)}`)
  }
  const meta = entity.metadata
  if (meta && typeof meta === "object" && Object.keys(meta).length > 0) {
    lines.push("", "## Metadata", "", "```json", JSON.stringify(meta, null, 2), "```")
  }
  return lines.join("\n")
}

export { NOTION_VERSION }
