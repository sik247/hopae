# Phase 1: Project Foundation - Research

**Researched:** 2026-03-13
**Domain:** Next.js scaffold + Supabase schema + shadcn/ui enterprise navigation shell
**Confidence:** HIGH — stack and patterns verified against official docs and prior STACK.md/ARCHITECTURE.md research

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Seed database with 60+ realistic entities across 20+ jurisdictions | Schema design: entities table with jurisdiction_id FK, entity_type, parent_entity_id, metadata JSONB columns enable Phase 2 seed work |
| DATA-02 | Seed jurisdiction-specific compliance rules for all represented countries | Schema design: jurisdictions table with filing_rules JSONB column captures per-country rule sets |
| DATA-05 | Entity data reflects Hopae's actual business model (eID provider keys, customer-dedicated entities) | Schema design: entity_type column (provider_key / customer_entity / hq) + purpose field captures business model distinctions |
</phase_requirements>

---

## Summary

Phase 1 is entirely scaffolding and schema — no business logic, no seed data, no AI calls. The deliverables are: a running Next.js app, a Supabase Postgres connection, the complete database schema in migrations, and an enterprise sidebar navigation shell that all future phases build on.

The project is greenfield (empty directory). `create-next-app` with TypeScript + Tailwind + App Router + src-dir is the correct bootstrap. shadcn/ui is initialized immediately after via `npx shadcn@latest init`, which auto-detects Tailwind v4. The Sidebar component (a first-class shadcn/ui primitive as of 2024-2025) is installed via `npx shadcn@latest add sidebar` and wired into the root `app/layout.tsx` using `SidebarProvider` + `AppSidebar`.

The Supabase schema covers all tables required through Phase 9: entities, jurisdictions, directors, compliance_requirements, documents, alerts, and intercompany_agreements. All tables are defined in a single initial migration SQL file. No seed data is included in Phase 1 — that is Phase 2's scope. The schema must include `entity_type`, `parent_entity_id` (self-referencing FK for hierarchy), and `metadata JSONB` on entities per the Phase 1 success criteria. Environment variables are wired up and documented in `.env.example`.

**Primary recommendation:** Bootstrap with `create-next-app`, init shadcn, add the Sidebar component, create Supabase clients, write the complete SQL schema migration, and wire env vars. Keep Phase 1 strictly foundational — no data, no compliance logic, no AI.

---

## Standard Stack

### Core (all versions from STACK.md, verified 2026-03-13)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | Full-stack React framework with App Router | SSR + Server Components first-class; `create-next-app` bootstraps cleanly |
| TypeScript | 5.x (bundled) | Type safety | Entity data model is complex nested JSON — strict mode catches shape errors at write time |
| Tailwind CSS | 4.2.1 | Utility-first styling | v4 CSS-first config via `@theme`, no `tailwind.config.js` needed; shadcn/ui CLI detects automatically |
| shadcn/ui | Latest CLI | Component library | Sidebar, Table, Badge, Card primitives are exact enterprise-UI needs; copy-owned components |
| `@supabase/supabase-js` | 2.99.1 | Supabase Postgres client | Typed table access; needed alongside `@supabase/ssr` |
| `@supabase/ssr` | 0.9.0 | Next.js App Router Supabase client factory | Required for `createServerClient` / `createBrowserClient` pattern |
| `lucide-react` | 0.577.0 | Icons | Ships with shadcn/ui; used for sidebar nav icons |

### Supporting (Phase 1 minimum install — others added in later phases)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tanstack/react-query` | 5.90.21 | Server-state caching | Install now so QueryClientProvider is in the root layout; actual queries start Phase 3+ |
| `zustand` | 5.0.11 | UI state | Install now; sidebar collapse state is its first use |
| `sonner` | 2.0.7 | Toast notifications | Install now; `<Toaster />` goes in root layout |

### Installation

```bash
# 1. Bootstrap
npx create-next-app@latest hopae --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd hopae

# 2. Initialize shadcn/ui (detects Tailwind v4 automatically)
npx shadcn@latest init

# 3. Install shadcn components needed for Phase 1 nav shell
npx shadcn@latest add sidebar button badge separator scroll-area

# 4. Install Supabase
npm install @supabase/supabase-js @supabase/ssr

# 5. Install state/query (wire up providers now, use later)
npm install @tanstack/react-query zustand sonner

# 6. Additional components that Phase 1 nav shell needs
npx shadcn@latest add tooltip dropdown-menu
```

