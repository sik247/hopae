# Architecture Research

**Domain:** Multi-entity legal operations management platform
**Researched:** 2026-03-13
**Confidence:** MEDIUM-HIGH (patterns verified across LEM platform documentation, Next.js/Supabase official docs, and compliance architecture case studies)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                           │
├──────────────┬──────────────┬──────────────┬────────────────────────┤
│  Dashboard   │  Entity      │  Compliance  │  Document              │
│  (overview   │  Hub         │  Calendar    │  Pipeline              │
│   + health)  │  (list/detail│  (deadlines  │  (drafting,            │
│              │   views)     │   + alerts)  │   extraction, signing) │
└──────┬───────┴──────┬───────┴──────┬───────┴──────────┬────────────┘
       │              │              │                   │
┌──────┴──────────────┴──────────────┴───────────────────┴────────────┐
│                    NEXT.JS APPLICATION LAYER                        │
│  Server Components (data fetch)  │  Server Actions (mutations)      │
│  Route Handlers (/api/*)         │  Streaming (AI responses)        │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
┌─────────┴────────┐    ┌──────────┴──────────┐  ┌─────────┴────────┐
│  SUPABASE        │    │  COMPLIANCE ENGINE   │  │  AI PIPELINE     │
│  (Postgres +     │    │  (pure TS service    │  │  (Gemini API     │
│   Storage)       │    │   layer, no DB dep)  │  │   via SDK)       │
│                  │    │                      │  │                  │
│  entities        │    │  deadline calculator │  │  doc extractor   │
│  jurisdictions   │    │  alert aggregator    │  │  doc drafter     │
│  directors       │    │  risk scorer         │  │  summary gen     │
│  compliance_reqs │    │                      │  │                  │
│  documents       │    └──────────────────────┘  └─────────────────┘
│  deadlines       │
│  alerts          │
└──────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Dashboard | Aggregate entity health, surface risk signals, top-level metrics | Next.js Server Component, reads denormalized views |
| Entity Hub | CRUD for entities, directors, banking, intercompany agreements | Server Components + Server Actions, Supabase client |
| Compliance Calendar | Display upcoming deadlines, overdue items, per-entity status | Client Component (interactive filtering), data from compliance engine |
| Document Pipeline | Trigger AI drafting/extraction, track signature status, store documents | Route Handler + Server Action, Gemini API + Supabase Storage |
| Compliance Engine | Calculate deadline dates given jurisdiction rules, compute risk level, produce alerts | Pure TypeScript service layer (no DB dep), called from Server Actions and Route Handlers |
| AI Pipeline | Extract structured data from uploaded documents, draft compliance filings and agreements | Server-side only, Gemini API via `@google/generative-ai`, results stored in Supabase |
| Supabase (Postgres) | Source of truth for all entity, compliance, and document data | Tables + typed client via `supabase-js` + generated types |
| Supabase Storage | Binary document storage (PDFs, contracts) | Supabase Storage buckets, URLs referenced in documents table |

---

## Recommended Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (sidebar + nav shell)
│   ├── page.tsx                  # Redirects to /dashboard
│   ├── dashboard/
│   │   └── page.tsx              # Global entity health overview
│   ├── entities/
│   │   ├── page.tsx              # Entity list (searchable, filterable)
│   │   └── [id]/
│   │       ├── page.tsx          # Entity detail (tabs: overview, compliance, docs)
│   │       ├── compliance/
│   │       │   └── page.tsx      # Per-entity compliance timeline
│   │       └── documents/
│   │           └── page.tsx      # Per-entity document list
│   ├── compliance/
│   │   └── page.tsx              # Global compliance calendar + alerts
│   ├── documents/
│   │   └── page.tsx              # Document pipeline (drafting, extraction)
│   └── api/
│       ├── ai/
│       │   ├── draft/route.ts    # POST — AI document drafting (streaming)
│       │   └── extract/route.ts  # POST — AI document extraction
│       └── compliance/
│           └── recalculate/route.ts  # POST — recompute deadlines for entity
│
├── components/
│   ├── ui/                       # shadcn/ui primitives (auto-generated)
│   ├── layout/                   # Sidebar, header, breadcrumbs
│   ├── entities/                 # EntityCard, EntityTable, DirectorList
│   ├── compliance/               # DeadlineRow, AlertBadge, RiskIndicator
│   ├── documents/                # DocumentCard, SignatureStatusBadge
│   └── dashboard/                # StatCard, EntityHealthGrid, AlertFeed
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client (service role)
│   │   └── types.ts              # Generated DB types (supabase gen types)
│   ├── compliance-engine/
│   │   ├── deadline-calculator.ts  # jurisdiction rules → deadline dates
│   │   ├── risk-scorer.ts          # entity compliance state → risk level
│   │   └── alert-aggregator.ts     # risk + deadlines → actionable alerts
│   ├── ai/
│   │   ├── gemini.ts             # Initialized Gemini client
│   │   ├── extractor.ts          # Document → structured data
│   │   └── drafter.ts            # Params → draft document text
│   └── utils/
│       ├── dates.ts              # Deadline date arithmetic
│       └── formatting.ts         # Currency, jurisdiction display names
│
├── data/
│   └── seed/
│       ├── entities.ts           # 60+ realistic dummy entities
│       ├── jurisdictions.ts      # 20+ jurisdiction rules
│       └── documents.ts          # Representative dummy documents
│
└── supabase/
    ├── migrations/               # SQL migration files
    └── seed.sql                  # Seed script for demo data
```

### Structure Rationale

- **`lib/compliance-engine/`:** Isolated pure TypeScript with no DB dependency. This makes deadline logic testable, reusable across both Server Actions and Route Handlers, and independent of Supabase schema changes.
- **`lib/ai/`:** Gemini integration isolated from UI. Drafting and extraction are separate modules because they have different input shapes, prompt strategies, and streaming behaviors.
- **`app/api/`:** AI calls and compliance recalculation go through Route Handlers (not Server Actions) because they are long-running, may stream, and benefit from explicit HTTP semantics.
- **`data/seed/`:** Dummy data is TypeScript, not SQL, so it can be composed programmatically to ensure realistic relationships (e.g., entity references valid jurisdiction IDs).

---

## Entity Data Model (Supabase / Postgres)

### Core Schema

```sql
-- Jurisdictions: the rule set for each country
jurisdictions (
  id            uuid PK,
  country_code  text UNIQUE,      -- ISO 3166-1 alpha-2
  country_name  text,
  filing_rules  jsonb,            -- { annual_filing_month, tax_deadline_doy, ... }
  currency      text,
  created_at    timestamptz
)

-- Legal entities
entities (
  id                  uuid PK,
  name                text,
  legal_name          text,
  jurisdiction_id     uuid FK → jurisdictions,
  entity_type         text,       -- LLC, Ltd, GmbH, S.A.S, etc.
  incorporation_date  date,
  registration_number text,
  status              text,       -- active | dormant | dissolving
  purpose             text,       -- provider_key | customer_entity | hq
  hq_entity_id        uuid FK → entities (self-ref, nullable),
  banking_info        jsonb,      -- { bank_name, account_currency, ... }
  registered_agent    jsonb,      -- { name, address, renewal_date }
  created_at          timestamptz
)

-- Directors / officers
directors (
  id          uuid PK,
  entity_id   uuid FK → entities,
  full_name   text,
  role        text,               -- Director, Secretary, Statutory Auditor
  nationality text,
  start_date  date,
  end_date    date,               -- null = current
  is_current  boolean
)

-- Compliance requirements (instantiated per entity from jurisdiction rules)
compliance_requirements (
  id              uuid PK,
  entity_id       uuid FK → entities,
  requirement_type text,          -- annual_filing | tax_return | agent_renewal | ...
  due_date        date,
  fiscal_year     int,
  status          text,           -- pending | in_progress | completed | overdue
  notes           text,
  completed_at    timestamptz
)

-- Documents
documents (
  id              uuid PK,
  entity_id       uuid FK → entities,
  document_type   text,           -- incorporation_cert | intercompany_agreement | filing | ...
  title           text,
  storage_path    text,           -- Supabase Storage path
  source          text,           -- uploaded | ai_drafted | ai_extracted
  signature_status text,          -- not_required | pending | signed
  signatories     jsonb,          -- [{ name, email, signed_at }]
  extracted_data  jsonb,          -- AI-extracted fields (dates, obligations, parties)
  created_at      timestamptz
)

-- Alerts (materialized from compliance engine)
alerts (
  id              uuid PK,
  entity_id       uuid FK → entities,
  requirement_id  uuid FK → compliance_requirements,
  alert_type      text,           -- overdue | due_soon | at_risk | info
  message         text,
  due_date        date,
  resolved        boolean,
  created_at      timestamptz
)
```

### Key Relationships

```
jurisdictions ──< entities ──< directors
                     │
                     ├──< compliance_requirements ──< alerts
                     │
                     └──< documents
```

---

## Architectural Patterns

### Pattern 1: Server Components for Data, Client Components for Interaction

**What:** Entity list, entity detail, and dashboard pages are Next.js Server Components that fetch directly from Supabase using the server client. Interactive elements (filters, search, tabs, modals) are `"use client"` islands.

**When to use:** All data-display pages. Keeps sensitive Supabase queries server-side. Eliminates loading spinners for initial paint.

**Trade-offs:** Server Components cannot use React state or browser APIs. Interaction boundaries must be explicit. Worth it for the 5-hour build constraint — less client state to manage.

```typescript
// app/entities/page.tsx — Server Component
import { createServerClient } from '@/lib/supabase/server'

export default async function EntitiesPage() {
  const supabase = createServerClient()
  const { data: entities } = await supabase
    .from('entities')
    .select('*, jurisdiction:jurisdictions(*), compliance_requirements(*)')
    .order('name')

  return <EntityTable entities={entities} />
}
```

### Pattern 2: Compliance Engine as Pure Service Layer

**What:** The compliance engine (`lib/compliance-engine/`) is pure TypeScript with no DB calls. It receives entity + jurisdiction data as input, returns deadline dates, risk levels, and alert objects as output. The caller (Server Action or Route Handler) is responsible for persisting results.

**When to use:** Any deadline calculation, risk scoring, or alert generation. This prevents compliance logic from being scattered across UI components and keeps it testable.

**Trade-offs:** Requires passing full entity context to the engine (not an issue for a single-tenant internal tool at this scale). Adds a slight indirection vs. computing inline in a query.

```typescript
// lib/compliance-engine/deadline-calculator.ts
export interface DeadlineInput {
  entity: Entity
  jurisdiction: Jurisdiction
  fiscalYear: number
}

export interface DeadlineResult {
  requirementType: string
  dueDate: Date
  daysUntilDue: number
  riskLevel: 'critical' | 'warning' | 'ok'
}

export function calculateDeadlines(input: DeadlineInput): DeadlineResult[] {
  const rules = input.jurisdiction.filing_rules
  // Pure date arithmetic — no side effects, no DB calls
  return [
    {
      requirementType: 'annual_filing',
      dueDate: computeAnnualFilingDate(rules, input.fiscalYear),
      // ...
    },
  ]
}
```

### Pattern 3: AI Calls via Route Handlers with Streaming

**What:** Gemini API calls go through `/api/ai/draft` and `/api/ai/extract` Route Handlers, not Server Actions. The draft endpoint streams the response. The extraction endpoint returns JSON synchronously (structured output via Gemini's JSON mode).

**When to use:** All Gemini API interactions. Route Handlers can stream; Server Actions cannot easily do so in the current Next.js stable release. Also keeps API key on the server and makes token budget management explicit.

**Trade-offs:** Requires a client-side fetch call and UI streaming state. Slightly more code than a Server Action for simple cases.

```typescript
// app/api/ai/draft/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  const { entityId, documentType, context } = await req.json()
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const result = await model.generateContentStream(buildDraftPrompt(context))
  return new Response(result.stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
```

### Pattern 4: Denormalized Dashboard View

**What:** The dashboard reads a Postgres view (`entity_health_summary`) that pre-joins entities, their active compliance requirements, overdue count, and risk level. This view is computed at query time by Postgres, not maintained as a separate table.

**When to use:** Dashboard page only. Avoids N+1 queries when showing 60+ entities at a glance.

**Trade-offs:** View adds a schema artifact to maintain. Acceptable for this scale and build time.

```sql
CREATE VIEW entity_health_summary AS
SELECT
  e.id,
  e.name,
  e.status,
  j.country_name,
  COUNT(cr.id) FILTER (WHERE cr.status = 'overdue') AS overdue_count,
  COUNT(cr.id) FILTER (WHERE cr.status = 'pending'
    AND cr.due_date BETWEEN NOW() AND NOW() + INTERVAL '30 days') AS due_soon_count,
  CASE
    WHEN COUNT(cr.id) FILTER (WHERE cr.status = 'overdue') > 0 THEN 'critical'
    WHEN COUNT(cr.id) FILTER (WHERE cr.status = 'pending'
      AND cr.due_date < NOW() + INTERVAL '14 days') > 0 THEN 'warning'
    ELSE 'ok'
  END AS risk_level
FROM entities e
JOIN jurisdictions j ON j.id = e.jurisdiction_id
LEFT JOIN compliance_requirements cr ON cr.entity_id = e.id
GROUP BY e.id, e.name, e.status, j.country_name;
```

---

## Data Flow

### Entity Overview Flow (Dashboard Load)

```
Browser requests /dashboard
    ↓
Next.js Server Component renders
    ↓
createServerClient() — Supabase service role client
    ↓
SELECT * FROM entity_health_summary
    ↓
Postgres aggregates across entities + requirements
    ↓
Server Component renders EntityHealthGrid with pre-computed data
    ↓
HTML streamed to browser — no client-side fetch needed
```

### Compliance Deadline Calculation Flow

```
Admin triggers "Recalculate Compliance" (or: runs on seed)
    ↓
POST /api/compliance/recalculate  (Route Handler)
    ↓
Fetches all entities + jurisdictions from Supabase
    ↓
compliance-engine/deadline-calculator.ts
  → For each entity × jurisdiction rules × fiscal years
  → Returns DeadlineResult[]
    ↓
compliance-engine/risk-scorer.ts
  → Returns risk level per entity
    ↓
compliance-engine/alert-aggregator.ts
  → Returns Alert[] (overdue, due_soon, at_risk)
    ↓
Upsert into compliance_requirements + alerts tables
    ↓
Dashboard/compliance views read pre-computed data
```

### AI Document Extraction Flow

```
User uploads PDF on Document Pipeline page
    ↓
Client POST to /api/ai/extract  { file: base64, entityId }
    ↓
Route Handler: send to Gemini (gemini-1.5-pro, JSON mode)
  Prompt: "Extract: parties, dates, obligations, governing law, key clauses"
    ↓
Gemini returns structured JSON
    ↓
Route Handler validates schema (Zod), stores in documents.extracted_data
    ↓
Client receives extracted fields, displays for review
    ↓
User can save → Server Action writes to documents table
```

### AI Document Drafting Flow

```
User opens "Draft Document" modal, selects type + entity
    ↓
Client POST to /api/ai/draft  { documentType, entityContext }
    ↓
Route Handler streams Gemini response
    ↓
Client renders streaming text in draft preview
    ↓
User reviews, edits, confirms
    ↓
Server Action: save draft → documents table (source: 'ai_drafted')
    ↓
If signature required: update signature_status → 'pending'
    ↓
Signature routing: display signatories list + status (simulated in demo)
```

### Key Data Flow Principles

1. **Reads are server-side.** All Supabase reads happen in Server Components or Route Handlers. No Supabase client-side queries.
2. **Writes are Server Actions or Route Handlers.** Mutations never go directly from client to Supabase.
3. **AI is always server-side.** Gemini API key never exposed to browser. All AI calls go through `/api/ai/*` handlers.
4. **Compliance engine is stateless.** It computes, never persists. Persistence is the caller's responsibility.
5. **Documents are referenced by path.** Supabase Storage holds binaries; the `documents` table holds metadata and extracted data.

---

## Component Boundaries (What Talks to What)

| From | To | Via | Notes |
|------|----|-----|-------|
| Browser | Server Components | HTTP (Next.js routing) | Read-only, SSR |
| Browser | `/api/ai/*` | fetch() | AI calls with streaming |
| Browser | Server Actions | POST (form/action) | Mutations |
| Server Component | Supabase | `@supabase/ssr` server client | Direct query |
| Server Action | Supabase | `@supabase/ssr` server client | Upsert/insert |
| Route Handler | Gemini API | `@google/generative-ai` SDK | AI generation |
| Route Handler | Supabase | `@supabase/ssr` server client | Persist AI results |
| Route Handler | Compliance Engine | Direct TS import | Pure computation |
| Compliance Engine | (nothing) | — | Stateless, no I/O |
| Supabase Storage | Browser | Signed URLs | Document downloads |

---

## Suggested Build Order (Dependencies)

The component dependency graph determines the correct build sequence:

```
1. Data Foundation
   └── Supabase schema (migrations) + seed data
       → Everything else reads from this

2. Compliance Engine (pure TS, no UI dep)
   └── deadline-calculator + risk-scorer + alert-aggregator
       → Dashboard and compliance views depend on computed data

3. Entity Hub (core read path)
   └── Entity list page + Entity detail page
       → Most other pages are extensions of entity detail

4. Dashboard (aggregated read)
   └── entity_health_summary view + Dashboard page
       → Depends on: schema, seeded data, compliance engine output

5. Compliance Calendar
   └── Global compliance view + per-entity compliance tab
       → Depends on: compliance_requirements table populated by engine

6. AI Pipeline
   └── /api/ai/extract + /api/ai/draft + Document Pipeline page
       → Can be built independently after schema; depends on Gemini client

7. Document Management
   └── Documents table, Supabase Storage, signature status tracking
       → Depends on: schema, AI pipeline (for extraction/drafting)

8. Polish: Dashboard alerts, risk indicators, search/filter, demo data tuning
```

**Critical path:** Schema → Seed Data → Compliance Engine → Entity Hub → Dashboard.
AI Pipeline and Document Management are parallel to Dashboard after the schema is in place.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (9 entities, 1 user) | Monolith is fine. Server Components + direct Supabase queries. No caching layer needed. |
| Target (60+ entities, lean ops team) | Same architecture holds. `entity_health_summary` view handles aggregation. Seed data should be at 60-entity scale from day one. |
| Future (200+ entities, multiple ops users) | Add Supabase RLS for user-level access control. Materialize `entity_health_summary` as a table refreshed via Postgres trigger or cron. Add Redis/Upstash for compliance engine result caching. |
| Multi-tenant SaaS (explicitly out of scope) | Would require schema-per-tenant or tenant_id-based RLS. Not applicable. |

### Scaling Priorities

1. **First bottleneck:** `entity_health_summary` view performance as entity count grows. Fix: materialize as table with `pg_cron` refresh.
2. **Second bottleneck:** Gemini API latency on document extraction for large PDFs. Fix: queue extraction jobs via Supabase Edge Functions or a job table polled by a cron.

---

## Anti-Patterns

### Anti-Pattern 1: Embedding Compliance Logic in UI Components

**What people do:** Calculate deadline status or risk level inside a React component or a SQL query inline in a page.

**Why it's wrong:** Logic gets duplicated across dashboard, entity detail, compliance calendar, and alerts. Any rule change (e.g., "Luxembourg annual filing is now March 31, not April 30") requires finding and updating multiple scattered callsites.

**Do this instead:** All deadline and risk logic lives exclusively in `lib/compliance-engine/`. Every page that needs risk data reads from the pre-computed `compliance_requirements` or `alerts` tables — not from inline calculations.

### Anti-Pattern 2: Calling Gemini Directly from Client Components

**What people do:** Import `@google/generative-ai` in a client component, pass the API key via env var prefixed with `NEXT_PUBLIC_`.

**Why it's wrong:** Exposes Gemini API key to every browser user. Also prevents streaming control, token budget enforcement, and prompt centralization.

**Do this instead:** All Gemini calls go through `/api/ai/*` Route Handlers. API key is `GEMINI_API_KEY` (not `NEXT_PUBLIC_`). Prompts are defined in `lib/ai/drafter.ts` and `lib/ai/extractor.ts`, not inline.

### Anti-Pattern 3: One Monolithic Entity Detail Page with All Data Fetched Upfront

**What people do:** Fetch entity + all directors + all compliance requirements + all documents + all alerts in one massive join for every entity page load.

**Why it's wrong:** Entity detail has tabs. Most users look at the overview tab. Fetching documents and full compliance history on every load wastes DB round-trips and slows initial paint.

**Do this instead:** Entity overview fetches core entity data + current-year compliance summary. Each tab (Compliance, Documents) fetches its own data via a nested Server Component or `<Suspense>` boundary. This pattern is natural with the Next.js App Router.

### Anti-Pattern 4: Modeling Jurisdiction Rules as Separate Tables

**What people do:** Create `annual_filing_rules`, `tax_deadline_rules`, `agent_renewal_rules` tables, one row per rule type per jurisdiction, and join them at query time.

**Why it's wrong:** For a single-tenant internal tool with 20 jurisdictions, this is premature normalization. Joining across 5 rule tables for every compliance calculation adds query complexity with no benefit at this scale.

**Do this instead:** Store jurisdiction rules as a `jsonb` column on the `jurisdictions` table. The compliance engine parses the JSON into typed TypeScript structs. If rules become complex enough to warrant normalization, the engine abstraction makes that refactor safe.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Gemini API | Server-side HTTP via `@google/generative-ai` SDK, called from Route Handlers | Use `gemini-1.5-pro` for document extraction (large context); `gemini-1.5-flash` for drafting (faster, cheaper). Stream drafting responses. |
| Supabase Postgres | `@supabase/ssr` server client in Server Components + Route Handlers; `@supabase/supabase-js` anon client for any real-time needs | Use service role key server-side. Never expose service role to browser. |
| Supabase Storage | Signed URLs for document downloads; direct upload from Route Handler for AI-processed files | Keep documents in a private bucket; generate short-lived signed URLs for display. |
| Vercel | Deploy Next.js app; set GEMINI_API_KEY and SUPABASE_* as environment variables | No special configuration needed beyond standard Next.js on Vercel. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI components ↔ Server Components | Props (data passed down from server fetch) | No client-side Supabase calls |
| Server Components ↔ Supabase | Direct query via server client | Service role bypasses RLS (single-tenant, no auth required for demo) |
| Route Handlers ↔ Compliance Engine | Direct TypeScript import | Engine is stateless; handler owns persistence |
| Route Handlers ↔ Gemini | `@google/generative-ai` SDK | Prompts defined in `lib/ai/`; not inlined in route handlers |
| Client ↔ Route Handlers (AI) | `fetch()` with streaming response | Client uses `ReadableStream` to display streamed draft text |

---

## Sources

- [Legal Entity Management Systems, Data & Process Strategy in 2025](https://www.crosscountry-consulting.com/insights/blog/legal-entity-management-efficiency-technology/) — LEM component taxonomy
- [What Is a Legal Entity Management Database? | Blueprint](https://insights.diligent.com/entity-management/what-is-a-legal-entity-management-database/) — entity data model reference
- [How to Design Database for Compliance Management Systems](https://www.geeksforgeeks.org/dbms/how-to-design-database-for-compliance-management-systems/) — schema design patterns
- [Next.js + Supabase app in production: what would I do differently](https://catjam.fi/articles/next-supabase-what-do-differently) — Server Component + RLS patterns
- [Use Supabase with Next.js | Supabase Docs](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) — official integration pattern
- [Gemini AI with Next.js 15: A Comprehensive Guide](https://dev.to/shubhamtiwari909/gemini-ai-next-js-15-tailwind-1247) — Gemini + Next.js integration patterns
- [Market Research Agent with Gemini and the AI SDK by Vercel](https://ai.google.dev/gemini-api/docs/vercel-ai-sdk-example) — Gemini streaming architecture

---

*Architecture research for: Multi-entity legal ops management platform (Hopae)*
*Researched: 2026-03-13*
