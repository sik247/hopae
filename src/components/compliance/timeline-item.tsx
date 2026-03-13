import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { formatRequirementType } from "./types"
import type { SerializedDeadlineResult } from "./types"

interface TimelineItemProps {
  deadline: SerializedDeadlineResult
}

const dotColors = {
  overdue: "bg-red-500",
  dueSoon: "bg-amber-500",
  compliant: "bg-emerald-500",
}

export function TimelineItem({ deadline }: TimelineItemProps) {
  const status = deadline.isOverdue
    ? "overdue"
    : deadline.isDueSoon
      ? "dueSoon"
      : "compliant"

  const dotColor = dotColors[status]
  const dueDate = new Date(deadline.dueDate)
  const absDays = Math.abs(deadline.daysUntilDue)

  return (
    <div className="relative flex items-start gap-4 pl-5 py-2">
      {/* Timeline dot */}
      <div
        className={cn(
          "absolute left-0 top-3.5 -translate-x-1/2 size-2.5 rounded-full ring-2 ring-background",
          dotColor
        )}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">
            {formatRequirementType(deadline.requirementType)}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            FY{deadline.fiscalYear}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {format(dueDate, "MMM d, yyyy")}
          </span>
          <span
            className={cn(
              "text-xs font-medium",
              status === "overdue" && "text-red-600 dark:text-red-400",
              status === "dueSoon" && "text-amber-600 dark:text-amber-400",
              status === "compliant" && "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {status === "overdue"
              ? `${absDays} days overdue`
              : status === "dueSoon"
                ? `Due in ${absDays} days`
                : "Compliant"}
          </span>
        </div>
      </div>
    </div>
  )
}
