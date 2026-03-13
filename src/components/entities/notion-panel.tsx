"use client"

import { useEffect, useState, useCallback } from "react"
import { INTEGRATIONS_UPDATED_EVENT } from "./integration-links-card"
import { FileText, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface NotionPage {
  id: string
  title: string
  lastEdited: string
  icon?: string
  url: string
}

// Demo data when no Notion API key or no linked pages
function getDemoNotionPages(entityName: string): NotionPage[] {
  const quarter = "Q4 2025"
  return [
    {
      id: "1",
      title: `Board Minutes - ${entityName} ${quarter}`,
      lastEdited: "2025-12-15",
      url: "#",
    },
    {
      id: "2",
      title: `Entity Registration Notes - ${entityName}`,
      lastEdited: "2025-11-20",
      url: "#",
    },
    {
      id: "3",
      title: `Compliance Checklist 2026`,
      lastEdited: "2026-01-05",
      url: "#",
    },
    {
      id: "4",
      title: `Director Appointment Records`,
      lastEdited: "2025-10-08",
      url: "#",
    },
  ]
}

interface NotionPanelProps {
  entityId: string
  entityName: string
}

export function NotionPanel({ entityId, entityName }: NotionPanelProps) {
  const [pages, setPages] = useState<NotionPage[]>([])
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/integrations/notion?entityId=${encodeURIComponent(entityId)}`
      )
      const data = (await res.json()) as { pages?: NotionPage[] }
      if (data.pages?.length) {
        setPages(
          data.pages.map((p) => ({
            ...p,
            lastEdited: p.lastEdited?.slice(0, 10) ?? p.lastEdited,
          }))
        )
        setIsDemo(false)
      } else {
        setPages(getDemoNotionPages(entityName))
        setIsDemo(true)
      }
    } catch {
      setPages(getDemoNotionPages(entityName))
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [entityId, entityName])

  useEffect(() => {
    setLoading(true)
    fetchPages()
  }, [fetchPages])

  useEffect(() => {
    const handler = () => {
      setLoading(true)
      fetchPages()
    }
    window.addEventListener(INTEGRATIONS_UPDATED_EVENT, handler)
    return () => window.removeEventListener(INTEGRATIONS_UPDATED_EVENT, handler)
  }, [fetchPages])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.5 3.5L8 2L20 3.5V20.5L8 22L4.5 20.5V3.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M8 2V22"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line x1="11" y1="7" x2="17" y2="7" stroke="currentColor" strokeWidth="1.2" />
              <line x1="11" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.2" />
              <line x1="11" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            Notion Pages
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {loading ? "…" : `${pages.length} linked`}
            {isDemo && !loading && " (demo)"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            {isDemo && (
              <p className="text-xs text-muted-foreground mb-3">
                Add <code className="rounded bg-muted px-1">NOTION_API_KEY</code> and set{" "}
                <code className="rounded bg-muted px-1">metadata.notion_page_ids</code> on the entity to show real pages.
              </p>
            )}
            <div className="space-y-2">
              {pages.map((page) => (
                <a
                  key={page.id}
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/50 transition-colors group"
                >
                  <FileText className="size-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{page.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Edited{" "}
                      {new Date(page.lastEdited).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <ExternalLink className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </a>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