---

## Architecture Patterns

### Recommended Project Structure (Phase 1 scope — what gets created THIS phase)

```
src/
├── app/
│   ├── layout.tsx                # Root layout: SidebarProvider + AppSidebar + providers
│   ├── page.tsx                  # Redirects to /dashboard (or placeholder)
│   └── dashboard/
│       └── page.tsx              # Placeholder — "Dashboard coming in Phase 7"
│
├── components/
│   ├── ui/                       # shadcn/ui auto-generated primitives
│   └── layout/
│       ├── app-sidebar.tsx       # The enterprise sidebar component
│       ├── sidebar-nav.tsx       # Nav item config + rendering
│       └── header.tsx            # Top bar with page title + breadcrumb placeholder
│
└── lib/
    ├── supabase/
    │   ├── client.ts             # createBrowserClient (Client Components)
    │   └── server.ts             # createServerClient (Server Components + Actions)
    └── utils/
        └── cn.ts                 # Tailwind class merge utility (shadcn auto-creates this)

supabase/
└── migrations/
    └── 20260313000000_initial_schema.sql   # ALL tables — Phase 1 deliverable
```

### Pattern 1: shadcn/ui Sidebar in App Router Layout

**What:** The `SidebarProvider` wraps the entire application in `app/layout.tsx`. `AppSidebar` contains navigation items driven by a config array. `SidebarTrigger` appears in the header for collapse/expand.

**When to use:** Everywhere — this is the persistent application shell for all 11 phases.

**Key facts about the shadcn Sidebar component:**
- Installed via: `npx shadcn@latest add sidebar`
- Requires `SidebarProvider` at the root (layout.tsx)
- `SidebarProvider` props: `defaultOpen` (boolean), `open` (controlled), `onOpenChange` (callback)
- Keyboard shortcut `cmd+b` / `ctrl+b` toggles sidebar automatically
- Sub-components: `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`
- Sidebar state (open/closed) can be persisted in a cookie so it survives page navigation

**Example:**
```typescript
// app/layout.tsx
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  )
}
```

```typescript
// components/layout/app-sidebar.tsx — config-driven nav
"use client"
import { usePathname } from "next/navigation"
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarGroup,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Building2, Shield, FileText, LayoutDashboard } from "lucide-react"
import Link from "next/link"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Entities", href: "/entities", icon: Building2 },
  { label: "Compliance", href: "/compliance", icon: Shield },
  { label: "Documents", href: "/documents", icon: FileText },
]

export function AppSidebar() {
  const pathname = usePathname()
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-3 font-semibold text-sm">Hopae Ops</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                  <Link href={item.href}>
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
```

### Pattern 2: Supabase Dual-Client Setup

**What:** Two separate client factories — one for server context, one for browser context. Both use `@supabase/ssr`.

**Why two:** Next.js App Router requires separate handling of cookies for server vs. client. `createServerClient` reads/writes cookies via Next.js `cookies()`. `createBrowserClient` manages session in localStorage.

**Critical:** No auth is needed for this demo. The anon key is sufficient for all operations. Do NOT install `@supabase/auth-helpers-nextjs` — it is deprecated.

