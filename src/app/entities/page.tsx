import type { Metadata } from "next"

import { createClient } from "@/lib/supabase/server"
import type { EntityHealthSummary } from "@/lib/db/types"
import { EntityDataTable } from "@/components/entities/entity-data-table"

export const metadata: Metadata = {
  title: "Entities | Hopae",
}

export default async function EntitiesPage() {
  const supabase = await createClient()
  const { data: entities } = await supabase
    .from("entity_health_summary")
    .select("*")
    .order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Entity Registry</h1>
        <p className="text-muted-foreground">
          60+ legal entities across 20+ jurisdictions
        </p>
      </div>
      <EntityDataTable data={(entities as EntityHealthSummary[]) ?? []} />
    </div>
  )
}
