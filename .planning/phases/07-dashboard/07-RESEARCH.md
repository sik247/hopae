# Phase 7: Dashboard — Research

**Discovery Level:** 1 (Quick Verification)

## Stack Already Available

- **UI Components:** shadcn/ui Card for summary cards, already installed
- **Data:** Supabase `entity_health_summary` view provides aggregated counts
- **Compliance Engine:** `aggregateAlerts()` provides ranked urgent action items
- **Color Coding:** Red/amber/green patterns from Phase 3 entity registry
- **Icons:** lucide-react for dashboard iconography

## Architecture Decisions

### Summary Cards
Four stat cards (Total Entities, At Risk, Overdue, Upcoming) using shadcn Card. Server Component fetches from `entity_health_summary` and aggregates counts.

### Jurisdiction Risk Heatmap
A grid of country cells (not a geographic map — too heavy for demo). Each cell shows flag + country name + risk indicator with background color intensity based on worst-risk entity in that jurisdiction. Uses the same `countryFlag()` helper from entity columns.

### AI Compliance Briefing
Call Gemini via server-side Route Handler (`/api/ai/briefing`) to generate a natural language summary from the compliance data. The prompt includes: overdue count, due-soon count, top risk jurisdictions, dissolving entities. Streamed response displayed in a Card. Falls back to a static template if Gemini unavailable.

### Urgent Action Items
Top 5 from `aggregateAlerts()`, rendered as a list with entity name, obligation type, days until/past due, and a Link to `/entities/[id]` (or `/compliance` until entity detail exists).

## Dependencies

- `@google/genai` 1.45.0 — already specified in project decisions for AI features. Will need to be installed for the briefing feature.
- No other new dependencies.
