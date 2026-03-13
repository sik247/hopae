"use client"

import { useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  Loader2,
  Database,
  BookOpen,
  HardDrive,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { DataSource, DataSourceType } from "@/lib/db/types"

// ---------- Notion "N" icon ----------

function NotionIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.12 2.168c-.42-.326-.98-.7-2.054-.607L3.02 2.721c-.466.046-.56.28-.374.466l1.813 1.021zm.793 3.358v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.633c0-.606-.233-.933-.746-.886l-15.177.886c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.886l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.747 0-.933-.234-1.494-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.218.187c-.093-.187 0-.653.327-.746l.84-.233V8.68l-1.168-.093c-.093-.42.14-1.026.793-1.073l3.451-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.886.747-.933l3.175-.187z" />
    </svg>
  )
}

// ---------- Status badge component ----------

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "syncing":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        >
          <Loader2 className="mr-1 size-3 animate-spin" />
          Syncing
        </Badge>
      )
    case "synced":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        >
          Synced
        </Badge>
      )
    case "error":
      return (
        <Badge
          variant="destructive"
        >
          Error
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary">Pending</Badge>
      )
  }
}

// ---------- Source icon ----------

function SourceIcon({ type, className }: { type: string; className?: string }) {
  if (type === "notion") {
    return <NotionIcon className={cn("size-5", className)} />
  }
  return <HardDrive className={cn("size-5", className)} />
}

// ---------- Add Source Dialog ----------

