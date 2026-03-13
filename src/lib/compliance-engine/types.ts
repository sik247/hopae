// Compliance engine type contracts.
// These types define the inputs/outputs for the pure computation functions.

import type { Entity, Jurisdiction, RiskLevel, AlertType } from '@/lib/db/types'

// Re-export for convenience
export type { Entity, Jurisdiction, RiskLevel, AlertType }

/** Input to the deadline calculator */
export interface DeadlineInput {
  entity: Entity
  jurisdiction: Jurisdiction
  fiscalYear: number
  referenceDate?: Date
}

/** A single computed deadline */
export interface DeadlineResult {
  requirementType: string
  dueDate: Date
  daysUntilDue: number
  isOverdue: boolean
  isDueSoon: boolean
  fiscalYear: number
}

/** Risk assessment for a single entity */
export interface EntityRiskScore {
  entityId: string
  entityName: string
  riskLevel: RiskLevel
  overdue: DeadlineResult[]
  dueSoon: DeadlineResult[]
  compliant: DeadlineResult[]
  isDissolving: boolean
}

/** A ranked alert item for display */
export interface AlertItem {
  entityId: string
  entityName: string
  legalName: string
  countryCode: string
  alertType: AlertType
  requirementType: string
  dueDate: Date
  daysUntilDue: number
  message: string
  urgencyScore: number
}
