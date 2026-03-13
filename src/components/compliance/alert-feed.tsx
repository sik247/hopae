"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCard } from "./alert-card"
import type { SerializedAlertItem } from "./types"
import { CheckCircle2 } from "lucide-react"

interface AlertFeedProps {
  alerts: SerializedAlertItem[]
}

export function AlertFeed({ alerts }: AlertFeedProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Alerts</CardTitle>
          {alerts.length > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {alerts.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle2 className="size-8 mb-2 text-emerald-500" />
            <p className="text-sm font-medium">All clear</p>
            <p className="text-xs">No compliance alerts at this time</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {alerts.map((alert, i) => (
              <AlertCard key={`${alert.entityId}-${alert.requirementType}-${i}`} alert={alert} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
