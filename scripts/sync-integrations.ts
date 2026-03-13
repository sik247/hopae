/**
 * Sync Notion + Google Drive with Supabase entities.
 *
 * Randomly splits jurisdictions between Notion and Google Drive:
 * - ~half of jurisdictions → Notion pages with entity content
 * - ~half of jurisdictions → Google Drive folders with Google Docs
 *
 * Steps:
 * 1. DELETE all existing Notion child pages
 * 2. DELETE all existing Drive folders
 * 3. CLEAR entity metadata
 * 4. RANDOMLY split jurisdictions between Notion and Drive
 * 5. CREATE Notion pages for Notion-assigned jurisdictions
 * 6. CREATE Drive folders + Google Docs for Drive-assigned jurisdictions
 * 7. UPDATE Supabase entity metadata with IDs/links
 *
 * Run: npm run sync-integrations
 */

import { config } from "dotenv"
config({ path: ".env.local" })

import { createClient } from "@supabase/supabase-js"
import { google } from "googleapis"
import {
  entityToNotionBlocks,
  entityToMarkdown,
  NOTION_VERSION,
  type EntityWithJurisdiction,
} from "../src/lib/notion/entity-to-blocks"
import { extractNotionPageId } from "../src/lib/notion/notion-id"
import type { Entity, Jurisdiction, Director, EntityIntegrationLinks } from "../src/lib/db/types"

const NOTION_API_BASE = "https://api.notion.com/v1"
const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive"]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// ── Notion helpers ──────────────────────────────────────────────────

async function notionFetch(path: string, options: RequestInit = {}) {
  const apiKey = process.env.NOTION_API_KEY!
  return fetch(`${NOTION_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })
}

async function listNotionChildPages(parentId: string): Promise<string[]> {
  const ids: string[] = []
  let cursor: string | undefined
  do {
    const url = `/blocks/${parentId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`
    const res = await notionFetch(url)
    if (!res.ok) break
    const data = (await res.json()) as {
      results: Array<{ id: string; type: string }>
      next_cursor?: string
      has_more: boolean
    }
    for (const block of data.results) {
      if (block.type === "child_page") ids.push(block.id)
    }
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)
  return ids
}

async function archiveNotionPage(pageId: string) {
  const res = await notionFetch(`/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({ archived: true }),
  })
  return res.ok
}

async function createNotionPage(
  parentId: string,
  title: string,
  blocks: ReturnType<typeof entityToNotionBlocks>
): Promise<string | null> {
  const res = await notionFetch("/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { type: "page_id", page_id: parentId },
      properties: {
        title: {
          type: "title",
          title: [{ type: "text", text: { content: title.slice(0, 2000) } }],
        },
      },
      children: blocks.map((b) => {
        const { object: _o, ...rest } = b as { object: string; [k: string]: unknown }
        return rest
      }),
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error(`  Notion error (${res.status}): ${err.slice(0, 200)}`)
    return null
  }
  const page = (await res.json()) as { id: string }
  return page.id
}

// ── Drive helpers ───────────────────────────────────────────────────

/**
 * Creates a Drive client.
 * - If GOOGLE_OAUTH_REFRESH_TOKEN is set, uses personal OAuth2 (has storage quota → can upload files).
 * - Otherwise falls back to service account (no storage quota → folders only).
 */
function createDriveClient() {
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET

  if (refreshToken && clientId && clientSecret) {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret)
    oauth2.setCredentials({ refresh_token: refreshToken })
    return { drive: google.drive({ version: "v3", auth: oauth2 }), canUploadFiles: true }
  }

  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON!
  const credentials = JSON.parse(credentialsJson) as { client_email: string; private_key: string }
  const auth = new google.auth.GoogleAuth({ credentials, scopes: DRIVE_SCOPES })
  return { drive: google.drive({ version: "v3", auth }), canUploadFiles: false }
}

