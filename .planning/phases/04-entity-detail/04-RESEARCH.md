# Phase 4: Entity Detail — Research

**Phase:** 04-entity-detail
**Researched:** 2026-03-13
**Discovery Level:** 0 (Skip) — All work follows established codebase patterns

## Technical Decisions

### 1. Dynamic Route Structure

Use `/entities/[id]/page.tsx` as a Server Component that fetches entity data and renders a tabbed detail page. No nested routes for tabs — use client-side tab switching within a single page to avoid extra navigation round-trips.

### 2. Tabbed Interface

Install shadcn Tabs component (`npx shadcn@latest add tabs`). Four tabs: Overview, Compliance, Documents, Agreements. Tabs are client components; outer page is a Server Component that fetches all data upfront.

**Why fetch all tab data upfront (not per-tab lazy loading):** At 60 entities with modest per-entity data (3-5 directors, 1-3 agreements, 5-10 compliance items), the total payload per entity is small. Lazy loading adds complexity for no measurable benefit in this demo. The architecture note about per-tab Suspense boundaries is good advice for production but overkill for a 5-hour demo build.

### 3. Org Hierarchy Tree

Simple recursive tree view using Tailwind indentation — no D3, no external tree library. Fetch all entities once, build parent-child map in memory, render recursively. The hierarchy is at most 3 levels deep (HQ -> subsidiary -> branch).

Data shape from seed: `parent_entity_id` links to parent. HQ has `null` parent. Subsidiaries point to HQ. Branches point to their parent subsidiary.

### 4. Data Fetching Pattern

Follow established pattern from Phase 1: `createClient()` from `@/lib/supabase/server` in Server Components. Queries join related tables using Supabase's `select('*, relation(*)')` syntax.

### 5. Component Organization

New components go in `src/components/entities/`:
- `entity-detail-tabs.tsx` — Client component with tab switching
- `entity-overview.tsx` — Directors, banking, registered agent display
- `entity-hierarchy.tsx` — Org tree component
- `entity-agreements.tsx` — Intercompany agreements table

### 6. Existing Types

All needed types already exist in `src/lib/db/types.ts`:
- `Entity`, `Director`, `IntercompanyAgreement`, `ComplianceRequirement`
- `BankingInfo`, `RegisteredAgent`, `AgreementParty`
- `EntityStatus`, `EntityPurpose`, `AgreementStatus`, `ComplianceStatus`

No new types needed.

## Dependencies

- **shadcn Tabs:** Must be installed (`npx shadcn@latest add tabs` and `npx shadcn@latest add table`)
- **Phase 3 (Entity Registry):** Phase 4 assumes entity list exists with clickable rows linking to `/entities/[id]`. If Phase 3 is not yet executed, the detail page still works via direct URL navigation.

## Risk Assessment

- **Low risk:** All patterns established in Phase 1/2. No external services. No new libraries beyond shadcn components.
- **Hierarchy data correctness:** Seed data has deterministic parent_entity_id chains — query verified in seed.ts.

---
*Research for Phase 04: Entity Detail*
