"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { format } from "date-fns"

import type { EntityHealthSummary } from "@/lib/db/types"
import { StatusBadge, RiskBadge } from "./status-badge"

/** Convert a 2-letter ISO country code to a regional indicator flag emoji. */
function countryFlag(code: string): string {
  const base = 0x1f1e6 - 65 // 'A' char code
  return String.fromCodePoint(
    base + code.charCodeAt(0),
    base + code.charCodeAt(1)
  )
}

export const columns: ColumnDef<EntityHealthSummary>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Entity
        <ArrowUpDown className="size-3" />
      </button>
    ),
    cell: ({ row }) => (
      <div className="min-w-[180px]">
        <div className="font-medium">{row.original.name}</div>
        <div className="text-xs text-muted-foreground">{row.original.legal_name}</div>
      </div>
    ),
  },
  {
    accessorKey: "country_name",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Jurisdiction
        <ArrowUpDown className="size-3" />
      </button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <span>{countryFlag(row.original.country_code)}</span>
        <span>{row.original.country_name}</span>
      </div>
    ),
    filterFn: (row, _columnId, filterValue: string[]) => {
      if (!filterValue?.length) return true
      return filterValue.includes(String(row.getValue("country_name")))
    },
  },
  {
    accessorKey: "entity_type",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Type
        <ArrowUpDown className="size-3" />
      </button>
    ),
    filterFn: (row, _columnId, filterValue: string[]) => {
      if (!filterValue?.length) return true
      return filterValue.includes(String(row.getValue("entity_type")))
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="size-3" />
      </button>
    ),
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    filterFn: (row, _columnId, filterValue: string[]) => {
      if (!filterValue?.length) return true
      return filterValue.includes(String(row.getValue("status")))
    },
  },
  {
    accessorKey: "risk_level",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Risk
        <ArrowUpDown className="size-3" />
      </button>
    ),
    cell: ({ row }) => <RiskBadge riskLevel={row.original.risk_level} />,
    filterFn: (row, _columnId, filterValue: string[]) => {
      if (!filterValue?.length) return true
      return filterValue.includes(String(row.getValue("risk_level")))
    },
  },
  {
    accessorKey: "incorporation_date",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Incorporated
        <ArrowUpDown className="size-3" />
      </button>
    ),
    cell: ({ row }) => {
      const date = row.original.incorporation_date
      if (!date) return <span className="text-muted-foreground">&mdash;</span>
      return format(new Date(date), "MMM yyyy")
    },
  },
  {
    accessorKey: "overdue_count",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Overdue
        <ArrowUpDown className="size-3" />
      </button>
    ),
    cell: ({ row }) => {
      const count = row.original.overdue_count
      return (
        <span className={count > 0 ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground"}>
          {count}
        </span>
      )
    },
  },
  {
    accessorKey: "due_soon_count",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Due Soon
        <ArrowUpDown className="size-3" />
      </button>
    ),
    cell: ({ row }) => {
      const count = row.original.due_soon_count
      return (
        <span className={count > 0 ? "font-medium text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
          {count}
        </span>
      )
    },
  },
]
