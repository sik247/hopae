# Phase 5 Research: Compliance Engine

**Researched:** 2026-03-13
**Discovery Level:** 0 (Skip) — Pure internal TypeScript work using existing types and patterns. No new dependencies.

## Domain Analysis

### What the Compliance Engine Does

The compliance engine is a **pure TypeScript service layer** in `src/lib/compliance-engine/` that:

1. **Computes deadlines** — Given an entity + its jurisdiction's `filing_rules`, calculates concrete due dates for each obligation type (annual_filing, tax_return, agent_renewal)
2. **Scores risk** — Given computed deadlines and today's date, assigns a risk level per requirement and per entity
3. **Aggregates alerts** — Collects all at-risk/due-soon/overdue items across entities into a ranked, urgency-ordered list

### Key Constraint: No Database Calls

The engine receives data as function arguments and returns computed results. The caller (Route Handler, Server Action, or Server Component) is responsible for:
- Fetching entity + jurisdiction data from Supabase
- Passing it to the engine
- Persisting results if needed

This is already an established project decision (see STATE.md: "Compliance engine is pure TypeScript in `lib/compliance-engine/` — no DB calls inside it").

## Data Contracts (from existing codebase)

### Input: Filing Rules (from `jurisdictions.filing_rules` JSONB)

From seed data analysis, every jurisdiction has:

```typescript
{
  annual_filing_month: number    // Month (1-12) when annual filing is due
  tax_deadline_doy: number       // Day-of-year for tax return deadline
  agent_renewal_month: number    // Month when agent renewal is due
  fiscal_year_end_month: number  // FY end month (12 for most, 3 for JP/IN)
  fiscal_year_end_day: number    // FY end day (typically 31)
  grace_period_days: number      // Buffer days after theoretical deadline
  notes: string                  // Human-readable context
}
```

### Input: Entity (from `src/lib/db/types.ts`)

Key fields for compliance calculation:
- `id`, `name`, `legal_name` — identification
- `jurisdiction_id` — links to jurisdiction rules
- `incorporation_date` — needed for fiscal year calculation
- `status` — active/dormant/dissolving/dissolved (dissolving = at_risk)
- `registered_agent.renewal_date` — for agent renewal deadline

### Input: Compliance Requirements (already seeded)

From seed data: 155 requirements across 63 entities with types:
- `annual_filing` — annual accounts/financial statements
- `tax_return` — corporate income tax return
- `agent_renewal` — registered agent renewal

Statuses: `pending | in_progress | completed | overdue`

### Output: Risk Levels

From `src/lib/db/types.ts`:
- `RiskLevel = 'critical' | 'warning' | 'ok'`
- `AlertType = 'overdue' | 'due_soon' | 'at_risk' | 'info'`

Mapping to phase requirements:
- **overdue** = past due date (AlertType: 'overdue', RiskLevel: 'critical')
- **due_soon** = within 30 days (AlertType: 'due_soon', RiskLevel: 'warning')
- **at_risk** = entity is dissolving or has other risk factors (AlertType: 'at_risk', RiskLevel: 'critical')
- **compliant** = no issues (RiskLevel: 'ok')

## Architecture Decision

### Three modules, one index

```
src/lib/compliance-engine/
  index.ts                  — Re-exports all public functions + types
  types.ts                  — Engine-specific input/output types
  deadline-calculator.ts    — computeDeadlines(entity, jurisdiction, fiscalYear, referenceDate?) -> DeadlineResult[]
  risk-scorer.ts            — scoreEntityRisk(entity, deadlines, referenceDate?) -> EntityRiskScore
  alert-aggregator.ts       — aggregateAlerts(entityScores) -> Alert[] (sorted by urgency)
```

### Deadline Calculation Logic

For a given entity + jurisdiction + fiscal year:

1. **Annual filing**: `fiscal_year_end_month + annual_filing_month` months = deadline month, day 1. This represents "N months after FYE".
   - Example: JP has FYE=March, annual_filing_month=5 -> May filing deadline
   - Actually: `annual_filing_month` is the absolute calendar month of the deadline, not offset from FYE

2. **Tax return**: `tax_deadline_doy` is day-of-year for the tax deadline in the calendar year following FYE.
   - Example: LU has tax_deadline_doy=365 -> Dec 31 of following year

3. **Agent renewal**: `agent_renewal_month` is the calendar month when agent renewal is due.
   - Combined with entity's `registered_agent.renewal_date` if available

4. **Grace period**: `grace_period_days` added to the base deadline before marking as overdue.

### Risk Scoring Logic

Per requirement:
- `daysUntilDue < 0` -> overdue (critical)
- `daysUntilDue <= 30` -> due_soon (warning)
- Entity status is 'dissolving' -> at_risk regardless of deadlines

Per entity (aggregate):
- Any overdue -> critical
- Any due_soon -> warning
- Dissolving -> critical
- Otherwise -> ok

### Alert Aggregation Logic

1. Collect all entity risk scores
2. Filter to non-ok entities
3. Sort by urgency: overdue first, then due_soon, then at_risk
4. Within same urgency, sort by days until soonest deadline (ascending)
5. Return structured alert objects with entity context

## Testing Strategy

All three modules are pure functions with deterministic outputs given inputs. Ideal for unit testing with fixed reference dates.

Test approach: Pass a fixed `referenceDate` (default: `new Date()`) to all functions so tests can pin the date and get deterministic results.

---

*Research for Phase 5: Compliance Engine*
*Level 0 — No new dependencies, pure TypeScript computation*
