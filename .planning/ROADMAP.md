# Roadmap: Hopae Entity Management Platform

## Overview

From raw requirements to a reviewable 3-minute demo: the project builds an AI-native entity management platform in 11 phases, starting with the database schema and realistic seed data, then layering in entity views, the compliance engine, dashboards, AI document operations, external integrations, and finally hardening the demo path for Vercel deployment. Every phase delivers one coherent, verifiable capability before the next begins. The critical path is schema → data → entity hub → compliance engine → dashboard → AI pipeline, because AI output quality scales directly with entity data richness.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Project Foundation** - Next.js scaffold, Supabase schema, data model, and project structure (completed 2026-03-13)
- [x] **Phase 2: Seed Data** - 60+ realistic entities across 20+ jurisdictions with compliance rules and dramatic tension (completed 2026-03-13)
- [x] **Phase 3: Entity Registry** - Dense filterable entity list table (the core hub) (completed 2026-03-13)
- [x] **Phase 4: Entity Detail** - Per-entity profiles, org hierarchy, intercompany agreements (completed 2026-03-13)
- [x] **Phase 5: Compliance Engine** - Pure TypeScript deadline calculator, risk scorer, and alert aggregator (completed 2026-03-13)
- [x] **Phase 6: Compliance UI** - Calendar view, alert feed, per-entity compliance timeline (completed 2026-03-13)
- [x] **Phase 7: Dashboard** - Portfolio overview, jurisdiction risk heatmap, urgent action items (completed 2026-03-13)
- [x] **Phase 8: AI Drafting** - Gemini streaming drafts for compliance filings and intercompany agreements (completed 2026-03-13)
- [x] **Phase 9: AI Document Extraction + Signature Routing** - Upload, extract key data, route for signature (completed 2026-03-13)
- [x] **Phase 10: Integrations** - Notion and Google Drive connections inline within entity profiles (completed 2026-03-13)
- [x] **Phase 11: Polish + Demo Path** - End-to-end demo hardening, AI output caching, Vercel deployment (completed 2026-03-13)

## Phase Details

### Phase 1: Project Foundation
**Goal**: A running Next.js app with Supabase connected, complete database schema, and enterprise navigation shell
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01 (schema), DATA-02 (jurisdiction rule schema), DATA-05 (entity type/model design)
**Success Criteria** (what must be TRUE):
  1. `npm run dev` starts the app without errors and the enterprise sidebar navigation renders
  2. Supabase Postgres connection is live and all schema migrations run cleanly
  3. Entity, jurisdiction, compliance_rule, document, and intercompany_agreement tables exist with correct columns including `entity_type`, `parent_entity_id`, and `metadata` JSONB
  4. Environment variables for Supabase and Gemini are wired up and documented in `.env.example`
**Plans**: 2 plans
Plans:
- [x] 01-01-PLAN.md — Bootstrap Next.js, install deps, Supabase clients, SQL schema migration
- [x] 01-02-PLAN.md — Enterprise sidebar navigation shell, root layout, placeholder pages

### Phase 2: Seed Data
**Goal**: The database contains 60+ realistic entities across 20+ jurisdictions with compliance deadlines that tell a compelling story — some overdue, some urgent, some healthy
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05
**Success Criteria** (what must be TRUE):
  1. Running `npm run db:seed` populates 60+ entities with proper local legal names (Hopae KK, Hopae Pte. Ltd., Hopae GmbH, etc.) spanning 20+ jurisdictions
  2. Each entity has realistic directors, banking details, registered agent, and intercompany agreement with Luxembourg HQ
  3. Jurisdiction compliance rules exist for all 20+ represented countries with verified filing deadline logic (fixed-date and fiscal-year-relative)
  4. Compliance deadlines reflect dramatic tension: at least 3 overdue, at least 5 due within 30 days, at least 2 entities flagged dissolution risk
  5. Entity types include both subsidiaries and branches, and the parent_entity_id hierarchy correctly chains to Luxembourg HQ
**Plans**: 2 plans
Plans:
- [ ] 02-01-PLAN.md — Seed infrastructure, jurisdictions (23), entities (63), directors (~130)
- [ ] 02-02-PLAN.md — Compliance requirements, intercompany agreements, alerts, validation script

### Phase 3: Entity Registry
**Goal**: Users can see all 60+ entities in a dense, filterable table and understand portfolio status at a glance
**Depends on**: Phase 2
**Requirements**: ENTY-01, ENTY-05
**Success Criteria** (what must be TRUE):
  1. User sees a dense TanStack Table listing all 60+ entities with jurisdiction, status badge, entity type, and incorporation date visible without scrolling horizontally
  2. User can filter entities by jurisdiction, status, risk level, and entity type using faceted filter controls
  3. User can search entities by name and the table updates in real time
  4. Status and risk badges use color coding that immediately communicates urgency (red for at-risk, amber for due-soon, green for compliant)
