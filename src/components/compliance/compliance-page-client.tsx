"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle, Shield, ExternalLink } from "lucide-react"
import { ComplianceCalendar } from "./compliance-calendar"
import { AlertFeed } from "./alert-feed"
import { RiskDashboard } from "./risk-dashboard"
import { countryFlag, formatRequirementType } from "./types"
import Link from "next/link"
import type {
  SerializedDeadlineWithContext,
  SerializedAlertItem,
  SerializedEntityScoreWithContext,
} from "./types"

const tabs = [
  { id: "risk" as const, label: "Risk Dashboard", icon: Shield },
  { id: "alerts" as const, label: "Alerts", icon: AlertTriangle },
]

type TabId = (typeof tabs)[number]["id"]

interface CompliancePageClientProps {
  deadlinesByDate: Record<string, SerializedDeadlineWithContext[]>
  alerts: SerializedAlertItem[]
  riskScores: SerializedEntityScoreWithContext[]
  entityLinks: Record<string, { source: string; url: string } | null>
}

export function CompliancePageClient({
  deadlinesByDate,
  alerts,
  riskScores,
  entityLinks,
}: CompliancePageClientProps) {
  const [activeTab, setActiveTab] = useState<TabId | null>(null)

  // Get the most urgent items (overdue + due soon) sorted by urgency
  const urgentItems = useMemo(() => {
    const items: (SerializedDeadlineWithContext & { sourceLink?: { source: string; url: string } | null })[] = []
    for (const deadlines of Object.values(deadlinesByDate)) {
      for (const d of deadlines) {
        if (d.isOverdue || d.isDueSoon) {
          items.push({ ...d, sourceLink: entityLinks[d.entityId] })
        }
      }
    }
    // Most overdue first, then soonest due
    return items.sort((a, b) => a.daysUntilDue - b.daysUntilDue)
  }, [deadlinesByDate, entityLinks])

  return (
    <div className="space-y-4">
      {/* Urgent Items Banner */}
      {urgentItems.length > 0 && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-4 text-red-500" />
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">
              {urgentItems.filter(i => i.isOverdue).length} overdue, {urgentItems.filter(i => i.isDueSoon && !i.isOverdue).length} due soon
            </h3>
          </div>
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {urgentItems.slice(0, 10).map((d, i) => (
              <div
                key={`${d.entityId}-${d.requirementType}-${i}`}
                className="flex items-center justify-between text-sm bg-white dark:bg-background/50 rounded-md px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0">{countryFlag(d.countryCode)}</span>
                  {d.sourceLink?.url ? (
                    <a
                      href={d.sourceLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline underline-offset-2 truncate flex items-center gap-1"
                    >
                      {d.entityName}
                      <ExternalLink className="size-3 shrink-0 opacity-50" />
                    </a>
                  ) : (
                    <Link
                      href={`/entities/${d.entityId}`}
                      className="font-medium hover:underline underline-offset-2 truncate"
                    >
                      {d.entityName}
                    </Link>
                  )}
                  <span className="text-muted-foreground text-xs shrink-0">
                    {formatRequirementType(d.requirementType)}
                  </span>
                  {d.sourceLink && (
                    <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                      {d.sourceLink.source === 'notion' ? '📝' : '📁'} {d.sourceLink.source === 'notion' ? 'Notion' : 'Drive'}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold shrink-0 ml-2",
                    d.isOverdue
                      ? "text-red-600 dark:text-red-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                >
                  {d.isOverdue
                    ? `${Math.abs(d.daysUntilDue)}d overdue`
                    : `${d.daysUntilDue}d left`}
                </span>
              </div>
            ))}
            {urgentItems.length > 10 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                +{urgentItems.length - 10} more items
              </p>
            )}
          </div>
        </div>
      )}

      {/* Calendar — always visible as primary view */}
      <ComplianceCalendar deadlinesByDate={deadlinesByDate} entityLinks={entityLinks} />

      {/* Secondary tab buttons */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {tab.label}
              {tab.id === "alerts" && alerts.length > 0 && (
                <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {alerts.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === "risk" && (
        <RiskDashboard entityScores={riskScores} />
      )}
      {activeTab === "alerts" && (
        <AlertFeed alerts={alerts} />
      )}
    </div>
  )
}
