# Project Research Summary

**Project:** Hopae Entity Management Platform
**Domain:** Enterprise legal entity management / compliance ops (internal tooling)
**Researched:** 2026-03-13
**Confidence:** HIGH

## Executive Summary

Hopae is building an AI-native internal ops platform to manage 60+ legal entities across 20+ jurisdictions — replacing spreadsheets and manual tracking with a system where ops teams supervise exceptions rather than perform routine work. Research confirms this is a well-understood product category (legal entity management, or LEM) with established patterns from platforms like Diligent Entities, Athennian, and CSC. The differentiation space is clear: no major platform combines AI document drafting, AI document extraction, and intercompany agreement tracking in a single tool. This is where Hopae wins, provided the foundation (entity registry, compliance engine, data model) is built correctly first.

The recommended approach is a Next.js 16 / Supabase / Gemini stack with a strict server-first architecture. All data reads happen in Server Components; all mutations go through Server Actions; all AI calls route through API Route Handlers that keep the Gemini key server-side. The compliance engine is a pure TypeScript service layer isolated from both the UI and the database — this is the single most important architectural decision, as compliance logic is complex, multi-jurisdiction, and must be independently testable. The entity registry is the root dependency for everything else.

The primary risks are non-technical: (1) building demo-last instead of demo-first, resulting in an app that looks like a fancy spreadsheet instead of demonstrating the AI value prop; (2) AI hallucination in legal output if Gemini is called without grounded entity context; and (3) a rigid data model that fails when entity types or corporate hierarchy complexity grows. All three are avoidable with deliberate decisions in the first phase of development. The 5-hour implementation constraint makes prioritization discipline the most important success factor — skip auth, skip RLS, skip pagination, and get the AI demo path working.

## Key Findings

### Recommended Stack

The stack is tightly coupled and designed for speed: Next.js 16 App Router eliminates the need for a separate API layer, Supabase provides Postgres + Storage + real-time with no migration overhead, and the new `@google/genai` SDK (unified GA release, May 2025) handles document analysis and text generation. shadcn/ui with Tailwind v4 and TanStack Table delivers the dense enterprise data table aesthetic that legal ops teams expect. There are several critical version-specific gotchas: `@supabase/auth-helpers-nextjs` is deprecated and must not be used (use `@supabase/ssr` instead), `@google/generative-ai` is deprecated as of November 2025 (use `@google/genai` 1.45.0), and Zod v4 requires `@hookform/resolvers` v5+.

**Core technologies:**
- Next.js 16 + React 19: App Router with Server Components and Server Actions — eliminates separate API layer, enables SSR-first architecture
- Supabase (`@supabase/supabase-js` 2.99.1 + `@supabase/ssr` 0.9.0): Postgres + Storage with SSR-safe client pattern — zero migration friction, built-in file storage for legal documents
- `@google/genai` 1.45.0: Unified Gemini SDK (not deprecated `@google/generative-ai`) — supports PDFs up to 1000 pages, structured JSON output, streaming
- TanStack Table 8.21.3 + shadcn/ui: Dense enterprise data table — column visibility, faceted filters, server-side pagination-ready
- TanStack Query v5 + Zustand v5: Server-state caching (TQ) and UI state only (Zustand) — clean separation of concerns
- Zod 4 + react-hook-form 7 + `@hookform/resolvers` 5: Single schema source of truth for all entity data shapes
- date-fns 4: Deadline arithmetic across jurisdictions — immutable dates, full tree-shaking, locale support
- Tailwind CSS 4.2.1: CSS-first config (no config file), Oxide Rust engine, required for enterprise density aesthetic

### Expected Features

Research confirmed the product category has well-established table stakes and a clear differentiation gap. The full feature dependency graph is documented in FEATURES.md — entity registry is the root node for every other feature.

