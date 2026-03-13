import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { DocumentsPageClient } from "@/components/documents/documents-page-client"
import { computeAllComplianceData } from "@/lib/compliance-engine/compute-all"

export const metadata: Metadata = {
  title: "Documents | Hopae",
}

export default async function DocumentsPage() {
  const supabase = await createClient()

  // Fetch entities with metadata for integration links
  const { data: entities } = await supabase
    .from("entities")
    .select("id, name, legal_name, entity_type, status, metadata, jurisdiction:jurisdictions(country_code, country_name)")
    .order("name")

  // Fetch documents
  const { data: documents } = await supabase
    .from("documents")
    .select("*, entity:entities(name, legal_name)")
    .order("created_at", { ascending: false })

  // Fetch agreements
  const { data: agreements } = await supabase
    .from("intercompany_agreements")
    .select("*, entity:entities(name, legal_name)")
    .order("effective_date", { ascending: false })

  // Get compliance data for urgency scoring
  const { alerts } = await computeAllComplianceData()
  const serializedAlerts = alerts.map((a) => ({
    ...a,
    dueDate: a.dueDate.toISOString(),
  }))

  // Build entity links and info
  const entityData: Record<string, {
    name: string
    legalName: string
    countryCode: string
    countryName: string
    status: string
    source: 'notion' | 'drive' | 'unknown'
    sourceUrl: string | null
    notionPageIds: string[]
    driveFolderId: string | null
  }> = {}

  for (const e of entities ?? []) {
    const meta = (e.metadata ?? {}) as Record<string, unknown>
    const notionPageIds = (meta.notion_page_ids as string[]) ?? []
    const driveFolderId = (meta.drive_folder_id as string) ?? null
    const jurisdictionArr = e.jurisdiction as unknown as { country_code: string; country_name: string }[] | null
    const jurisdiction = jurisdictionArr?.[0] ?? null
    const hasNotion = notionPageIds.length > 0
    const hasDrive = !!driveFolderId

    entityData[e.id] = {
      name: e.name,
      legalName: e.legal_name,
      countryCode: jurisdiction?.country_code ?? '',
      countryName: jurisdiction?.country_name ?? '',
      status: e.status,
      source: hasNotion ? 'notion' : hasDrive ? 'drive' : 'unknown',
      sourceUrl: hasNotion
        ? `https://www.notion.so/${notionPageIds[0]}`
        : hasDrive
          ? `https://drive.google.com/drive/folders/${driveFolderId}`
          : null,
      notionPageIds,
      driveFolderId,
    }
  }

  return (
    <DocumentsPageClient
      entityData={entityData}
      documents={documents ?? []}
      agreements={agreements ?? []}
      alerts={serializedAlerts}
    />
  )
}
