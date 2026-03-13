import { NextResponse } from 'next/server'
import { computeDashboardData } from '@/lib/dashboard/compute-dashboard-data'
import type { SerializedAlertItem } from '@/lib/dashboard/compute-dashboard-data'
import { createClient } from '@/lib/supabase/server'

export interface BriefingEntity {
  id: string
  name: string
  needed: string
  source: 'notion' | 'drive' | 'unknown'
  sourceUrl: string | null
}

export interface BriefingSection {
  countryCode: string
  countryName: string
  entityCount: number
  entities: BriefingEntity[]
}

export interface BriefingSections {
  urgent: BriefingSection[]
  intermediate: BriefingSection[]
  good: BriefingSection[]
}

function humanizeRequirement(s: string): string {
  const MAP: Record<string, string> = {
    agent_renewal: 'Registered Agent Renewal',
    annual_filing: 'Annual Filing',
    annual_report: 'Annual Report',
    tax_filing: 'Tax Filing',
    tax_return: 'Tax Return',
    director_renewal: 'Director Renewal',
    audit: 'Statutory Audit',
    incorporation: 'Incorporation Filing',
  }
  return MAP[s] ?? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function GET() {
  try {
    const data = await computeDashboardData()
    const { summary, jurisdictionRisks, urgentActions, allAlerts } = data

    // Fetch entity metadata to determine Notion vs Drive source
    const supabase = await createClient()
    const { data: entityMeta } = await supabase.from('entities').select('id, metadata')
    const metaMap = new Map<string, Record<string, unknown>>()
    for (const e of entityMeta ?? []) {
      metaMap.set(e.id, (e.metadata ?? {}) as Record<string, unknown>)
    }

    // Group all alerts by country for building entity links
    const alertsByCountry = new Map<string, SerializedAlertItem[]>()
    for (const alert of allAlerts) {
      if (!alertsByCountry.has(alert.countryCode)) alertsByCountry.set(alert.countryCode, [])
      alertsByCountry.get(alert.countryCode)!.push(alert)
    }

    // Build structured sections
    const sections: BriefingSections = { urgent: [], intermediate: [], good: [] }

    for (const j of jurisdictionRisks) {
      const countryAlerts = alertsByCountry.get(j.countryCode) ?? []
      const entities: BriefingEntity[] = countryAlerts.map((a) => {
        const meta = metaMap.get(a.entityId) ?? {}
        const hasNotion = Array.isArray(meta.notion_page_ids) && (meta.notion_page_ids as string[]).length > 0
        const hasDrive = typeof meta.drive_folder_id === 'string' && meta.drive_folder_id.length > 0
        const source: BriefingEntity['source'] = hasNotion ? 'notion' : hasDrive ? 'drive' : 'unknown'
        const notionPageIds = meta.notion_page_ids as string[] | undefined
        const driveFolderId = meta.drive_folder_id as string | undefined
        const sourceUrl = hasNotion && notionPageIds?.[0]
          ? `https://www.notion.so/${notionPageIds[0]}`
          : hasDrive && driveFolderId
            ? `https://drive.google.com/drive/folders/${driveFolderId}`
            : null
        return {
          id: a.entityId,
          name: a.legalName || a.entityName,
          needed: a.daysUntilDue < 0
            ? `${humanizeRequirement(a.requirementType)} — overdue by ${Math.abs(a.daysUntilDue)}d`
            : `${humanizeRequirement(a.requirementType)} — due in ${a.daysUntilDue}d`,
          source,
          sourceUrl,
        }
      })

      const section: BriefingSection = {
        countryCode: j.countryCode,
        countryName: j.countryName,
        entityCount: j.entityCount,
        entities,
      }

      if (j.worstRisk === 'critical') sections.urgent.push(section)
      else if (j.worstRisk === 'warning') sections.intermediate.push(section)
      else sections.good.push(section)
    }

    // Build prompt context
    const urgentLines = sections.urgent
      .map((s) => {
        const entityLines = s.entities.map((e) => `    • ${e.name}: ${e.needed}`).join('\n')
        return `  ${s.countryName} (${s.entityCount} entities, ${s.entities.length} alerts):\n${entityLines}`
      })
      .join('\n')

    const intermediateLines = sections.intermediate
      .map((s) => {
        const entityLines = s.entities.map((e) => `    • ${e.name}: ${e.needed}`).join('\n')
        return `  ${s.countryName} (${s.entityCount} entities, ${s.entities.length} alerts):\n${entityLines || '    • No active alerts'}`
      })
      .join('\n')

    const goodLines = sections.good
      .map((s) => `  ${s.countryName} (${s.entityCount} entities) — all compliant`)
      .join('\n')

    const urgentList = urgentActions
      .map(
        (a) =>
          `${a.entityName} (${a.countryCode}): ${a.requirementType}, ${a.daysUntilDue < 0 ? Math.abs(a.daysUntilDue) + ' days overdue' : a.daysUntilDue + ' days remaining'}`
      )
      .join('; ')

    const totalUrgentEntities = sections.urgent.reduce((sum, s) => sum + s.entities.length, 0)
    const totalIntermediateEntities = sections.intermediate.reduce((sum, s) => sum + s.entities.length, 0)

    const prompt = `You are a senior compliance officer writing a structured daily compliance report for Hopae's operations team. Hopae manages ${summary.totalEntities} legal entities across ${jurisdictionRisks.length} jurisdictions globally.

PORTFOLIO SNAPSHOT:
- ${summary.overdueFilings} overdue filings (each day of delay risks penalties or regulatory action)
- ${summary.upcomingDeadlines} deadlines due within 30 days
- ${summary.atRisk} entities at elevated risk

━━ URGENT — ACT TODAY ━━
${urgentLines || '  None'}

━━ INTERMEDIATE — SCHEDULE THIS WEEK ━━
${intermediateLines || '  None'}

━━ GOOD STANDING ━━
${goodLines || '  None'}

Write the report in EXACTLY this structure. Use line breaks between each section to space them out clearly:

SECTION 1 — HEADER (one line):
"There are ${totalUrgentEntities} urgent items requiring immediate action and ${totalIntermediateEntities} items to schedule this week."

SECTION 2 — URGENT (spaced out, one entity per line):
For each urgent entity, write one line: the flag emoji + country, the entity name, what's overdue, and days overdue. Separate each entity with a blank line. Be explicit about consequences if ignored (fines, penalties, suspension).

SECTION 3 — UPCOMING (spaced out, one entity per line):
For each intermediate entity, write one line: the flag emoji + country, the entity name, what's coming due, and days remaining. Separate each entity with a blank line. Include recommended prep actions.

SECTION 4 — CLEAR (one line):
List the good-standing jurisdictions with their flag emojis in one sentence.

Rules:
- IMPORTANT: Always prefix each country name with its flag emoji (e.g. 🇯🇵 Japan, 🇩🇪 Germany, 🇬🇧 United Kingdom, 🇺🇸 United States, 🇱🇺 Luxembourg, 🇸🇬 Singapore, 🇰🇷 South Korea, 🇭🇰 Hong Kong, 🇦🇺 Australia, etc.).
- Put a blank line between every entity mention so the report is easy to scan.
- Tone: direct, no filler words, no hedging. Write like a compliance officer who values their team's time.
- No markdown formatting. Plain text only. Max 300 words total.`

    // Try Gemini if API key is available
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai')
        const ai = new GoogleGenAI({ apiKey })
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        })

        const briefing = response.text ?? ''

        if (briefing) {
          return NextResponse.json({
            briefing,
            sections,
            generatedAt: new Date().toISOString(),
          })
        }
      } catch {
        // Fall through to template fallback
      }
    }

    // Template fallback — structured report format
    const fallbackLines: string[] = []

    fallbackLines.push(`There are ${totalUrgentEntities} urgent items requiring immediate action and ${totalIntermediateEntities} items to schedule this week.`)
    fallbackLines.push('')

    if (sections.urgent.length > 0) {
      for (const s of sections.urgent) {
        for (const e of s.entities) {
          fallbackLines.push(`${s.countryName} — ${e.name}: ${e.needed}`)
          fallbackLines.push('')
        }
      }
    }

    if (sections.intermediate.length > 0) {
      for (const s of sections.intermediate) {
        for (const e of s.entities) {
          fallbackLines.push(`${s.countryName} — ${e.name}: ${e.needed}`)
          fallbackLines.push('')
        }
      }
    }

    if (sections.good.length > 0) {
      const goodNames = sections.good.map((s) => s.countryName).join(', ')
      fallbackLines.push(`Clear: ${goodNames} — all compliant.`)
    }

    const fallbackBriefing = fallbackLines.join('\n')

    return NextResponse.json({
      briefing: fallbackBriefing,
      sections,
      generatedAt: new Date().toISOString(),
      isTemplate: true,
    })
  } catch (error) {
    console.error('Briefing generation failed:', error)
    return NextResponse.json(
      {
        briefing:
          'Unable to generate compliance briefing at this time. Please check the dashboard cards and urgent actions for current status.',
        generatedAt: new Date().toISOString(),
        isTemplate: true,
      },
      { status: 500 }
    )
  }
}
