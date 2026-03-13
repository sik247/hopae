import { createClient } from '@/lib/supabase/server'
import type { EntityHealthSummary, RiskLevel } from '@/lib/db/types'
import type { Entity, Jurisdiction } from '@/lib/compliance-engine/types'
import { calculateDeadlines } from '@/lib/compliance-engine/deadline-calculator'
import { scoreEntityRisk } from '@/lib/compliance-engine/risk-scorer'
import { aggregateAlerts } from '@/lib/compliance-engine/alert-aggregator'
import type { EntityScoreWithContext } from '@/lib/compliance-engine/alert-aggregator'
import type { AlertItem } from '@/lib/compliance-engine/types'

/** Serialized alert item with ISO string dates for client transport */
export interface SerializedAlertItem extends Omit<AlertItem, 'dueDate'> {
  dueDate: string
}

export interface JurisdictionRisk {
  countryCode: string
  countryName: string
  entityCount: number
  criticalCount: number
  warningCount: number
  worstRisk: RiskLevel
}

export interface DashboardData {
  summary: {
    totalEntities: number
    atRisk: number
    overdueFilings: number
    upcomingDeadlines: number
  }
  jurisdictionRisks: JurisdictionRisk[]
  urgentActions: SerializedAlertItem[]
  allAlerts: SerializedAlertItem[]
}

/**
 * Compute all dashboard data from Supabase entity_health_summary view
 * and the compliance engine for alerts.
 */
export async function computeDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()

  // Fetch entity health summary from the view
  const { data: entities } = await supabase
    .from('entity_health_summary')
    .select('*')

  const healthEntities = (entities as EntityHealthSummary[]) ?? []

  // Summary counts
  const totalEntities = healthEntities.length
  const atRisk = healthEntities.filter(
    (e) => e.risk_level === 'critical' || e.risk_level === 'warning'
  ).length
  const overdueFilings = healthEntities.reduce(
    (sum, e) => sum + (e.overdue_count ?? 0),
    0
  )
  const upcomingDeadlines = healthEntities.reduce(
    (sum, e) => sum + (e.due_soon_count ?? 0),
    0
  )

  // Jurisdiction risk aggregation
  const jurisdictionMap = new Map<string, JurisdictionRisk>()
  for (const e of healthEntities) {
    const key = e.country_code
    const existing = jurisdictionMap.get(key)
    if (existing) {
      existing.entityCount++
      if (e.risk_level === 'critical') existing.criticalCount++
      if (e.risk_level === 'warning') existing.warningCount++
      if (
        e.risk_level === 'critical' ||
        (e.risk_level === 'warning' && existing.worstRisk === 'ok')
      ) {
        existing.worstRisk = e.risk_level
      }
    } else {
      jurisdictionMap.set(key, {
        countryCode: e.country_code,
        countryName: e.country_name,
        entityCount: 1,
        criticalCount: e.risk_level === 'critical' ? 1 : 0,
        warningCount: e.risk_level === 'warning' ? 1 : 0,
        worstRisk: e.risk_level,
      })
    }
  }

  const jurisdictionRisks = Array.from(jurisdictionMap.values()).sort(
    (a, b) => {
      const riskOrder: Record<RiskLevel, number> = {
        critical: 0,
        warning: 1,
        ok: 2,
      }
      return riskOrder[a.worstRisk] - riskOrder[b.worstRisk]
    }
  )

  // Urgent actions: fetch full entity + jurisdiction data for compliance engine
  const { data: rawEntities } = await supabase
    .from('entities')
    .select('*')
  const { data: rawJurisdictions } = await supabase
    .from('jurisdictions')
    .select('*')

  const entitiesArr = (rawEntities as Entity[]) ?? []
  const jurisdictionsArr = (rawJurisdictions as Jurisdiction[]) ?? []
  const jurisdictionById = new Map(jurisdictionsArr.map((j) => [j.id, j]))

  const currentYear = new Date().getUTCFullYear()
  const entityScores: EntityScoreWithContext[] = []

  for (const entity of entitiesArr) {
    const jurisdiction = jurisdictionById.get(entity.jurisdiction_id)
    if (!jurisdiction) continue

    const deadlines = calculateDeadlines({
      entity,
      jurisdiction,
      fiscalYear: currentYear,
    })
    const score = scoreEntityRisk(entity, deadlines)

    entityScores.push({
      score,
      entity: { id: entity.id, name: entity.name, legalName: entity.legal_name },
      jurisdiction: {
        countryCode: jurisdiction.country_code,
        countryName: jurisdiction.country_name,
      },
    })
  }

  const allAlerts = aggregateAlerts(entityScores)
  const serializedAlerts: SerializedAlertItem[] = allAlerts.map((alert) => ({
    ...alert,
    dueDate: alert.dueDate.toISOString(),
  }))
  const urgentActions = serializedAlerts.slice(0, 5)

  return {
    summary: { totalEntities, atRisk, overdueFilings, upcomingDeadlines },
    jurisdictionRisks,
    urgentActions,
    allAlerts: serializedAlerts,
  }
}
