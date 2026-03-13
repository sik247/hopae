"use client"

import { useState } from "react"
import type { Column } from "@tanstack/react-table"
import { Check, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import type { EntityHealthSummary } from "@/lib/db/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Separator } from "@/components/ui/separator"

interface FacetedFilterOption {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

interface DataTableFacetedFilterProps {
  column: Column<EntityHealthSummary, unknown>
  title: string
  options?: FacetedFilterOption[]
}

export function DataTableFacetedFilter({
  column,
  title,
  options: predefinedOptions,
}: DataTableFacetedFilterProps) {
  const [open, setOpen] = useState(false)
  const facetedValues = column.getFacetedUniqueValues()
  const selectedValues = new Set(
    (column.getFilterValue() as string[] | undefined) ?? []
  )

  // Derive options from faceted values if not provided
  const options: FacetedFilterOption[] =
    predefinedOptions ??
    Array.from(facetedValues.keys())
      .sort()
      .map((value) => ({
        label: String(value),
        value: String(value),
      }))

  function handleSelect(value: string) {
    const next = new Set(selectedValues)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    const filterValue = next.size ? Array.from(next) : undefined
    column.setFilterValue(filterValue)
  }

  function handleClear() {
    column.setFilterValue(undefined)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            <PlusCircle className="size-3.5" />
            {title}
            {selectedValues.size > 0 && (
              <>
                <Separator orientation="vertical" className="mx-1 h-4" />
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-normal lg:hidden"
                >
                  {selectedValues.size}
                </Badge>
                <div className="hidden gap-1 lg:flex">
                  {selectedValues.size > 2 ? (
                    <Badge
                      variant="secondary"
                      className="rounded-sm px-1 font-normal"
                    >
                      {selectedValues.size} selected
                    </Badge>
                  ) : (
                    Array.from(selectedValues).map((value) => {
                      const option = options.find((o) => o.value === value)
                      return (
                        <Badge
                          key={value}
                          variant="secondary"
                          className="rounded-sm px-1 font-normal"
                        >
                          {option?.label ?? value}
                        </Badge>
                      )
                    })
                  )}
                </div>
              </>
            )}
          </Button>
        }
      />
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value)
                const count = facetedValues.get(option.value) ?? 0
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                    data-checked={isSelected ? "true" : undefined}
                  >
                    <div
                      className={cn(
                        "flex size-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="size-3" />
                    </div>
                    {option.icon && (
                      <option.icon className="size-4 text-muted-foreground" />
                    )}
                    <span className="truncate">{option.label}</span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {count}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleClear}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
