import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import type {
  Entity,
  Jurisdiction,
  Director,
  ComplianceRequirement,
  IntercompanyAgreement,
} from "@/lib/db/types"
import { Badge } from "@/components/ui/badge"
import { EntityDetailTabs } from "@/components/entities/entity-detail-tabs"

export const metadata: Metadata = {
  title: "Entity Detail | Hopae",
}

const statusVariant = (status: string) => {
  switch (status) {
    case "active":
      return "default"
    case "dissolving":
      return "destructive"
    case "dormant":
    case "dissolved":
      return "secondary"
    default:
      return "outline"
  }
}

export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: entity } = await supabase
    .from("entities")
    .select("*, jurisdiction:jurisdictions(*)")
    .eq("id", id)
    .single()

  if (!entity) {
    notFound()
  }

  const typedEntity = entity as unknown as Entity & {
    jurisdiction: Jurisdiction
  }

  const [
    { data: directors },
    { data: complianceRequirements },
    { data: agreements },
    { data: allEntities },
  ] = await Promise.all([
    supabase
      .from("directors")
      .select("*")
      .eq("entity_id", id)
      .order("is_current", { ascending: false }),
    supabase
      .from("compliance_requirements")
      .select("*")
      .eq("entity_id", id)
      .order("due_date"),
    supabase
      .from("intercompany_agreements")
      .select("*")
      .eq("entity_id", id)
      .order("effective_date", { ascending: false }),
    supabase
      .from("entities")
      .select("id, name, legal_name, entity_type, entity_purpose, status, parent_entity_id"),
  ])

  const formattedIncorporationDate = typedEntity.incorporation_date
    ? new Date(typedEntity.incorporation_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/entities"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Entities
        </Link>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {typedEntity.legal_name}
          </h1>
          <Badge variant={statusVariant(typedEntity.status)}>
            {typedEntity.status}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {typedEntity.entity_type}
          {typedEntity.jurisdiction?.country_name &&
            ` \u00B7 ${typedEntity.jurisdiction.country_name}`}
          {formattedIncorporationDate &&
            ` \u00B7 Incorporated ${formattedIncorporationDate}`}
        </p>
      </div>

      <EntityDetailTabs
        entity={typedEntity}
        directors={(directors as Director[]) ?? []}
        complianceRequirements={
          (complianceRequirements as ComplianceRequirement[]) ?? []
        }
        agreements={(agreements as IntercompanyAgreement[]) ?? []}
        allEntities={allEntities ?? []}
      />
    </div>
  )
}
