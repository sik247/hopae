---
phase: 02-seed-data
plan: 02
subsystem: database
tags: [supabase, seed-data, tsx, compliance, alerts, intercompany-agreements, validation]

requires:
  - phase: 02-seed-data
    provides: Seed script infrastructure, 23 jurisdictions, 63 entities, 116 directors, deterministic IDs

provides:
  - 155 compliance requirements with dramatic tension (3 overdue, 5+ due-soon, completed history)
  - 62 intercompany agreements (every non-HQ entity linked to Luxembourg HQ)
  - 11 alerts driving dashboard red-badge count (3 overdue, 6 due_soon, 2 at_risk)
  - Post-seed validation script (14 checks covering all DATA requirements)
  - Complete seed script populating all 7 tables

affects: [03-compliance-engine, 07-dashboard, 08-ai-document-drafter]

tech-stack:
  added: []
  patterns: [compliance requirement per-entity per-type generation, agreement type distribution across entity purposes, alert-to-requirement referencing by deterministic ID]

key-files:
  created:
    - scripts/validate-seed.ts
  modified:
    - scripts/seed.ts
    - package.json

key-decisions:
  - "155 compliance requirements (not exactly 150) for natural per-entity distribution with 3 types per entity"
  - "11 alerts total (not minimum 10) — added extra due_soon alert for IN_HDFC to strengthen demo data"
  - "Agreement type distribution: all 23 providers get service_agreement, branches get data_processing, customers split across ip_license/management_fee/loan_agreement"

patterns-established:
  - "Compliance requirement ID format: d0000000-... with sequential counter"
  - "Agreement ID format: e0000000-... with sequential counter"
  - "Alert ID format: f0000000-... with sequential counter"
  - "Alerts reference compliance requirements by deterministic ID for cross-table traceability"

requirements-completed: [DATA-01, DATA-02, DATA-03, DATA-04, DATA-05]

duration: 6min
completed: 2026-03-13
---

# Phase 02 Plan 02: Seed Compliance Data Summary

**155 compliance requirements with dramatic tension (3 overdue, 5 due-soon), 62 intercompany agreements, 11 alerts, and 14-check validation script covering all DATA requirements**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-13T06:29:25Z
- **Completed:** 2026-03-13T06:35:25Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- 155 compliance requirements across all 63 entities: 3 overdue (BR/PL/BE), 5+ due-soon (KR/PL/IN/FI/KR_KB), ~130 pending/completed
- 62 intercompany agreements with correct type distribution (23 service, 15 ip_license, 10 management_fee, 3 loan, 11 data_processing)
- 11 unresolved alerts for dashboard display: overdue, due_soon, and at_risk for dissolving entities
- Post-seed validation script with 14 checks covering all 5 DATA requirements

## Task Commits

Each task was committed atomically:

1. **Task 1: Seed compliance requirements and intercompany agreements** - `746e6af` (feat)
2. **Task 2: Seed alerts and create validation script** - `29eaedd` (feat)

## Files Created/Modified
- `scripts/seed.ts` - Extended with compliance_requirements (155), intercompany_agreements (62), alerts (11) arrays and inserts (2266 lines total)
- `scripts/validate-seed.ts` - Post-seed validation with 14 checks across all DATA requirements (204 lines)
- `package.json` - Added db:validate script

## Decisions Made
- 155 compliance requirements total: natural distribution of 2-3 requirement types per entity plus completed FY2024 history items, exceeding the 150 minimum target
- 11 alerts (1 extra due_soon for IN_HDFC) to provide richer demo data for the dashboard
- Agreement type distribution follows RESEARCH.md: all providers get service_agreement, branches get data_processing, customers distributed across ip_license (15), management_fee (10), and loan_agreement (3)
- Dissolving entities (BE Ghent, EE Tallinn) get 'expired' agreement status and at_risk alerts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Supabase credentials not configured in .env.local (same as Plan 01). Script verified structurally but cannot run against database until credentials are provided. This is expected at this stage.

## User Setup Required
Before running `npm run db:seed` and `npm run db:validate`, configure `.env.local` with:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key

## Next Phase Readiness
- All 7 tables have seed data ready: jurisdictions, entities, directors, compliance_requirements, intercompany_agreements, alerts (documents seeded later)
- Compliance engine (Phase 3) can now operate on realistic entity data with overdue/due-soon/healthy status distribution
- Dashboard (Phase 7) has 11 unresolved alerts ready for display
- IDS export provides deterministic UUIDs for cross-phase referencing

---
*Phase: 02-seed-data*
*Completed: 2026-03-13*
