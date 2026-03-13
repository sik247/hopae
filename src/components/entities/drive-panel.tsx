"use client"

import { useEffect, useState, useCallback } from "react"
import { INTEGRATIONS_UPDATED_EVENT } from "./integration-links-card"
import {
  ExternalLink,
  FileSpreadsheet,
  FileText,
  File,
  Image,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DriveFile {
  id: string
  name: string
  type?: "pdf" | "spreadsheet" | "document" | "image" | "other"
  mimeType?: string
  lastModified: string
  size: string
  webViewLink?: string
}

// Demo data when no Drive credentials or no linked folder
function getDemoDriveFiles(entityName: string): DriveFile[] {
  return [
    {
      id: "1",
      name: `Articles_of_Incorporation_${entityName.replace(/[^a-zA-Z]/g, "_")}.pdf`,
      type: "pdf",
      lastModified: "2025-06-12",
      size: "2.4 MB",
    },
    {
      id: "2",
      name: `Annual_Return_2025.pdf`,
      type: "pdf",
      lastModified: "2025-12-01",
      size: "1.1 MB",
    },
    {
      id: "3",
      name: `Financial_Statements_FY2025.xlsx`,
      type: "spreadsheet",
      lastModified: "2026-01-20",
      size: "856 KB",
    },
    {
      id: "4",
      name: `Board_Resolution_Director_Appointment.pdf`,
      type: "pdf",
      lastModified: "2025-09-15",
      size: "340 KB",
    },
    {
      id: "5",
      name: `Registered_Agent_Agreement.pdf`,
      type: "pdf",
      lastModified: "2025-03-10",
      size: "512 KB",
    },
  ]
}

function inferType(mimeType: string): DriveFile["type"] {
  if (mimeType.includes("pdf")) return "pdf"
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("sheet")
  )
    return "spreadsheet"
  if (mimeType.includes("document") || mimeType.includes("word")) return "document"
  if (mimeType.includes("image")) return "image"
  return "other"
}

const fileIcon = (type: DriveFile["type"]) => {
  switch (type) {
    case "pdf":
      return <FileText className="size-4 text-red-500" />
    case "spreadsheet":
      return <FileSpreadsheet className="size-4 text-green-600" />
    case "document":
      return <File className="size-4 text-blue-500" />
    case "image":
      return <Image className="size-4 text-purple-500" />
    default:
      return <File className="size-4 text-muted-foreground" />
  }
}

interface DrivePanelProps {
  entityId: string
  entityName: string
}

export function DrivePanel({ entityId, entityName }: DrivePanelProps) {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/integrations/drive?entityId=${encodeURIComponent(entityId)}`
      )
      const data = (await res.json()) as {
        files?: Array<{
          id: string
          name: string
          mimeType: string
          lastModified: string
          size: string
          webViewLink?: string
        }>
      }
      if (data.files?.length) {
        setFiles(
          data.files.map((f) => ({
            id: f.id,
            name: f.name,
            type: inferType(f.mimeType),
            mimeType: f.mimeType,
            lastModified: f.lastModified,
            size: f.size,
            webViewLink: f.webViewLink,
          }))
        )
        setIsDemo(false)
      } else {
        setFiles(getDemoDriveFiles(entityName))
        setIsDemo(true)
      }
    } catch {
      setFiles(getDemoDriveFiles(entityName))
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [entityId, entityName])

  useEffect(() => {
    setLoading(true)
    fetchFiles()
  }, [fetchFiles])

  useEffect(() => {
    const handler = () => {
      setLoading(true)
      fetchFiles()
    }
    window.addEventListener(INTEGRATIONS_UPDATED_EVENT, handler)
    return () => window.removeEventListener(INTEGRATIONS_UPDATED_EVENT, handler)
  }, [fetchFiles])

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
                d="M8 2L2 14H8L16 14L22 2H16L8 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M2 14L8 22H16L22 14"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
            Google Drive
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {loading ? "…" : `${files.length} files`}
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
                Add <code className="rounded bg-muted px-1">GOOGLE_SERVICE_ACCOUNT_JSON</code> and set{" "}
                <code className="rounded bg-muted px-1">metadata.drive_folder_id</code> on the entity to show real files.
              </p>
            )}
            <div className="space-y-2">
              {files.map((file) => (
                <a
                  key={file.id}
                  href={file.webViewLink ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/50 transition-colors group"
                >
                  {fileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.size} &middot; Modified{" "}
                      {new Date(file.lastModified).toLocaleDateString("en-US", {
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
