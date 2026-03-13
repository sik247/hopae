"use client"

import { useState, useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  ExternalLink,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"

function countryFlag(code: string): string {
  if (!code) return ""
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("")
}

interface EntityInfo {
  name: string
  legalName: string
  countryCode: string
  countryName: string
  status: string
  source: "notion" | "drive" | "unknown"
  sourceUrl: string | null
  notionPageIds: string[]
  driveFolderId: string | null
}

interface SerializedAlert {
  entityId: string
  entityName: string
  legalName: string
  countryCode: string
  alertType: string
  requirementType: string
  dueDate: string
  daysUntilDue: number
  message: string
  urgencyScore: number
}

type ReviewStatus = "pending" | "approved" | "rejected" | "changes_requested"

interface ReviewState {
  status: ReviewStatus
  comment: string
  reviewedAt: string | null
}

interface DocumentsPageClientProps {
  entityData: Record<string, EntityInfo>
  documents: Array<Record<string, unknown>>
  agreements: Array<Record<string, unknown>>
  alerts: SerializedAlert[]
}

function formatRequirementType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function SourceLink({ entity }: { entity: EntityInfo }) {
  if (!entity.sourceUrl) return null

  return (
    <a
      href={entity.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
    >
      {entity.source === "notion" ? "📝 Notion" : "📁 Drive"}
      <ExternalLink className="size-2.5" />
    </a>
  )
}

function ReviewActions({
  review,
  onAction,
}: {
  review: ReviewState
  onAction: (status: ReviewStatus, comment?: string) => void
}) {
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState("")

  if (review.status !== "pending") {
    return (
      <div className="flex items-center gap-2">
        <Badge
          variant={review.status === "approved" ? "default" : "secondary"}
          className={cn(
            review.status === "approved" && "bg-green-600",
            review.status === "rejected" && "bg-red-600",
            review.status === "changes_requested" && "bg-amber-600"
          )}
        >
          {review.status === "approved" && "Approved"}
          {review.status === "rejected" && "Rejected"}
          {review.status === "changes_requested" && "Changes Requested"}
        </Badge>
        {review.comment && (
          <span className="text-xs text-muted-foreground italic truncate max-w-[200px]">
            &ldquo;{review.comment}&rdquo;
          </span>
        )}
        <button
          onClick={() => onAction("pending")}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Reset
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onAction("approved")}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/50 border border-green-200 dark:border-green-900/40 transition-colors"
      >
        <ThumbsUp className="size-3" /> Approve
      </button>
      <button
        onClick={() => onAction("rejected")}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900/40 transition-colors"
      >
        <ThumbsDown className="size-3" /> Reject
      </button>
      <button
        onClick={() => setShowComment(!showComment)}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-900/40 transition-colors"
      >
        <MessageSquare className="size-3" /> Comment
      </button>
      {showComment && (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Request changes..."
            className="text-xs border rounded px-2 py-1 w-48 bg-background"
            onKeyDown={(e) => {
              if (e.key === "Enter" && comment.trim()) {
                onAction("changes_requested", comment)
                setComment("")
                setShowComment(false)
              }
            }}
          />
          <button
            onClick={() => {
              if (comment.trim()) {
                onAction("changes_requested", comment)
                setComment("")
                setShowComment(false)
              }
            }}
            className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground"
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}

export function DocumentsPageClient({
  entityData,
  documents,
  agreements,
  alerts,
}: DocumentsPageClientProps) {
  const [filter, setFilter] = useState<"all" | "urgent" | "pending" | "approved">("all")
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Record<string, ReviewState>>({})

  const getReview = (id: string): ReviewState =>
    reviews[id] ?? { status: "pending", comment: "", reviewedAt: null }

  const setReview = (id: string, status: ReviewStatus, comment?: string) => {
    setReviews((prev) => ({
      ...prev,
      [id]: {
        status,
        comment: comment ?? "",
        reviewedAt: status !== "pending" ? new Date().toISOString() : null,
      },
    }))
  }

  // Build unified document list: entities with their alerts (urgency) + source links
  const entityDocuments = useMemo(() => {
    // Group alerts by entity
    const alertsByEntity = new Map<string, SerializedAlert[]>()
    for (const alert of alerts) {
      if (!alertsByEntity.has(alert.entityId)) alertsByEntity.set(alert.entityId, [])
      alertsByEntity.get(alert.entityId)!.push(alert)
    }

    // Build list of all entities with urgency info
    const items = Object.entries(entityData).map(([entityId, info]) => {
      const entityAlerts = alertsByEntity.get(entityId) ?? []
      const worstUrgency = entityAlerts.length > 0
        ? Math.min(...entityAlerts.map((a) => a.daysUntilDue))
        : Infinity
      const hasOverdue = entityAlerts.some((a) => a.daysUntilDue < 0)
      const hasDueSoon = entityAlerts.some((a) => a.daysUntilDue >= 0 && a.daysUntilDue <= 30)
      const reviewStatus = getReview(entityId).status

      return {
        entityId,
        info,
        alerts: entityAlerts,
        worstUrgency,
        hasOverdue,
        hasDueSoon,
        reviewStatus,
      }
    })

    // Sort by urgency (most urgent first)
    items.sort((a, b) => a.worstUrgency - b.worstUrgency)

    return items
  }, [entityData, alerts, reviews]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredDocs = useMemo(() => {
    switch (filter) {
      case "urgent":
        return entityDocuments.filter((d) => d.hasOverdue || d.hasDueSoon)
      case "pending":
        return entityDocuments.filter((d) => getReview(d.entityId).status === "pending")
      case "approved":
        return entityDocuments.filter((d) => getReview(d.entityId).status === "approved")
      default:
        return entityDocuments
    }
  }, [entityDocuments, filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => ({
    total: entityDocuments.length,
    urgent: entityDocuments.filter((d) => d.hasOverdue).length,
    dueSoon: entityDocuments.filter((d) => d.hasDueSoon && !d.hasOverdue).length,
    approved: entityDocuments.filter((d) => getReview(d.entityId).status === "approved").length,
    pending: entityDocuments.filter((d) => getReview(d.entityId).status === "pending").length,
  }), [entityDocuments]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Entity compliance documents sorted by urgency. Review and approve like a PR.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => setFilter("all")}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Total Entities</p>
              <FileText className="size-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-1 hover:ring-red-500/50 transition-all" onClick={() => setFilter("urgent")}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-red-600">Overdue</p>
              <AlertTriangle className="size-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.urgent}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-1 hover:ring-amber-500/50 transition-all" onClick={() => setFilter("urgent")}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-amber-600">Due Soon</p>
              <Clock className="size-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.dueSoon}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => setFilter("pending")}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Pending Review</p>
              <MessageSquare className="size-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-1 hover:ring-green-500/50 transition-all" onClick={() => setFilter("approved")}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-green-600">Approved</p>
              <CheckCircle2 className="size-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Filter className="size-4 text-muted-foreground" />
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(["all", "urgent", "pending", "approved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                filter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {filteredDocs.length} of {entityDocuments.length} entities
        </span>
      </div>

      {/* Document List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Entity Documents</CardTitle>
          <CardDescription>
            Sorted by compliance urgency. Click to expand, review, and approve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {filteredDocs.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="mx-auto size-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  {filter === "approved"
                    ? "No approved documents yet."
                    : filter === "urgent"
                      ? "No urgent items. All entities are in good standing."
                      : "No documents match this filter."}
                </p>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isExpanded = expandedEntity === doc.entityId
                const review = getReview(doc.entityId)

                return (
                  <div
                    key={doc.entityId}
                    className={cn(
                      "rounded-lg border transition-all",
                      doc.hasOverdue && "border-red-200 dark:border-red-900/40",
                      doc.hasDueSoon && !doc.hasOverdue && "border-amber-200 dark:border-amber-900/40",
                      review.status === "approved" && "border-green-200 dark:border-green-900/40 opacity-75",
                    )}
                  >
                    {/* Entity row header */}
                    <button
                      onClick={() => setExpandedEntity(isExpanded ? null : doc.entityId)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Urgency indicator */}
                        <div className={cn(
                          "size-2.5 rounded-full shrink-0",
                          doc.hasOverdue ? "bg-red-500" : doc.hasDueSoon ? "bg-amber-500" : "bg-emerald-500"
                        )} />

                        <span className="text-base shrink-0">
                          {countryFlag(doc.info.countryCode)}
                        </span>

                        <div className="min-w-0 text-left">
                          <p className="text-sm font-medium truncate">
                            {doc.info.legalName || doc.info.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.info.countryName}
                          </p>
                        </div>

                        <SourceLink entity={doc.info} />

                        {/* Alert badges */}
                        {doc.hasOverdue && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            {doc.alerts.filter(a => a.daysUntilDue < 0).length} overdue
                          </Badge>
                        )}
                        {doc.hasDueSoon && !doc.hasOverdue && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            {doc.alerts.filter(a => a.daysUntilDue >= 0).length} due soon
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {review.status !== "pending" && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px]",
                              review.status === "approved" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                              review.status === "rejected" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                              review.status === "changes_requested" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                            )}
                          >
                            {review.status.replace("_", " ")}
                          </Badge>
                        )}
                        {isExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t">
                        {/* Compliance requirements */}
                        {doc.alerts.length > 0 && (
                          <div className="pt-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Compliance Requirements
                            </p>
                            <div className="space-y-1.5">
                              {doc.alerts
                                .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
                                .map((alert, i) => (
                                  <div
                                    key={`${alert.requirementType}-${i}`}
                                    className={cn(
                                      "flex items-center justify-between text-sm rounded-md px-3 py-2",
                                      alert.daysUntilDue < 0 ? "bg-red-50 dark:bg-red-950/20" : "bg-amber-50 dark:bg-amber-950/20"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      {alert.daysUntilDue < 0 ? (
                                        <AlertTriangle className="size-3.5 text-red-500 shrink-0" />
                                      ) : (
                                        <Clock className="size-3.5 text-amber-500 shrink-0" />
                                      )}
                                      <span className="font-medium">
                                        {formatRequirementType(alert.requirementType)}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        Due: {new Date(alert.dueDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <span
                                      className={cn(
                                        "text-xs font-semibold",
                                        alert.daysUntilDue < 0 ? "text-red-600" : "text-amber-600"
                                      )}
                                    >
                                      {alert.daysUntilDue < 0
                                        ? `${Math.abs(alert.daysUntilDue)}d overdue`
                                        : `${alert.daysUntilDue}d left`}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {doc.alerts.length === 0 && (
                          <div className="pt-3 flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="size-4" />
                            All compliance requirements met
                          </div>
                        )}

                        {/* Source documents links */}
                        <div className="pt-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Source Documents
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {doc.info.sourceUrl && (
                              <a
                                href={doc.info.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium bg-slate-50 dark:bg-slate-900 border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                {doc.info.source === "notion" ? "📝" : "📁"}
                                Open in {doc.info.source === "notion" ? "Notion" : "Google Drive"}
                                <ExternalLink className="size-3.5" />
                              </a>
                            )}
                            {!doc.info.sourceUrl && (
                              <span className="text-xs text-muted-foreground italic">
                                No linked documents. Sync integrations to connect.
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Review actions - PR-style */}
                        <div className="pt-3 border-t">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Review
                          </p>
                          <ReviewActions
                            review={review}
                            onAction={(status, comment) => setReview(doc.entityId, status, comment)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
