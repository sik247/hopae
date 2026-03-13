import { cn } from "@/lib/utils"
import { countryFlag } from "./types"
import type { SerializedEntityScoreWithContext } from "./types"

const riskBorderColors: Record<string, string> = {
  critical: "border-l-red-500",
  warning: "border-l-amber-500",
  ok: "border-l-emerald-500",
}

interface RiskEntityRowProps {
  entityScore: SerializedEntityScoreWithContext
  isSelected: boolean
  onSelect: () => void
}

export function RiskEntityRow({
  entityScore,
  isSelected,
  onSelect,
}: RiskEntityRowProps) {
  const { score, entity, jurisdiction } = entityScore
  const borderColor = riskBorderColors[score.riskLevel] ?? "border-l-muted"

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center justify-between rounded-md border border-l-4 p-3 text-left transition-colors hover:bg-muted/50",
        borderColor,
        isSelected && "bg-muted"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-base">{countryFlag(jurisdiction.countryCode)}</span>
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{entity.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {jurisdiction.countryCode}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-xs">
        {score.overdue.length > 0 && (
          <span className="text-red-600 dark:text-red-400 font-medium">
            {score.overdue.length} overdue
          </span>
        )}
        {score.dueSoon.length > 0 && (
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            {score.dueSoon.length} due soon
          </span>
        )}
        {score.overdue.length === 0 && score.dueSoon.length === 0 && (
          <span className="text-emerald-600 dark:text-emerald-400">
            Compliant
          </span>
        )}
      </div>
    </button>
  )
}
