"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FilePlus2 } from "lucide-react"
import type { EntityIntegrationLinks } from "@/lib/db/types"

export const INTEGRATIONS_UPDATED_EVENT = "integrations-updated"

export function dispatchIntegrationsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(INTEGRATIONS_UPDATED_EVENT))
  }
}

interface IntegrationLinksCardProps {
  entityId: string
  initialMetadata: EntityIntegrationLinks
}

export function IntegrationLinksCard({
  entityId,
  initialMetadata,
}: IntegrationLinksCardProps) {
  const [notionIds, setNotionIds] = useState(
    Array.isArray(initialMetadata.notion_page_ids)
      ? initialMetadata.notion_page_ids.join("\n")
      : ""
  )
  const [driveFolderId, setDriveFolderId] = useState(
    typeof initialMetadata.drive_folder_id === "string"
      ? initialMetadata.drive_folder_id
      : ""
  )
  const [saving, setSaving] = useState(false)
  const [creatingNotion, setCreatingNotion] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const save = useCallback(async () => {
    setSaving(true)
    setMessage(null)
    const pageIds = notionIds
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    try {
      const res = await fetch(`/api/entities/${entityId}/metadata`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notion_page_ids: pageIds,
          drive_folder_id: driveFolderId.trim() || null,
        }),
      })
      const data = (await res.json()) as { error?: string; success?: boolean }
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to save" })
        return
      }
      setMessage({ type: "success", text: "Links saved. Notion and Drive panels will refresh." })
      dispatchIntegrationsUpdated()
    } catch {
      setMessage({ type: "error", text: "Request failed" })
    } finally {
      setSaving(false)
    }
  }, [entityId, notionIds, driveFolderId])

  const createNotionPage = useCallback(async () => {
    setCreatingNotion(true)
    setMessage(null)
    try {
      const res = await fetch("/api/integrations/notion/create-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId }),
      })
      const data = (await res.json()) as {
        error?: string
        created?: number
        results?: Array<{ url: string; entityName: string }>
        errors?: Array<{ error: string }>
      }
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to create page" })
        return
      }
      const first = data.results?.[0]
      if (first) {
        setMessage({
          type: "success",
          text: `Created Notion page for this entity. ${data.errors?.length ? `(${data.errors.length} issue(s) reported.)` : ""}`,
        })
        dispatchIntegrationsUpdated()
      } else if (data.errors?.length) {
        setMessage({ type: "error", text: data.errors[0].error })
      } else {
        setMessage({ type: "error", text: "No page created" })
      }
    } catch {
      setMessage({ type: "error", text: "Request failed" })
    } finally {
      setCreatingNotion(false)
    }
  }, [entityId])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Link integrations to this entity</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Each entity can have its own Notion pages and one Google Drive folder. Set IDs below or create a Notion page from this entity’s data.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={createNotionPage}
            disabled={creatingNotion}
            className="shrink-0"
          >
            <FilePlus2 className="size-4 mr-1.5" />
            {creatingNotion ? "Creating…" : "Create Notion page"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="notion-ids" className="text-sm font-medium leading-none">
            Notion page IDs (one per line or comma-separated)
          </label>
          <textarea
            id="notion-ids"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="abc123def456..."
            value={notionIds}
            onChange={(e) => setNotionIds(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            From page URL: notion.so/.../<strong>page-id-here</strong> — and share each page with your Notion integration.
          </p>
        </div>
        <div className="space-y-2">
          <label htmlFor="drive-folder" className="text-sm font-medium leading-none">
            Google Drive folder ID
          </label>
          <Input
            id="drive-folder"
            type="text"
            placeholder="e.g. 1ABC..."
            value={driveFolderId}
            onChange={(e) => setDriveFolderId(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            From folder URL: drive.google.com/.../folders/<strong>FOLDER_ID</strong> — and share the folder with your service account email.
          </p>
        </div>
        {message && (
          <p
            className={`text-sm ${message.type === "success" ? "text-green-600" : "text-destructive"}`}
          >
            {message.text}
          </p>
        )}
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save links"}
        </Button>
      </CardContent>
    </Card>
  )
}
