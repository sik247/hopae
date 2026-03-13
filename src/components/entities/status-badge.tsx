import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EntityStatus, RiskLevel } from "@/lib/db/types"

const statusConfig: Record<EntityStatus, { label: string; className: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: {
    label: "Active",
    variant: "default",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-transparent",
  },
  dormant: {
    label: "Dormant",
    variant: "secondary",
    className: "",
  },
  dissolving: {
    label: "Dissolving",
    variant: "destructive",
    className: "",
  },
  dissolved: {
    label: "Dissolved",
    variant: "outline",
    className: "text-muted-foreground",
  },
}

const riskConfig: Record<RiskLevel, { label: string; className: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  critical: {
    label: "At Risk",
    variant: "destructive",
    className: "",
  },
  warning: {
    label: "Due Soon",
    variant: "default",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-transparent",
  },
  ok: {
    label: "Compliant",
    variant: "default",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-transparent",
  },
}

export function StatusBadge({ status }: { status: EntityStatus }) {
  const config = statusConfig[status]
  return (
    <Badge variant={config.variant} className={cn(config.className)}>
      {config.label}
    </Badge>
  )
}

export function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  const config = riskConfig[riskLevel]
  return (
    <Badge variant={config.variant} className={cn(config.className)}>
      {config.label}
    </Badge>
  )
}
