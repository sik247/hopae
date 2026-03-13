import { createClient } from '@/lib/supabase/server'
import type { Entity, Jurisdiction } from '@/lib/db/types'
import { calculateDeadlines } from './deadline-calculator'
import { scoreEntityRisk } from './risk-scorer'
import { aggregateAlerts } from './alert-aggregator'
import type { DeadlineResult, AlertItem } from './types'
import type { EntityScoreWithContext } from './alert-aggregator'

/** Deadline result enriched with entity/jurisdiction context for calendar display */
export interface DeadlineWithContext extends DeadlineResult {
  entityName: string
  entityId: string
  countryCode: string
}

/** Shared fetch + computation: loads entities and jurisdictions, runs the engine */
async function computeAll(referenceDate: Date = new Date()) {
  const supabase = await createClient()

  const [{ data: entities }, { data: jurisdictions }] = await Promise.all([
    supabase.from('entities').select('*'),
    supabase.from('jurisdictions').select('*'),
  ])

  const entityList = (entities as Entity[]) ?? []
  const jurisdictionList = (jurisdictions as Jurisdiction[]) ?? []

  // O(1) jurisdiction lookup
  const jurisdictionMap = new Map<string, Jurisdiction>()
  for (const j of jurisdictionList) {
    jurisdictionMap.set(j.id, j)
  }

  const currentYear = referenceDate.getFullYear()
  const previousYear = currentYear - 1

  const allDeadlines: DeadlineWithContext[] = []
  const entityScores: EntityScoreWithContext[] = []

  for (const entity of entityList) {
    if (entity.status === 'dissolved') continue

    const jurisdiction = jurisdictionMap.get(entity.jurisdiction_id)
    if (!jurisdiction) continue

    // Compute deadlines for current and previous fiscal year
    const deadlinesCurrent = calculateDeadlines({
      entity,
      jurisdiction,
      fiscalYear: currentYear,
      referenceDate,
    })
    const deadlinesPrev = calculateDeadlines({
      entity,
      jurisdiction,
      fiscalYear: previousYear,
      referenceDate,
    })

    const allEntityDeadlines = [...deadlinesCurrent, ...deadlinesPrev]

    // Enrich deadlines with entity context
    for (const d of allEntityDeadlines) {
      allDeadlines.push({
        ...d,
        entityName: entity.name,
        entityId: entity.id,
        countryCode: jurisdiction.country_code,
      })
    }

    // Score risk using combined deadlines
    const score = scoreEntityRisk(entity, allEntityDeadlines)

    entityScores.push({
      score,
      entity: { id: entity.id, name: entity.name, legalName: entity.legal_name },
      jurisdiction: { countryCode: jurisdiction.country_code, countryName: jurisdiction.country_name },
    })
  }

  return { allDeadlines, entityScores }
}

/** Compute all deadlines grouped by ISO date string for calendar display */
export async function computeAllDeadlines(): Promise<{
  deadlinesByDate: Record<string, DeadlineWithContext[]>
  totalDeadlines: number
}> {
  const { allDeadlines } = await computeAll()

  const deadlinesByDate: Record<string, DeadlineWithContext[]> = {}
  for (const d of allDeadlines) {
    const key = d.dueDate.toISOString().slice(0, 10) // YYYY-MM-DD
    if (!deadlinesByDate[key]) {
      deadlinesByDate[key] = []
    }
    deadlinesByDate[key].push(d)
  }

  return { deadlinesByDate, totalDeadlines: allDeadlines.length }
}

/** Compute ranked alerts sorted by urgency */
export async function computeAllAlerts(): Promise<AlertItem[]> {
  const { entityScores } = await computeAll()
  return aggregateAlerts(entityScores)
}

/** Compute risk scores for all entities, sorted by risk (critical first) */
export async function computeAllRiskScores(): Promise<EntityScoreWithContext[]> {
  const { entityScores } = await computeAll()

  const riskOrder: Record<string, number> = { critical: 0, warning: 1, ok: 2 }
  return entityScores.sort(
    (a, b) => (riskOrder[a.score.riskLevel] ?? 3) - (riskOrder[b.score.riskLevel] ?? 3)
  )
}

/** Compute everything in one pass (avoids duplicate Supabase calls) */
export async function computeAllComplianceData() {
  const { allDeadlines, entityScores } = await computeAll()

  // Build deadlinesByDate
  const deadlinesByDate: Record<string, DeadlineWithContext[]> = {}
  for (const d of allDeadlines) {
    const key = d.dueDate.toISOString().slice(0, 10)
    if (!deadlinesByDate[key]) {
      deadlinesByDate[key] = []
    }
    deadlinesByDate[key].push(d)
  }

  // Build alerts
  const alerts = aggregateAlerts(entityScores)

  // Sort risk scores
  const riskOrder: Record<string, number> = { critical: 0, warning: 1, ok: 2 }
  const riskScores = entityScores.sort(
    (a, b) => (riskOrder[a.score.riskLevel] ?? 3) - (riskOrder[b.score.riskLevel] ?? 3)
  )

  return {
    deadlinesByDate,
    totalDeadlines: allDeadlines.length,
    alerts,
    riskScores,
  }
}