function AddSourceDialog({
  onAdd,
}: {
  onAdd: (source: DataSource) => void
}) {
  const [open, setOpen] = useState(false)
  const [sourceType, setSourceType] = useState<DataSourceType>("notion")
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!name.trim() || !url.trim()) {
      setError("Name and URL are required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_type: sourceType, name: name.trim(), url: url.trim() }),
      })

      const data = (await res.json()) as { source?: DataSource; error?: string }

      if (!res.ok) {
        setError(data.error ?? "Failed to add source")
        return
      }

      if (data.source) {
        onAdd(data.source)
        setOpen(false)
        setName("")
        setUrl("")
        setSourceType("notion")
      }
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Add Source
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Data Source</DialogTitle>
          <DialogDescription>
            Connect a Notion page or Google Drive folder to import entity data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Source Type</label>
            <Select value={sourceType} onValueChange={(val) => setSourceType(val as DataSourceType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="notion">Notion</SelectItem>
                <SelectItem value="google_drive">Google Drive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="e.g. Entity Registry"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">URL</label>
            <Input
              placeholder={
                sourceType === "notion"
                  ? "https://www.notion.so/..."
                  : "https://drive.google.com/drive/folders/..."
              }
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-1 size-4 animate-spin" />}
            Add Source
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Main component ----------

interface SourcesPageClientProps {
  initialSources: DataSource[]
  serviceAccountEmail: string | null
}

export function SourcesPageClient({
  initialSources,
  serviceAccountEmail,
}: SourcesPageClientProps) {
  const [sources, setSources] = useState<DataSource[]>(initialSources)
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const handleAddSource = useCallback((source: DataSource) => {
    setSources((prev) => [source, ...prev])
  }, [])

  const handleSync = useCallback(async (id: string) => {
    setSyncingIds((prev) => new Set(prev).add(id))

    // Optimistically set status
    setSources((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: "syncing" as const, error_message: null } : s
      )
    )

    try {
      const res = await fetch(`/api/sources/${id}/sync`, { method: "POST" })
      const data = (await res.json()) as {
        success?: boolean
        entityCount?: number
        error?: string
      }

      if (res.ok && data.success) {
        setSources((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: "synced" as const,
                  entity_count: data.entityCount ?? s.entity_count,
                  last_synced_at: new Date().toISOString(),
                  error_message: null,
                }
              : s
          )
        )
      } else {
        setSources((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: "error" as const,
                  error_message: data.error ?? "Sync failed",
                }
              : s
          )
        )
      }
    } catch {
      setSources((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: "error" as const, error_message: "Network error" }
            : s
        )
      )
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id))

    try {
      const res = await fetch(`/api/sources/${id}`, { method: "DELETE" })
      if (res.ok) {
        setSources((prev) => prev.filter((s) => s.id !== id))
      }
    } catch {
      // Ignore
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }, [])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Sources</h1>
        <p className="text-muted-foreground">
          Connect Notion pages and Google Drive folders to import entity data into Hopae.
        </p>
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">
            <Database className="size-4" />
            Directory
          </TabsTrigger>
          <TabsTrigger value="howto">
            <BookOpen className="size-4" />
            How To
          </TabsTrigger>
        </TabsList>

        {/* ---- Directory Tab ---- */}
        <TabsContent value="directory">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Connected Sources</CardTitle>
                <CardDescription>
                  {sources.length === 0
                    ? "No sources connected yet. Add one to get started."
                    : `${sources.length} source${sources.length !== 1 ? "s" : ""} connected`}
                </CardDescription>
              </div>
              <AddSourceDialog onAdd={handleAddSource} />
            </CardHeader>
            <CardContent>
              {sources.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="mx-auto size-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No data sources yet. Click &quot;Add Source&quot; to connect a Notion page or Google Drive folder.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sources.map((source) => {
                    const isSyncing = syncingIds.has(source.id)
                    const isDeleting = deletingIds.has(source.id)

                    return (
                      <div
                        key={source.id}
                        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <SourceIcon
                            type={source.source_type}
                            className="shrink-0 text-muted-foreground"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">
                                {source.name}
                              </p>
                              <StatusBadge status={source.status} />
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:text-foreground truncate max-w-[300px] inline-flex items-center gap-1"
                              >
                                {source.url}
                                <ExternalLink className="size-3 shrink-0" />
                              </a>
                              {source.entity_count > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {source.entity_count} entities
                                </span>
                              )}
                              {source.last_synced_at && (
                                <span className="text-xs text-muted-foreground">
                                  Last synced:{" "}
                                  {new Date(source.last_synced_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {source.error_message && (
                              <p className="text-xs text-destructive mt-1">
                                {source.error_message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(source.id)}
                            disabled={isSyncing}
                          >
                            {isSyncing ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="size-3.5" />
                            )}
                            Sync
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(source.id)}
                            disabled={isDeleting}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            {isDeleting ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- How To Tab ---- */}
        <TabsContent value="howto">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Notion instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <NotionIcon className="size-5" />
                  Connect Notion
                </CardTitle>
                <CardDescription>
                  Import entity data from a Notion database or page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
                  <li>
                    <span className="text-foreground font-medium">
                      Create a Notion integration
                    </span>
                    <br />
                    Go to{" "}
                    <a
                      href="https://www.notion.so/my-integrations"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:no-underline"
                    >
                      notion.so/my-integrations
                    </a>{" "}
                    and create a new internal integration. Copy the API key and
                    set it as <code className="rounded bg-muted px-1.5 py-0.5 text-xs">NOTION_API_KEY</code> in
                    your environment.
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      Share the page with the integration
                    </span>
                    <br />
                    Open the Notion page containing your entity data. Click
                    &quot;Share&quot; in the top-right and invite your integration.
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      Add the page URL as a source
                    </span>
                    <br />
                    Copy the page URL from your browser and paste it in the
                    Directory tab using the &quot;Add Source&quot; button.
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      Sync to import data
                    </span>
                    <br />
                    Click &quot;Sync&quot; on the source to import child pages as entities
                    into Hopae. Each child page becomes an entity record.
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Google Drive instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HardDrive className="size-5" />
                  Connect Google Drive
                </CardTitle>
                <CardDescription>
                  Import entity data from a Google Drive folder structure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
                  <li>
                    <span className="text-foreground font-medium">
                      Share the folder with the service account
                    </span>
                    <br />
                    Share your Google Drive folder with the service account email
                    below (Editor or Viewer access).
                    {serviceAccountEmail ? (
                      <div className="mt-1.5 rounded-md bg-muted p-2 font-mono text-xs break-all">
                        {serviceAccountEmail}
                      </div>
                    ) : (
                      <div className="mt-1.5 rounded-md bg-amber-50 dark:bg-amber-950/20 p-2 text-xs text-amber-700 dark:text-amber-400">
                        Service account not configured. Set{" "}
                        <code className="font-mono">GOOGLE_SERVICE_ACCOUNT_JSON</code> in your
                        environment.
                      </div>
                    )}
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      Organize with country subfolders
                    </span>
                    <br />
                    Structure your Drive folder with country-named subfolders
                    (e.g., &quot;United States&quot;, &quot;Singapore&quot;), each containing
                    entity-named subfolders.
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      Add the folder URL as a source
                    </span>
                    <br />
                    Copy the folder URL from Google Drive and paste it in the
                    Directory tab using the &quot;Add Source&quot; button.
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      Sync to import data
                    </span>
                    <br />
                    Click &quot;Sync&quot; to scan subfolders and create jurisdiction
                    and entity records in Hopae.
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
