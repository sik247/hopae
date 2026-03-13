/**
 * Creates Notion pages from Supabase entities and updates entity metadata with new page IDs.
 * Run: npm run notion-create-pages [entityId]
 * Requires NOTION_API_KEY and NOTION_PARENT_PAGE_ID in .env.local.
 * Optional NOTION_PARENT_PAGE_IDS_BY_JURISDICTION (JSON {"JP":"page-id",...}) for different parent per jurisdiction.
 * Share all parent pages with your integration before running.
 */

import { config } from "dotenv"
config({ path: ".env.local" })

import { createClient } from "@supabase/supabase-js"
import {
  entityToNotionBlocks,
  NOTION_VERSION,
  type EntityWithJurisdiction,
} from "../src/lib/notion/entity-to-blocks"
import { resolveNotionParentPageId } from "../src/lib/notion/resolve-parent"
import type { Entity, Jurisdiction, Director } from "../src/lib/db/types"
import type { EntityIntegrationLinks } from "../src/lib/db/types"

const NOTION_API_BASE = "https://api.notion.com/v1"

async function main() {
  const apiKey = process.env.NOTION_API_KEY
  const parentPageId =
    process.env.NOTION_PARENT_PAGE_ID ||
    process.env.OUR_DEFAULT_PARENT_PAGE_ID
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!apiKey || !parentPageId) {
    console.error("Missing NOTION_API_KEY and NOTION_PARENT_PAGE_ID (or OUR_DEFAULT_PARENT_PAGE_ID) in .env.local")
    process.exit(1)
  }
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  const entityId = process.argv[2]?.trim()
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: entitiesRaw } = await supabase
    .from("entities")
    .select("*, jurisdiction:jurisdictions(*)")
  const entities = (entitiesRaw ?? []) as unknown as (Entity & {
    jurisdiction: Jurisdiction | null
  })[]

  const toProcess = entityId
    ? entities.filter((e) => e.id === entityId)
    : entities
  if (toProcess.length === 0) {
    console.error(entityId ? `Entity not found: ${entityId}` : "No entities found")
    process.exit(1)
  }

  console.log(`Creating Notion pages for ${toProcess.length} entity/entities...`)

  for (const entity of toProcess) {
    const { data: directors } = await supabase
      .from("directors")
      .select("*")
      .eq("entity_id", entity.id)
      .order("is_current", { ascending: false })
    const directorsList = (directors as Director[]) ?? []
    const typedEntity = entity as EntityWithJurisdiction
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
        console.error(`[${entity.name}] Notion API error: ${createRes.status} ${errBody.slice(0, 300)}`)
        continue
      }

      const page = (await createRes.json()) as { id: string; url?: string }
      const notionPageId = page.id
      const url = page.url ?? `https://notion.so/${notionPageId.replace(/-/g, "")}`

      const { data: existing } = await supabase
        .from("entities")
        .select("metadata")
        .eq("id", entity.id)
        .single()

      const currentMeta = (existing?.metadata ?? {}) as Record<string, unknown>
      const links = (currentMeta as EntityIntegrationLinks).notion_page_ids ?? []
      const newPageIds = Array.isArray(links) ? [...links, notionPageId] : [notionPageId]
      const newMeta = { ...currentMeta, notion_page_ids: newPageIds }

      const { error: updateError } = await supabase
        .from("entities")
        .update({
          metadata: newMeta,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entity.id)

      if (updateError) {
        console.error(`[${entity.name}] Page created but metadata update failed:`, updateError.message)
      } else {
        console.log(`[${entity.name}] Created: ${url}`)
      }
    } catch (err) {
      console.error(`[${entity.name}] Error:`, err instanceof Error ? err.message : err)
    }
  }

  console.log("Done.")
}

main()
