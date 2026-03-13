"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TimelineItem } from "./timeline-item"
import { countryFlag } from "./types"
import type { SerializedDeadlineResult } from "./types"

interface EntityComplianceTimelineProps {
  entityName: string
  legalName: string
  countryCode: string
  deadlines: SerializedDeadlineResult[]
}

export function EntityComplianceTimeline({
  entityName,
  legalName,
  countryCode,
  deadlines,
}: EntityComplianceTimelineProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>{countryFlag(countryCode)}</span>
          <span>{entityName}</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{legalName}</p>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No compliance obligations
          </p>
        ) : (
          <div className="relative ml-3">
            {/* Vertical timeline line */}
            <div className="absolute left-0 top-2 bottom-2 w-px bg-border" />
            <div className="space-y-0">
              {deadlines.map((deadline, i) => (
                <TimelineItem
                  key={`${deadline.requirementType}-${deadline.fiscalYear}-${i}`}
                  deadline={deadline}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
