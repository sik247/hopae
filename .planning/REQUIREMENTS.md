# Requirements: Hopae Entity Management Platform

**Defined:** 2026-03-13
**Core Value:** An extremely lean ops team can reliably manage 60+ legal entities across 20+ jurisdictions without missing deadlines — because AI handles the routine and surfaces only what needs human attention.

## v1 Requirements

### Entity Registry

- [x] **ENTY-01**: User can view a list of all 60+ entities with jurisdiction, status, type, and incorporation date
- [x] **ENTY-02**: User can view detailed entity profile: directors, banking details, registered agent, compliance status
- [x] **ENTY-03**: User can see entity hierarchy (Luxembourg HQ → subsidiaries) in a tree/org view
- [x] **ENTY-04**: User can view intercompany agreements between each entity and Luxembourg HQ
- [x] **ENTY-05**: User can filter/search entities by jurisdiction, status, risk level, and type

### Compliance & Deadlines

- [x] **COMP-01**: System computes compliance deadlines from jurisdiction-specific rules (annual filings, tax, registered agent renewals)
- [x] **COMP-02**: User can view a compliance calendar showing all upcoming deadlines across entities
- [x] **COMP-03**: System alerts on overdue, due-soon (30 days), and at-risk items
- [x] **COMP-04**: User can see a risk dashboard with urgency signals across all entities
- [x] **COMP-05**: Each entity shows its compliance timeline with status per obligation

### AI Document Operations

- [x] **AIDOC-01**: User can generate draft compliance filings via Gemini for a specific entity
- [x] **AIDOC-02**: User can generate draft intercompany agreements via Gemini between entity and HQ
- [x] **AIDOC-03**: User can extract key dates, obligations, and parties from uploaded legal documents via Gemini
- [x] **AIDOC-04**: User can route documents for signature with status tracking (draft → sent → signed)
- [x] **AIDOC-05**: AI outputs include grounding context from entity database to prevent hallucination

### Dashboard & Overview

- [x] **DASH-01**: User sees a global dashboard with entity health, compliance status, and action items at a glance
- [x] **DASH-02**: Dashboard shows a jurisdiction risk heatmap (visual map or grid)
- [x] **DASH-03**: User can view AI-generated compliance briefings summarizing current state
- [x] **DASH-04**: Dashboard surfaces the most urgent items requiring human attention

### Integrations

- [x] **INTG-01**: Platform connects to Notion to pull/display entity-related data from existing Notion pages
- [x] **INTG-02**: Platform connects to Google Drive to browse/link legal documents stored there
- [x] **INTG-03**: Integrations show data inline within entity profiles (linked Notion pages, Drive documents)

### Data & Realism

- [x] **DATA-01**: Seed database with 60+ realistic entities across 20+ jurisdictions with proper local naming (Hopae KK, Hopae Pte Ltd, Hopae GmbH, etc.)
- [x] **DATA-02**: Seed jurisdiction-specific compliance rules for all represented countries
- [x] **DATA-03**: Seed realistic compliance deadlines with dramatic tension (some overdue, some due soon, some healthy)
- [x] **DATA-04**: Seed realistic directors, banking details, registered agents, and intercompany agreements
- [x] **DATA-05**: Entity data reflects Hopae's actual business model (eID provider keys, customer-dedicated entities)

## v2 Requirements

### Notifications

- **NOTF-01**: Email/Slack alerts for upcoming compliance deadlines
- **NOTF-02**: Weekly compliance digest email

### Audit Trail

- **AUDT-01**: All entity changes logged with timestamp and actor
- **AUDT-02**: Compliance action history per entity

### Automation

- **AUTO-01**: Auto-generate recurring compliance tasks from jurisdiction rules
- **AUTO-02**: Auto-assign tasks to ops team members

## Out of Scope

| Feature | Reason |
|---------|--------|
| User authentication / RBAC | Demo focuses on functionality, not access control |
| Real e-filing integrations | Would require actual government API access |
| Cap table management | Not relevant to Hopae's entity structure |
| Mobile app | Desktop-first internal ops tooling |
| Multi-tenant SaaS | Internal tool for Hopae's ops team |
| Real e-signature (DocuSign) | Status-based simulation sufficient for demo |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENTY-01 | Phase 3 | Complete |
| ENTY-02 | Phase 4 | Complete |
| ENTY-03 | Phase 4 | Complete |
| ENTY-04 | Phase 4 | Complete |
| ENTY-05 | Phase 3 | Complete |
| COMP-01 | Phase 5 | Complete |
| COMP-02 | Phase 6 | Complete |
| COMP-03 | Phase 5 | Complete |
| COMP-04 | Phase 6 | Complete |
| COMP-05 | Phase 6 | Complete |
| AIDOC-01 | Phase 8 | Complete |
| AIDOC-02 | Phase 8 | Complete |
| AIDOC-03 | Phase 9 | Complete |
| AIDOC-04 | Phase 9 | Complete |
| AIDOC-05 | Phase 8 | Complete |
| DASH-01 | Phase 7 | Complete |
| DASH-02 | Phase 7 | Complete |
| DASH-03 | Phase 7 | Complete |
| DASH-04 | Phase 7 | Complete |
| INTG-01 | Phase 10 | Complete |
| INTG-02 | Phase 10 | Complete |
| INTG-03 | Phase 10 | Complete |
| DATA-01 | Phase 2 | Complete |
| DATA-02 | Phase 2 | Complete |
| DATA-03 | Phase 2 | Complete |
| DATA-04 | Phase 2 | Complete |
| DATA-05 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after roadmap creation — all 27 requirements mapped*
