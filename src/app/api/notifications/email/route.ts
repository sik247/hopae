import { NextRequest, NextResponse } from 'next/server'
import { computeDashboardData } from '@/lib/dashboard/compute-dashboard-data'
import { createClient } from '@/lib/supabase/server'

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

export async function POST(request: NextRequest) {
  try {
    const { email, emails, filter } = (await request.json()) as {
      email?: string
      emails?: string[]
      filter?: 'overdue' | 'due_soon' | 'all'
    }

    // Support both single email and multiple emails (comma-separated or array)
    let recipients: string[] = []
    if (emails && Array.isArray(emails)) {
      recipients = emails.map((e) => e.trim()).filter((e) => e.includes('@'))
    } else if (email) {
      recipients = email.split(',').map((e) => e.trim()).filter((e) => e.includes('@'))
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'At least one valid email required' }, { status: 400 })
    }

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return NextResponse.json(
        { error: 'Email service not configured. Set RESEND_API_KEY in environment.' },
        { status: 503 }
      )
    }

    // Get compliance data
    const data = await computeDashboardData()
    const { summary, allAlerts } = data

    // Fetch entity metadata for links
    const supabase = await createClient()
    const { data: entityMeta } = await supabase.from('entities').select('id, metadata')
    const linkMap = new Map<string, string>()
    for (const e of entityMeta ?? []) {
      const meta = (e.metadata ?? {}) as Record<string, unknown>
      const notionIds = meta.notion_page_ids as string[] | undefined
      const driveId = meta.drive_folder_id as string | undefined
      if (notionIds?.length) linkMap.set(e.id, `https://www.notion.so/${notionIds[0]}`)
      else if (driveId) linkMap.set(e.id, `https://drive.google.com/drive/folders/${driveId}`)
    }

    // Filter alerts
    const effectiveFilter = filter ?? 'all'
    const filteredAlerts = allAlerts.filter((a) => {
      if (effectiveFilter === 'overdue') return a.daysUntilDue < 0
      if (effectiveFilter === 'due_soon') return a.daysUntilDue >= 0 && a.daysUntilDue <= 30
      return true
    })

    if (filteredAlerts.length === 0) {
      return NextResponse.json({
        sent: false,
        message: 'No alerts match the selected filter. No email sent.',
      })
    }

    // Build HTML email
    const alertRows = filteredAlerts
      .map((a) => {
        const link = linkMap.get(a.entityId)
        const entityDisplay = link
          ? `<a href="${link}" style="color: #2563eb; text-decoration: underline;">${a.legalName || a.entityName}</a>`
          : (a.legalName || a.entityName)
        const status = a.daysUntilDue < 0
          ? `<span style="color: #dc2626; font-weight: 600;">${Math.abs(a.daysUntilDue)}d overdue</span>`
          : `<span style="color: #d97706; font-weight: 600;">${a.daysUntilDue}d remaining</span>`

        return `<tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${countryFlag(a.countryCode)} ${a.countryCode}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${entityDisplay}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${humanizeRequirement(a.requirementType)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${status}</td>
        </tr>`
      })
      .join('\n')

    const overdueCount = filteredAlerts.filter((a) => a.daysUntilDue < 0).length
    const dueSoonCount = filteredAlerts.filter((a) => a.daysUntilDue >= 0).length

    // Separate overdue vs due-soon rows for grouped report
    const overdueRows = filteredAlerts.filter((a) => a.daysUntilDue < 0)
    const dueSoonRows = filteredAlerts.filter((a) => a.daysUntilDue >= 0)

    function buildAlertRow(a: typeof filteredAlerts[number]) {
      const link = linkMap.get(a.entityId)
      const entityDisplay = link
        ? `<a href="${link}" style="color: #2563eb; text-decoration: underline;">${a.legalName || a.entityName}</a>`
        : (a.legalName || a.entityName)
      const status = a.daysUntilDue < 0
        ? `<span style="color: #dc2626; font-weight: 600;">${Math.abs(a.daysUntilDue)}d overdue</span>`
        : `<span style="color: #d97706; font-weight: 600;">${a.daysUntilDue}d remaining</span>`
      return `<tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${countryFlag(a.countryCode)} ${a.countryCode}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${entityDisplay}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${humanizeRequirement(a.requirementType)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${status}</td>
      </tr>`
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; color: #1f2937;">
  <div style="border-bottom: 3px solid #7c3aed; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="margin: 0; font-size: 22px; color: #111827;">Hopae Compliance Report</h1>
    <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 28px;">
    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">
      There are <span style="color: #dc2626;">${overdueCount} urgent</span> items requiring immediate action
      and <span style="color: #d97706;">${dueSoonCount} upcoming</span> items to schedule this week.
    </p>
    <p style="margin: 8px 0 0; font-size: 13px; color: #6b7280;">
      ${summary.totalEntities} entities across ${data.jurisdictionRisks.length} jurisdictions
    </p>
  </div>

  ${overdueRows.length > 0 ? `
  <div style="margin-bottom: 28px;">
    <h2 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #dc2626; border-bottom: 2px solid #fecaca; padding-bottom: 6px;">
      Urgent &mdash; Act Today (${overdueRows.length})
    </h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <thead>
        <tr style="background: #fef2f2;">
          <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Country</th>
          <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Entity</th>
          <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Requirement</th>
          <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Status</th>
        </tr>
      </thead>
      <tbody>${overdueRows.map(buildAlertRow).join('\n')}</tbody>
    </table>
  </div>
  ` : ''}

  ${dueSoonRows.length > 0 ? `
  <div style="margin-bottom: 28px;">
    <h2 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #d97706; border-bottom: 2px solid #fde68a; padding-bottom: 6px;">
      Upcoming &mdash; Schedule This Week (${dueSoonRows.length})
    </h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <thead>
        <tr style="background: #fffbeb;">
          <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Country</th>
          <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Entity</th>
          <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Requirement</th>
          <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Status</th>
        </tr>
      </thead>
      <tbody>${dueSoonRows.map(buildAlertRow).join('\n')}</tbody>
    </table>
  </div>
  ` : ''}

  <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      Sent by Hopae Compliance Agent &mdash; ${new Date().toISOString()}
    </p>
  </div>
</body>
</html>`

    // Send via Resend
    const { Resend } = await import('resend')
    const resend = new Resend(resendKey)

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Hopae Compliance <onboarding@resend.dev>',
      to: recipients,
      subject: `Hopae Compliance Report: ${overdueCount} overdue, ${dueSoonCount} due soon`,
      html,
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return NextResponse.json({ error: 'Failed to send email', details: emailError.message }, { status: 500 })
    }

    return NextResponse.json({
      sent: true,
      emailId: emailResult?.id,
      alertCount: filteredAlerts.length,
      recipientCount: recipients.length,
      message: `Report sent to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''} (${recipients.join(', ')}) with ${filteredAlerts.length} compliance alerts.`,
    })
  } catch (error) {
    console.error('Notification email error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