**Must have (table stakes):**
- Entity registry with 60+ entities in a dense, filterable data table — core reason to adopt any LEM platform
- Per-entity detail view: directors, compliance status, banking, intercompany agreements — without this there's nowhere to navigate
- Compliance deadline calendar with per-country rules and urgency indicators — the oldest concept in legal ops
- Deadline alerting with risk flags (overdue, <30 days, dissolution risk) — calendar without alerts is just a list
- Officer/director tracking with roles and tenure dates — table stakes across all competitor platforms
- Portfolio dashboard with entity health at a glance — mandatory for multi-entity management

**Should have (competitive differentiators):**
- AI document extraction via Gemini — parse legal PDFs, extract dates and obligations automatically; no competitor combines this with drafting
- AI document drafting — context-aware intercompany agreements and compliance filings, not just templates
- Intercompany agreement tracking — most platforms handle debt-only; Hopae needs full agreement tracking for HQ/subsidiary structure
- Risk-based entity health scoring — composite score driving dashboard prioritization, not just a flat list
- AI compliance intelligence summary — natural language briefing on entity posture ("2 overdue filings, renewal in 14 days")

**Defer (v2+):**
- Real government registry integrations — each jurisdiction is a months-long integration
- Full audit trail with tamper-evident log — important for production, not demo priority
- RBAC and user management — required before multi-user production use
- Signature routing with actual e-signature (show workflow UI in v1, defer real signing)
- Document correspondence intake/AI classification — add after manual upload is proven

### Architecture Approach

The architecture follows a strict server-first pattern: Next.js Server Components own all data fetching (no client-side Supabase queries), Server Actions own all mutations, and AI calls route exclusively through Route Handlers (not Server Actions) because they require streaming. The compliance engine is isolated as a pure TypeScript service layer in `lib/compliance-engine/` with no database dependency — it receives entity + jurisdiction data as input and returns deadline dates, risk levels, and alerts as output. This isolation is the most important structural decision because compliance logic must be testable, reusable across multiple callers, and independent of schema changes.

**Major components:**
1. Dashboard — aggregates entity health via Postgres `entity_health_summary` view; Server Component, no client-side queries
2. Entity Hub — entity list and detail pages; Server Components with Client Component islands for filters, tabs, modals
3. Compliance Engine (`lib/compliance-engine/`) — pure TypeScript deadline calculator, risk scorer, alert aggregator; no DB calls; called from Route Handlers and Server Actions
4. AI Pipeline (`/api/ai/draft` + `/api/ai/extract`) — Route Handlers only; streaming drafts via `generateContentStream`; structured JSON extraction via Gemini JSON mode; API key server-only
5. Supabase (Postgres + Storage) — single source of truth; server client via `@supabase/ssr` in all server contexts; service role key never exposed to browser

**Critical path:** Schema → Seed Data → Compliance Engine → Entity Hub → Dashboard. AI Pipeline and Document Management are parallel work streams after the schema is in place.

### Critical Pitfalls

1. **Demo built last instead of first** — Design the 3-minute demo path before writing any code. The dashboard must show red risk signals on load. AI drafting must be reachable in two clicks. Dummy data must have deliberate drama: at least one overdue filing, one entity approaching dissolution risk, one document pending signature. A demo that shows green status everywhere fails the review.

2. **AI hallucination in legal drafting** — Ground every Gemini call with structured entity context from the database. Never call Gemini with only a document type and entity name. Include names, jurisdictions, incorporation dates, and existing agreement terms in the prompt. Add a visible "AI draft — requires legal review" disclaimer. Pre-validate demo entity output and cache curated versions if needed.

3. **Rigid data model that breaks on entity type variation** — Include `entity_type` field and `parent_entity_id` self-reference from day one. Store variable attributes in a `jsonb` metadata column. Dummy data must include at least two entity types (subsidiary + branch) to prove the schema handles variation. Intercompany agreements must be first-class records, not notes.

4. **Jurisdiction complexity underestimation** — Deadlines must be computed, not stored as static dates. The compliance rule schema needs `jurisdiction_type` (national/regional/hybrid), `rule_basis` (fixed_date/fiscal_year_relative/event_triggered), and `calculation_formula`. Store `filing_rules` as JSONB on the jurisdictions table. Verify deadline accuracy for at least 3 countries with different fiscal year calendars.

