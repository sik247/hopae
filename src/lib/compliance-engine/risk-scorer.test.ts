import { describe, it, expect } from 'vitest'
import { scoreEntityRisk } from './risk-scorer'
import type { DeadlineResult } from './types'
import type { Entity } from '@/lib/db/types'

function makeEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'ent-001',
    name: 'Test Entity',
    legal_name: 'Test Entity LLC',
    entity_type: 'LLC',
    entity_purpose: 'customer_entity',
    jurisdiction_id: 'jur-us',
    parent_entity_id: null,
    incorporation_date: '2020-01-15',
    registration_number: 'REG123',
    status: 'active',
    banking_info: {},
    registered_agent: {},
    metadata: {},
    created_at: '2020-01-15T00:00:00Z',
    updated_at: '2020-01-15T00:00:00Z',
    ...overrides,
  }
}

function makeDeadline(overrides: Partial<DeadlineResult> = {}): DeadlineResult {
  return {
    requirementType: 'annual_filing',
    dueDate: new Date('2026-07-01T00:00:00Z'),
    daysUntilDue: 110,
    isOverdue: false,
    isDueSoon: false,
    fiscalYear: 2025,
    ...overrides,
  }
}

describe('scoreEntityRisk', () => {
  it('returns critical for entity with 1 overdue deadline', () => {
    const entity = makeEntity()
    const deadlines = [
      makeDeadline({ isOverdue: true, daysUntilDue: -45 }),
      makeDeadline({ requirementType: 'tax_return', daysUntilDue: 90, isOverdue: false }),
    ]

    const score = scoreEntityRisk(entity, deadlines)

    expect(score.riskLevel).toBe('critical')
    expect(score.overdue).toHaveLength(1)
    expect(score.compliant).toHaveLength(1)
    expect(score.entityId).toBe('ent-001')
    expect(score.entityName).toBe('Test Entity')
  })

  it('returns warning for entity with 0 overdue but 2 due_soon', () => {
    const entity = makeEntity()
    const deadlines = [
      makeDeadline({ isDueSoon: true, daysUntilDue: 10 }),
      makeDeadline({ requirementType: 'tax_return', isDueSoon: true, daysUntilDue: 25 }),
    ]

    const score = scoreEntityRisk(entity, deadlines)

    expect(score.riskLevel).toBe('warning')
    expect(score.dueSoon).toHaveLength(2)
    expect(score.overdue).toHaveLength(0)
  })

  it('returns ok for entity with all compliant deadlines', () => {
    const entity = makeEntity()
    const deadlines = [
      makeDeadline({ daysUntilDue: 110 }),
      makeDeadline({ requirementType: 'tax_return', daysUntilDue: 200 }),
    ]

    const score = scoreEntityRisk(entity, deadlines)

    expect(score.riskLevel).toBe('ok')
    expect(score.compliant).toHaveLength(2)
    expect(score.overdue).toHaveLength(0)
    expect(score.dueSoon).toHaveLength(0)
  })

  it('returns critical for dissolving entity with no overdue', () => {
    const entity = makeEntity({ status: 'dissolving' })
    const deadlines = [
      makeDeadline({ daysUntilDue: 110 }),
    ]

    const score = scoreEntityRisk(entity, deadlines)

    expect(score.riskLevel).toBe('critical')
    expect(score.isDissolving).toBe(true)
    expect(score.overdue).toHaveLength(0)
  })

  it('returns ok for entity with no deadlines at all', () => {
    const entity = makeEntity()
    const deadlines: DeadlineResult[] = []

    const score = scoreEntityRisk(entity, deadlines)

    expect(score.riskLevel).toBe('ok')
    expect(score.overdue).toHaveLength(0)
    expect(score.dueSoon).toHaveLength(0)
    expect(score.compliant).toHaveLength(0)
    expect(score.isDissolving).toBe(false)
  })
})
