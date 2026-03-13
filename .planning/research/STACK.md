# Stack Research

**Domain:** Enterprise legal entity management / compliance ops platform (internal tooling)
**Researched:** 2026-03-13
**Confidence:** HIGH — all versions verified via npm registry; patterns verified against official docs

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.1.6 | Full-stack React framework | App Router + Server Components eliminate the need for a separate API layer. Server Actions handle mutations without a REST API. Zero-config Vercel deployment. The only React framework where SSR, RSC, and edge functions are first-class. |
| TypeScript | 5.x (bundled with Next.js) | Type safety across the entire app | Legal entity data has complex nested shapes (per-country compliance rules, intercompany structures). TypeScript catches wrong-field bugs at write time, not demo time. Strict mode required. |
| React | 19.x (bundled with Next.js 15+) | UI rendering | Concurrent features + `use()` hook work natively with Next.js 15 RSC patterns. |
| Supabase | `@supabase/supabase-js` 2.99.1 | PostgreSQL database + real-time + storage | Hosted Postgres means no migration hassle. Built-in file storage for legal documents. Row-level security for future auth needs. Works perfectly with Vercel. The SSR package (`@supabase/ssr` 0.9.0) is the correct modern approach — not the deprecated `auth-helpers` packages. |
| shadcn/ui | Latest CLI (Tailwind v4 compatible) | Component library | Copy-owned components mean no version lock-in. Built on Radix primitives for accessibility. The data-table pattern (Table + TanStack) is the standard dense enterprise table approach. Full Tailwind v4 support as of 2025. |
| Tailwind CSS | 4.2.1 | Utility-first styling | v4 removes the config file entirely — CSS-first configuration via `@theme`. Pairs directly with shadcn/ui v4 path. 10x faster build times vs v3 due to Rust engine (Oxide). Required for the enterprise density aesthetic. |
| Gemini API (`@google/genai`) | 1.45.0 | AI document drafting, extraction, compliance intelligence | This is the unified Google GenAI SDK that reached GA in May 2025. The old `@google/generative-ai` package is deprecated as of Nov 2025 — do not use it. Supports document analysis (up to 1000 PDF pages), structured output, and streaming. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tanstack/react-table` | 8.21.3 | Headless data table engine | Use for every entity list, compliance matrix, and deadline tracker. Provides server-side pagination, multi-column sorting, faceted filtering, and column resizing. shadcn/ui's `DataTable` component is a thin wrapper over this. It handles 50,000+ rows with sub-50ms sort/filter when paired with server-side pagination. |
| `@tanstack/react-query` | 5.90.21 | Server-state caching and synchronization | Use for all data fetching that runs in Client Components. v5 has cleaner API than v4: `gcTime` replaces `cacheTime`, `staleTime` controls freshness. Handles background refetch, optimistic updates, and loading/error states automatically. Pairs with Zustand for UI state. |
| `zustand` | 5.0.11 | Lightweight client-side state | Use for UI state only: selected entity, open panel state, filter sidebar visibility. Do NOT use for server data — that's TanStack Query's job. Zustand v5 is smaller and has cleaner TypeScript inference than v4. |
| `react-hook-form` | 7.71.2 | Form state management | Use for all compliance forms, entity creation forms, and document metadata forms. Minimal re-renders (input-level, not form-level). Required for entity edit workflows. |
| `zod` | 4.3.6 | Schema validation and type inference | Use as the single source of truth for all data shapes. Define entity schemas in Zod, infer TypeScript types from them, use `zodResolver` with react-hook-form. v4 is the current release — faster parsing, better error messages. |
| `@hookform/resolvers` | 5.2.2 | Bridge between Zod and react-hook-form | Always install alongside zod + react-hook-form. The `zodResolver` adapter is the standard pattern. |
| `date-fns` | 4.1.0 | Date manipulation and formatting | Use for all deadline calculations (days until filing, overdue days, relative dates). Better than `dayjs` for tree-shaking. Critical for multi-jurisdiction date arithmetic. Do NOT use `moment` — deprecated and 67KB. |
| `recharts` | 3.8.0 | Chart rendering (via shadcn/ui Chart) | Use via shadcn's `Chart` component wrapper, which handles theming. Use for entity health overview charts, compliance status pie charts, deadline timeline bars. |
| `lucide-react` | 0.577.0 | Icon set | Already installed as part of shadcn/ui. Consistent with the shadcn aesthetic. Do not mix with heroicons or react-icons. |
| `sonner` | 2.0.7 | Toast notifications | The official shadcn/ui toast replacement. Use for AI operation feedback ("Document drafted"), deadline alert confirmations, and async action results. |
| `@supabase/ssr` | 0.9.0 | Supabase SSR client factory | Required for correct cookie-based session handling in Next.js App Router. Creates both server-side and client-side Supabase clients correctly. Do not use `@supabase/auth-helpers-nextjs` — it is deprecated. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint (Next.js config) | Code quality | Use `eslint-config-next` — ships with Next.js. Enable `@typescript-eslint/no-explicit-any` to catch weak typing in entity data models. |
| Prettier | Code formatting | Configure `tailwindcss` plugin for automatic class sorting. Single consistent format matters when building fast. |
| `tsx` / `ts-node` | Run TypeScript scripts | Useful for seed scripts that populate realistic dummy entity data into Supabase. |
| Vercel CLI | Local deployment preview | `vercel dev` mirrors production environment including edge functions. Run before final submission to verify. |

---

## Installation

```bash
# Bootstrap
npx create-next-app@latest hopae --typescript --tailwind --app --src-dir --import-alias "@/*"