**Plans**: 2 plans
Plans:
- [ ] 03-01-PLAN.md — Install TanStack Table, build dense data table with columns and color-coded badges
- [ ] 03-02-PLAN.md — Add faceted filter toolbar (jurisdiction, status, risk, type) and real-time name search

### Phase 4: Entity Detail
**Goal**: Users can drill into any entity and see its full profile — directors, banking, compliance status, hierarchy position, and intercompany agreements
**Depends on**: Phase 3
**Requirements**: ENTY-02, ENTY-03, ENTY-04
**Success Criteria** (what must be TRUE):
  1. User can click any entity in the registry and land on a tabbed detail page showing overview, compliance, documents, and agreements tabs
  2. The overview tab shows directors with roles and tenure dates, banking details, and registered agent information
  3. The org hierarchy view shows Luxembourg HQ as root with all subsidiaries/branches correctly nested, and user can click any node to navigate to that entity
  4. The agreements tab lists all intercompany agreements between the entity and Luxembourg HQ with parties, governing law, and effective date
**Plans**: 2 plans
Plans:
- [x] 04-01-PLAN.md — Entity detail page with tabbed interface, overview tab (directors, banking, registered agent)
- [x] 04-02-PLAN.md — Org hierarchy tree, intercompany agreements tab

### Phase 5: Compliance Engine
**Goal**: A pure TypeScript service that computes jurisdiction-specific deadlines, risk levels, and alerts from entity + rule data — no UI dependency
**Depends on**: Phase 2
**Requirements**: COMP-01, COMP-03
**Success Criteria** (what must be TRUE):
  1. The compliance engine (`lib/compliance-engine/`) computes all upcoming deadlines for any entity given its jurisdiction rules and incorporation date, returning structured deadline objects with due date, obligation type, and risk level
  2. The risk scorer assigns overdue / due-soon-30d / at-risk / compliant status to each entity based on computed deadlines
  3. The alert aggregator returns a ranked list of entities requiring attention, ordered by urgency
  4. All three functions are callable from Route Handlers and Server Actions without any database calls inside the engine itself
**Plans**: 2 plans
Plans:
- [x] 05-01-PLAN.md — Engine types, deadline calculator, and risk scorer with unit tests
- [x] 05-02-PLAN.md — Alert aggregator, barrel index, full test suite verification

### Phase 6: Compliance UI
**Goal**: Users can view compliance deadlines across all entities in a calendar, see urgency-coded alerts, and inspect per-entity compliance timelines
**Depends on**: Phase 5
**Requirements**: COMP-02, COMP-04, COMP-05
**Success Criteria** (what must be TRUE):
  1. User can navigate to a compliance calendar page that shows all upcoming deadlines across all entities, color-coded by urgency (overdue red, due-soon amber, healthy green)
  2. User sees a risk dashboard page with a ranked list of entities by risk level, immediately surfacing which entities need action today
  3. On each entity detail page, the compliance tab shows that entity's full obligation timeline with status per filing type (overdue, pending, completed)
  4. The alert feed on the compliance pages surfaces at least the 3 overdue and 5 due-soon entities from the seed data
**Plans**: 2 plans
Plans:
- [x] 06-01-PLAN.md — Compliance calendar with deadline dots, alert feed with urgency ranking
- [x] 06-02-PLAN.md — Risk dashboard with ranked entities, per-entity compliance timeline

### Phase 7: Dashboard
**Goal**: The landing page communicates the full portfolio health story — entity counts, risk distribution, jurisdiction heatmap, and the most urgent action items — within 10 seconds of load
**Depends on**: Phase 6
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria** (what must be TRUE):
  1. User lands on the dashboard and immediately sees entity health summary cards (total entities, entities at risk, overdue filings, upcoming deadlines)
  2. The jurisdiction risk heatmap (grid or visual map) shows risk concentration by country using color intensity — high-risk jurisdictions are visually prominent
  3. The dashboard surfaces the 5 most urgent action items requiring human attention today, with one-click navigation to the relevant entity
  4. User can view an AI-generated compliance briefing that summarizes the current portfolio state in natural language ("2 overdue filings in JP and DE, 5 renewals due within 30 days")
**Plans**: 2 plans
Plans:
- [x] 07-01-PLAN.md — Health summary cards, jurisdiction risk heatmap, urgent action items
- [x] 07-02-PLAN.md — AI compliance briefing via Gemini with template fallback

