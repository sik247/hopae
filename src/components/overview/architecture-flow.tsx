"use client"

interface Country {
  code: string
  name: string
  flag: string
  count: number
}

interface Props {
  notionCountries: Country[]
  driveCountries: Country[]
  notionEntities: number
  driveEntities: number
  total: number
}

function Arrow() {
  return (
    <div className="flex justify-center py-1">
      <div className="flex flex-col items-center gap-0">
        <div className="w-px h-6 bg-border" />
        <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-border" />
      </div>
    </div>
  )
}

function NodeBox({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border bg-card px-5 py-4 ${className}`}>
      {children}
    </div>
  )
}

export function ArchitectureFlow({ notionCountries, driveCountries, notionEntities, driveEntities, total }: Props) {
  return (
    <div className="rounded-xl border bg-muted/30 p-5 space-y-1">

      {/* ── Row 1: Data sources ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Notion */}
        <NodeBox className="border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📝</span>
            <div>
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">Notion</p>
              <p className="text-xs text-muted-foreground">{notionCountries.length} countries · {notionEntities} entities</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {notionCountries.map((c) => (
              <div key={c.code} title={`${c.name} (${c.count})`}
                className="flex items-center gap-1 rounded-md bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 text-xs">
                <span>{c.flag}</span>
                <span className="text-violet-700 dark:text-violet-300 font-medium">{c.code}</span>
              </div>
            ))}
          </div>
        </NodeBox>

        {/* Google Drive */}
        <NodeBox className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📁</span>
            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Google Drive</p>
              <p className="text-xs text-muted-foreground">{driveCountries.length} countries · {driveEntities} entities</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {driveCountries.map((c) => (
              <div key={c.code} title={`${c.name} (${c.count})`}
                className="flex items-center gap-1 rounded-md bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs">
                <span>{c.flag}</span>
                <span className="text-blue-700 dark:text-blue-300 font-medium">{c.code}</span>
              </div>
            ))}
          </div>
        </NodeBox>
      </div>

      {/* connector lines merging */}
      <div className="relative h-8">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line x1="25%" y1="0" x2="50%" y2="100%" stroke="hsl(var(--border))" strokeWidth="1.5" />
          <line x1="75%" y1="0" x2="50%" y2="100%" stroke="hsl(var(--border))" strokeWidth="1.5" />
        </svg>
      </div>

      {/* ── Row 2: ETL / Sync ── */}
      <NodeBox className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚙️</span>
          <div>
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">ETL Sync Layer</p>
            <p className="text-xs text-muted-foreground">
              <code className="bg-orange-100 dark:bg-orange-900/40 px-1 rounded">sync-integrations.ts</code>
              {" "}— randomises jurisdiction split, creates Notion pages + Drive folders, updates Supabase metadata
            </p>
          </div>
        </div>
      </NodeBox>

      <Arrow />

      {/* ── Row 3: Supabase ── */}
      <NodeBox className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
        <div className="flex items-center gap-3">
          <span className="text-xl">🗄️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Supabase (PostgreSQL)</p>
            <p className="text-xs text-muted-foreground">{total} entities · 23 jurisdictions · entity_health_summary view · integration metadata (notion_page_ids, drive_folder_id)</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{total}</p>
            <p className="text-xs text-muted-foreground">entities</p>
          </div>
        </div>
      </NodeBox>

      <Arrow />

      {/* ── Row 4: Agent layer ── */}
      <div className="grid grid-cols-2 gap-4">
        <NodeBox className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚖️</span>
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Compliance Engine</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Pure TypeScript deadline calculator + risk scorer. Computes overdue / due-soon / compliant
            per entity from jurisdiction rules. No DB calls inside — fully testable.
          </p>
        </NodeBox>
        <NodeBox className="border-pink-200 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-950/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🤖</span>
            <p className="text-sm font-semibold text-pink-700 dark:text-pink-300">PII Agent (LangGraph)</p>
          </div>
          <p className="text-xs text-muted-foreground">
            LangGraph StateGraph: Scan → Classify → Assess → Recommend.
            Gemini 2.5 Flash with Zod structured output. GDPR / PDPA / DIFC jurisdiction rules.
          </p>
        </NodeBox>
      </div>

      {/* connector lines merging back */}
      <div className="relative h-8">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line x1="25%" y1="0" x2="50%" y2="100%" stroke="hsl(var(--border))" strokeWidth="1.5" />
          <line x1="75%" y1="0" x2="50%" y2="100%" stroke="hsl(var(--border))" strokeWidth="1.5" />
        </svg>
      </div>

      {/* ── Row 5: Dashboard ── */}
      <NodeBox className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
        <div className="flex items-center gap-3">
          <span className="text-xl">📊</span>
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Next.js Dashboard (Frontend)</p>
            <p className="text-xs text-muted-foreground">
              Portfolio overview · Risk heatmap · AI compliance briefing (urgent / intermediate / good) with entity hyperlinks ·
              Entity registry · Compliance calendar · Document drafting · PII scanner tab
            </p>
          </div>
        </div>
      </NodeBox>

    </div>
  )
}
