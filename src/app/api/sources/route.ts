import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Extract a Notion page ID from a URL like:
 *   https://www.notion.so/workspace/Page-Title-abc123def456...
 *   https://notion.so/abc123def456...
 * Returns the 32-char hex ID or null.
 */
function extractNotionPageId(url: string): string | null {
  const match = url.match(/[a-f0-9]{32}/i)
  return match ? match[0] : null
}

/**
 * Extract a Google Drive folder ID from a URL like:
 *   https://drive.google.com/drive/folders/1ABCxyz123...
 * Returns the folder ID or null.
 */
function extractDriveFolderId(url: string): string | null {
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

export async function GET() {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from("data_sources")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sources: data })
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    source_type?: string
    name?: string
    url?: string
  }

  const { source_type, name, url } = body

  if (!source_type || !name || !url) {
    return NextResponse.json(
      { error: "source_type, name, and url are required" },
      { status: 400 }
    )
  }

  if (source_type !== "notion" && source_type !== "google_drive") {
    return NextResponse.json(
      { error: "source_type must be 'notion' or 'google_drive'" },
      { status: 400 }
    )
  }

  let sourceId: string | null = null
  if (source_type === "notion") {
    sourceId = extractNotionPageId(url)
  } else {
    sourceId = extractDriveFolderId(url)
  }

  const supabase = getSupabase()

  const { data, error } = await supabase
    .from("data_sources")
    .insert({
      source_type,
      name,
      url,
      source_id: sourceId,
      status: "pending",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ source: data }, { status: 201 })
}