### Phase 8: AI Drafting
**Goal**: Users can generate grounded AI draft documents — compliance filings and intercompany agreements — for any entity using Gemini, with streaming output and visible grounding context
**Depends on**: Phase 4
**Requirements**: AIDOC-01, AIDOC-02, AIDOC-05
**Success Criteria** (what must be TRUE):
  1. User can open a "Draft Document" modal from any entity detail page, select a document type (compliance filing or intercompany agreement), and receive a streaming AI draft within 10 seconds
  2. The draft is visibly grounded in entity data — entity name, jurisdiction, incorporation date, existing agreement terms, and directors appear correctly in the output
  3. Every AI draft includes a visible "AI draft — requires legal review" disclaimer
  4. The `/api/ai/draft` Route Handler keeps the Gemini API key server-side and is never exposed to the browser
**Plans**: 1 plan
Plans:
- [x] 08-01-PLAN.md — AI document drafting with Gemini streaming, entity-grounded prompts

### Phase 9: AI Document Extraction + Signature Routing
**Goal**: Users can upload legal documents, extract key structured data automatically via Gemini, and route documents through a signature workflow with status tracking
**Depends on**: Phase 8
**Requirements**: AIDOC-03, AIDOC-04
**Success Criteria** (what must be TRUE):
  1. User can upload a PDF legal document from an entity's documents tab and trigger AI extraction that returns structured JSON: parties, key dates, obligations, governing law
  2. Extracted data is displayed in a readable summary view within the entity profile
  3. User can set a document's status (draft → sent for signature → signed) and the status change persists and is visible on the entity's documents tab
  4. The signature routing workflow shows a clear status tracker (e.g., step indicator) so users can see where each document is in the process
**Plans**: 1 plan
Plans:
- [x] 09-01-PLAN.md — AI document extraction and signature routing workflow

### Phase 10: Integrations
**Goal**: Users can see linked Notion pages and Google Drive documents inline within entity profiles, replacing the need to switch tabs
**Depends on**: Phase 4
**Requirements**: INTG-01, INTG-02, INTG-03
**Success Criteria** (what must be TRUE):
  1. User can see a linked Notion page panel within an entity's detail view that displays the Notion page title and a preview or link (using Notion API or simulated connection with realistic demo data)
  2. User can see a Google Drive documents panel within an entity's detail view showing linked Drive files with file names, types, and last-modified dates
  3. Both integration panels are embedded inline within the entity profile — the user does not leave the platform to access the linked content
**Plans**: 1 plan
Plans:
- [x] 10-01-PLAN.md — Notion and Google Drive integration panels with demo data

### Phase 11: Polish + Demo Path
**Goal**: The 3-minute reviewer demo path works end-to-end without friction — dashboard risk signals visible on load, AI draft reachable in two clicks, Vercel deployment verified
**Depends on**: Phase 10
**Requirements**: (no new requirements — all 27 v1 requirements already mapped; this phase verifies the integrated experience)
**Success Criteria** (what must be TRUE):
  1. Reviewer can open the live Vercel URL and immediately see red risk signals on the dashboard without any setup or navigation
  2. Reviewer can go from dashboard → entity detail → AI draft in no more than 3 clicks
  3. All environment variables are configured on Vercel and the app loads without console errors
  4. Demo entities have curated, pre-validated AI draft outputs that are legally plausible for their jurisdictions
  5. The app renders correctly at 1280px+ viewport with no layout breaks in the enterprise data tables

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11

Note: Phase 5 (Compliance Engine) depends only on Phase 2 (data), not Phase 3 or 4. Phases 3, 4, and 5 can proceed after Phase 2 completes — 3 and 4 are sequenced (detail needs list), and 5 is independent. Phase 8 depends on Phase 4 (needs entity context). Phases 6 and 7 follow Phase 5.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Foundation | 2/2 | Complete    | 2026-03-13 |
| 2. Seed Data | 0/2 | Complete    | 2026-03-13 |
| 3. Entity Registry | 2/2 | Complete    | 2026-03-13 |
| 4. Entity Detail | 2/2 | Complete    | 2026-03-13 |
| 5. Compliance Engine | 2/2 | Complete    | 2026-03-13 |
| 6. Compliance UI | 2/2 | Complete    | 2026-03-13 |
| 7. Dashboard | 2/2 | Complete    | 2026-03-13 |
| 8. AI Drafting | 1/1 | Complete    | 2026-03-13 |
| 9. AI Extraction + Signature | 1/1 | Complete    | 2026-03-13 |
| 10. Integrations | 1/1 | Complete    | 2026-03-13 |
| 11. Polish + Demo Path | 1/1 | Complete    | 2026-03-13 |