# Initialize shadcn/ui (Tailwind v4 path)
npx shadcn@latest init

# Core data and state
npm install @tanstack/react-table @tanstack/react-query zustand

# Forms and validation
npm install react-hook-form zod @hookform/resolvers

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# AI
npm install @google/genai

# Utilities
npm install date-fns recharts sonner lucide-react

# Dev dependencies
npm install -D @types/node
```

Key shadcn/ui components to add after init:
```bash
npx shadcn@latest add table button badge dialog sheet sidebar command
npx shadcn@latest add select input label textarea card separator scroll-area
npx shadcn@latest add dropdown-menu tooltip popover alert sonner chart
```

---

## Supabase Client Pattern (Critical)

Two clients are required in Next.js App Router — one for server context, one for client context:

```typescript
// lib/supabase/server.ts — for Server Components, Server Actions, Route Handlers
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
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// lib/supabase/client.ts — for Client Components only
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Do NOT call `getSession()` for authorization checks — it reads from cookies without server verification. Use `getUser()` instead when auth is needed.

---

## Gemini API Pattern

Use the new unified SDK (`@google/genai`), not the deprecated `@google/generative-ai`:

```typescript
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

// For document analysis (legal PDFs, compliance filings)
const result = await ai.models.generateContent({
  model: 'gemini-2.5-flash',   // best balance of accuracy and speed for doc analysis
  contents: [
    { inlineData: { mimeType: 'application/pdf', data: base64PdfData } },
    { text: 'Extract all compliance deadlines and obligations as structured JSON' }
  ],
  config: { responseMimeType: 'application/json' }
})

// For text drafting (intercompany agreements, compliance filings)
const draft = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [{ text: draftingPrompt }]
})
```

**Model selection:** Use `gemini-2.5-flash` for all operations. It achieves 80% correctness on complex extraction tasks and is substantially faster and cheaper than `gemini-2.5-pro`. The demo does not need Pro-tier quality — Flash will look excellent.

**GEMINI_API_KEY** is server-only — never prefix with `NEXT_PUBLIC_`. Call Gemini exclusively from Server Actions or Route Handlers.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@google/genai` 1.45.0 | `@google/generative-ai` (old SDK) | Never — deprecated Nov 2025, missing Live API, Veo, and newer features |
| TanStack Query v5 | SWR | SWR is simpler but lacks the mutation pipeline, optimistic updates, and infinite query features needed for compliance workflow state |
| Zustand v5 | Redux Toolkit | Redux only if team is already standardized on it with 5+ devs; overkill for a single internal tool |
| Supabase | Prisma + raw PG | Prisma adds migration complexity without benefit on a 5-hour build. Supabase SDK gives direct table access with TypeScript autocomplete. |
| date-fns v4 | dayjs | dayjs has no tree-shaking; date-fns v4 is fully modular. For compliance deadlines across 20+ jurisdictions, immutable dates and locale support matter. |
| Tailwind CSS v4 | Tailwind CSS v3 | Use v3 only if existing project is on v3 and migration cost outweighs benefit. For greenfield, v4's Oxide engine and CSS-first config is clearly superior. |
| recharts (via shadcn Chart) | Chart.js, Victory, Nivo | Recharts is already embedded in shadcn/ui. Using another library adds bundle weight and breaks theme consistency. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@google/generative-ai` | Deprecated as of November 30, 2025. Does not support Live API, Veo, or features added after 2024. | `@google/genai` 1.45.0 |
| `@supabase/auth-helpers-nextjs` | Deprecated. The SSR package consolidates all framework adapters. | `@supabase/ssr` |
| `moment` | 67KB, deprecated, mutable dates are a bug source in deadline calculations | `date-fns` v4 |
| Redux / Redux Toolkit | 3-5x more boilerplate than Zustand for the same UI state; adds mental overhead with no architectural benefit for a single-team internal tool | Zustand + TanStack Query |
| `next-auth` | Auth is explicitly out of scope per PROJECT.md. Adding it now creates unnecessary complexity. | Nothing — skip auth for demo |
| `react-query` v4 | v5 has breaking API changes (`cacheTime` → `gcTime`, new `useMutation` shape). Using v4 means fighting deprecation warnings immediately. | `@tanstack/react-query` v5 |
| `pages/` Router | App Router is the current standard. Pages Router is in maintenance mode. RSC and Server Actions don't work with it. | App Router only |
| `axios` | `fetch` is native in Next.js (with deduplication and caching built in for RSC). Axios adds 8KB for zero benefit. | Native `fetch` in RSC / Server Actions |
| `tailwindcss-animate` | Replaced by `tw-animate-css` in Tailwind v4 ecosystem. The old package causes conflicts with Tailwind v4. | `tw-animate-css` (comes with shadcn init) |

