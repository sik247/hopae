import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { EntityIntegrationLinks } from "@/lib/db/types"

/**
 * PATCH: merge integration links (notion_page_ids, drive_folder_id) into entity.metadata.
 * Body: { notion_page_ids?: string[], drive_folder_id?: string }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: entityId } = await params
  if (!entityId) {
    return NextResponse.json({ error: "Entity ID required" }, { status: 400 })
  }

  let body: { notion_page_ids?: string[]; drive_folder_id?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const updates: EntityIntegrationLinks = {}
  if (Array.isArray(body.notion_page_ids)) {
    updates.notion_page_ids = body.notion_page_ids
      .map((id) => (typeof id === "string" ? id.trim() : ""))
      .filter(Boolean)
  }
  if (body.drive_folder_id !== undefined) {
    const v = typeof body.drive_folder_id === "string" ? body.drive_folder_id.trim() : ""
    updates.drive_folder_id = v || undefined
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid integration links to update" }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    const { data: existing } = await supabase
      .from("entities")
      .select("metadata")
      .eq("id", entityId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }

    const currentMeta = (existing.metadata ?? {}) as Record<string, unknown>
    const newMeta = { ...currentMeta, ...updates }
    if (updates.drive_folder_id === undefined && "drive_folder_id" in currentMeta) {
      delete newMeta.drive_folder_id
    }

    const { error } = await supabase
      .from("entities")
      .update({
        metadata: newMeta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", entityId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, metadata: newMeta })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    )
  }
}