```typescript
// lib/supabase/server.ts — Server Components, Server Actions, Route Handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {} // setAll in Server Component read-only context — safe to ignore
        },
      },
    }
  )
}

// lib/supabase/client.ts — Client Components only
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Pattern 3: SQL Migration File

**What:** All schema tables defined in `supabase/migrations/20260313000000_initial_schema.sql`. Single migration file for Phase 1 — simplest approach for a greenfield project.

**When to use:** Create this file manually and run with `supabase db push` (hosted) or `supabase db reset` (local). No Supabase CLI local dev setup required for Phase 1 — just paste the SQL into the Supabase dashboard SQL editor OR use the CLI.

**File naming:** Timestamp prefix is required: `YYYYMMDDHHMMSS_description.sql`. The timestamp determines execution order.

**Note on Supabase local dev vs. hosted:** For speed, connect directly to a free-tier hosted Supabase project. Run the SQL via the dashboard SQL editor. Local `supabase start` requires Docker and adds setup time against the 5-hour cap.

### Anti-Patterns to Avoid

- **Installing `@supabase/auth-helpers-nextjs`:** Deprecated. Only `@supabase/ssr` is the current package.
- **Using `tailwindcss-animate`:** Conflicts with Tailwind v4. `tw-animate-css` comes automatically with shadcn init — do not install the old package.
- **Putting `SidebarProvider` inside a page instead of layout.tsx:** The sidebar must be in the root layout to avoid remounting on navigation.
- **Calling `cookies()` synchronously in Next.js 15+:** `cookies()` is now async in Next.js 15. Must `await cookies()` in the server client factory. (Already shown correctly in the pattern above.)
- **Using Pages Router:** App Router only. Pages Router cannot use Server Components or Server Actions.
- **Creating separate tables for each jurisdiction's compliance rules:** Store `filing_rules` as JSONB on the `jurisdictions` table (see ARCHITECTURE.md anti-pattern 4).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sidebar open/close state + persistence | Custom useState + localStorage logic | shadcn `SidebarProvider` | Handles keyboard shortcut, cookie persistence, mobile responsiveness, and animation out of the box |
| Icon set | Custom SVG icons | `lucide-react` (ships with shadcn) | Already installed; consistent stroke weight for enterprise aesthetic |
| Toast notifications | Custom toast component | `sonner` via shadcn | Already in shadcn ecosystem; `<Toaster />` in layout is 2 lines |
| CSS class merging | Custom string concat | `cn()` utility (shadcn auto-creates `lib/utils.ts`) | Handles Tailwind class conflicts correctly |
| TypeScript types for Supabase tables | Hand-written interfaces | `supabase gen types typescript` | CLI generates exact types from live schema — run after migration |

**Key insight:** shadcn/ui primitives cover the entire navigation shell. The only custom code in Phase 1 is the nav config array and the SQL schema.

---

## Complete Database Schema

This is the schema that must be created in the migration file. It covers all tables needed through Phase 9.

```sql
-- supabase/migrations/20260313000000_initial_schema.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Jurisdictions: country-level rule sets
CREATE TABLE jurisdictions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code  TEXT NOT NULL UNIQUE,  -- ISO 3166-1 alpha-2 (e.g., 'JP', 'DE', 'LU')
  country_name  TEXT NOT NULL,
  filing_rules  JSONB NOT NULL DEFAULT '{}',  -- { annual_filing_month, tax_deadline_doy, agent_renewal_month, ... }
  currency      TEXT,
  timezone      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Legal entities (self-referencing hierarchy via parent_entity_id)
CREATE TABLE entities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,          -- display name (e.g., "Hopae Japan")
  legal_name          TEXT NOT NULL,          -- legal name (e.g., "Hopae 株式会社")
  entity_type         TEXT NOT NULL,          -- LLC | Ltd | GmbH | KK | S.A.S | Branch | etc.
  entity_purpose      TEXT NOT NULL DEFAULT 'provider_key',  -- provider_key | customer_entity | hq
  jurisdiction_id     UUID NOT NULL REFERENCES jurisdictions(id),
  parent_entity_id    UUID REFERENCES entities(id),  -- null = top-level (HQ), set for subsidiaries
  incorporation_date  DATE,
  registration_number TEXT,
  status              TEXT NOT NULL DEFAULT 'active',  -- active | dormant | dissolving | dissolved
  banking_info        JSONB NOT NULL DEFAULT '{}',     -- { bank_name, account_number, currency, iban }
  registered_agent    JSONB NOT NULL DEFAULT '{}',     -- { name, address, renewal_date, email }
  metadata            JSONB NOT NULL DEFAULT '{}',     -- flexible: eID provider key ID, customer name, etc.
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Directors / officers per entity
CREATE TABLE directors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id   UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL,       -- Director | Secretary | Statutory Auditor | Manager | etc.
  nationality TEXT,
  start_date  DATE,
  end_date    DATE,                -- NULL = currently serving
  is_current  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compliance requirements (instantiated per entity, computed from jurisdiction rules)
CREATE TABLE compliance_requirements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id        UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL,  -- annual_filing | tax_return | agent_renewal | board_meeting | etc.
  due_date         DATE NOT NULL,
  fiscal_year      INTEGER,
  status           TEXT NOT NULL DEFAULT 'pending',  -- pending | in_progress | completed | overdue
  notes            TEXT,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents (AI-drafted, uploaded, or extracted)
