import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { RiskLevel } from "@/lib/db/types"

interface JurisdictionRisk {
  countryCode: string
  countryName: string
  entityCount: number
  criticalCount: number
  warningCount: number
  worstRisk: RiskLevel
}

interface JurisdictionHeatmapProps {
  jurisdictions: JurisdictionRisk[]
}

function countryFlag(code: string): string {
  const base = 0x1f1e6 - 65
  return String.fromCodePoint(
    base + code.charCodeAt(0),
    base + code.charCodeAt(1)
  )
}

const riskStyles: Record<
  RiskLevel,
  { bg: string; border: string; badge: string }
> = {
  critical: {
    bg: "bg-red-100 dark:bg-red-950",
    border: "border-l-4 border-l-red-600",
    badge: "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950",
    border: "border-l-4 border-l-amber-500",
    badge:
      "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
  ok: {
    bg: "bg-green-50 dark:bg-green-950",
    border: "border-l-4 border-l-green-500",
    badge:
      "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
}

export function JurisdictionHeatmap({
  jurisdictions,
}: JurisdictionHeatmapProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Jurisdiction Risk Map</CardTitle>
        <CardDescription>
          Risk concentration by country ({jurisdictions.length} jurisdictions)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {jurisdictions.map((j) => {
            const style = riskStyles[j.worstRisk]
            return (
              <div
                key={j.countryCode}
                className={`rounded-md p-3 ${style.bg} ${style.border}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{countryFlag(j.countryCode)}</span>
                  <span className="text-sm font-medium truncate">
                    {j.countryName}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  {j.entityCount} {j.entityCount === 1 ? "entity" : "entities"}
                </div>
                <div className="flex gap-1">
                  {j.criticalCount > 0 && (
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${riskStyles.critical.badge}`}
                    >
                      {j.criticalCount} critical
                    </span>
                  )}
                  {j.warningCount > 0 && (
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${riskStyles.warning.badge}`}
                    >
                      {j.warningCount} warning
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
