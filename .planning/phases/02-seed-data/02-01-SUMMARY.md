---
phase: 02-seed-data
plan: 01
subsystem: database
tags: [supabase, seed-data, tsx, dotenv, jurisdictions, entities, directors]

requires:
  - phase: 01-project-foundation
    provides: Database schema (jurisdictions, entities, directors tables), TypeScript types

provides:
  - Seed script infrastructure (scripts/seed.ts with npm run db:seed)
  - 23 jurisdictions with filing_rules JSONB (fiscal years, deadlines, grace periods)
  - 63 entities with correct hierarchy (HQ -> subsidiaries -> branches)
  - 116 directors with Luxembourg-appointed rotation and country-appropriate names
  - Deterministic UUIDs (IDS export) for cross-plan referencing

affects: [02-seed-data, 03-compliance-engine, 07-dashboard]

tech-stack:
  added: [tsx, dotenv]
  patterns: [deterministic UUID assignment, truncate-then-insert idempotent seeding, FK-safe insert ordering]

key-files:
  created:
    - scripts/seed.ts
  modified:
    - package.json
    - .env.example

key-decisions:
  - "Used 'branch' as entity_purpose value for branch entities despite TypeScript type not including it (SQL TEXT column accepts any string)"
  - "Moved supabase createClient inside main() to allow module-level imports without requiring env vars"
  - "116 directors (not 130) due to 2-per-subsidiary/customer + 1-per-branch formula being exact"

patterns-established:
  - "Deterministic ID format: a0000000-... for jurisdictions, b0000000-... for entities, c0000000-... for directors"
  - "daysFromSeed() helper for relative date arithmetic from SEED_DATE 2026-03-13"
  - "FK-safe insert order: jurisdictions -> HQ entity -> subsidiaries -> branches -> directors"

requirements-completed: [DATA-01, DATA-02, DATA-04, DATA-05]

duration: 9min
completed: 2026-03-13
---

# Phase 02 Plan 01: Seed Foundation Tables Summary

**Seed script with 23 jurisdictions (country-specific filing rules), 63 entities (HQ/subsidiary/branch hierarchy), and 116 directors (Luxembourg-appointed rotation pattern)**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-13T06:16:11Z
- **Completed:** 2026-03-13T06:26:10Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created idempotent seed script at scripts/seed.ts runnable via `npm run db:seed`
- 23 jurisdictions with complete filing_rules JSONB including fiscal year ends (JP: Mar 31, IN: Mar 31, AU: Jun 30)
- 63 entities with correct hierarchy: 1 HQ, 23 provider_key, 28 customer_entity, 11 branch
- 116 directors with Luxembourg-appointed rotation (Fontaine/Kessler/Schiltz) and country-appropriate names/roles
- 2 dissolving entities (Belgium Ghent Branch, Estonia Branch) with terminated directors

## Task Commits

Each task was committed atomically:

1. **Task 1: Setup seed infrastructure and seed jurisdictions + entities** - `8001ee8` (feat)
2. **Task 2: Seed directors for all 63 entities** - `7709f68` (feat)

## Files Created/Modified
- `scripts/seed.ts` - Complete seed script with jurisdictions, entities, directors (1439 lines)
- `package.json` - Added db:seed script, tsx and dotenv devDependencies
- `.env.example` - Added SUPABASE_SERVICE_ROLE_KEY placeholder

## Decisions Made
- Used 'branch' as entity_purpose for branch entities. The SQL schema uses TEXT (not enum), so this works despite the TypeScript EntityPurpose type only defining 'provider_key' | 'customer_entity' | 'hq'. The plan explicitly requires 11 branch-purpose entities.
- Moved createClient inside main() to prevent module-load crash when SUPABASE_URL is empty, enabling the script to be imported for validation without active credentials.
- Director count is 116 (not ~130): 3 HQ + 46 provider (23x2) + 56 customer (28x2) + 11 branch (11x1). The ~130 estimate in the plan was approximate.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Korean entity legal names using wrong Unicode characters**
- **Found during:** Task 1 (Entity data creation)
- **Issue:** Korean legal names used Chinese characters (主式会社) instead of Korean (주식회사)
- **Fix:** Replaced all Korean entity legal_name and entity_type fields with correct Hangul characters
- **Files modified:** scripts/seed.ts
- **Verification:** Confirmed correct Unicode output via Python3
- **Committed in:** 8001ee8 (Task 1 commit)

**2. [Rule 3 - Blocking] Deferred supabase client creation to main()**
- **Found during:** Task 1 (Script infrastructure)
- **Issue:** Top-level createClient crashes module load when env vars are empty, preventing any validation
- **Fix:** Moved createClient inside main() function
- **Files modified:** scripts/seed.ts
- **Verification:** Module parses without env vars set
- **Committed in:** 8001ee8 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- Supabase credentials not configured in .env.local (SUPABASE_SERVICE_ROLE_KEY missing, NEXT_PUBLIC_SUPABASE_URL empty). Script verified structurally but cannot run against database until credentials are provided. This is expected at this stage.

## User Setup Required
Before running `npm run db:seed`, the user must configure `.env.local` with:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (from Supabase dashboard > Settings > API)

## Next Phase Readiness
- Foundation tables (jurisdictions, entities, directors) ready for Plan 02 (compliance_requirements, intercompany_agreements, alerts)
- IDS export available for Plan 02 to reference entity/jurisdiction UUIDs
- Script is idempotent (truncates all tables before inserting)

---
*Phase: 02-seed-data*
*Completed: 2026-03-13*
