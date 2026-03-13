"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  Bot,
  Scan,
} from "lucide-react"
import type { PIIScanResult, PIIFinding } from "@/lib/pii-agent/types"

interface PIIScannerProps {
  entityId: string
  entityName: string
}

const RISK_CONFIG = {
  critical: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: ShieldAlert },
  high: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", icon: ShieldAlert },
  medium: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", icon: Shield },
  low: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: ShieldCheck },
}

const ACTION_LABELS: Record<string, string> = {
  redact: "Redact",
  mask: "Mask",
  tokenize: "Tokenize",
  flag: "Flag for Review",
  retain: "Retain (Secure)",
}

function FindingRow({ finding, showValues }: { finding: PIIFinding; showValues: boolean }) {
  const config = RISK_CONFIG[finding.riskLevel]
  const Icon = config.icon

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">
            {finding.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          <Badge variant="outline" className={`text-[10px] ${config.color}`}>
            {finding.riskLevel}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {ACTION_LABELS[finding.suggestedAction] ?? finding.suggestedAction}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          {finding.location}
        </p>
        <p className="text-xs">
          <span className="text-muted-foreground">Value: </span>
          <code className="bg-muted px-1 rounded text-[11px]">
            {showValues ? finding.value : finding.maskedValue}
          </code>
        </p>
        {finding.regulation && (
          <p className="text-[11px] text-muted-foreground">
            Regulation: {finding.regulation}
          </p>
        )}
      </div>
    </div>
  )
}

export function PIIScanner({ entityId, entityName }: PIIScannerProps) {
  const [result, setResult] = useState<PIIScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showValues, setShowValues] = useState(false)

  const runScan = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/pii-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Scan failed")
      }
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">PII Agent Scanner</CardTitle>
            <Badge variant="outline" className="text-[10px]">LangChain</Badge>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowValues(!showValues)}
                className="text-xs"
              >
                {showValues ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                {showValues ? "Hide" : "Show"} Values
              </Button>
            )}
            <Button onClick={runScan} disabled={loading} size="sm">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Scan className="h-4 w-4 mr-1" />
              )}
              {loading ? "Scanning..." : "Scan for PII"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {!result && !loading && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">
              Run the PII agent to scan <strong>{entityName}</strong> for personally identifiable information.
            </p>
            <p className="text-xs mt-1">
              The agent uses LangGraph to orchestrate scanning, classification, jurisdiction assessment, and recommendations.
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-sm text-muted-foreground">Agent is scanning entity data...</p>
            <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>Detecting PII</span>
              <span>&rarr;</span>
              <span>Classifying</span>
              <span>&rarr;</span>
              <span>Jurisdiction Check</span>
              <span>&rarr;</span>
              <span>Recommendations</span>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{result.criticalCount}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">{result.highCount}</p>
                <p className="text-xs text-muted-foreground">High</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{result.mediumCount}</p>
                <p className="text-xs text-muted-foreground">Medium</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{result.lowCount}</p>
                <p className="text-xs text-muted-foreground">Low</p>
              </div>
            </div>

            {/* Compliance Notes */}
            {result.complianceNotes.length > 0 && (
              <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                <p className="text-xs font-medium">Jurisdiction Compliance Notes</p>
                {result.complianceNotes.map((note, i) => (
                  <p key={i} className="text-xs text-muted-foreground">• {note}</p>
                ))}
              </div>
            )}

            {/* Findings List */}
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {result.totalFindings} PII Finding{result.totalFindings !== 1 ? "s" : ""} Detected
              </p>
              {result.findings.map((finding, i) => (
                <FindingRow key={i} finding={finding} showValues={showValues} />
              ))}
            </div>

            {/* Scanned Fields */}
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-muted-foreground mr-1">Scanned:</span>
              {result.scannedFields.map((field) => (
                <Badge key={field} variant="outline" className="text-[10px] font-mono">
                  {field}
                </Badge>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground">
              Scanned at {new Date(result.scannedAt).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
