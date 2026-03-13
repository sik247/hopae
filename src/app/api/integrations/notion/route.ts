import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { EntityIntegrationLinks } from "@/lib/db/types"

const NOTION_API_BASE = "https://api.notion.com/v1"

/** Extract title from Notion page properties (title property with rich_text) */
function getPageTitle(properties: Record<string, unknown>): string {
  const titleProp = properties?.title as
    | { type: string; title?: Array<{ plain_text?: string }> }
    | undefined
  if (!titleProp?.title?.length) return "Untitled"
  return titleProp.title.map((t) => t.plain_text ?? "").join("") || "Untitled"
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const entityId = searchParams.get("entityId")
  if (!entityId) {
    return NextResponse.json({ error: "entityId is required" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: entity } = await supabase
    .from("entities")
    .select("metadata")
    .eq("id", entityId)
    .single()

  if (!entity?.metadata) {
    return NextResponse.json({ pages: [] })
  }

  const meta = entity.metadata as EntityIntegrationLinks
  const pageIds = Array.isArray(meta.notion_page_ids) ? meta.notion_page_ids : []
  if (pageIds.length === 0) {
    return NextResponse.json({ pages: [] })
  }

  const apiKey = process.env.NOTION_API_KEY
  if (!apiKey) {
    return NextResponse.json({ pages: [] })
  }

  const pages: Array<{ id: string; title: string; url: string; lastEdited: string }> = []

  for (const pageId of pageIds.slice(0, 20)) {
    try {
      const res = await fetch(`${NOTION_API_BASE}/pages/${pageId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": "2022-06-28",
        },
      })
      if (!res.ok) continue
      const data = (await res.json()) as {
        id: string
        url?: string
        last_edited_time?: string
        properties?: Record<string, unknown>
      }
      pages.push({
        id: data.id,
        title: getPageTitle(data.properties ?? {}),
        url: data.url ?? `https://notion.so/${data.id.replace(/-/g, "")}`,
        lastEdited: data.last_edited_time ?? new Date().toISOString(),
      })
    } catch {
      // Skip failed pages
    }
  }

  return NextResponse.json({ pages })
}
