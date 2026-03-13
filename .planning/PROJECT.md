# Hopae Entity Management Platform

## What This Is

A web-based operations platform that centralizes management of Hopae's global legal entities — currently 9+ across multiple countries, scaling to 60+ across 20+ jurisdictions within 24 months. It replaces scattered inboxes, Notion pages, Google Drive folders, and tribal knowledge with a single source of truth powered by AI workflows. The target: routine entity ops go from full-time daily work to ~1 hour of human oversight per week.

## Core Value

An extremely lean ops team can reliably manage 60+ legal entities across 20+ jurisdictions without missing deadlines, losing documents, or burning out — because AI handles the routine and surfaces only what needs human attention.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Centralized entity data hub with all 60+ entities visible at a glance
- [ ] Per-entity detail views: incorporation, banking, directors, compliance status, intercompany agreements
- [ ] Compliance deadline tracking with per-country rules (annual filings, tax deadlines, registered agent renewals)
- [ ] Risk-based alerting: upcoming deadlines, overdue items, entities at risk of fines/dissolution
- [ ] AI-powered document drafting via Gemini (compliance filings, intercompany agreements)
- [ ] AI document data extraction (parse legal correspondence, extract key dates/obligations)
- [ ] Document signature routing workflows
- [ ] Dashboard overview: entity health across all jurisdictions at a glance
- [ ] Very realistic dummy data reflecting Hopae's actual scale and jurisdictions
- [ ] Enterprise-feel UI: dense data tables, sidebar navigation, internal ops tooling aesthetic

### Out of Scope

- Actual integration with national eID providers — this is the ops layer, not the identity verification layer
- Real legal/tax advice — AI drafts are starting points, not legal opinions
- Multi-tenant SaaS — this is an internal tool for Hopae's ops team
- Mobile app — desktop-first internal tooling
- User authentication/RBAC — demo focuses on functionality, not access control

## Context

**Business context:** Hopae connects to national electronic identity providers worldwide. Most providers require a locally incorporated entity to hold a production key, and keys can't be shared. Some customers need their own dedicated entity that Hopae sets up and manages. Every new country, provider, or customer can mean a new legal entity.

**Current pain:** Entity data, legal correspondence, compliance deadlines, and documents awaiting signature are scattered across inboxes, Notion pages, Google Drive folders, and people's heads. Nothing is centralized or reliably current. The ops team is extremely lean.

**Scale trajectory:** 9+ countries today → 60+ entities across 20+ jurisdictions within 24 months. Current processes don't scale.

**Intercompany structure:** All entities have intercompany agreements with Luxembourg HQ. Compliance requirements vary by country — annual filings, tax deadlines, registered agent renewals. Missing a deadline can mean fines or dissolution.

**Assignment constraints:** This is a CEO Staff assignment for Hopae. 5-hour hard cap. Submission must take reviewers under 3 minutes to evaluate. What we build and how we decided what to build both matter.

## Constraints

- **Time**: 5-hour hard cap on implementation
- **Tech stack**: Next.js + TypeScript, Supabase, shadcn/ui, Gemini API
- **Data**: Dummy data only — no access to actual Hopae business data. Must be very realistic.
- **Deployment**: Must work locally and deploy to Vercel
- **Review**: Submission must be reviewable in under 3 minutes — prioritize impressive demo flow
- **AI**: Gemini for document analysis, drafting, and compliance intelligence

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + Supabase + shadcn/ui | Fast to build, deploys to Vercel, enterprise-ready components | — Pending |
| Gemini for AI features | User preference | — Pending |
| Full demo mode over backend depth | 5-hour cap means we prioritize impressive, reviewable demo flow | — Pending |
| Enterprise-feel UI | Internal ops tooling should feel dense and data-rich, not consumer-pretty | — Pending |
| Very realistic dummy data | Reviewers should feel like they're looking at real ops data | — Pending |

---
*Last updated: 2026-03-13 after initialization*
