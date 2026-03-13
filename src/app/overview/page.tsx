import { createClient } from "@/lib/supabase/server"
import type { Entity, Jurisdiction } from "@/lib/db/types"
import { ArchitectureFlow } from "@/components/overview/architecture-flow"
import { ExternalLink, Github, Globe, Linkedin } from "lucide-react"

const FLAG: Record<string, string> = {
  AT: "🇦🇹", AU: "🇦🇺", AE: "🇦🇪", BE: "🇧🇪", BR: "🇧🇷", CA: "🇨🇦",
  DE: "🇩🇪", DK: "🇩🇰", EE: "🇪🇪", ES: "🇪🇸", FI: "🇫🇮", FR: "🇫🇷",
  GB: "🇬🇧", IN: "🇮🇳", IT: "🇮🇹", JP: "🇯🇵", KR: "🇰🇷", LU: "🇱🇺",
  NL: "🇳🇱", NO: "🇳🇴", PL: "🇵🇱", SE: "🇸🇪", SG: "🇸🇬",
}

async function getOverviewData() {
  const supabase = await createClient()

  const { data: rawEntities } = await supabase
    .from("entities")
    .select("*, jurisdiction:jurisdictions(*)")

  const entities = (rawEntities ?? []) as unknown as (Entity & {
    jurisdiction: Jurisdiction | null
    metadata: Record<string, unknown> | null
  })[]

  const notionCountries = new Map<string, { name: string; count: number }>()
  const driveCountries = new Map<string, { name: string; count: number }>()

  for (const e of entities) {
    const code = e.jurisdiction?.country_code ?? "OTHER"
    const name = e.jurisdiction?.country_name ?? code
    const meta = (e.metadata ?? {}) as Record<string, unknown>
    const hasNotion = Array.isArray(meta.notion_page_ids) && (meta.notion_page_ids as string[]).length > 0
    const hasDrive = typeof meta.drive_folder_id === "string" && meta.drive_folder_id.length > 0

    if (hasNotion) {
      const existing = notionCountries.get(code)
      notionCountries.set(code, { name, count: (existing?.count ?? 0) + 1 })
    } else if (hasDrive) {
      const existing = driveCountries.get(code)
      driveCountries.set(code, { name, count: (existing?.count ?? 0) + 1 })
    }
  }

  const notionList = [...notionCountries.entries()].map(([code, v]) => ({ code, ...v })).sort((a, b) => a.name.localeCompare(b.name))
  const driveList = [...driveCountries.entries()].map(([code, v]) => ({ code, ...v })).sort((a, b) => a.name.localeCompare(b.name))

  const notionEntities = notionList.reduce((s, c) => s + c.count, 0)
  const driveEntities = driveList.reduce((s, c) => s + c.count, 0)

  return { notionList, driveList, notionEntities, driveEntities, total: entities.length }
}

export default async function OverviewPage() {
  const { notionList, driveList, notionEntities, driveEntities, total } = await getOverviewData()

  const notionCountries = notionList.map(c => ({ ...c, flag: FLAG[c.code] ?? "🏳️" }))
  const driveCountries = driveList.map(c => ({ ...c, flag: FLAG[c.code] ?? "🏳️" }))

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* ── Applicant header ── */}
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Applicant</p>
              <h1 className="text-2xl font-bold tracking-tight">Harry (Sang In Kang)</h1>
              <p className="text-sm text-muted-foreground mt-0.5">AI-native entity operations platform — 63 entities · 23 jurisdictions</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="https://ai-strategy-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium hover:bg-accent transition-colors">
                <Globe className="size-3" /> Personal Site
              </a>
              <a href="https://github.com/sik247" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium hover:bg-accent transition-colors">
                <Github className="size-3" /> GitHub
              </a>
              <a href="https://www.linkedin.com/in/harry-k-a256b9b0/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium hover:bg-accent transition-colors">
                <Linkedin className="size-3" /> LinkedIn
              </a>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <a href="https://hopae.vercel.app/dashboard" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold hover:bg-primary/90 transition-colors">
              <ExternalLink className="size-3" /> Live Demo
            </a>
            <a href="https://github.com/sik247/hopae" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border px-4 py-1.5 text-xs font-semibold hover:bg-accent transition-colors">
              <Github className="size-3" /> GitHub Repo
            </a>
          </div>
        </div>

        {/* ── Problem / Solution ── */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-6 space-y-2">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <span className="text-red-500">⚠</span> Problem
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Managing 60+ subsidiaries across 23 jurisdictions means tracking hundreds of compliance
              deadlines, director appointments, and registered agent renewals. A missed filing in one
              jurisdiction can cascade into penalties or forced dissolution. Spreadsheets don't scale.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6 space-y-2">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <span className="text-green-500">✦</span> Solution
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              An AI-native operations platform with real-time risk scoring, AI compliance briefings
              that categorize jurisdictions into urgent / intermediate / good standing, document
              drafting grounded in entity data, and a LangGraph PII agent for data compliance — all
              in a single dashboard.
            </p>
          </div>
        </div>

        {/* ── Agentic Framework ── */}
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <span>🤖</span> Agentic Framework
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Built on <strong>LangGraph + LangChain + Gemini 2.5 Flash</strong>. The PII agent follows
            a 4-step StateGraph pipeline: <em>Scan</em> (5 LangChain tools across entity fields,
            director records, documents) → <em>Classify</em> (Zod-typed structured output) →{" "}
            <em>Assess</em> (GDPR, PDPA, DIFC jurisdiction rules) → <em>Recommend</em> (actionable
            remediation). The AI Compliance Briefing uses Gemini to produce a structured three-tier
            analysis with direct entity hyperlinks.
          </p>
        </div>

        {/* ── Architecture Flow Chart ── */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold px-1">Architecture</h2>
          <p className="text-xs text-muted-foreground px-1">
            Forms / Seed → ETL (sync scripts) → Supabase → Agent Layer → Frontend Dashboard
          </p>
          <ArchitectureFlow
            notionCountries={notionCountries}
            driveCountries={driveCountries}
            notionEntities={notionEntities}
            driveEntities={driveEntities}
            total={total}
          />
        </div>

        {/* ── Data Stats ── */}
        <div className="grid md:grid-cols-2 gap-4">
          <a href="https://www.notion.so/Entities-e3240e40db894c9288d012c4b08b8293?pvs=21"
            target="_blank" rel="noopener noreferrer"
            className="rounded-xl border bg-card p-6 space-y-2 hover:bg-accent/30 transition-colors group">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <span className="text-lg">📝</span> Notion Data
              </h3>
              <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <p className="text-2xl font-bold">{notionList.length} <span className="text-sm font-normal text-muted-foreground">countries</span></p>
            <p className="text-sm text-muted-foreground">{notionEntities} entities · Full page content per entity</p>
          </a>
          <div className="rounded-xl border bg-card p-6 space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <span className="text-lg">📁</span> Google Drive Data
            </h3>
            <p className="text-2xl font-bold">{driveList.length} <span className="text-sm font-normal text-muted-foreground">countries</span></p>
            <p className="text-sm text-muted-foreground">{driveEntities} entities · Folder + Overview.txt per entity</p>
          </div>
        </div>

      </div>
    </div>
  )
}
