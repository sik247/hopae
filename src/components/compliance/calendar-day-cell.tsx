"use client"

import { cn } from "@/lib/utils"
import type { SerializedDeadlineWithContext } from "./types"

interface CalendarDayCellProps {
  date: Date
  deadlines: SerializedDeadlineWithContext[]
  isCurrentMonth: boolean
  isSelected: boolean
  isToday: boolean
  onSelect: () => void
}

export function CalendarDayCell({
  date,
  deadlines,
  isCurrentMonth,
  isSelected,
  isToday: isTodayDate,
  onSelect,
}: CalendarDayCellProps) {
  const hasOverdue = deadlines.some((d) => d.isOverdue)
  const hasDueSoon = deadlines.some((d) => d.isDueSoon && !d.isOverdue)
  const hasCompliant = deadlines.some((d) => !d.isOverdue && !d.isDueSoon)
  const totalDeadlines = deadlines.length

  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center justify-start p-1.5 h-14 text-sm transition-colors rounded-md",
        isCurrentMonth
          ? "text-foreground"
          : "text-muted-foreground/50",
        isSelected && "bg-primary/10 ring-1 ring-primary",
        isTodayDate && !isSelected && "ring-1 ring-muted-foreground/30",
        totalDeadlines > 0 && "hover:bg-muted cursor-pointer",
        totalDeadlines === 0 && "cursor-default"
      )}
      disabled={totalDeadlines === 0}
    >
      <span
        className={cn(
          "text-xs font-medium",
          isTodayDate && "rounded-full bg-primary text-primary-foreground size-5 flex items-center justify-center"
        )}
      >
        {date.getDate()}
      </span>

      {/* Deadline dots */}
      {totalDeadlines > 0 && (
        <div className="flex items-center gap-0.5 mt-0.5">
          {hasOverdue && (
            <span className="size-1.5 rounded-full bg-red-500" />
          )}
          {hasDueSoon && (
            <span className="size-1.5 rounded-full bg-amber-500" />
          )}
          {hasCompliant && (
            <span className="size-1.5 rounded-full bg-emerald-500" />
          )}
          {totalDeadlines > 3 && (
            <span className="text-[9px] text-muted-foreground ml-0.5">
              +{totalDeadlines - 3}
            </span>
          )}
        </div>
      )}
    </button>
  )
}