5. **Over-engineering for a 5-hour demo** — Explicitly skip RLS, skip server-side pagination (60 entities does not need it), skip real-time subscriptions, skip error boundaries on non-demo-path flows. Every hour not spent on infrastructure is an hour available for AI features and visual polish.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 0: Demo Path + Data Strategy
**Rationale:** The single biggest pitfall is building without a defined demo path. This phase locks in the 3-minute reviewer experience and ensures every subsequent phase builds toward it. Dummy data strategy must precede UI work because the data narrative informs what views need to communicate.
**Delivers:** Written demo script, dummy data narrative (Hopae's corporate family story), explicit "demo-quality vs. production-quality" annotations for all features, Supabase schema migrations, and a seed script with 60+ realistic entities spanning 20+ jurisdictions.
**Addresses:** Entity registry (data foundation), jurisdiction rules library, compliance requirements pre-populated from rules
**Avoids:** "Demo falls flat" pitfall (Pitfall 4), "Unrealistic dummy data" pitfall (Pitfall 7), over-engineering pitfall (Pitfall 6)
**Research flag:** Standard patterns — no deeper research needed; schema design is fully specified in ARCHITECTURE.md

### Phase 1: Foundation — Entity Hub + Compliance Engine
**Rationale:** Entity registry is the root dependency for every other feature. The compliance engine is a pure TypeScript service — building it before any UI means deadline logic is available to all subsequent phases without refactoring. This phase has no UI debt to slow it down.
**Delivers:** Entity list page (dense TanStack Table with status badges), per-entity detail page (tabbed: overview, compliance, documents), compliance engine (`deadline-calculator`, `risk-scorer`, `alert-aggregator`), and director/officer tracking.
**Uses:** TanStack Table 8.21.3, shadcn/ui DataTable, Supabase server client, date-fns 4
**Implements:** Entity Hub + Compliance Engine components from ARCHITECTURE.md
**Avoids:** Rigid data model pitfall (Pitfall 3) — entity_type and parent_entity_id must be in the schema before this phase
**Research flag:** Standard patterns — well-documented stack; skip research-phase

### Phase 2: Dashboard + Compliance Calendar
**Rationale:** With entities and compliance data in place, the dashboard and compliance calendar are pure read paths. The `entity_health_summary` Postgres view enables the aggregate dashboard without N+1 queries. This phase is what a reviewer sees first — it must communicate risk signals immediately on load.
**Delivers:** Portfolio dashboard with entity health grid and risk alerts, global compliance calendar with deadline proximity indicators, per-entity compliance tab with urgency-coded deadlines, alert feed surfacing overdue and at-risk entities.
**Uses:** `entity_health_summary` Postgres view, shadcn Chart (via recharts), Badge color variants, date-fns deadline arithmetic
**Implements:** Dashboard + Compliance Calendar components from ARCHITECTURE.md
**Avoids:** "Dashboard shows only green" failure mode — dummy data must have intentional risk signals loaded before this phase is reviewed
**Research flag:** Standard patterns — skip research-phase

### Phase 3: AI Pipeline — Extraction + Drafting
**Rationale:** AI is Hopae's primary differentiator. It depends on entity context being rich (Phase 1) and is independent of the compliance calendar (Phase 2). Route Handlers with streaming are the correct pattern — documented and ready. This phase is the demo's aha moment and must be demo-path-complete, not just technically functional.
**Delivers:** `/api/ai/extract` Route Handler (Gemini JSON mode, structured extraction from PDFs), `/api/ai/draft` Route Handler (Gemini streaming, intercompany agreement and compliance filing drafts), Document Pipeline page with upload + extraction display, "Draft Document" modal with streaming output and entity context, AI disclaimer UI, intercompany agreement tracker per entity.
**Uses:** `@google/genai` 1.45.0, `gemini-2.5-flash` model, Supabase Storage, streaming `ReadableStream` client pattern
**Implements:** AI Pipeline + Document Management components from ARCHITECTURE.md
**Avoids:** AI hallucination pitfall (Pitfall 2) — grounded entity context must be injected into every prompt; pre-validate demo entity output before this phase is considered complete
**Research flag:** Needs deeper research during planning — prompt engineering for grounded legal drafting is domain-specific; validate Gemini JSON mode structured output schema design for extraction

### Phase 4: Polish + Demo Path Verification
**Rationale:** The final phase is not feature addition — it is demo path hardening. Every hour here directly reduces demo failure risk. Covers visual polish, risk signal visibility, AI output caching, and Vercel deployment verification.
**Delivers:** End-to-end demo path walkthrough (dashboard risk → entity drill-down → AI draft in 3 clicks), cached AI outputs for demo entities, verified Vercel deployment with all environment variables, tuned dummy data (deadline dates verified for jurisdiction accuracy), any P2 features that fit within remaining time (AI compliance intelligence summary, org chart).
**Avoids:** Vercel deployment failure (integration gotcha), Gemini rate limit during live demo, deadline timezone errors (Pitfall 5)
**Research flag:** Standard patterns — skip research-phase

### Phase Ordering Rationale

- **Data first, UI second:** The schema and seed data must exist before any UI is built. Changing the schema after TanStack Table column definitions are in place is expensive.
- **Compliance engine before compliance UI:** Pure TypeScript with no UI dependency means it can be validated before any page is built. Pre-computing compliance results into the database (rather than computing in the browser) means the dashboard can read pre-joined data without client-side calculation.
- **AI after entity data:** Gemini drafting quality directly scales with the richness of entity records. Shallow entity data in Phase 1 = poor AI output in Phase 3. The dependency is not just technical (entity context injection) but qualitative.
- **Demo path verification as its own phase:** Research consistently shows that legal ops demo failures come from the last 20% — the moment a reviewer navigates off the happy path. Treating polish as an explicit phase (not a "we'll clean it up" intention) is the structural mitigation.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (AI Pipeline):** Prompt engineering for grounded legal document drafting requires validation against real Gemini output. The structured output JSON schema for document extraction (parties, dates, obligations, governing law) should be pre-designed and tested before implementation. The `gemini-2.5-flash` model's accuracy on specific legal document types (intercompany loans, board resolutions) should be spot-checked.

Phases with standard patterns (skip research-phase):
- **Phase 0 (Foundation/Data):** Schema design is fully specified in ARCHITECTURE.md with complete SQL. Seed data strategy is documented.
- **Phase 1 (Entity Hub):** TanStack Table + shadcn/ui patterns are well-documented. Supabase server client pattern is code-complete in STACK.md.
- **Phase 2 (Dashboard/Calendar):** Postgres view aggregation is a standard pattern. shadcn Chart + recharts integration is straightforward.
- **Phase 4 (Polish):** No novel technical patterns — primarily data verification, deployment validation, and UX hardening.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm registry 2026-03-13. Critical version gotchas (deprecated SDKs) explicitly documented. Supabase SSR and Gemini SDK patterns verified against official docs. |
| Features | HIGH | Validated against multiple LEM platforms (Diligent, Athennian, CSC, MinuteBox, EntityKeeper). Feature dependency graph is rigorous. Competitor analysis confirms the AI drafting + extraction gap. |
| Architecture | MEDIUM-HIGH | Patterns verified across LEM documentation, Next.js/Supabase official docs, and compliance architecture case studies. The compliance engine isolation pattern and AI Route Handler pattern are well-established. Minor uncertainty around optimal Gemini streaming UX for legal draft display. |
| Pitfalls | HIGH | Domain-specific pitfalls drawn from enterprise LEM post-mortems, legal AI hallucination research (Stanford/JELS 2025), and Next.js + Supabase production retrospectives. The demo-path and dummy data pitfalls are particularly well-evidenced. |

**Overall confidence:** HIGH

### Gaps to Address

- **Jurisdiction rule completeness:** Research confirms the schema pattern (JSONB filing_rules on jurisdictions table) but the actual deadline rules for all 20+ target jurisdictions need to be compiled during Phase 0. Luxembourg, Japan, Singapore, UAE, and US (Delaware) fiscal year calendars are referenced in pitfalls research — these need verified 2026 filing dates before seed data is written.

- **Gemini structured output schema for extraction:** The extraction prompt pattern is documented (parties, dates, obligations, governing law), but the exact JSON schema that reliably produces consistent structured output from Gemini needs to be prototyped early in Phase 3. The ARCHITECTURE.md notes that Zod schema validation is applied to Gemini output — the schema design is gap work.

- **AI drafting prompt quality for specific document types:** PITFALLS.md notes that Gemini can hallucinate jurisdiction-specific regulatory citations. The prompt engineering for intercompany loan agreements vs. board resolutions vs. compliance filing letters requires hands-on testing. Pre-validate all demo entity outputs before Phase 3 is considered complete.

- **Demo data narrative:** The Hopae entity family story (which 60+ entities, what their HQ/subsidiary relationships are, what the intercompany structure looks like) must be authored as product decisions, not technical fixtures. This is a planning-phase deliverable that no research file resolves fully.

## Sources

### Primary (HIGH confidence)
- npm registry (verified 2026-03-13) — all package versions: next@16.1.6, @google/genai@1.45.0, @tanstack/react-table@8.21.3, @supabase/supabase-js@2.99.1, @supabase/ssr@0.9.0, zod@4.3.6, react-hook-form@7.71.2, zustand@5.0.11, @tanstack/react-query@5.90.21, tailwindcss@4.2.1, date-fns@4.1.0
- [Supabase SSR Docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — server/client Supabase pattern, deprecated auth-helpers confirmation
- [Gemini API Libraries](https://ai.google.dev/gemini-api/docs/libraries) — @google/genai GA status, deprecated @google/generative-ai
- [googleapis/js-genai GitHub](https://github.com/googleapis/js-genai) — SDK capabilities, document analysis (1000 PDF pages), structured output
- [TanStack Table v8](https://tanstack.com/table/v8) — headless table API, server-side capabilities
- [shadcn/ui Tailwind v4 Docs](https://ui.shadcn.com/docs/tailwind-v4) — v4 compatibility confirmed
- [Legal RAG Hallucinations — Stanford/JELS 2025](https://dho.stanford.edu/wp-content/uploads/Legal_RAG_Hallucinations.pdf) — 6.4% hallucination rate on grounded legal tasks

### Secondary (MEDIUM confidence)
- [Athennian Product Overview](https://www.athennian.com/product) — feature list and AI positioning
- [Diligent Entities — 10 must-have features](https://www.diligent.com/resources/blog/best-entity-management-software) — industry standard feature checklist
- [Next.js + Supabase in production: what would I do differently](https://catjam.fi/articles/next-supabase-what-do-differently) — production pattern validation
- [Legal Entity Management Systems, Data & Process Strategy 2025 — CrossCountry Consulting](https://www.crosscountry-consulting.com/insights/blog/legal-entity-management-efficiency-technology/) — LEM architecture taxonomy
- [How to nail your demo data — Tonic.ai](https://www.tonic.ai/blog/3-ways-to-nail-your-demo-data) — dummy data strategy for demo-critical applications
- [Discern — Best Entity Management Software 2026](https://www.discern.com/resources/best-entity-management-software-growing-companies) — differentiators vs table stakes analysis
- WebSearch: TanStack Query v5 vs Zustand pattern (2025), Gemini 2.5 Flash document extraction accuracy — cross-validated with official sources

### Tertiary (referenced, lower weight)
- [CSC Entity Management](https://www.cscglobal.com/service/entity-solutions/entity-management/) — enterprise feature reference
- [MinuteBox — Entity Management Software](https://www.minutebox.com/glossary/entity-management-software) — compliance calendar patterns
- [Common Compliance Software Mistakes 2026 — OuranosTech](https://www.ouranostech.com/blogs/common-compliance-software-mistakes-to-avoid) — implementation failure patterns

---
*Research completed: 2026-03-13*
*Ready for roadmap: yes*
