import { describe, it, expect } from 'vitest'
import { aggregateAlerts } from './alert-aggregator'
import type { EntityRiskScore, DeadlineResult } from './types'
import type { EntityScoreWithContext } from './alert-aggregator'

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

function makeScoreWithContext(
  overrides: Partial<EntityRiskScore> & { entityId?: string; entityName?: string } = {},
  context: { legalName?: string; countryCode?: string; countryName?: string } = {},
): EntityScoreWithContext {
  const entityId = overrides.entityId ?? 'ent-001'
  const entityName = overrides.entityName ?? 'Test Entity'
  return {
    score: {
      entityId,
      entityName,
      riskLevel: 'ok',
      overdue: [],
      dueSoon: [],
      compliant: [],
      isDissolving: false,
      ...overrides,
    },
    entity: {
      id: entityId,
      name: entityName,
      legalName: context.legalName ?? 'Test Entity LLC',
    },
    jurisdiction: {
      countryCode: context.countryCode ?? 'US',
      countryName: context.countryName ?? 'United States',
    },
  }
}

describe('aggregateAlerts', () => {
  it('includes alerts from critical and warning entities, excludes ok entities', () => {
    const scores: EntityScoreWithContext[] = [
      makeScoreWithContext({
        entityId: 'ent-critical',
        entityName: 'Critical Corp',
        riskLevel: 'critical',
        overdue: [makeDeadline({ isOverdue: true, daysUntilDue: -45 })],
      }),
      makeScoreWithContext({
        entityId: 'ent-warning',
        entityName: 'Warning Inc',
        riskLevel: 'warning',
        dueSoon: [makeDeadline({ isDueSoon: true, daysUntilDue: 10 })],
        compliant: [makeDeadline({ requirementType: 'tax_return', daysUntilDue: 200 })],
      }),
      makeScoreWithContext({
        entityId: 'ent-ok',
        entityName: 'Ok Ltd',
        riskLevel: 'ok',
        compliant: [makeDeadline({ daysUntilDue: 300 })],
      }),
    ]

    const alerts = aggregateAlerts(scores)

    // Should have alerts from critical (1 overdue) and warning (1 due_soon) only
    expect(alerts).toHaveLength(2)
    const entityIds = alerts.map(a => a.entityId)
    expect(entityIds).toContain('ent-critical')
    expect(entityIds).toContain('ent-warning')
    expect(entityIds).not.toContain('ent-ok')
  })

  it('sorts overdue alerts before due_soon alerts', () => {
    const scores: EntityScoreWithContext[] = [
      makeScoreWithContext({
        entityId: 'ent-warning',
        entityName: 'Warning Inc',
        riskLevel: 'warning',
        dueSoon: [makeDeadline({ isDueSoon: true, daysUntilDue: 10 })],
      }),
      makeScoreWithContext({
        entityId: 'ent-critical',
        entityName: 'Critical Corp',
        riskLevel: 'critical',
        overdue: [makeDeadline({ isOverdue: true, daysUntilDue: -20 })],
      }),
    ]

    const alerts = aggregateAlerts(scores)

    expect(alerts[0].alertType).toBe('overdue')
    expect(alerts[0].entityId).toBe('ent-critical')
    expect(alerts[1].alertType).toBe('due_soon')
    expect(alerts[1].entityId).toBe('ent-warning')
  })

  it('sorts two overdue alerts by daysUntilDue ascending (most overdue first)', () => {
    const scores: EntityScoreWithContext[] = [
      makeScoreWithContext({
        entityId: 'ent-1',
        entityName: 'Less Overdue',
        riskLevel: 'critical',
        overdue: [makeDeadline({ isOverdue: true, daysUntilDue: -10 })],
      }),
      makeScoreWithContext({
        entityId: 'ent-2',
        entityName: 'More Overdue',
        riskLevel: 'critical',
        overdue: [makeDeadline({ isOverdue: true, daysUntilDue: -45 })],
      }),
    ]

    const alerts = aggregateAlerts(scores)

    expect(alerts[0].entityId).toBe('ent-2') // -45 first (most overdue)
    expect(alerts[1].entityId).toBe('ent-1') // -10 second
  })

  it('produces at_risk alert for dissolving entity with no overdue deadlines', () => {
    const scores: EntityScoreWithContext[] = [
      makeScoreWithContext({
        entityId: 'ent-dissolving',
        entityName: 'Dissolving GmbH',
        riskLevel: 'critical',
        isDissolving: true,
        compliant: [makeDeadline({ daysUntilDue: 100 })],
      }),
    ]

    const alerts = aggregateAlerts(scores)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].alertType).toBe('at_risk')
    expect(alerts[0].entityId).toBe('ent-dissolving')
    expect(alerts[0].message).toContain('dissolving')
  })

  it('returns empty array for empty entity scores', () => {
    const alerts = aggregateAlerts([])
    expect(alerts).toEqual([])
  })

  it('generates human-readable messages with formatted requirement types', () => {
    const scores: EntityScoreWithContext[] = [
      makeScoreWithContext({
        entityId: 'ent-1',
        entityName: 'Test Corp',
        riskLevel: 'critical',
        overdue: [makeDeadline({
          requirementType: 'annual_filing',
          isOverdue: true,
          daysUntilDue: -41,
          fiscalYear: 2025,
        })],
        dueSoon: [makeDeadline({
          requirementType: 'tax_return',
          isDueSoon: true,
          daysUntilDue: 15,
          fiscalYear: 2025,
        })],
      }),
    ]

    const alerts = aggregateAlerts(scores)

    const overdueAlert = alerts.find(a => a.alertType === 'overdue')
    expect(overdueAlert!.message).toContain('Annual filing')
    expect(overdueAlert!.message).toContain('FY2025')
    expect(overdueAlert!.message).toContain('41 days overdue')

    const dueSoonAlert = alerts.find(a => a.alertType === 'due_soon')
    expect(dueSoonAlert!.message).toContain('Tax return')
    expect(dueSoonAlert!.message).toContain('15 days')
  })
})
