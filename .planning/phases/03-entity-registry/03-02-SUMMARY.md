---
phase: 03-entity-registry
plan: 02
subsystem: ui
tags: [tanstack-table, faceted-filter, search, popover, command]

requires:
  - phase: 03-entity-registry
    provides: EntityDataTable with TanStack Table instance and column filterFns
provides:
  - Reusable DataTableFacetedFilter component for checkbox popover filtering
  - DataTableToolbar with search input and 4 faceted filter buttons
  - Global filter function searching by entity name and legal name
  - Reset button to clear all filters
affects: [04-entity-detail]

tech-stack:
  added: []
  patterns: [faceted-filter-popover-with-cmdk, global-filter-on-name-and-legal-name]

key-files:
  created:
    - src/components/entities/data-table-faceted-filter.tsx
    - src/components/entities/data-table-toolbar.tsx
  modified:
    - src/components/entities/entity-data-table.tsx
    - src/lib/db/types.ts
    - scripts/seed.ts

key-decisions:
  - "Used base-ui Popover open/onOpenChange pattern (not Radix) for filter popover state"
  - "Derived jurisdiction and type filter options from getFacetedUniqueValues() rather than hardcoding"

patterns-established:
  - "Faceted filter pattern: Popover > Command > CommandItem with checkbox toggle and faceted count"
  - "Global filter searches across name + legal_name for fuzzy entity lookup"

requirements-completed: [ENTY-05]

duration: 3min
completed: 2026-03-13
---

# Phase 3 Plan 02: Faceted Filtering and Search Summary

**Four faceted filter popovers (jurisdiction, status, risk, type) with real-time name search and active filter badges on entity registry table**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-13T06:50:37Z
- **Completed:** 2026-03-13T06:53:39Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Built reusable DataTableFacetedFilter component with popover, cmdk search within options, checkbox toggle, and faceted value counts
- Built DataTableToolbar with search input (filters by name and legal_name) and 4 faceted filter buttons with color-coded risk icons
- Wired toolbar into EntityDataTable, showing filtered count ("X of 63 entities")
- Reset button clears all column filters and global search

## Task Commits

1. **Task 1: Create faceted filter component and toolbar** - `4a288d8` (feat)
2. **Task 2: Wire toolbar into entity data table** - `492e63f` (feat)

## Files Created/Modified
- `src/components/entities/data-table-faceted-filter.tsx` - Reusable faceted filter with popover, checkbox, and counts
- `src/components/entities/data-table-toolbar.tsx` - Toolbar with search input, 4 filter buttons, reset
- `src/components/entities/entity-data-table.tsx` - Added toolbar rendering above table
- `src/lib/db/types.ts` - Added missing FilingRules fields for compliance engine compatibility
- `scripts/seed.ts` - Fixed Set type annotations for TypeScript strict mode

## Decisions Made
- Used base-ui Popover open/onOpenChange pattern (consistent with project's shadcn v2 setup)
- Jurisdiction and entity type filter options auto-derived from data via getFacetedUniqueValues, while status and risk options are predefined with labels

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing TypeScript errors in scripts/seed.ts**
- **Found during:** Task 2 (build verification)
- **Issue:** Set literals inferred narrow types, causing type error when comparing with string entity IDs
- **Fix:** Added explicit `Set<string>` type annotations to DISSOLVING_IDS, DRAFT_IDS, EXPIRED_IDS
- **Files modified:** scripts/seed.ts
- **Committed in:** 492e63f

**2. [Rule 3 - Blocking] Added missing FilingRules type fields**
- **Found during:** Task 2 (build verification)
- **Issue:** compliance-engine/deadline-calculator.ts accessed fiscal_year_end_month, fiscal_year_end_day, grace_period_days via index signature returning unknown
- **Fix:** Added explicit optional number fields to FilingRules interface
- **Files modified:** src/lib/db/types.ts
- **Committed in:** 492e63f

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes required for build to pass. No scope creep.

## Issues Encountered
None beyond the auto-fixed blocking issues.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Entity registry fully interactive with search + 4 faceted filters + sorting
- Entity rows clickable (navigating to /entities/[id] which is Phase 4)
- Phase 4 builds the entity detail page that these rows link to

---
*Phase: 03-entity-registry*
*Completed: 2026-03-13*
