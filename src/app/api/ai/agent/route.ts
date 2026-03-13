import { NextRequest, NextResponse } from 'next/server'
import { computeDashboardData } from '@/lib/dashboard/compute-dashboard-data'
import { createClient } from '@/lib/supabase/server'

interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AgentRequest {
  message: string
  history: AgentMessage[]
}

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('')
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

async function buildComplianceContext() {
  const data = await computeDashboardData()
  const { summary, jurisdictionRisks, allAlerts } = data

  // Fetch entity metadata for source links
  const supabase = await createClient()
  const { data: entityMeta } = await supabase.from('entities').select('id, name, legal_name, metadata, jurisdiction:jurisdictions(country_code, country_name)')

  const entityMap = new Map<string, {
    name: string
    legalName: string
    countryCode: string
    countryName: string
    source: string
    sourceUrl: string | null
  }>()

  for (const e of entityMeta ?? []) {
    const meta = (e.metadata ?? {}) as Record<string, unknown>
    const notionPageIds = meta.notion_page_ids as string[] | undefined
    const driveFolderId = meta.drive_folder_id as string | undefined
    const jurisdictionArr = e.jurisdiction as unknown as { country_code: string; country_name: string }[] | null
    const jurisdiction = jurisdictionArr?.[0]
    const hasNotion = (notionPageIds?.length ?? 0) > 0
    const hasDrive = !!driveFolderId

    entityMap.set(e.id, {
      name: e.name,
      legalName: e.legal_name,
      countryCode: jurisdiction?.country_code ?? '',
      countryName: jurisdiction?.country_name ?? '',
      source: hasNotion ? 'Notion' : hasDrive ? 'Google Drive' : 'unknown',
      sourceUrl: hasNotion && notionPageIds?.[0]
        ? `https://www.notion.so/${notionPageIds[0]}`
        : hasDrive && driveFolderId
          ? `https://drive.google.com/drive/folders/${driveFolderId}`
          : null,
    })
  }

  // Build structured data
  const alertsWithLinks = allAlerts.map((a) => {
    const entity = entityMap.get(a.entityId)
    return {
      entityId: a.entityId,
      entityName: a.entityName,
      legalName: a.legalName,
      countryCode: a.countryCode,
      countryFlag: countryFlag(a.countryCode),
      requirementType: humanizeRequirement(a.requirementType),
      rawRequirementType: a.requirementType,
      dueDate: a.dueDate,
      daysUntilDue: a.daysUntilDue,
      isOverdue: a.daysUntilDue < 0,
      source: entity?.source ?? 'unknown',
      sourceUrl: entity?.sourceUrl ?? null,
      alertType: a.alertType,
    }
  })

  return {
    summary,
    jurisdictionRisks,
    alerts: alertsWithLinks,
    entityMap,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AgentRequest
    const { message, history } = body

    // Build compliance context
    const ctx = await buildComplianceContext()

    // Format the alerts data for the AI
    const overdueAlerts = ctx.alerts.filter((a) => a.isOverdue)
    const dueSoonAlerts = ctx.alerts.filter((a) => !a.isOverdue)

    const alertsContext = ctx.alerts
      .map((a) => {
        const urgency = a.isOverdue
          ? `OVERDUE by ${Math.abs(a.daysUntilDue)} days`
          : `due in ${a.daysUntilDue} days`
        const link = a.sourceUrl ? ` | Link: ${a.sourceUrl}` : ''
        return `- ${a.countryFlag} ${a.legalName} (${a.countryCode}): ${a.requirementType} — ${urgency} | Source: ${a.source}${link}`
      })
      .join('\n')

    const entityList = Array.from(ctx.entityMap.entries())
      .map(([id, e]) => {
        const link = e.sourceUrl ? ` | Link: ${e.sourceUrl}` : ''
        return `- ${countryFlag(e.countryCode)} ${e.legalName} (${e.countryCode}) | Source: ${e.source}${link}`
      })
      .join('\n')

    const systemPrompt = `You are Hopae's AI Compliance Agent — an intelligent assistant for a global legal entity management platform. You help the operations team query, filter, and act on compliance data across ${ctx.summary.totalEntities} legal entities in ${ctx.jurisdictionRisks.length} jurisdictions.

CURRENT PORTFOLIO STATE:
- Total entities: ${ctx.summary.totalEntities}
- At risk: ${ctx.summary.atRisk}
- Overdue filings: ${ctx.summary.overdueFilings}
- Upcoming deadlines (30d): ${ctx.summary.upcomingDeadlines}

ALL COMPLIANCE ALERTS (sorted by urgency):
${alertsContext || 'None — all entities in good standing.'}

ALL ENTITIES:
${entityList}

RULES:
1. Always use country flag emojis before country names (e.g., 🇯🇵 Japan)
2. When listing entities, ALWAYS include the direct link to their Notion page or Google Drive folder if available. Format links as markdown: [Entity Name](url)
3. When filtering by timeframe (e.g., "due in 7 days"), be precise about the cutoff
4. For anomaly checks, look for: entities with multiple overdue filings, jurisdictions with clustered deadlines, entities missing expected filings, mismatches between entity status and compliance state
5. Be concise but complete. Use markdown formatting with tables when listing multiple items.
6. If the user asks to send email notifications, tell them to configure their email in the settings panel (gear icon in the agent chat), then confirm what alerts would be included.
7. When recommending actions, be specific: name the entity, the filing, the deadline, and the link.
8. Always respond in a direct, professional tone. No filler.`

    const conversationHistory = history
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n')

    const fullPrompt = conversationHistory
      ? `${conversationHistory}\n\nUser: ${message}`
      : `User: ${message}`

    // Try Gemini
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai')
        const ai = new GoogleGenAI({ apiKey })
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: fullPrompt,
          config: {
            systemInstruction: systemPrompt,
          },
        })

        const reply = response.text ?? ''
        if (reply) {
          return NextResponse.json({
            reply,
            metadata: {
              totalAlerts: ctx.alerts.length,
              overdueCount: overdueAlerts.length,
              dueSoonCount: dueSoonAlerts.length,
            },
          })
        }
      } catch (err) {
        console.error('Gemini agent error:', err)
      }
    }

    // Fallback: structured response without AI
    const fallbackReply = buildFallbackResponse(message, ctx)
    return NextResponse.json({
      reply: fallbackReply,
      metadata: {
        totalAlerts: ctx.alerts.length,
        overdueCount: overdueAlerts.length,
        dueSoonCount: dueSoonAlerts.length,
      },
      isTemplate: true,
    })
  } catch (error) {
    console.error('Agent error:', error)
    return NextResponse.json(
      { reply: 'Something went wrong. Please try again.', error: true },
      { status: 500 }
    )
  }
}

