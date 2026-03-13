"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RiskEntityRow } from "./risk-entity-row"
import { EntityComplianceTimeline } from "./entity-compliance-timeline"
import type { SerializedEntityScoreWithContext } from "./types"

interface RiskDashboardProps {
  entityScores: SerializedEntityScoreWithContext[]
}

export function RiskDashboard({ entityScores }: RiskDashboardProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)

  const criticalCount = entityScores.filter((e) => e.score.riskLevel === "critical").length
  const warningCount = entityScores.filter((e) => e.score.riskLevel === "warning").length
  const okCount = entityScores.filter((e) => e.score.riskLevel === "ok").length

  const selectedEntity = entityScores.find(
    (e) => e.score.entityId === selectedEntityId
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Risk Dashboard</CardTitle>
            <span className="text-sm text-muted-foreground">
              {criticalCount + warningCount} entities need attention
            </span>
          </div>
          {/* Summary bar */}
          <div className="flex gap-3 mt-1">
            {criticalCount > 0 && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {warningCount} warning
              </span>
            )}
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {okCount} compliant
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
            {entityScores.map((es) => (
              <RiskEntityRow
                key={es.score.entityId}
                entityScore={es}
                isSelected={selectedEntityId === es.score.entityId}
                onSelect={() =>
                  setSelectedEntityId(
                    selectedEntityId === es.score.entityId
                      ? null
                      : es.score.entityId
                  )
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected entity timeline */}
      {selectedEntity && (
        <EntityComplianceTimeline
          entityName={selectedEntity.entity.name}
          legalName={selectedEntity.entity.legalName}
          countryCode={selectedEntity.jurisdiction.countryCode}
          deadlines={[
            ...selectedEntity.score.overdue,
            ...selectedEntity.score.dueSoon,
            ...selectedEntity.score.compliant,
          ].sort(
            (a, b) =>
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          )}
        />
      )}
    </div>
  )
}
