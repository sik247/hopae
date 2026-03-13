import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { EntityIntegrationLinks } from "@/lib/db/types"
import {
  entityToNotionBlocks,
  NOTION_VERSION,
  type EntityWithJurisdiction,
} from "@/lib/notion/entity-to-blocks"
import { resolveNotionParentPageId } from "@/lib/notion/resolve-parent"
import type { Entity, Jurisdiction, Director } from "@/lib/db/types"

const NOTION_API_BASE = "https://api.notion.com/v1"

/**
 * POST: Create Notion pages from Supabase entities and link them.
 * Body: { entityId?: string } — if provided, create only for that entity; otherwise all entities.
 * Requires NOTION_API_KEY and NOTION_PARENT_PAGE_ID (default parent). Optional
 * NOTION_PARENT_PAGE_IDS_BY_JURISDICTION (JSON: {"JP":"page-id", "DE":"page-id"}) uses
 * a different parent per jurisdiction. Creates one page per entity; appends new page ID
 * to entity.metadata.notion_page_ids.
 */
export async function POST(request: Request) {
  const apiKey = process.env.NOTION_API_KEY
  const parentPageId =
    process.env.NOTION_PARENT_PAGE_ID ||
    process.env.OUR_DEFAULT_PARENT_PAGE_ID
  if (!apiKey) {
    return NextResponse.json(
      { error: "NOTION_API_KEY is required to create pages" },
      { status: 400 }
    )
  }
  if (!parentPageId) {
    return NextResponse.json(
      { error: "NOTION_PARENT_PAGE_ID or OUR_DEFAULT_PARENT_PAGE_ID is required." },
      { status: 400 }
    )
  }

  let body: { entityId?: string }
  try {
    body = request.method === "POST" ? (await request.json()) as { entityId?: string } : {}
  } catch {
    body = {}
  }

  const supabase = await createClient()
  const admin = createAdminClient()

  const entityId = typeof body.entityId === "string" ? body.entityId.trim() || undefined : undefined

  const query = supabase
    .from("entities")
    .select("*, jurisdiction:jurisdictions(*)")
  const { data: entitiesRaw } = entityId ? await query.eq("id", entityId) : await query

  const entities = (entitiesRaw ?? []) as unknown as (Entity & { jurisdiction: Jurisdiction | null })[]
  if (entities.length === 0) {
    return NextResponse.json(
      { error: entityId ? "Entity not found" : "No entities found" },
      { status: 404 }
    )
  }

  const results: Array<{ entityId: string; entityName: string; notionPageId: string; url: string }> = []
  const errors: Array<{ entityId: string; entityName: string; error: string }> = []

  for (const entity of entities) {
    const typedEntity = entity as EntityWithJurisdiction
    const { data: directors } = await supabase
      .from("directors")
      .select("*")
      .eq("entity_id", entity.id)
      .order("is_current", { ascending: false })
    const directorsList = (directors as Director[]) ?? []

    const children = entityToNotionBlocks(typedEntity, directorsList)
    const pageTitle = entity.legal_name || entity.name || "Untitled Entity"
    const parentId = resolveNotionParentPageId(parentPageId, entity.jurisdiction)

    try {
      const createRes = await fetch(`${NOTION_API_BASE}/pages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent: { type: "page_id", page_id: parentId },
          properties: {
            title: {
              type: "title",
              title: [{ type: "text", text: { content: pageTitle.slice(0, 2000) } }],
            },
          },
          children: children.map((b) => {
            const { object: _o, ...rest } = b as { object: string; [k: string]: unknown }
            return rest
          }),
        }),
      })

      if (!createRes.ok) {
        const errBody = await createRes.text()
        errors.push({
          entityId: entity.id,
          entityName: entity.name,
          error: `${createRes.status}: ${errBody.slice(0, 200)}`,
        })
        continue
      }

      const page = (await createRes.json()) as { id: string; url?: string }
      const notionPageId = page.id
      const url = page.url ?? `https://notion.so/${notionPageId.replace(/-/g, "")}`

      const { data: existing } = await admin
        .from("entities")
        .select("metadata")
        .eq("id", entity.id)
        .single()

      const currentMeta = (existing?.metadata ?? {}) as Record<string, unknown>
      const links = (currentMeta as EntityIntegrationLinks).notion_page_ids ?? []
      const newPageIds = Array.isArray(links) ? [...links, notionPageId] : [notionPageId]
      const newMeta = { ...currentMeta, notion_page_ids: newPageIds }

      const { error: updateError } = await admin
        .from("entities")
        .update({
          metadata: newMeta,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entity.id)

      if (updateError) {
        errors.push({
          entityId: entity.id,
          entityName: entity.name,
          error: `Page created but metadata update failed: ${updateError.message}`,
        })
      }

      results.push({
        entityId: entity.id,
        entityName: entity.name,
        notionPageId,
        url,
      })
    } catch (err) {
      errors.push({
        entityId: entity.id,
        entityName: entity.name,
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  return NextResponse.json({
    created: results.length,
    results,
    errors: errors.length > 0 ? errors : undefined,
  })
}
