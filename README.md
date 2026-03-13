# Hopae Ops — Entity Management Platform

**Applicant:** Harry (Sang In Kang) — [Personal Site](https://ai-strategy-portfolio.vercel.app/) · [GitHub](https://github.com/sik247) · [LinkedIn](https://www.linkedin.com/in/harry-k-a256b9b0/)

[Live Demo](https://hopae.vercel.app/dashboard) · [GitHub](https://github.com/sik247/hopae)

---

## Problem

Entity records live across disconnected sources — Notion pages, Google Drive folders, spreadsheets. An Ops Manager tracking 60+ subsidiaries across 20+ jurisdictions cannot see what is urgent without manually cross-referencing every source. A missed filing cascades into penalties, frozen bank accounts, or forced dissolution.

---

## How It Works

### 1. Connect your data sources

From the **Sources** page, add a Notion page URL or Google Drive folder URL. The system extracts the source ID and stores the connection.

- **Notion**: share a page with the Hopae integration, paste the URL
- **Google Drive**: share a folder with the service account, paste the URL

### 2. Scrape on demand

Click **Sync** on any source. The system reads data directly from the Notion API or Google Drive API:

- **Notion sources** — fetches child pages, extracts entity names, directors, banking info, and registered agent details from content blocks. Jurisdiction is inferred from the page content.
- **Google Drive sources** — lists country subfolders, then entity subfolders within each. Folder names map to jurisdiction and entity records.

All scraped data is upserted into Supabase (PostgreSQL) — the single source of truth.

### 3. Process with compliance engine + AI

Once data lands in Supabase, three systems process it:

- **Compliance Engine** (pure TypeScript) — calculates deadlines from jurisdiction rules, scores entity risk, aggregates alerts
- **LangGraph PII Agent** — scans entity fields and documents for PII, classifies findings with Gemini, recommends remediation per jurisdiction (GDPR, PDPA, DIFC)
- **Gemini 2.5 Flash** — generates structured compliance briefings with urgent/intermediate/good-standing tiers and entity hyperlinks

### 4. Surface on the dashboard

The dashboard presents everything an Ops Manager needs:

- **Urgent Actions** banner with overdue and at-risk items
- **AI Compliance Briefing** with source badges (Notion/Drive) per entity
- **Compliance Calendar** with deadline grouping and jurisdiction heatmap
- **Agent Chat** for natural-language compliance queries with email notifications

---

## Data Pipeline

```
Notion Pages  ──┐
                 ├──  Sync API  ──→  Supabase (PostgreSQL)  ──→  Compliance Engine  ──→  Dashboard
Drive Folders ──┘                    single source of truth       Risk Scorer             AI Briefing
                                                                  Alert Aggregator        Agent Chat
```

The key insight: **Notion and Google Drive are the sources of truth**. Supabase is populated by scraping them — not the other way around. No seed scripts, no fake data. The platform works with whatever entity data already lives in your existing tools.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Components) |
| Language | TypeScript (strict) |
| Database | Supabase (Postgres) |
| UI Components | shadcn/ui v2 |
| Data Tables | TanStack Table v8 |
| AI | Google Gemini 2.5 Flash via `@google/genai` |
| Agent Framework | LangGraph + LangChain |
| Styling | Tailwind CSS v4 |

---

## Setup

```bash
cp .env.example .env.local   # fill in env vars
npm install
npm run dev                   # http://localhost:3000
```

Then go to **/sources**, add your Notion/Drive links, and click Sync.

### Environment Variables

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |
| `NOTION_API_KEY` | [Notion integrations](https://www.notion.so/my-integrations) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | GCP service account JSON string |
