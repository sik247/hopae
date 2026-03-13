import { describe, it, expect } from 'vitest'
import { calculateDeadlines } from './deadline-calculator'
import type { DeadlineInput } from './types'
import type { Entity, Jurisdiction } from '@/lib/db/types'

// Pinned reference date for deterministic tests
const REF_DATE = new Date('2026-03-13T00:00:00Z')

function makeEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'ent-lu-001',
    name: 'Hopae S.a r.l.',
    legal_name: 'Hopae S.a r.l.',
    entity_type: 'SARL',
    entity_purpose: 'hq',
    jurisdiction_id: 'jur-lu',
    parent_entity_id: null,
    incorporation_date: '2020-01-15',
    registration_number: 'B123456',
    status: 'active',
    banking_info: {},
    registered_agent: { name: 'LuxAgent', renewal_date: '2026-03-15' },
    metadata: {},
    created_at: '2020-01-15T00:00:00Z',
    updated_at: '2020-01-15T00:00:00Z',
    ...overrides,
  }
}

function makeJurisdiction(overrides: Partial<Jurisdiction> = {}): Jurisdiction {
  return {
    id: 'jur-lu',
    country_code: 'LU',
    country_name: 'Luxembourg',
    filing_rules: {
      annual_filing_month: 7,
      tax_deadline_doy: 365,
      agent_renewal_month: 3,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 30,
    },
    currency: 'EUR',
    timezone: 'Europe/Luxembourg',
    created_at: '2020-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('calculateDeadlines', () => {
  it('returns correct deadlines for LU entity (FYE Dec, annual_filing_month=7) for FY2025', () => {
    const input: DeadlineInput = {
      entity: makeEntity(),
      jurisdiction: makeJurisdiction(),
      fiscalYear: 2025,
      referenceDate: REF_DATE,
    }

    const results = calculateDeadlines(input)

    // Should return annual_filing, tax_return, and agent_renewal
    const annualFiling = results.find(r => r.requirementType === 'annual_filing')
    const taxReturn = results.find(r => r.requirementType === 'tax_return')
    const agentRenewal = results.find(r => r.requirementType === 'agent_renewal')

    expect(annualFiling).toBeDefined()
    expect(taxReturn).toBeDefined()
    expect(agentRenewal).toBeDefined()

    // LU FY2025: FYE = 2025-12-31
    // annual_filing_month=7, fiscal_year_end_month=12. 7 < 12 -> next year = 2026. July 1, 2026.
    expect(annualFiling!.dueDate).toEqual(new Date('2026-07-01T00:00:00Z'))

    // tax_deadline_doy=365 in year after FYE year (2025+1=2026). Day 365 of 2026 = Dec 31, 2026
    expect(taxReturn!.dueDate).toEqual(new Date('2026-12-31T00:00:00Z'))
  })

  it('returns correct deadlines for JP entity (FYE March, annual_filing_month=5) for FY2025', () => {
    const jpEntity = makeEntity({
      id: 'ent-jp-001',
      name: 'Hopae KK',
      jurisdiction_id: 'jur-jp',
      status: 'active',
    })
    const jpJurisdiction = makeJurisdiction({
      id: 'jur-jp',
      country_code: 'JP',
      country_name: 'Japan',
      filing_rules: {
        annual_filing_month: 5,
        tax_deadline_doy: 151,
        agent_renewal_month: 4,
        fiscal_year_end_month: 3,
        fiscal_year_end_day: 31,
        grace_period_days: 14,
      },
    })

    const input: DeadlineInput = {
      entity: jpEntity,
      jurisdiction: jpJurisdiction,
      fiscalYear: 2025,
      referenceDate: REF_DATE,
    }

    const results = calculateDeadlines(input)

    const annualFiling = results.find(r => r.requirementType === 'annual_filing')
    expect(annualFiling).toBeDefined()

    // JP FY2025: FYE = 2025-03-31
    // annual_filing_month=5, fiscal_year_end_month=3. 5 > 3 -> same year as FYE = 2025. May 1, 2025.
    expect(annualFiling!.dueDate).toEqual(new Date('2025-05-01T00:00:00Z'))
  })

  it('applies grace_period_days to delay overdue classification', () => {
    // LU FY2025: annual_filing due 2026-07-01, grace_period=30
    // ref date = 2026-03-13 -> daysUntilDue = 110 (positive), not overdue
    const input: DeadlineInput = {
      entity: makeEntity(),
      jurisdiction: makeJurisdiction(),
      fiscalYear: 2025,
      referenceDate: REF_DATE,
    }

    const results = calculateDeadlines(input)
    const annualFiling = results.find(r => r.requirementType === 'annual_filing')

    // 110 days away, 30-day grace -> definitely not overdue
    expect(annualFiling!.isOverdue).toBe(false)

    // Now test with a date well past due + grace
    const lateDateInput: DeadlineInput = {
      entity: makeEntity(),
      jurisdiction: makeJurisdiction(),
      fiscalYear: 2025,
      referenceDate: new Date('2026-08-15T00:00:00Z'), // 45 days past July 1
    }

    const lateResults = calculateDeadlines(lateDateInput)
    const lateFiling = lateResults.find(r => r.requirementType === 'annual_filing')

    // 45 days past due, grace=30. daysUntilDue = -45, overdue since -45 < -30
    expect(lateFiling!.isOverdue).toBe(true)
    expect(lateFiling!.daysUntilDue).toBeLessThan(0)

    // Test within grace period: 20 days past due date
    const graceInput: DeadlineInput = {
      entity: makeEntity(),
      jurisdiction: makeJurisdiction(),
      fiscalYear: 2025,
      referenceDate: new Date('2026-07-21T00:00:00Z'), // 20 days past July 1
    }

    const graceResults = calculateDeadlines(graceInput)
    const graceFiling = graceResults.find(r => r.requirementType === 'annual_filing')

    // 20 days past due, grace=30. daysUntilDue = -20, NOT overdue since -20 > -30
    expect(graceFiling!.isOverdue).toBe(false)
    expect(graceFiling!.daysUntilDue).toBeLessThan(0)
  })

  it('uses agent_renewal_month for agent_renewal deadline', () => {
    const input: DeadlineInput = {
      entity: makeEntity(),
      jurisdiction: makeJurisdiction(),
      fiscalYear: 2025,
      referenceDate: REF_DATE,
    }

    const results = calculateDeadlines(input)
    const agentRenewal = results.find(r => r.requirementType === 'agent_renewal')

    expect(agentRenewal).toBeDefined()
    // agent_renewal_month=3, referenceDate is March 2026
    // Agent renewal date: entity has renewal_date '2026-03-15'
    // So due date should be March 15, 2026 (from entity's registered_agent.renewal_date)
    expect(agentRenewal!.dueDate.getMonth()).toBe(2) // March = month index 2
  })

  it('returns negative daysUntilDue for past-due dates', () => {
    const jpEntity = makeEntity({
      id: 'ent-jp-001',
      name: 'Hopae KK',
      jurisdiction_id: 'jur-jp',
      status: 'active',
      registered_agent: {},
    })
    const jpJurisdiction = makeJurisdiction({
      id: 'jur-jp',
      country_code: 'JP',
      country_name: 'Japan',
      filing_rules: {
        annual_filing_month: 5,
        tax_deadline_doy: 151,
        agent_renewal_month: 4,
        fiscal_year_end_month: 3,
        fiscal_year_end_day: 31,
        grace_period_days: 14,
      },
    })

    const input: DeadlineInput = {
      entity: jpEntity,
      jurisdiction: jpJurisdiction,
      fiscalYear: 2025,
      referenceDate: REF_DATE, // 2026-03-13
    }

    const results = calculateDeadlines(input)

    // JP FY2025: annual_filing due 2025-05-01
    // ref date 2026-03-13 -> 316 days past due
    const annualFiling = results.find(r => r.requirementType === 'annual_filing')
    expect(annualFiling!.daysUntilDue).toBeLessThan(0)
  })

  it('returns empty array for dissolved entities', () => {
    const input: DeadlineInput = {
      entity: makeEntity({ status: 'dissolved' }),
      jurisdiction: makeJurisdiction(),
      fiscalYear: 2025,
      referenceDate: REF_DATE,
    }

    const results = calculateDeadlines(input)
    expect(results).toEqual([])
  })
})
