---
phase: 06-compliance-ui
plan: 02
subsystem: ui
tags: [next.js, compliance, risk-dashboard, timeline, tailwind]

requires:
  - phase: 05-compliance-engine
    provides: "EntityRiskScore, DeadlineResult types and scoring functions"
  - phase: 06-compliance-ui-01
    provides: "compute-all.ts, CompliancePageClient tab system, serialized types"
provides:
  - "Risk dashboard with ranked entities by risk level"
  - "Per-entity compliance timeline with obligation statuses"
  - "Three-tab compliance page (Calendar, Risk Dashboard, Alerts)"
affects: [07-dashboard]

tech-stack:
  added: []
  patterns: ["Vertical timeline with colored dots", "Click-to-expand entity detail"]

key-files:
  created:
    - src/components/compliance/risk-dashboard.tsx
    - src/components/compliance/risk-entity-row.tsx
    - src/components/compliance/entity-compliance-timeline.tsx
    - src/components/compliance/timeline-item.tsx
  modified:
    - src/components/compliance/compliance-page-client.tsx
    - src/app/compliance/page.tsx

key-decisions:
  - "Risk dashboard uses click-to-expand pattern: clicking an entity shows its timeline below the dashboard"
  - "Timeline items sorted by dueDate ascending for chronological obligation view"
  - "Used explicit SerializedEntityScoreWithContext types for proper type checking at server/client boundary"

patterns-established:
  - "Click-to-expand entity detail: select entity in list, show detail panel below"
  - "Vertical timeline with colored dots: red=overdue, amber=dueSoon, green=compliant"

requirements-completed: [COMP-04, COMP-05]

duration: 2min
completed: 2026-03-13
---

# Phase 6 Plan 2: Risk Dashboard and Entity Timeline Summary

**Risk dashboard with ranked entities by risk level and click-to-expand compliance timeline per entity**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-13T07:08:25Z
- **Completed:** 2026-03-13T07:10:31Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Risk dashboard with summary badges (N critical, N warning, N compliant) and scrollable entity list
- Per-entity compliance timeline with vertical line, colored dots, and obligation status text
- Three-tab compliance page: Calendar, Risk Dashboard, Alerts with instant client-side switching
- Properly typed serialization at server/client boundary

## Task Commits

Each task was committed atomically:

1. **Task 1: Build risk dashboard and entity timeline components** - `8210ec4` (feat)
2. **Task 2: Integrate risk dashboard and timeline into compliance page** - `68e2f85` (feat)

## Files Created/Modified
- `src/components/compliance/risk-dashboard.tsx` - Ranked entity list with summary badges and click-to-expand timeline
- `src/components/compliance/risk-entity-row.tsx` - Entity row with risk-level border and overdue/due-soon counts
- `src/components/compliance/entity-compliance-timeline.tsx` - Vertical timeline card for entity obligations
- `src/components/compliance/timeline-item.tsx` - Individual obligation with colored dot and status text
- `src/components/compliance/compliance-page-client.tsx` - Updated with Risk Dashboard tab
- `src/app/compliance/page.tsx` - Fixed serialization with explicit return types

## Decisions Made
- Click-to-expand pattern for entity timeline (click entity row to show timeline below dashboard)
- Explicit return type annotations on serialization functions for type safety
- Single computeAllComplianceData() call serves all three tabs (no duplicate DB fetches)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed serialization type annotations**
- **Found during:** Task 2
- **Issue:** ReturnType<typeof serializeDeadline & ...> generic didn't resolve correctly, causing TS2322 error
- **Fix:** Used explicit return type annotations (SerializedDeadlineWithContext[], etc.) on serialization functions
- **Files modified:** src/app/compliance/page.tsx
- **Committed in:** 68e2f85

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type fix necessary for correctness. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete compliance UI with Calendar, Risk Dashboard, and Alerts tabs
- All compliance engine data surfaced through interactive UI components
- Ready for Phase 7 (Dashboard) integration

---
*Phase: 06-compliance-ui*
*Completed: 2026-03-13*
