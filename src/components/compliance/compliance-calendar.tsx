"use client"

import { useState, useMemo } from "react"
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
} from "date-fns"
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDayCell } from "./calendar-day-cell"
import { formatRequirementType, countryFlag } from "./types"
import type { SerializedDeadlineWithContext } from "./types"
import Link from "next/link"

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

interface ComplianceCalendarProps {
  deadlinesByDate: Record<string, SerializedDeadlineWithContext[]>
  entityLinks?: Record<string, { source: string; url: string } | null>
}

export function ComplianceCalendar({ deadlinesByDate, entityLinks }: ComplianceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const selectedDeadlines = selectedDate
    ? deadlinesByDate[selectedDate] ?? []
    : []

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {format(currentMonth, "MMMM yyyy")}
          </CardTitle>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              className="rounded-md p-2 hover:bg-muted transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="rounded-md p-2 hover:bg-muted transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd")
            const dayDeadlines = deadlinesByDate[dateKey] ?? []
            return (
              <CalendarDayCell
                key={dateKey}
                date={day}
                deadlines={dayDeadlines}
                isCurrentMonth={isSameMonth(day, currentMonth)}
                isSelected={selectedDate === dateKey}
                isToday={isToday(day)}
                onSelect={() =>
                  setSelectedDate(selectedDate === dateKey ? null : dateKey)
                }
              />
            )
          })}
        </div>

        {/* Selected day detail */}
        {selectedDate && selectedDeadlines.length > 0 && (
          <div className="mt-4 rounded-lg border p-3 space-y-2">
            <h4 className="text-sm font-medium">
              {format(new Date(selectedDate + "T00:00:00"), "MMMM d, yyyy")} &mdash;{" "}
              {selectedDeadlines.length} deadline{selectedDeadlines.length !== 1 ? "s" : ""}
            </h4>
            <div className="space-y-1.5">
              {selectedDeadlines.map((d, i) => {
                const link = entityLinks?.[d.entityId]
                return (
                  <div
                    key={`${d.entityId}-${d.requirementType}-${i}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span>{countryFlag(d.countryCode)}</span>
                      {link?.url ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline underline-offset-2 flex items-center gap-1"
                        >
                          {d.entityName}
                          <ExternalLink className="size-3 opacity-50" />
                        </a>
                      ) : (
                        <Link href={`/entities/${d.entityId}`} className="font-medium hover:underline underline-offset-2">
                          {d.entityName}
                        </Link>
                      )}
                      <span className="text-muted-foreground">
                        {formatRequirementType(d.requirementType)}
                      </span>
                      {link && (
                        <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {link.source === 'notion' ? '📝 Notion' : '📁 Drive'}
                        </span>
                      )}
                    </div>
                    <span
                      className={
                        d.isOverdue
                          ? "text-red-600 dark:text-red-400 font-medium"
                          : d.isDueSoon
                            ? "text-amber-600 dark:text-amber-400 font-medium"
                            : "text-emerald-600 dark:text-emerald-400"
                      }
                    >
                      {d.isOverdue
                        ? `${Math.abs(d.daysUntilDue)}d overdue`
                        : d.isDueSoon
                          ? `${d.daysUntilDue}d left`
                          : "On track"}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-red-500" />
            Overdue
          </div>
          <div className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-500" />
            Due Soon
          </div>
          <div className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500" />
            On Track
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
