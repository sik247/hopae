import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import type { SerializedAlertItem } from "@/lib/dashboard/compute-dashboard-data"

function countryFlag(code: string): string {
  const base = 0x1f1e6 - 65
  return String.fromCodePoint(
    base + code.charCodeAt(0),
    base + code.charCodeAt(1)
  )
}

function formatRequirementType(type: string): string {
  return type
    .split("_")
    .map((word, i) =>
      i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word
    )
    .join(" ")
}

interface UrgentActionsProps {
  actions: SerializedAlertItem[]
}

export function UrgentActions({ actions }: UrgentActionsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Urgent Action Items</CardTitle>
            <CardDescription>
              {actions.length > 0
                ? `${actions.length} items requiring attention`
                : "All clear"}
            </CardDescription>
          </div>
          {actions.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
              {actions.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="size-5" />
            <span className="text-sm font-medium">No urgent items</span>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action, i) => {
              const isOverdue = action.alertType === "overdue"
              const daysText = isOverdue
                ? `${Math.abs(action.daysUntilDue)}d overdue`
                : `${action.daysUntilDue}d remaining`

              return (
                <div
                  key={`${action.entityId}-${action.requirementType}`}
                  className="flex items-start gap-3"
                >
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                      isOverdue ? "bg-red-600" : "bg-amber-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">
                        {action.entityName}
                      </span>
                      <span className="text-sm">
                        {countryFlag(action.countryCode)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatRequirementType(action.requirementType)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-medium ${
                        isOverdue
                          ? "text-red-600 dark:text-red-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {daysText}
                    </span>
                    <Link
                      href={`/entities/${action.entityId}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