CREATE TABLE documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id        UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  document_type    TEXT NOT NULL,  -- incorporation_cert | intercompany_agreement | filing | tax_return | etc.
  title            TEXT NOT NULL,
  storage_path     TEXT,           -- Supabase Storage path (null if not yet stored)
  source           TEXT NOT NULL DEFAULT 'uploaded',  -- uploaded | ai_drafted | ai_extracted
  signature_status TEXT NOT NULL DEFAULT 'not_required',  -- not_required | pending | signed
  signatories      JSONB NOT NULL DEFAULT '[]',          -- [{ name, email, signed_at }]
  extracted_data   JSONB NOT NULL DEFAULT '{}',          -- AI-extracted: dates, obligations, parties
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Intercompany agreements (entity ↔ HQ Luxembourg)
CREATE TABLE intercompany_agreements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  hq_entity_id    UUID NOT NULL REFERENCES entities(id),  -- Luxembourg HQ entity
  agreement_type  TEXT NOT NULL,  -- service_agreement | loan_agreement | ip_license | management_fee | etc.
  title           TEXT NOT NULL,
  effective_date  DATE,
  expiry_date     DATE,           -- NULL = evergreen
  governing_law   TEXT,           -- e.g., "Luxembourg"
  parties         JSONB NOT NULL DEFAULT '[]',  -- [{ name, role, entity_id }]
  key_terms       JSONB NOT NULL DEFAULT '{}',  -- { fee_amount, payment_terms, ip_scope, etc. }
  document_id     UUID REFERENCES documents(id),  -- linked document
  status          TEXT NOT NULL DEFAULT 'active',  -- active | expired | terminated | draft
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alerts (generated by compliance engine; persisted for dashboard display)
CREATE TABLE alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id        UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  requirement_id   UUID REFERENCES compliance_requirements(id) ON DELETE SET NULL,
  alert_type       TEXT NOT NULL,  -- overdue | due_soon | at_risk | info
  message          TEXT NOT NULL,
  due_date         DATE,
  resolved         BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_entities_jurisdiction_id ON entities(jurisdiction_id);
CREATE INDEX idx_entities_parent_entity_id ON entities(parent_entity_id);
CREATE INDEX idx_entities_status ON entities(status);
CREATE INDEX idx_compliance_requirements_entity_id ON compliance_requirements(entity_id);
CREATE INDEX idx_compliance_requirements_due_date ON compliance_requirements(due_date);
CREATE INDEX idx_compliance_requirements_status ON compliance_requirements(status);
CREATE INDEX idx_alerts_entity_id ON alerts(entity_id);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);
CREATE INDEX idx_directors_entity_id ON directors(entity_id);
CREATE INDEX idx_documents_entity_id ON documents(entity_id);
CREATE INDEX idx_intercompany_agreements_entity_id ON intercompany_agreements(entity_id);

-- Entity health summary view (used by Dashboard in Phase 7)
CREATE VIEW entity_health_summary AS
SELECT
  e.id,
  e.name,
  e.legal_name,
  e.entity_type,
  e.entity_purpose,
  e.status,
  e.incorporation_date,
  j.country_code,
  j.country_name,
  COUNT(cr.id) FILTER (WHERE cr.status = 'overdue') AS overdue_count,
  COUNT(cr.id) FILTER (WHERE cr.status = 'pending'
    AND cr.due_date BETWEEN NOW() AND NOW() + INTERVAL '30 days') AS due_soon_count,
  COUNT(cr.id) FILTER (WHERE cr.status IN ('pending', 'in_progress')) AS open_requirements,
  CASE
    WHEN COUNT(cr.id) FILTER (WHERE cr.status = 'overdue') > 0 THEN 'critical'
    WHEN COUNT(cr.id) FILTER (WHERE cr.status = 'pending'
      AND cr.due_date < NOW() + INTERVAL '14 days') > 0 THEN 'warning'
    ELSE 'ok'
  END AS risk_level
FROM entities e
JOIN jurisdictions j ON j.id = e.jurisdiction_id
LEFT JOIN compliance_requirements cr ON cr.entity_id = e.id
GROUP BY e.id, e.name, e.legal_name, e.entity_type, e.entity_purpose,
         e.status, e.incorporation_date, j.country_code, j.country_name;
