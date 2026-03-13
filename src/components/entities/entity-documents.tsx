"use client"

import { useState, useCallback } from "react"
import {
  Upload,
  FileText,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DocumentStatusTracker,
  type DocStatus,
} from "@/components/entities/document-status-tracker"

interface ExtractedData {
  parties?: Array<{ name: string; role: string }>
  key_dates?: Array<{ description: string; date: string }>
  obligations?: Array<{ party: string; description: string }>
  governing_law?: string
  document_type?: string
  summary?: string
}

interface DocEntry {
  id: string
  title: string
  status: DocStatus
  extractedData: ExtractedData | null
  createdAt: string
}

interface EntityDocumentsProps {
  entityId: string
}

export function EntityDocuments({ entityId }: EntityDocumentsProps) {
  const [documents, setDocuments] = useState<DocEntry[]>([])
  const [textInput, setTextInput] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)

  const handleExtract = useCallback(async () => {
    if (!textInput.trim()) return
    setIsExtracting(true)

    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: textInput, entityId }),
      })

      if (!res.ok) throw new Error("Extraction failed")

      const data = await res.json()
      const newDoc: DocEntry = {
        id: crypto.randomUUID(),
        title: data.extracted?.document_type ?? "Extracted Document",
        status: "draft",
        extractedData: data.extracted,
        createdAt: new Date().toISOString(),
      }

      setDocuments((prev) => [newDoc, ...prev])
      setTextInput("")
      setExpandedDoc(newDoc.id)
    } catch {
      // Error handling - silent for demo
    } finally {
      setIsExtracting(false)
    }
  }, [textInput, entityId])

  const handleStatusChange = (docId: string, newStatus: DocStatus) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: newStatus } : d))
    )
  }

  const statusBadgeVariant = (status: DocStatus) => {
    switch (status) {
      case "draft":
        return "secondary"
      case "sent_for_signature":
        return "outline"
      case "signed":
        return "default"
    }
  }

  const statusLabel = (status: DocStatus) => {
    switch (status) {
      case "draft":
        return "Draft"
      case "sent_for_signature":
        return "Sent"
      case "signed":
        return "Signed"
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload / paste area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            Upload Document for AI Extraction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Paste legal document text here for AI extraction..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={isExtracting}
          />
          <Button
            onClick={handleExtract}
            disabled={!textInput.trim() || isExtracting}
            size="sm"
          >
            {isExtracting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Extracting...
              </>
            ) : (
              <>
                <FileText className="size-4 mr-2" />
                Extract Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Document list */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Documents</CardTitle>
              <Badge variant="secondary">{documents.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {documents.map((doc) => {
              const isExpanded = expandedDoc === doc.id
              return (
                <div key={doc.id} className="rounded-lg border">
                  {/* Document header */}
                  <button
                    type="button"
                    className="flex items-center gap-3 w-full p-3 text-left hover:bg-muted/50 transition-colors"
                    onClick={() =>
                      setExpandedDoc(isExpanded ? null : doc.id)
                    }
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-4 shrink-0" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0" />
                    )}
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium text-sm flex-1 truncate">
                      {doc.title}
                    </span>
                    <Badge variant={statusBadgeVariant(doc.status)}>
                      {statusLabel(doc.status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t p-4 space-y-4">
                      {/* Status tracker */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Signature Workflow
                        </p>
                        <DocumentStatusTracker
                          status={doc.status}
                          onStatusChange={(s) =>
                            handleStatusChange(doc.id, s)
                          }
                        />
                      </div>

                      {/* Extracted data */}
                      {doc.extractedData && (
                        <div className="space-y-3">
                          {doc.extractedData.summary && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Summary
                              </p>
                              <p className="text-sm">
                                {doc.extractedData.summary}
                              </p>
                            </div>
                          )}

                          {doc.extractedData.parties &&
                            doc.extractedData.parties.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Parties
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {doc.extractedData.parties.map((p, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {p.name} ({p.role})
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                          {doc.extractedData.key_dates &&
                            doc.extractedData.key_dates.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Key Dates
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  {doc.extractedData.key_dates.map((d, i) => (
                                    <div
                                      key={i}
                                      className="text-sm bg-muted/50 rounded px-2 py-1"
                                    >
                                      <span className="font-medium">
                                        {d.description}:
                                      </span>{" "}
                                      {d.date}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          {doc.extractedData.obligations &&
                            doc.extractedData.obligations.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Obligations
                                </p>
                                <ul className="text-sm space-y-1">
                                  {doc.extractedData.obligations.map(
                                    (o, i) => (
                                      <li
                                        key={i}
                                        className="flex gap-2 items-start"
                                      >
                                        <span className="font-medium shrink-0">
                                          {o.party}:
                                        </span>
                                        <span>{o.description}</span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                          {doc.extractedData.governing_law && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Governing Law
                              </p>
                              <p className="text-sm">
                                {doc.extractedData.governing_law}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {documents.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="size-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              No documents yet. Paste document text above to extract structured
              data with AI.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
