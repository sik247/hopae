import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { EntityIntegrationLinks } from "@/lib/db/types"
import { resolveDriveFolderId } from "@/lib/drive/resolve-folder"
import { google } from "googleapis"

const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const entityId = searchParams.get("entityId")
  if (!entityId) {
    return NextResponse.json({ error: "entityId is required" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: entity } = await supabase
    .from("entities")
    .select("metadata, jurisdiction:jurisdictions(country_code)")
    .eq("id", entityId)
    .single()

  if (!entity) {
    return NextResponse.json({ files: [] })
  }

  const meta = (entity.metadata ?? {}) as EntityIntegrationLinks
  const jurisdiction = (entity as { jurisdiction?: { country_code?: string } | null }).jurisdiction ?? null
  const defaultFolderId = process.env.DRIVE_DEFAULT_FOLDER_ID
  const folderId = resolveDriveFolderId(
    meta.drive_folder_id,
    defaultFolderId,
    jurisdiction
  )
  if (!folderId) {
    return NextResponse.json({ files: [] })
  }

  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!credentialsJson) {
    return NextResponse.json({ files: [] })
  }

  let credentials: { client_email?: string; private_key?: string }
  try {
    credentials = JSON.parse(credentialsJson) as {
      client_email?: string
      private_key?: string
    }
  } catch {
    return NextResponse.json({ files: [] })
  }

  if (!credentials.client_email || !credentials.private_key) {
    return NextResponse.json({ files: [] })
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: DRIVE_SCOPES,
    })
    const drive = google.drive({ version: "v3", auth })
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      pageSize: 50,
      fields: "nextPageToken, files(id, name, mimeType, modifiedTime, size)",
      orderBy: "modifiedTime desc",
    })

    const files = (res.data.files ?? []).map((f) => ({
      id: f.id ?? "",
      name: f.name ?? "Untitled",
      mimeType: f.mimeType ?? "application/octet-stream",
      lastModified: f.modifiedTime ?? new Date().toISOString(),
      size: f.size ? formatDriveSize(Number(f.size)) : "—",
      webViewLink: `https://drive.google.com/file/d/${f.id}/view`,
    }))

    return NextResponse.json({ files })
  } catch {
    return NextResponse.json({ files: [] })
  }
}

function formatDriveSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
