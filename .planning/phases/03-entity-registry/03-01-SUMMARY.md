---
phase: 03-entity-registry
plan: 01
subsystem: ui
tags: [tanstack-table, shadcn, react, supabase, badges]

requires:
  - phase: 02-seed-data
    provides: entity_health_summary view with 63 entities
provides:
  - Dense TanStack Table rendering all entities with sortable columns
  - Color-coded StatusBadge and RiskBadge components
  - EntityDataTable client component with sorting, filtering hooks ready
  - Server page fetching from entity_health_summary view
affects: [03-entity-registry, 04-entity-detail]

tech-stack:
  added: ["@tanstack/react-table v8", "date-fns", "shadcn table/popover/command/select"]
  patterns: [headless-table-with-shadcn-primitives, server-component-data-fetch-to-client-table]

key-files:
  created:
    - src/components/entities/status-badge.tsx
    - src/components/entities/columns.tsx
    - src/components/entities/entity-data-table.tsx
    - src/components/ui/table.tsx
    - src/components/ui/popover.tsx
    - src/components/ui/command.tsx
    - src/components/ui/select.tsx
  modified:
    - src/app/entities/page.tsx
    - package.json

key-decisions:
  - "Used custom Tailwind classes for green/amber badges since shadcn Badge only has default/secondary/destructive/outline variants"
  - "Inline filterFn on each filterable column rather than global filterFns registry for simpler Plan 02 integration"
  - "Country flag emoji via Unicode regional indicator conversion (no external library)"

patterns-established:
  - "Server Component fetches from Supabase view, passes typed array to Client Component for TanStack Table"
  - "Badge color override pattern: use Badge variant + className for custom colors"

requirements-completed: [ENTY-01]

duration: 2min
completed: 2026-03-13
---

# Phase 3 Plan 01: Entity Registry Table Summary

**Dense TanStack Table with 8 sortable columns, color-coded status/risk badges, and server-side data fetch from entity_health_summary view**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-13T06:47:00Z
- **Completed:** 2026-03-13T06:49:16Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Installed TanStack Table v8 and shadcn table/popover/command/select primitives
- Built 8-column entity table with name, jurisdiction (flag emoji), type, status badge, risk badge, incorporation date, overdue count, due-soon count
- Color-coded StatusBadge (active=green, dormant=gray, dissolving=red, dissolved=muted) and RiskBadge (critical=red, warning=amber, ok=green)
- Server Component page fetches all entities from entity_health_summary view, client component renders sortable table with row click navigation

## Task Commits

1. **Task 1: Install TanStack Table and add shadcn components** - `1559662` (chore)
2. **Task 2: Build entity data table with columns, badges, and server fetch** - `b6f5a8f` (feat)

## Files Created/Modified
- `src/components/entities/status-badge.tsx` - StatusBadge and RiskBadge with color-coded variants
- `src/components/entities/columns.tsx` - 8 typed ColumnDef with sort headers and custom cells
- `src/components/entities/entity-data-table.tsx` - Client component with useReactTable, sorting, filtering, row click
- `src/app/entities/page.tsx` - Server Component fetching entity_health_summary from Supabase
- `src/components/ui/table.tsx` - shadcn Table primitives
- `src/components/ui/popover.tsx` - shadcn Popover (for Plan 02 filters)
- `src/components/ui/command.tsx` - shadcn Command (for Plan 02 filters)
- `src/components/ui/select.tsx` - shadcn Select (for Plan 02 filters)

## Decisions Made
- Used custom Tailwind classes for green/amber badges since shadcn Badge only has default/secondary/destructive/outline variants
- Placed filterFn directly on column definitions for simpler integration with faceted filters in Plan 02
- Used Unicode regional indicator math for country flag emoji instead of an external library

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Table renders with all columns and sorting ready
- Faceted filter model hooks (getFacetedRowModel, getFacetedUniqueValues) already initialized in table config
- Column filterFn functions already defined for the 4 filterable columns (country_name, status, risk_level, entity_type)
- Plan 02 adds toolbar with search input and faceted filter popovers

---
*Phase: 03-entity-registry*
*Completed: 2026-03-13*