```

---

## Common Pitfalls

### Pitfall 1: `cookies()` Must Be Awaited in Next.js 15+

**What goes wrong:** Calling `const cookieStore = cookies()` without `await` in the Supabase server client factory. This worked in Next.js 14 but is broken in 15+.

**Why it happens:** Next.js 15 made `cookies()`, `headers()`, and `params` async. The Supabase SSR docs have examples for both versions — easy to copy the old one.

**How to avoid:** Always `await cookies()` in `lib/supabase/server.ts`. The pattern in the Code Examples section above is correct.

**Warning signs:** TypeScript error: `Type 'ReadonlyRequestCookies' is not assignable to type...` or runtime errors about cookie reads.

### Pitfall 2: shadcn Init Overwriting Tailwind Config

**What goes wrong:** Running `npx shadcn@latest init` after `create-next-app` in a way that conflicts with the auto-generated `globals.css`.

**Why it happens:** `create-next-app` with Tailwind generates a `globals.css`. shadcn init regenerates it. If you've added custom styles before running shadcn init, they get overwritten.

**How to avoid:** Run `npx shadcn@latest init` immediately after `create-next-app` before adding any custom styles.

### Pitfall 3: Missing `SidebarProvider` Causes Sidebar State Errors

**What goes wrong:** Using `SidebarTrigger` or `useSidebar()` outside of `SidebarProvider` throws a runtime error: "useSidebar must be used within a SidebarProvider."

**Why it happens:** `AppSidebar` uses `useSidebar()` internally. If `SidebarProvider` is missing or placed below the sidebar in the tree, the context lookup fails.

**How to avoid:** `SidebarProvider` must wrap `AppSidebar` in `layout.tsx`. See the layout pattern in Code Examples.

### Pitfall 4: `entity_type` Column Name Collision Risk

**What goes wrong:** Postgres `type` is a reserved-ish keyword that causes confusion in some ORMs. Using `type` as a column name can cause subtle query issues.

**Why it happens:** The schema uses `entity_type` not `type` — this is intentional. Stick with this naming.

**How to avoid:** Always use `entity_type` (not `type`) when querying or seeding.

### Pitfall 5: Forgetting `tw-animate-css` vs `tailwindcss-animate`

**What goes wrong:** Installing `tailwindcss-animate` (the v3 package) causes conflicts with Tailwind v4.

**Why it happens:** The v3 package hooks into Tailwind's plugin system which changed in v4. shadcn init installs `tw-animate-css` automatically — the correct v4 package.

**How to avoid:** Never manually install `tailwindcss-animate`. Let `npx shadcn@latest init` handle it.

### Pitfall 6: Schema Must Include `parent_entity_id` (Not `hq_entity_id`)

**What goes wrong:** The ARCHITECTURE.md draft schema shows `hq_entity_id` on entities, but the Phase 1 success criteria explicitly require `parent_entity_id`.

**Why it matters:** The Phase 1 success criteria list `parent_entity_id` for hierarchy support (general parent-child, not just Luxembourg-specific). The schema above uses `parent_entity_id` correctly.

**How to avoid:** Use `parent_entity_id` as shown in the migration above.

---

## Environment Variables

```bash
# .env.local (never commit — add to .gitignore immediately)
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Server-only (no NEXT_PUBLIC_ prefix — never exposed to browser)
GEMINI_API_KEY=AIza...
```

```bash
# .env.example (commit this — documents required vars for teammates/reviewers)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

`.gitignore` must include `.env.local`. `create-next-app` adds `.env*.local` by default but confirm it's present.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — no test framework configured yet (greenfield project) |
| Config file | None — Wave 0 task creates this if needed |
| Quick run command | `npm run build` (type-check passes as proxy for Phase 1) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map

