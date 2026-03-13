import type { Metadata } from "next"
import { computeDashboardData } from "@/lib/dashboard/compute-dashboard-data"
import { HealthSummaryCards } from "@/components/dashboard/health-summary-cards"
import { JurisdictionHeatmap } from "@/components/dashboard/jurisdiction-heatmap"
import { UrgentActions } from "@/components/dashboard/urgent-actions"
import { AiBriefing } from "@/components/dashboard/ai-briefing"
import { AgentChat } from "@/components/dashboard/agent-chat"

export const metadata: Metadata = {
  title: "Dashboard | Hopae",
}

export default async function DashboardPage() {
  const data = await computeDashboardData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Portfolio health overview
        </p>
      </div>

      <HealthSummaryCards summary={data.summary} />

      {/* AI Agent Chat — command center */}
      <AgentChat />

      <AiBriefing />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <JurisdictionHeatmap jurisdictions={data.jurisdictionRisks} />
        </div>
        <div>
          <UrgentActions actions={data.urgentActions} />
        </div>
      </div>
    </div>
  )
}
