import type { Entity } from '@/lib/db/types'
import type { DeadlineResult, EntityRiskScore } from './types'

/**
 * Score an entity's compliance risk based on computed deadlines.
 * Pure function -- no side effects, no database calls.
 *
 * @param entity - The entity to score
 * @param deadlines - Computed deadline results from calculateDeadlines
 * @returns Risk score with categorized deadline arrays
 */
export function scoreEntityRisk(
  entity: Entity,
  deadlines: DeadlineResult[],
): EntityRiskScore {
  const overdue: DeadlineResult[] = []
  const dueSoon: DeadlineResult[] = []
  const compliant: DeadlineResult[] = []

  for (const deadline of deadlines) {
    if (deadline.isOverdue) {
      overdue.push(deadline)
    } else if (deadline.isDueSoon) {
      dueSoon.push(deadline)
    } else {
      compliant.push(deadline)
    }
  }

  const isDissolving = entity.status === 'dissolving'

  let riskLevel: 'critical' | 'warning' | 'ok'
  if (overdue.length > 0 || isDissolving) {
    riskLevel = 'critical'
  } else if (dueSoon.length > 0) {
    riskLevel = 'warning'
  } else {
    riskLevel = 'ok'
  }

  return {
    entityId: entity.id,
    entityName: entity.name,
    riskLevel,
    overdue,
    dueSoon,
    compliant,
    isDissolving,
  }
}