Phase 1 requirements are infrastructure/schema — not behavioral in the unit-testable sense. Validation is done via explicit smoke checks:

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | entities table exists with correct columns | smoke (SQL query) | Manual: Supabase dashboard Table Editor | N/A |
| DATA-02 | jurisdictions table with filing_rules JSONB | smoke (SQL query) | Manual: Supabase dashboard Table Editor | N/A |
| DATA-05 | entity_type + parent_entity_id + metadata JSONB columns on entities | smoke (SQL query) | Manual: Supabase dashboard Table Editor | N/A |
| (all) | `npm run dev` starts without errors | smoke | `npm run dev` + visual check | N/A |
| (all) | Enterprise sidebar navigation renders | smoke | `npm run dev` + visual check at localhost:3000 | N/A |
| (all) | TypeScript compiles clean | type-check | `npm run build` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run build` (TypeScript clean)
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** `npm run dev` starts clean + sidebar renders + all schema tables visible in Supabase dashboard

### Wave 0 Gaps

- [ ] `tsconfig.json` — created by `create-next-app`, verify `"strict": true` is set
- [ ] `next.config.ts` — created by `create-next-app`, no additions needed for Phase 1
- [ ] `.env.local` — must be created manually (not scaffolded)
- [ ] `.env.example` — must be created manually

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` 0.9.0 | 2024 | Use only `@supabase/ssr` |
| `tailwindcss-animate` | `tw-animate-css` | Tailwind v4 (2025) | shadcn init handles automatically |
| `tailwind.config.js` | CSS-first `@theme` in `globals.css` | Tailwind v4 (2025) | No config file needed |
| `@google/generative-ai` | `@google/genai` 1.45.0 | November 2025 | Phase 1 installs new SDK (not the deprecated one) |
| Custom sidebar build | shadcn `Sidebar` component (first-class primitive) | 2024-2025 | `npx shadcn@latest add sidebar` — don't build custom |
| `cookies()` synchronous | `await cookies()` | Next.js 15 | Breaking change — must await |
| `forwardRef` pattern in shadcn | Removed (React 19) | 2025 | shadcn components no longer use forwardRef |

---

## Open Questions

1. **Supabase project: hosted vs. local CLI**
   - What we know: Local `supabase start` requires Docker; hosted free-tier is instant
   - What's unclear: Whether the reviewer environment has Docker available
   - Recommendation: Use hosted Supabase free-tier project. Paste SQL into dashboard SQL editor. Document the project URL in `.env.example`. This is faster and doesn't require Docker for the demo.

2. **Next.js version: 15 vs. 16**
   - What we know: STACK.md documents Next.js 16.1.6. `create-next-app@latest` will install whatever is latest at run time.
   - What's unclear: Whether `npx create-next-app@latest` installs 15 or 16 right now
   - Recommendation: After scaffolding, run `npm list next` and verify. The Supabase SSR pattern (await cookies) is correct for both 15 and 16.

3. **shadcn `new-york` vs `default` style**
   - What we know: shadcn is phasing out `default` style in favor of `new-york` per the Tailwind v4 docs
   - What's unclear: Whether `npx shadcn@latest init` auto-selects new-york or prompts
   - Recommendation: Select `new-york` style during `shadcn init` — it has sharper, more enterprise-appropriate aesthetics. The planner should specify this in the init task.

---

## Sources

### Primary (HIGH confidence)
- `STACK.md` (`.planning/research/STACK.md`) — complete stack with verified npm versions
- `ARCHITECTURE.md` (`.planning/research/ARCHITECTURE.md`) — entity data model, project structure, patterns
- [shadcn/ui Sidebar docs](https://ui.shadcn.com/docs/components/sidebar) — SidebarProvider API, install command, layout pattern
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — v4 migration changes, component updates
- [shadcn/ui Next.js installation](https://ui.shadcn.com/docs/installation/next) — `npx shadcn@latest init -t next` command
- [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations) — migration file naming convention, supabase/migrations directory

### Secondary (MEDIUM confidence)
- WebSearch: shadcn sidebar enterprise patterns (2025) — SidebarProvider layout.tsx placement, config-driven nav items
- WebSearch: create-next-app Tailwind v4 shadcn 2026 — confirmed `--typescript --tailwind --app --src-dir --import-alias` flags
- [Supabase Local Dev](https://supabase.com/docs/guides/local-development/overview) — migration workflow context

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified in STACK.md against npm registry 2026-03-13
- Architecture: HIGH — patterns from ARCHITECTURE.md cross-verified with official Next.js + shadcn docs
- Database schema: HIGH — derived from ARCHITECTURE.md core schema with Phase 1 success criteria additions (parent_entity_id, metadata JSONB)
- Sidebar setup: HIGH — verified against official shadcn/ui sidebar docs
- Pitfalls: HIGH — Next.js 15 async cookies confirmed in official docs; others from STACK.md/ARCHITECTURE.md

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (Next.js and shadcn/ui move fast; re-verify if more than 30 days pass)
