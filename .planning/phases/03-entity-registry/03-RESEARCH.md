# Phase 03 Research: Entity Registry

**Domain:** TanStack Table v8 + shadcn DataTable for dense entity registry
**Researched:** 2026-03-13
**Confidence:** HIGH — patterns verified in STACK.md research, shadcn docs, TanStack Table v8 docs

---

## Discovery Level: 1 (Quick Verification)

TanStack Table v8 is already recommended in STACK.md. shadcn/ui DataTable pattern is the standard approach. No new libraries to evaluate — just confirming integration patterns.

---

## Key Technical Decisions

### 1. Data Source: `entity_health_summary` View

The SQL view already exists in the schema and provides exactly the columns needed:
- `id`, `name`, `legal_name`, `entity_type`, `entity_purpose`, `status`
- `incorporation_date`, `country_code`, `country_name`
- `overdue_count`, `due_soon_count`, `open_requirements`, `risk_level`

This means the Server Component can do a single `SELECT *` from the view — no joins needed at the application layer.

### 2. TanStack Table v8 Pattern

**Not currently installed.** Must `npm install @tanstack/react-table` and `npx shadcn@latest add table` before building.

TanStack Table v8 is headless — it provides the logic (sorting, filtering, pagination, column visibility) and we render with shadcn `<Table>` primitives.

**Key v8 APIs needed:**
- `useReactTable` — core hook
- `getCoreRowModel` — base row rendering
- `getFilteredRowModel` — client-side filtering (fine for 63 rows)
- `getSortedRowModel` — client-side sorting
- `getFacetedRowModel` + `getFacetedUniqueValues` — for faceted filter counts
- `ColumnDef<T>` — typed column definitions
- `flexRender` — render cells

### 3. Client-Side Filtering (Not Server-Side)

With only 63 entities, client-side filtering is the correct approach:
- No pagination needed (all rows fit in one view for enterprise density)
- Instant filter response (no round-trip)
- Search, faceted filters, and sorting all operate on the in-memory dataset
- Server Component fetches all data once, passes to Client Component

### 4. Faceted Filters Pattern

shadcn DataTable example uses a `DataTableFacetedFilter` component pattern:
- Popover with checkbox list for each facet
- Badge showing selected count
- Uses `column.getFacetedUniqueValues()` to get value counts
- Facets needed: jurisdiction (country_name), status, risk_level, entity_type

### 5. Color-Coded Badges

Map risk_level and status to badge colors:
- `risk_level: 'critical'` → red/destructive badge ("At Risk")
- `risk_level: 'warning'` → amber/yellow badge ("Due Soon")
- `risk_level: 'ok'` → green badge ("Compliant")
- `status: 'active'` → default badge
- `status: 'dormant'` → secondary/muted badge
- `status: 'dissolving'` → destructive badge

Since shadcn Badge only has `default`, `secondary`, `destructive`, `outline` variants, custom color classes via Tailwind are needed for amber/green.

### 6. Row Click Navigation

Each row should be clickable, navigating to `/entities/[id]`. This is Phase 4's detail page — for now, the link target exists as a placeholder. Use `router.push()` on row click or wrap cells in `<Link>`.

---

## Architecture for This Phase

```
Server Component (app/entities/page.tsx)
  └── Fetches from entity_health_summary view via Supabase server client
  └── Passes data to Client Component

Client Component (components/entities/entity-data-table.tsx)
  └── "use client" — owns all interactive state
  └── useReactTable with column defs, filtering, sorting
  └── Renders DataTable with faceted filter toolbar

Supporting:
  components/entities/columns.tsx          — ColumnDef[] with typed accessors
  components/entities/data-table-toolbar.tsx — Search + faceted filters
  components/entities/data-table-faceted-filter.tsx — Reusable faceted popover
  components/entities/status-badge.tsx     — Color-coded status/risk badges
```

---

## What NOT to Build

- No server-side pagination (63 rows, client-side is correct)
- No column resizing (not needed for demo)
- No row selection / bulk actions (Phase 3 scope is read-only)
- No inline editing (read-only registry)
- No virtual scrolling (63 rows renders fine without it)

---

*Research for Phase 03: Entity Registry*
*Researched: 2026-03-13*
