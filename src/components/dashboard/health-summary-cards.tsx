import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Building2, AlertTriangle, XCircle, Clock } from "lucide-react"

interface HealthSummaryCardsProps {
  summary: {
    totalEntities: number
    atRisk: number
    overdueFilings: number
    upcomingDeadlines: number
  }
}

const cards = [
  {
    key: "totalEntities" as const,
    label: "Total Entities",
    icon: Building2,
    color: "text-muted-foreground",
    bgColor: "",
  },
  {
    key: "atRisk" as const,
    label: "At Risk",
    icon: AlertTriangle,
    activeColor: "text-red-600 dark:text-red-400",
    activeBg: "bg-red-50 dark:bg-red-950/50",
  },
  {
    key: "overdueFilings" as const,
    label: "Overdue Filings",
    icon: XCircle,
    activeColor: "text-red-600 dark:text-red-400",
    activeBg: "bg-red-50 dark:bg-red-950/50",
  },
  {
    key: "upcomingDeadlines" as const,
    label: "Upcoming (30d)",
    icon: Clock,
    activeColor: "text-amber-600 dark:text-amber-400",
    activeBg: "bg-amber-50 dark:bg-amber-950/50",
  },
]

export function HealthSummaryCards({ summary }: HealthSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const value = summary[card.key]
        const isActive = value > 0 && card.key !== "totalEntities"
        const Icon = card.icon
        const textColor = isActive
          ? card.activeColor
          : card.color ?? "text-muted-foreground"
        const bgColor = isActive ? card.activeBg : ""

        return (
          <Card key={card.key} className={bgColor}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {card.label}
              </span>
              <Icon className={`size-4 ${textColor}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${textColor}`}>{value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
