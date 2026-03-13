import type { Metadata } from "next"

import { computeAllComplianceData } from "@/lib/compliance-engine/compute-all"
import type { DeadlineWithContext } from "@/lib/compliance-engine/compute-all"
import type { AlertItem } from "@/lib/compliance-engine/types"
import type { EntityScoreWithContext } from "@/lib/compliance-engine/alert-aggregator"
import type { DeadlineResult } from "@/lib/compliance-engine/types"
import { CompliancePageClient } from "@/components/compliance/compliance-page-client"
import { createClient } from "@/lib/supabase/server"
import type {
  SerializedDeadlineWithContext,
  SerializedAlertItem,
  SerializedEntityScoreWithContext,
  SerializedDeadlineResult,
} from "@/components/compliance/types"

export const metadata: Metadata = {
  title: "Compliance | Hopae",
}

function serializeDeadline(d: DeadlineResult): SerializedDeadlineResult {
  return { ...d, dueDate: d.dueDate.toISOString() }
}

function serializeDeadlines(
  deadlinesByDate: Record<string, DeadlineWithContext[]>
): Record<string, SerializedDeadlineWithContext[]> {
  const serialized: Record<string, SerializedDeadlineWithContext[]> = {}
  for (const [date, deadlines] of Object.entries(deadlinesByDate)) {
    serialized[date] = deadlines.map((d) => ({
      ...serializeDeadline(d),
      entityName: d.entityName,
      entityId: d.entityId,
      countryCode: d.countryCode,
    }))
  }
  return serialized
}

function serializeAlerts(alerts: AlertItem[]): SerializedAlertItem[] {
  return alerts.map((a) => ({ ...a, dueDate: a.dueDate.toISOString() }))
}

function serializeRiskScores(scores: EntityScoreWithContext[]): SerializedEntityScoreWithContext[] {
  return scores.map((s) => ({
    ...s,
    score: {
      ...s.score,
      overdue: s.score.overdue.map(serializeDeadline),
      dueSoon: s.score.dueSoon.map(serializeDeadline),
      compliant: s.score.compliant.map(serializeDeadline),
    },
  }))
}

export default async function CompliancePage() {
  const { deadlinesByDate, totalDeadlines, alerts, riskScores } =
    await computeAllComplianceData()

  // Fetch entity metadata for Notion/Drive links
  const supabase = await createClient()
  const { data: entityMeta } = await supabase.from('entities').select('id, metadata')
  const entityLinks: Record<string, { source: string; url: string } | null> = {}
  for (const e of entityMeta ?? []) {
    const meta = (e.metadata ?? {}) as Record<string, unknown>
    const notionPageIds = meta.notion_page_ids as string[] | undefined
    const driveFolderId = meta.drive_folder_id as string | undefined
    if (notionPageIds?.length) {
      entityLinks[e.id] = { source: 'notion', url: `https://www.notion.so/${notionPageIds[0]}` }
    } else if (driveFolderId) {
      entityLinks[e.id] = { source: 'drive', url: `https://drive.google.com/drive/folders/${driveFolderId}` }
    } else {
      entityLinks[e.id] = null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Compliance Calendar
        </h1>
        <p className="text-muted-foreground">
          {totalDeadlines} deadlines tracked across all entities
        </p>
      </div>
      <CompliancePageClient
        deadlinesByDate={serializeDeadlines(deadlinesByDate)}
        alerts={serializeAlerts(alerts)}
        riskScores={serializeRiskScores(riskScores)}
        entityLinks={entityLinks}
      />
    </div>
  )
}
