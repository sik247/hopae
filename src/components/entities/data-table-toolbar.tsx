"use client"

import type { Table } from "@tanstack/react-table"
import { Circle, X } from "lucide-react"

import type { EntityHealthSummary } from "@/lib/db/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Dormant", value: "dormant" },
  { label: "Dissolving", value: "dissolving" },
]

function RedCircle({ className }: { className?: string }) {
  return <Circle className={`${className ?? ""} fill-red-500 text-red-500`} />
}
function AmberCircle({ className }: { className?: string }) {
  return <Circle className={`${className ?? ""} fill-amber-500 text-amber-500`} />
}
function GreenCircle({ className }: { className?: string }) {
  return <Circle className={`${className ?? ""} fill-emerald-500 text-emerald-500`} />
}

const riskOptions = [
  { label: "At Risk", value: "critical", icon: RedCircle },
  { label: "Due Soon", value: "warning", icon: AmberCircle },
  { label: "Compliant", value: "ok", icon: GreenCircle },
]

interface DataTableToolbarProps {
  table: Table<EntityHealthSummary>
}

export function DataTableToolbar({ table }: DataTableToolbarProps) {
  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    table.getState().globalFilter

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search entities..."
        value={table.getState().globalFilter ?? ""}
        onChange={(e) => table.setGlobalFilter(e.target.value)}
        className="h-8 w-[200px] lg:w-[300px]"
      />
      <div className="flex flex-wrap items-center gap-2">
        {table.getColumn("country_name") && (
          <DataTableFacetedFilter
            column={table.getColumn("country_name")!}
            title="Jurisdiction"
          />
        )}
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")!}
            title="Status"
            options={statusOptions}
          />
        )}
        {table.getColumn("risk_level") && (
          <DataTableFacetedFilter
            column={table.getColumn("risk_level")!}
            title="Risk"
            options={riskOptions}
          />
        )}
        {table.getColumn("entity_type") && (
          <DataTableFacetedFilter
            column={table.getColumn("entity_type")!}
            title="Type"
          />
        )}
      </div>
      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => {
            table.resetColumnFilters()
            table.setGlobalFilter("")
          }}
        >
          Reset
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  )
}