type DriveClient = ReturnType<typeof google.drive>

/**
 * Uploads a plain .txt file with entity markdown content inside a Drive folder.
 * Only works when using OAuth2 (personal account with storage quota).
 */
async function createEntityFile(
  drive: DriveClient,
  name: string,
  content: string,
  parentId: string
): Promise<string | null> {
  try {
    const { Readable } = await import("stream")
    const res = await drive.files.create({
      supportsAllDrives: true,
      requestBody: { name, mimeType: "text/plain", parents: [parentId] },
      media: { mimeType: "text/plain", body: Readable.from(content) },
    })
    return res.data.id ?? null
  } catch (err) {
    console.error(`  File create error: ${err instanceof Error ? err.message : err}`)
    return null
  }
}

async function listDriveChildren(drive: DriveClient, parentId: string) {
  const items: Array<{ id: string; name: string }> = []
  let pageToken: string | undefined
  do {
    const res = await drive.files.list({
      q: `'${parentId}' in parents and trashed = false`,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: "nextPageToken, files(id, name)",
      pageSize: 100,
      pageToken,
    })
    for (const f of res.data.files ?? []) {
      if (f.id && f.name) items.push({ id: f.id, name: f.name })
    }
    pageToken = res.data.nextPageToken ?? undefined
  } while (pageToken)
  return items
}

async function deleteDriveFile(drive: DriveClient, fileId: string) {
  try {
    await drive.files.delete({ fileId, supportsAllDrives: true })
    return true
  } catch {
    return false
  }
}

async function createDriveFolder(drive: DriveClient, name: string, parentId: string) {
  const res = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
  })
  return res.data.id ?? null
}

