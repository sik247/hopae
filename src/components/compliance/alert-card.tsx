import { cn } from "@/lib/utils"
import { countryFlag, formatRequirementType } from "./types"
import type { SerializedAlertItem } from "./types"

const borderColors: Record<string, string> = {
  overdue: "border-l-red-500",
  due_soon: "border-l-amber-500",
  at_risk: "border-l-yellow-500",
  info: "border-l-blue-500",
}

interface AlertCardProps {
  alert: SerializedAlertItem
}

export function AlertCard({ alert }: AlertCardProps) {
  const borderColor = borderColors[alert.alertType] ?? "border-l-muted"
  const absDays = Math.abs(alert.daysUntilDue)

  return (
    <div
      className={cn(
        "rounded-lg border border-l-4 p-3 space-y-1",
        borderColor
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{alert.entityName}</span>
        <span className="text-xs text-muted-foreground">
          {countryFlag(alert.countryCode)} {alert.countryCode}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        {formatRequirementType(alert.requirementType)}
      </div>
      <p className="text-xs text-muted-foreground">{alert.message}</p>
      <div className="flex items-center justify-end">
        <span
          className={cn(
            "text-xs font-medium",
            alert.alertType === "overdue"
              ? "text-red-600 dark:text-red-400"
              : alert.alertType === "due_soon"
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
          )}
        >
          {alert.alertType === "overdue"
            ? `${absDays} days overdue`
            : alert.alertType === "due_soon"
              ? `Due in ${absDays} days`
              : alert.alertType === "at_risk"
                ? "At risk"
                : ""}
        </span>
      </div>
    </div>
  )
}
