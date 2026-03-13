import type { AlertType, RiskLevel } from "@/lib/db/types"

/** Serialized DeadlineResult (dueDate as ISO string for client transfer) */
export interface SerializedDeadlineResult {
  requirementType: string
  dueDate: string
  daysUntilDue: number
  isOverdue: boolean
  isDueSoon: boolean
  fiscalYear: number
}

/** Serialized DeadlineWithContext for calendar display */
export interface SerializedDeadlineWithContext extends SerializedDeadlineResult {
  entityName: string
  entityId: string
  countryCode: string
}

/** Serialized AlertItem for alert feed */
export interface SerializedAlertItem {
  entityId: string
  entityName: string
  legalName: string
  countryCode: string
  alertType: AlertType
  requirementType: string
  dueDate: string
  daysUntilDue: number
  message: string
  urgencyScore: number
}

/** Serialized EntityRiskScore */
export interface SerializedEntityRiskScore {
  entityId: string
  entityName: string
  riskLevel: RiskLevel
  overdue: SerializedDeadlineResult[]
  dueSoon: SerializedDeadlineResult[]
  compliant: SerializedDeadlineResult[]
  isDissolving: boolean
}

/** Serialized EntityScoreWithContext */
export interface SerializedEntityScoreWithContext {
  score: SerializedEntityRiskScore
  entity: { id: string; name: string; legalName: string }
  jurisdiction: { countryCode: string; countryName: string }
}

/** Convert a 2-letter ISO country code to a regional indicator flag emoji */
export function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("")
}

/** Format requirement_type for human-readable display */
export function formatRequirementType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