---

## Stack Patterns by Variant

**For dense data tables (entity list, compliance matrix):**
- Use `@tanstack/react-table` with shadcn `<Table>` primitives
- Enable server-side pagination from the start — even with 60 entities, column count is wide enough to need it
- Column visibility toggling is a must for enterprise ops feel
- Use `faceted filters` for jurisdiction, entity status, compliance state

**For compliance deadline tracking:**
- Model deadlines as database rows with `due_date`, `entity_id`, `jurisdiction`, `type`, `status` columns
- Use `date-fns` `differenceInDays`, `isPast`, `isWithinInterval` for risk categorization
- Use shadcn `Badge` with color variants (red = overdue, amber = <30 days, green = ok)

**For AI document operations:**
- Always call Gemini from Server Actions — never expose the API key to the client
- Use streaming responses (`generateContentStream`) for long document drafts to avoid timeout
- Store AI-generated drafts in Supabase Storage as `.md` files; render with a simple Markdown viewer

**For the demo (5-hour cap constraint):**
- Seed all entity data as SQL — do not build entity CRUD forms first
- Build the dashboard and entity list table before any AI features — it's the visual anchor
- Use Supabase in local development mode (`supabase start`) or connect to a free-tier hosted project

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 16.x | React 19.x | React 19 is the minimum for Next.js 16+. Do not attempt to downgrade to React 18. |
| shadcn/ui (latest) | Tailwind CSS v4.x | Full v4 support confirmed in official docs. The CLI init detects Tailwind version automatically. |
| `@supabase/ssr` 0.9.x | `@supabase/supabase-js` 2.x | Both must be from the v2 family. Do not mix with v1 client imports. |
| `@tanstack/react-table` 8.x | React 18+ and React 19 | No breaking changes between React 18→19 for table usage. |
| `@tanstack/react-query` 5.x | React 18+ | v5 requires React 18+ minimum. Works with React 19 without changes. |
| `zod` 4.x | `@hookform/resolvers` 5.x | zod v4 requires resolvers v5+. Earlier resolver versions only support zod v3 schema API. |
| `@google/genai` 1.x | Node.js 18+ | Requires Node 18+ (native fetch). Next.js 15+ ships with Node 18+ requirement anyway. |

---

## Environment Variables

```bash
# .env.local (never commit)
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # safe to expose — RLS enforces access
GEMINI_API_KEY=AIza...                         # server-only, NO NEXT_PUBLIC_ prefix
```

GEMINI_API_KEY must never be prefixed with `NEXT_PUBLIC_`. Next.js will bundle it into client JavaScript if prefixed, exposing it to anyone who views source.

---

## Sources

- npm registry (verified 2026-03-13): next@16.1.6, @google/genai@1.45.0, @tanstack/react-table@8.21.3, @supabase/supabase-js@2.99.1, @supabase/ssr@0.9.0, zod@4.3.6, react-hook-form@7.71.2, zustand@5.0.11, @tanstack/react-query@5.90.21, tailwindcss@4.2.1, date-fns@4.1.0, recharts@3.8.0, lucide-react@0.577.0, sonner@2.0.7 — HIGH confidence
- [Supabase SSR Docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — @supabase/ssr client patterns, deprecated auth-helpers confirmation — HIGH confidence
- [Gemini API Libraries](https://ai.google.dev/gemini-api/docs/libraries) — @google/genai GA status, deprecated @google/generative-ai — HIGH confidence
- [googleapis/js-genai GitHub](https://github.com/googleapis/js-genai) — SDK capabilities, document analysis (1000 PDF pages), structured output — HIGH confidence
- [TanStack Table v8](https://tanstack.com/table/v8) — Headless table API, server-side capabilities — HIGH confidence
- [shadcn/ui Tailwind v4 Docs](https://ui.shadcn.com/docs/tailwind-v4) — v4 compatibility confirmed, CLI updates — HIGH confidence
- WebSearch: TanStack Query v5 vs Zustand pattern (2025), Gemini 2.5 Flash document extraction accuracy — MEDIUM confidence (cross-validated with official sources)
- WebSearch: Zod v4 + react-hook-form v7 integration (2025) — MEDIUM confidence

---

*Stack research for: Hopae Entity Management Platform — legal entity ops internal tooling*
*Researched: 2026-03-13*
