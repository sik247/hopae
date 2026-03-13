"use client"

import { useState, useRef, useCallback } from "react"
import { FileText, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface DraftDocumentModalProps {
  entityId: string
  entityName: string
}

type DocumentType = "compliance_filing" | "intercompany_agreement"

export function DraftDocumentModal({
  entityId,
  entityName,
}: DraftDocumentModalProps) {
  const [open, setOpen] = useState(false)
  const [documentType, setDocumentType] =
    useState<DocumentType>("compliance_filing")
  const [draft, setDraft] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const handleGenerate = useCallback(async () => {
    setDraft("")
    setError(null)
    setIsGenerating(true)

    abortRef.current = new AbortController()

    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId, documentType }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Draft generation failed")
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response stream")

      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        accumulated += text
        setDraft(accumulated)
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Generation failed")
    } finally {
      setIsGenerating(false)
    }
  }, [entityId, documentType])

  const handleClose = () => {
    if (abortRef.current) abortRef.current.abort()
    setOpen(false)
    setDraft("")
    setError(null)
    setIsGenerating(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="size-4" />
            Draft Document
          </Button>
        }
      />
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Draft Document for {entityName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Document type selector */}
          <div className="flex gap-2">
            <Button
              variant={
                documentType === "compliance_filing" ? "default" : "outline"
              }
              size="sm"
              onClick={() => setDocumentType("compliance_filing")}
              disabled={isGenerating}
            >
              Compliance Filing
            </Button>
            <Button
              variant={
                documentType === "intercompany_agreement"
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => setDocumentType("intercompany_agreement")}
              disabled={isGenerating}
            >
              Intercompany Agreement
            </Button>
          </div>

          {/* Generate button */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                "Generate Draft"
              )}
            </Button>
            {isGenerating && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => abortRef.current?.abort()}
              >
                <X className="size-4" />
                Cancel
              </Button>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Draft output */}
          {(draft || isGenerating) && (
            <div className="flex-1 overflow-auto rounded-md border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                {draft}
                {isGenerating && (
                  <span className="inline-block w-2 h-4 bg-foreground/70 animate-pulse ml-0.5" />
                )}
              </pre>
            </div>
          )}

          {/* Disclaimer - always visible when draft exists */}
          {draft && (
            <div className="rounded-md border border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-200 font-medium">
              AI draft — requires legal review. This document was generated by
              AI and must be reviewed by qualified legal counsel before use.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