function buildFallbackResponse(
  message: string,
  ctx: Awaited<ReturnType<typeof buildComplianceContext>>
): string {
  const lower = message.toLowerCase()

  // Clearing in N days
  const daysMatch = lower.match(/(\d+)\s*days?/)
  if (daysMatch && (lower.includes('clear') || lower.includes('due') || lower.includes('deadline') || lower.includes('upcoming'))) {
    const days = parseInt(daysMatch[1])
    const filtered = ctx.alerts.filter(
      (a) => a.daysUntilDue >= 0 && a.daysUntilDue <= days
    )
    if (filtered.length === 0) {
      return `No filings due within the next ${days} days. All clear.`
    }
    const lines = filtered.map((a) => {
      const link = a.sourceUrl ? `[${a.legalName}](${a.sourceUrl})` : a.legalName
      return `| ${a.countryFlag} ${a.countryCode} | ${link} | ${a.requirementType} | ${a.daysUntilDue}d | ${a.source} |`
    })
    return `**Filings due within ${days} days:**\n\n| Country | Entity | Requirement | Days Left | Source |\n|---------|--------|------------|-----------|--------|\n${lines.join('\n')}`
  }

  // Overdue
  if (lower.includes('overdue') || lower.includes('urgent') || lower.includes('critical')) {
    const overdue = ctx.alerts.filter((a) => a.isOverdue)
    if (overdue.length === 0) return 'No overdue filings. Portfolio is in good standing.'
    const lines = overdue.map((a) => {
      const link = a.sourceUrl ? `[${a.legalName}](${a.sourceUrl})` : a.legalName
      return `| ${a.countryFlag} ${a.countryCode} | ${link} | ${a.requirementType} | ${Math.abs(a.daysUntilDue)}d overdue | ${a.source} |`
    })
    return `**${overdue.length} overdue filings:**\n\n| Country | Entity | Requirement | Status | Source |\n|---------|--------|------------|--------|--------|\n${lines.join('\n')}`
  }

  // Anomalies
  if (lower.includes('anomal') || lower.includes('unusual') || lower.includes('check')) {
    const anomalies: string[] = []
    // Entities with multiple overdue
    const overdueByEntity = new Map<string, number>()
    for (const a of ctx.alerts.filter((a) => a.isOverdue)) {
      overdueByEntity.set(a.entityId, (overdueByEntity.get(a.entityId) ?? 0) + 1)
    }
    for (const [entityId, count] of overdueByEntity) {
      if (count >= 2) {
        const entity = ctx.entityMap.get(entityId)
        if (entity) {
          anomalies.push(`${countryFlag(entity.countryCode)} **${entity.legalName}** has ${count} overdue filings — needs immediate attention`)
        }
      }
    }
    if (anomalies.length === 0) {
      anomalies.push('No anomalies detected. All entities have expected filing patterns.')
    }
    return `**Anomaly Check:**\n\n${anomalies.map((a) => `- ${a}`).join('\n')}`
  }

  // Summary / status
  if (lower.includes('status') || lower.includes('summary') || lower.includes('overview')) {
    return `**Portfolio Summary:**\n\n- **${ctx.summary.totalEntities}** total entities across **${ctx.jurisdictionRisks.length}** jurisdictions\n- **${ctx.summary.overdueFilings}** overdue filings\n- **${ctx.summary.upcomingDeadlines}** deadlines in next 30 days\n- **${ctx.summary.atRisk}** entities at risk\n\nUse quick actions below for detailed views.`
  }

  // Default
  return `I can help you with:\n- Filtering entities by urgency (e.g., "due in 7 days")\n- Finding overdue filings with direct links\n- Checking for compliance anomalies\n- Sending email notifications for urgent items\n\nTry one of the quick actions below or ask a specific question.`
}
