// Compliance Engine — Public API
// Pure TypeScript functions for deadline calculation, risk scoring, and alert aggregation.
// No database dependency. All functions are callable from Route Handlers and Server Actions.

// Functions
export { calculateDeadlines } from './deadline-calculator'
export { scoreEntityRisk } from './risk-scorer'
export { aggregateAlerts } from './alert-aggregator'

// Types
export type {
  DeadlineInput,
  DeadlineResult,
  EntityRiskScore,
  AlertItem,
} from './types'

export type { EntityScoreWithContext } from './alert-aggregator'
