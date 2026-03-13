import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { google } from "googleapis"

const NOTION_API_BASE = "https://api.notion.com/v1"
const NOTION_VERSION = "2022-06-28"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ---------- Notion types ----------

interface NotionRichText {
  plain_text?: string
}

interface NotionTitleProperty {
  type: "title"
  title: NotionRichText[]
}

interface NotionTextBlock {
  type: string
  paragraph?: { rich_text: NotionRichText[] }
  heading_1?: { rich_text: NotionRichText[] }
  heading_2?: { rich_text: NotionRichText[] }
  heading_3?: { rich_text: NotionRichText[] }
  bulleted_list_item?: { rich_text: NotionRichText[] }
  numbered_list_item?: { rich_text: NotionRichText[] }
}

interface NotionPage {
  id: string
  properties?: Record<string, NotionTitleProperty | Record<string, unknown>>
}

interface NotionBlocksResponse {
  results: NotionTextBlock[]
  has_more: boolean
  next_cursor: string | null
}

interface NotionChildrenResponse {
  results: NotionPage[]
  has_more: boolean
  next_cursor: string | null
}

// ---------- Notion helpers ----------

function notionHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  }
}

function getPageTitle(properties: Record<string, unknown>): string {
  // The title property can be keyed under "title", "Name", or the first title-type prop
  for (const val of Object.values(properties)) {
    const prop = val as { type?: string; title?: NotionRichText[] }
    if (prop?.type === "title" && Array.isArray(prop.title)) {
      const text = prop.title.map((t) => t.plain_text ?? "").join("")
      if (text) return text
    }
  }
  return "Untitled"
}

function extractPlainText(richText: NotionRichText[]): string {
  return richText.map((t) => t.plain_text ?? "").join("")
}

async function fetchChildPages(pageId: string): Promise<NotionPage[]> {
  const pages: NotionPage[] = []
  let cursor: string | null = null
  let hasMore = true

  while (hasMore) {
    const url = new URL(`${NOTION_API_BASE}/blocks/${pageId}/children`)
    url.searchParams.set("page_size", "100")
    if (cursor) url.searchParams.set("start_cursor", cursor)

    const res = await fetch(url.toString(), { headers: notionHeaders() })
    if (!res.ok) break

    const data = (await res.json()) as NotionChildrenResponse
    for (const block of data.results) {
      const blockAny = block as unknown as { type?: string; id: string }
      if (blockAny.type === "child_page") {
        // Fetch the full page to get properties
        const pageRes = await fetch(`${NOTION_API_BASE}/pages/${blockAny.id}`, {
          headers: notionHeaders(),
        })
        if (pageRes.ok) {
          const pageData = (await pageRes.json()) as NotionPage
          pages.push(pageData)
        }
      }
    }

    hasMore = data.has_more
    cursor = data.next_cursor
  }

  return pages
}

async function fetchPageBlocks(pageId: string): Promise<string> {
  const lines: string[] = []
  let cursor: string | null = null
  let hasMore = true

  while (hasMore) {
    const url = new URL(`${NOTION_API_BASE}/blocks/${pageId}/children`)
    url.searchParams.set("page_size", "100")
    if (cursor) url.searchParams.set("start_cursor", cursor)

    const res = await fetch(url.toString(), { headers: notionHeaders() })
    if (!res.ok) break

    const data = (await res.json()) as NotionBlocksResponse
    for (const block of data.results) {
      const richText =
        block.paragraph?.rich_text ??
        block.heading_1?.rich_text ??
        block.heading_2?.rich_text ??
        block.heading_3?.rich_text ??
        block.bulleted_list_item?.rich_text ??
        block.numbered_list_item?.rich_text
      if (richText) {
        lines.push(extractPlainText(richText))
      }
    }

    hasMore = data.has_more
    cursor = data.next_cursor
  }

  return lines.join("\n")
}

/** Try to guess country from the page content for jurisdiction lookup */
function guessCountryFromContent(
  title: string,
  content: string
): { code: string; name: string } | null {
  const countries: Record<string, string> = {
    "united states": "US",
    usa: "US",
    "united kingdom": "GB",
    uk: "GB",
    singapore: "SG",
    "hong kong": "HK",
    ireland: "IE",
    netherlands: "NL",
    germany: "DE",
    france: "FR",
    japan: "JP",
    australia: "AU",
    canada: "CA",
    switzerland: "CH",
    luxembourg: "LU",
    "cayman islands": "KY",
    bermuda: "BM",
    "british virgin islands": "VG",
    bvi: "VG",
    india: "IN",
    brazil: "BR",
    mexico: "MX",
    "south korea": "KR",
    korea: "KR",
    china: "CN",
    taiwan: "TW",
    israel: "IL",
    "united arab emirates": "AE",
    uae: "AE",
    delaware: "US",
    wyoming: "US",
    nevada: "US",
    california: "US",
  }

  const countryNames: Record<string, string> = {
    US: "United States",
    GB: "United Kingdom",
    SG: "Singapore",
    HK: "Hong Kong",
    IE: "Ireland",
    NL: "Netherlands",
    DE: "Germany",
    FR: "France",
    JP: "Japan",
    AU: "Australia",
    CA: "Canada",
    CH: "Switzerland",
    LU: "Luxembourg",
    KY: "Cayman Islands",
    BM: "Bermuda",
    VG: "British Virgin Islands",
    IN: "India",
    BR: "Brazil",
    MX: "Mexico",
    KR: "South Korea",
    CN: "China",
    TW: "Taiwan",
    IL: "Israel",
    AE: "United Arab Emirates",
  }

  const combined = `${title} ${content}`.toLowerCase()
  for (const [keyword, code] of Object.entries(countries)) {
    if (combined.includes(keyword)) {
      return { code, name: countryNames[code] ?? code }
    }
  }
  return null
}

