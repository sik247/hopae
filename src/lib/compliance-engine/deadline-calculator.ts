import type { DeadlineInput, DeadlineResult } from './types'

/**
 * Calculate compliance deadlines for an entity based on jurisdiction rules.
 * Pure function -- no side effects, no database calls.
 *
 * @param input - Entity, jurisdiction, fiscal year, and optional reference date
 * @returns Array of deadline results, empty for dissolved entities
 */
export function calculateDeadlines(input: DeadlineInput): DeadlineResult[] {
  const { entity, jurisdiction, fiscalYear, referenceDate = new Date() } = input
  const rules = jurisdiction.filing_rules

  // Dissolved entities have no obligations
  if (entity.status === 'dissolved') {
    return []
  }

  const results: DeadlineResult[] = []
  const gracePeriodDays = rules.grace_period_days ?? 0
  const fyeMonth = rules.fiscal_year_end_month ?? 12
  const fyeDay = rules.fiscal_year_end_day ?? 31

  // Compute FYE date: fiscalYear label, e.g. FY2025 with FYE month=12 -> 2025-12-31
  // For FYE month=3 (JP), FY2025 -> 2025-03-31
  const fyeDate = new Date(Date.UTC(fiscalYear, fyeMonth - 1, fyeDay))
  const fyeYear = fyeDate.getUTCFullYear()

  // --- Annual Filing ---
  if (rules.annual_filing_month != null) {
    // annual_filing_month is an absolute calendar month
    // If annual_filing_month > fiscal_year_end_month -> same year as FYE
    // If annual_filing_month <= fiscal_year_end_month -> next year after FYE
    const filingMonth = rules.annual_filing_month
    const filingYear =
      filingMonth > fyeMonth ? fyeYear : fyeYear + 1

    const dueDate = new Date(Date.UTC(filingYear, filingMonth - 1, 1))
    results.push(makeDeadlineResult('annual_filing', dueDate, referenceDate, gracePeriodDays, fiscalYear))
  }

  // --- Tax Return ---
  if (rules.tax_deadline_doy != null) {
    // tax_deadline_doy is day-of-year in the year after FYE year
    const taxYear = fyeYear + 1
    const taxDate = dayOfYear(taxYear, rules.tax_deadline_doy)
    results.push(makeDeadlineResult('tax_return', taxDate, referenceDate, gracePeriodDays, fiscalYear))
  }

  // --- Agent Renewal ---
  if (rules.agent_renewal_month != null) {
    let dueDate: Date

    // If entity has a specific renewal_date, use it
    if (entity.registered_agent?.renewal_date) {
      dueDate = new Date(entity.registered_agent.renewal_date + 'T00:00:00Z')
    } else {
      // Use agent_renewal_month, day 1, in the year of referenceDate
      // If that date has already passed, use next year
      const refYear = referenceDate.getUTCFullYear()
      dueDate = new Date(Date.UTC(refYear, rules.agent_renewal_month - 1, 1))
      if (dueDate < referenceDate) {
        dueDate = new Date(Date.UTC(refYear + 1, rules.agent_renewal_month - 1, 1))
      }
    }

    results.push(makeDeadlineResult('agent_renewal', dueDate, referenceDate, gracePeriodDays, fiscalYear))
  }

  return results
}

/** Compute a DeadlineResult from a due date and reference date */
function makeDeadlineResult(
  requirementType: string,
  dueDate: Date,
  referenceDate: Date,
  gracePeriodDays: number,
  fiscalYear: number,
): DeadlineResult {
  const diffMs = dueDate.getTime() - referenceDate.getTime()
  const daysUntilDue = Math.round(diffMs / (1000 * 60 * 60 * 24))

  // isOverdue: past due by more than the grace period
  const isOverdue = daysUntilDue < -gracePeriodDays

  // isDueSoon: not overdue and within 30 days
  const isDueSoon = !isOverdue && daysUntilDue >= 0 && daysUntilDue <= 30

  return {
    requirementType,
    dueDate,
    daysUntilDue,
    isOverdue,
    isDueSoon,
    fiscalYear,
  }
}

/** Convert a day-of-year number to a Date in the given year */
function dayOfYear(year: number, doy: number): Date {
  const start = new Date(Date.UTC(year, 0, 1)) // Jan 1
  start.setUTCDate(start.getUTCDate() + doy - 1)
  return start
}
