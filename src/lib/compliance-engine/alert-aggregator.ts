import type { EntityRiskScore, AlertItem, AlertType } from './types'

/** Entity context needed for alert display */
export interface EntityScoreWithContext {
  score: EntityRiskScore
  entity: { id: string; name: string; legalName: string }
  jurisdiction: { countryCode: string; countryName: string }
}

/**
 * Aggregate entity risk scores into a ranked list of alerts sorted by urgency.
 * Pure function -- no side effects, no database calls.
 *
 * @param entityScores - Scored entities with display context
 * @returns Alerts sorted by urgency (most urgent first)
 */
export function aggregateAlerts(entityScores: EntityScoreWithContext[]): AlertItem[] {
  const alerts: AlertItem[] = []

  for (const { score, entity, jurisdiction } of entityScores) {
    if (score.riskLevel === 'ok') continue

    // Create alerts for overdue deadlines
    for (const deadline of score.overdue) {
      const formattedType = formatRequirementType(deadline.requirementType)
      alerts.push({
        entityId: entity.id,
        entityName: entity.name,
        legalName: entity.legalName,
        countryCode: jurisdiction.countryCode,
        alertType: 'overdue',
        requirementType: deadline.requirementType,
        dueDate: deadline.dueDate,
        daysUntilDue: deadline.daysUntilDue,
        message: `${formattedType} for FY${deadline.fiscalYear} is ${Math.abs(deadline.daysUntilDue)} days overdue. Immediate action required.`,
        urgencyScore: deadline.daysUntilDue, // negative = most urgent
      })
    }

    // Create alerts for due_soon deadlines
    for (const deadline of score.dueSoon) {
      const formattedType = formatRequirementType(deadline.requirementType)
      alerts.push({
        entityId: entity.id,
        entityName: entity.name,
        legalName: entity.legalName,
        countryCode: jurisdiction.countryCode,
        alertType: 'due_soon',
        requirementType: deadline.requirementType,
        dueDate: deadline.dueDate,
        daysUntilDue: deadline.daysUntilDue,
        message: `${formattedType} for FY${deadline.fiscalYear} due in ${deadline.daysUntilDue} days.`,
        urgencyScore: deadline.daysUntilDue,
      })
    }

    // Create at_risk alert for dissolving entities with no overdue
    if (score.isDissolving && score.overdue.length === 0) {
      alerts.push({
        entityId: entity.id,
        entityName: entity.name,
        legalName: entity.legalName,
        countryCode: jurisdiction.countryCode,
        alertType: 'at_risk',
        requirementType: 'dissolution',
        dueDate: new Date(),
        daysUntilDue: 0,
        message: `${entity.name} is dissolving. Review compliance obligations.`,
        urgencyScore: 0,
      })
    }
  }

  // Sort by urgencyScore ascending (most negative = most urgent first)
  alerts.sort((a, b) => a.urgencyScore - b.urgencyScore)

  return alerts
}

/** Format requirement_type for human-readable messages */
function formatRequirementType(type: string): string {
  return type
    .split('_')
    .map((word, i) => (i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ')
}