// ---------- Notion sync ----------

async function syncNotionSource(sourceId: string, notionPageId: string) {
  const supabase = getSupabase()

  // Set status to syncing
  await supabase
    .from("data_sources")
    .update({ status: "syncing", error_message: null, updated_at: new Date().toISOString() })
    .eq("id", sourceId)

  const childPages = await fetchChildPages(notionPageId)
  let entityCount = 0

  for (const page of childPages) {
    const title = getPageTitle(page.properties ?? {})
    const content = await fetchPageBlocks(page.id)

    // Try to determine jurisdiction
    const countryGuess = guessCountryFromContent(title, content)

    let jurisdictionId: string | null = null
    if (countryGuess) {
      // Look up or create jurisdiction
      const { data: existing } = await supabase
        .from("jurisdictions")
        .select("id")
        .eq("country_code", countryGuess.code)
        .single()

      if (existing) {
        jurisdictionId = existing.id
      } else {
        const { data: created } = await supabase
          .from("jurisdictions")
          .insert({
            country_code: countryGuess.code,
            country_name: countryGuess.name,
            filing_rules: {},
          })
          .select("id")
          .single()

        if (created) {
          jurisdictionId = created.id
        }
      }
    }

    if (!jurisdictionId) {
      // Fallback: create or use "Unknown" jurisdiction
      const { data: unknownJ } = await supabase
        .from("jurisdictions")
        .select("id")
        .eq("country_code", "XX")
        .single()

      if (unknownJ) {
        jurisdictionId = unknownJ.id
      } else {
        const { data: createdJ } = await supabase
          .from("jurisdictions")
          .insert({
            country_code: "XX",
            country_name: "Unknown",
            filing_rules: {},
          })
          .select("id")
          .single()
        jurisdictionId = createdJ?.id ?? null
      }
    }

    if (!jurisdictionId) continue

    // Parse content for directors, banking info, registered agent
    const contentLower = content.toLowerCase()

    const bankingInfo: Record<string, string> = {}
    const bankMatch = content.match(/bank[:\s]+(.+)/i)
    if (bankMatch) bankingInfo.bank_name = bankMatch[1].trim()

    const registeredAgent: Record<string, string> = {}
    const agentMatch = content.match(/registered agent[:\s]+(.+)/i)
    if (agentMatch) registeredAgent.name = agentMatch[1].trim()

    // Determine entity type from content
    let entityType = "subsidiary"
    if (contentLower.includes("llc")) entityType = "LLC"
    else if (contentLower.includes("limited") || contentLower.includes("ltd"))
      entityType = "Limited"
    else if (contentLower.includes("corp") || contentLower.includes("inc"))
      entityType = "Corporation"

    // Upsert entity -- match on legal_name to avoid duplicates
    const notionPageIdClean = page.id.replace(/-/g, "")
    const { data: existingEntity } = await supabase
      .from("entities")
      .select("id, metadata")
      .eq("legal_name", title)
      .single()

    if (existingEntity) {
      // Update metadata with notion page ID
      const meta = (existingEntity.metadata ?? {}) as Record<string, unknown>
      const existingIds = (meta.notion_page_ids as string[]) ?? []
      const updatedIds = Array.from(new Set([...existingIds, notionPageIdClean]))

      await supabase
        .from("entities")
        .update({
          metadata: { ...meta, notion_page_ids: updatedIds },
          banking_info: Object.keys(bankingInfo).length > 0 ? bankingInfo : undefined,
          registered_agent:
            Object.keys(registeredAgent).length > 0 ? registeredAgent : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingEntity.id)
    } else {
      await supabase.from("entities").insert({
        name: title.split(" ").slice(0, 2).join(" "),
        legal_name: title,
        entity_type: entityType,
        entity_purpose: "customer_entity",
        jurisdiction_id: jurisdictionId,
        status: "active",
        banking_info: bankingInfo,
        registered_agent: registeredAgent,
        metadata: { notion_page_ids: [notionPageIdClean] },
      })
    }

    entityCount++

    // Extract directors from content
    const directorMatches = content.match(/director[s]?[:\s]+(.+)/gi)
    if (directorMatches && existingEntity) {
      for (const dm of directorMatches) {
        const nameStr = dm.replace(/directors?[:\s]+/i, "").trim()
        if (nameStr && nameStr.length < 100) {
          const { data: existingDir } = await supabase
            .from("directors")
            .select("id")
            .eq("entity_id", existingEntity.id)
            .eq("full_name", nameStr)
            .single()

          if (!existingDir) {
            await supabase.from("directors").insert({
              entity_id: existingEntity.id,
              full_name: nameStr,
              role: "Director",
              is_current: true,
            })
          }
        }
      }
    }
  }

  // Update data source record
  await supabase
    .from("data_sources")
    .update({
      status: "synced",
      entity_count: entityCount,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", sourceId)

  return entityCount
}

// ---------- Google Drive sync ----------

async function syncDriveSource(sourceId: string, driveFolderId: string) {
  const supabase = getSupabase()

  await supabase
    .from("data_sources")
    .update({ status: "syncing", error_message: null, updated_at: new Date().toISOString() })
    .eq("id", sourceId)

  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!credentialsJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured")
  }

  const credentials = JSON.parse(credentialsJson) as {
    client_email?: string
    private_key?: string
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error("Invalid service account credentials")
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  })
  const drive = google.drive({ version: "v3", auth })

  // List country subfolders in the root folder
  const foldersRes = await drive.files.list({
    q: `'${driveFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    pageSize: 100,
    fields: "files(id, name)",
    orderBy: "name",
  })

  const countryFolders = foldersRes.data.files ?? []
  let entityCount = 0

  for (const countryFolder of countryFolders) {
    if (!countryFolder.id || !countryFolder.name) continue

    const countryName = countryFolder.name
    const countryGuess = guessCountryFromContent(countryName, "")

    // Look up or create jurisdiction
    let jurisdictionId: string | null = null
    const countryCode = countryGuess?.code ?? "XX"
    const countryDisplayName = countryGuess?.name ?? countryName

    const { data: existingJ } = await supabase
      .from("jurisdictions")
      .select("id")
      .eq("country_code", countryCode)
      .single()

    if (existingJ) {
      jurisdictionId = existingJ.id
    } else {
      const { data: createdJ } = await supabase
        .from("jurisdictions")
        .insert({
          country_code: countryCode,
          country_name: countryDisplayName,
          filing_rules: {},
        })
        .select("id")
        .single()
      jurisdictionId = createdJ?.id ?? null
    }

    if (!jurisdictionId) continue

    // List entity subfolders inside the country folder
    const entityFoldersRes = await drive.files.list({
      q: `'${countryFolder.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      pageSize: 100,
      fields: "files(id, name)",
      orderBy: "name",
    })

    const entityFolders = entityFoldersRes.data.files ?? []

    for (const entityFolder of entityFolders) {
      if (!entityFolder.id || !entityFolder.name) continue

      const entityName = entityFolder.name

      // Upsert entity
      const { data: existingEntity } = await supabase
        .from("entities")
        .select("id, metadata")
        .eq("legal_name", entityName)
        .single()

      if (existingEntity) {
        const meta = (existingEntity.metadata ?? {}) as Record<string, unknown>
        await supabase
          .from("entities")
          .update({
            metadata: { ...meta, drive_folder_id: entityFolder.id },
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingEntity.id)
      } else {
        await supabase.from("entities").insert({
          name: entityName.split(" ").slice(0, 2).join(" "),
          legal_name: entityName,
          entity_type: "subsidiary",
          entity_purpose: "customer_entity",
          jurisdiction_id: jurisdictionId,
          status: "active",
          banking_info: {},
          registered_agent: {},
          metadata: { drive_folder_id: entityFolder.id },
        })
      }

      entityCount++
    }
  }

  // Update data source record
  await supabase
    .from("data_sources")
    .update({
      status: "synced",
      entity_count: entityCount,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", sourceId)

  return entityCount
}

// ---------- Route handler ----------

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const supabase = getSupabase()

  const { data: source, error: fetchError } = await supabase
    .from("data_sources")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !source) {
    return NextResponse.json({ error: "Data source not found" }, { status: 404 })
  }

  const sourceRecord = source as {
    id: string
    source_type: string
    source_id: string | null
  }

  if (!sourceRecord.source_id) {
    await supabase
      .from("data_sources")
      .update({
        status: "error",
        error_message: "Could not extract source ID from URL",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    return NextResponse.json(
      { error: "Could not extract source ID from URL" },
      { status: 400 }
    )
  }

  try {
    let entityCount = 0

    if (sourceRecord.source_type === "notion") {
      if (!process.env.NOTION_API_KEY) {
        throw new Error("NOTION_API_KEY is not configured")
      }
      entityCount = await syncNotionSource(id, sourceRecord.source_id)
    } else if (sourceRecord.source_type === "google_drive") {
      entityCount = await syncDriveSource(id, sourceRecord.source_id)
    } else {
      return NextResponse.json(
        { error: `Unknown source type: ${sourceRecord.source_type}` },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, entityCount })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown sync error"

    await supabase
      .from("data_sources")
      .update({
        status: "error",
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