// Note: service accounts have no storage quota — they cannot upload file content.
// Folders are metadata-only (free). Entity data lives in Supabase/Notion;
// the Drive folder linked in the Integrations tab is the deliverable.

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const notionApiKey = process.env.NOTION_API_KEY
  const defaultParent = process.env.OUR_DEFAULT_PARENT_PAGE_ID ?? process.env.NOTION_PARENT_PAGE_ID
  const driveFolderId = process.env.DRIVE_DEFAULT_FOLDER_ID

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase env vars")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // ── 1. Fetch all entities with jurisdictions + directors ──
  console.log("Fetching entities from Supabase...")
  const { data: entitiesRaw } = await supabase
    .from("entities")
    .select("*, jurisdiction:jurisdictions(*)")
  const entities = (entitiesRaw ?? []) as unknown as (Entity & { jurisdiction: Jurisdiction | null })[]
  console.log(`  Found ${entities.length} entities`)

  // Group by jurisdiction code
  const byJurisdiction = new Map<string, typeof entities>()
  for (const e of entities) {
    const code = e.jurisdiction?.country_code ?? "OTHER"
    if (!byJurisdiction.has(code)) byJurisdiction.set(code, [])
    byJurisdiction.get(code)!.push(e)
  }
  const allJurisdictions = [...byJurisdiction.keys()]
  console.log(`  ${allJurisdictions.length} jurisdictions: ${allJurisdictions.join(", ")}`)

  // Fetch all directors
  const { data: allDirectors } = await supabase.from("directors").select("*").eq("is_current", true)
  const directorsMap = new Map<string, Director[]>()
  for (const d of (allDirectors ?? []) as Director[]) {
    if (!directorsMap.has(d.entity_id)) directorsMap.set(d.entity_id, [])
    directorsMap.get(d.entity_id)!.push(d)
  }

  // ── 2. RANDOMLY split jurisdictions between Notion and Drive ──
  const shuffled = shuffle(allJurisdictions)
  const splitPoint = Math.ceil(shuffled.length / 2) // slightly more to Notion
  const notionJurisdictions = new Set(shuffled.slice(0, splitPoint))
  const driveJurisdictions = new Set(shuffled.slice(splitPoint))

  const notionEntityCount = [...notionJurisdictions].reduce((n, c) => n + (byJurisdiction.get(c)?.length ?? 0), 0)
  const driveEntityCount = [...driveJurisdictions].reduce((n, c) => n + (byJurisdiction.get(c)?.length ?? 0), 0)

  console.log(`\n── Jurisdiction Split ──`)
  console.log(`  Notion (${notionJurisdictions.size} countries, ${notionEntityCount} entities): ${[...notionJurisdictions].join(", ")}`)
  console.log(`  Drive  (${driveJurisdictions.size} countries, ${driveEntityCount} entities): ${[...driveJurisdictions].join(", ")}`)

  // ── 3. CLEAN existing Notion pages ──
  const defaultParentId = defaultParent ? extractNotionPageId(defaultParent) : ""
  if (notionApiKey && defaultParentId) {
    console.log("\n── Cleaning Notion pages ──")
    const children = await listNotionChildPages(defaultParentId)
    // Only archive entity pages, not jurisdiction parent pages
    const jurisdictionParentIds = new Set<string>()
    try {
      const raw = process.env.NOTION_PARENT_PAGE_IDS_BY_JURISDICTION
      if (raw) {
        const map = JSON.parse(raw) as Record<string, string>
        for (const url of Object.values(map)) {
          jurisdictionParentIds.add(extractNotionPageId(url))
        }
      }
    } catch { /* ignore */ }

    const toArchive = children.filter((id) => !jurisdictionParentIds.has(id))
    if (toArchive.length > 0) {
      console.log(`  Archiving ${toArchive.length} entity pages...`)
      for (const id of toArchive) {
        await archiveNotionPage(id)
        process.stdout.write(".")
        await sleep(350)
      }
      console.log()
    }
    console.log("  Notion cleanup done")
  }

  // ── 4. CLEAN existing Drive folders + empty trash ──
  let drive: DriveClient | null = null
  let canUploadFiles = false
  const hasServiceAccount = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const hasOAuth = !!(process.env.GOOGLE_OAUTH_REFRESH_TOKEN && process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET)
  if ((hasServiceAccount || hasOAuth) && driveFolderId) {
    console.log("\n── Cleaning Google Drive ──")
    const client = createDriveClient()
    drive = client.drive
    canUploadFiles = client.canUploadFiles
    console.log(`  Auth: ${canUploadFiles ? "OAuth2 (file uploads enabled)" : "service account (folders only)"}`)
    const existing = await listDriveChildren(drive, driveFolderId)
    if (existing.length > 0) {
      console.log(`  Deleting ${existing.length} items...`)
      for (const item of existing) {
        await deleteDriveFile(drive, item.id)
        process.stdout.write(".")
      }
      console.log()
    }
    // Empty trash to reclaim storage quota
    try {
      await drive.files.emptyTrash()
      console.log("  Emptied trash to reclaim storage")
    } catch { /* ignore if no trash permission */ }
    console.log("  Drive cleanup done")
  }

  // ── 5. CLEAR all Supabase metadata ──
  console.log("\n── Clearing Supabase metadata ──")
  for (const e of entities) {
    await supabase
      .from("entities")
      .update({ metadata: {}, updated_at: new Date().toISOString() })
      .eq("id", e.id)
  }
  console.log(`  Cleared ${entities.length} entities`)

  // ── 6. CREATE Notion pages for Notion jurisdictions ──
  if (notionApiKey && defaultParentId) {
    console.log("\n── Creating Notion pages ──")
    for (const code of shuffle([...notionJurisdictions])) {
      const ents = shuffle(byJurisdiction.get(code)!)
      console.log(`  ${code} (${ents.length} entities)`)
      for (const entity of ents) {
        const directors = directorsMap.get(entity.id) ?? []
        const blocks = entityToNotionBlocks(entity as EntityWithJurisdiction, directors)
        const title = entity.legal_name || entity.name
        const pageId = await createNotionPage(defaultParentId, title, blocks)
        if (pageId) {
          const { data: cur } = await supabase.from("entities").select("metadata").eq("id", entity.id).single()
          const meta = ((cur?.metadata ?? {}) as Record<string, unknown>)
          await supabase
            .from("entities")
            .update({
              metadata: { ...meta, notion_page_ids: [pageId] } as EntityIntegrationLinks,
              updated_at: new Date().toISOString(),
            })
            .eq("id", entity.id)
          process.stdout.write("✓")
        } else {
          process.stdout.write("✗")
        }
        await sleep(350)
      }
      console.log()
    }
    console.log(`  Notion: ${notionEntityCount} pages across ${notionJurisdictions.size} countries`)
  }

  // ── 7. CREATE Drive folders + Google Docs for Drive jurisdictions ──
  if (drive && driveFolderId) {
    console.log("\n── Creating Google Drive folders ──")

    // First create country-level folders, then entity sub-folders with docs
    for (const code of shuffle([...driveJurisdictions])) {
      const ents = shuffle(byJurisdiction.get(code)!)
      const countryName = ents[0]?.jurisdiction?.country_name ?? code
      const countryFolderId = await createDriveFolder(drive, `${countryName} entities`, driveFolderId)
      if (!countryFolderId) {
        console.error(`  Failed to create country folder for ${code}`)
        continue
      }
      console.log(`  ${code} - ${countryName} (${ents.length} entities)`)

      for (const entity of ents) {
        const folderName = entity.name || entity.legal_name

        // Create entity folder
        const entityFolderId = await createDriveFolder(drive, folderName, countryFolderId)
        if (!entityFolderId) {
          process.stdout.write("✗")
          continue
        }

        // Upload entity overview .txt if OAuth is available (service accounts have no storage quota)
        if (canUploadFiles) {
          const directors = directorsMap.get(entity.id) ?? []
          const md = entityToMarkdown(entity as EntityWithJurisdiction, directors)
          const fileName = `${entity.legal_name || entity.name} — Overview.txt`
          await createEntityFile(drive, fileName, md, entityFolderId)
        }

        // Update Supabase with Drive folder link
        const { data: cur } = await supabase.from("entities").select("metadata").eq("id", entity.id).single()
        const meta = ((cur?.metadata ?? {}) as Record<string, unknown>)
        await supabase
          .from("entities")
          .update({
            metadata: { ...meta, drive_folder_id: entityFolderId } as EntityIntegrationLinks,
            updated_at: new Date().toISOString(),
          })
          .eq("id", entity.id)

        process.stdout.write("✓")
      }
      console.log()
    }
    console.log(`  Drive: ${driveEntityCount} folders across ${driveJurisdictions.size} countries`)
  }

  // ── 8. Summary ──
  console.log("\n" + "═".repeat(50))
  console.log("✅ Sync complete!")
  console.log("═".repeat(50))
  console.log(`Total entities: ${entities.length}`)
  console.log(`Total jurisdictions: ${allJurisdictions.length}`)
  console.log("")
  console.log(`Notion Data (${notionJurisdictions.size} countries, ${notionEntityCount} entities):`)
  for (const code of [...notionJurisdictions].sort()) {
    const count = byJurisdiction.get(code)?.length ?? 0
    const name = byJurisdiction.get(code)?.[0]?.jurisdiction?.country_name ?? code
    console.log(`  ${code} - ${name}: ${count} entities`)
  }
  console.log("")
  console.log(`Google Drive Data (${driveJurisdictions.size} countries, ${driveEntityCount} entities):`)
  for (const code of [...driveJurisdictions].sort()) {
    const count = byJurisdiction.get(code)?.length ?? 0
    const name = byJurisdiction.get(code)?.[0]?.jurisdiction?.country_name ?? code
    console.log(`  ${code} - ${name}: ${count} entities`)
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
