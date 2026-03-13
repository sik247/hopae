# Phase 6: Compliance UI — Research

**Discovery Level:** 0 (Skip)

All work follows established codebase patterns. No new external dependencies needed.

## Stack Already Available

- **UI Components:** shadcn/ui (Card, Badge, Table, etc.) already installed
- **Date Formatting:** `date-fns` v4 already in package.json
- **Data Fetching:** Supabase server client (`createClient()`) pattern established in entities page
- **Compliance Engine:** Pure TypeScript functions (`calculateDeadlines`, `scoreEntityRisk`, `aggregateAlerts`) ready in `src/lib/compliance-engine/`
- **Color Coding:** Red/amber/green pattern established in `StatusBadge` and `RiskBadge` components
- **Table Pattern:** TanStack Table with faceted filters established in entity registry

## Architecture Decisions

### Calendar View
Use a simple month-grid calendar built with `date-fns` and Tailwind — no external calendar library needed. The calendar shows deadline dots color-coded by urgency. Clicking a day shows the deadlines for that day in a side panel or below the calendar.

### Data Flow
Server Components fetch entities + jurisdictions from Supabase, compute deadlines/risk scores via the compliance engine, and pass results to client components for interactivity (calendar navigation, filtering).

### Alert Feed
Reuses `aggregateAlerts()` from the compliance engine. The feed is a simple ranked list of `AlertItem` objects rendered as cards with urgency color coding.

### Per-Entity Compliance Tab
Will be built in this phase as a standalone component. Phase 4 (Entity Detail) will integrate it when it adds the tabbed detail page. The component receives an entity + jurisdiction and renders the obligation timeline.

## No External Dependencies Needed

Everything builds on existing patterns and installed packages.
