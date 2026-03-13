import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { SourcesPageClient } from "@/components/sources/sources-page-client"
import type { DataSource } from "@/lib/db/types"

export const metadata: Metadata = {
  title: "Data Sources | Hopae",
}

export default async function SourcesPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("data_sources")
    .select("*")
    .order("created_at", { ascending: false })

  const sources: DataSource[] = (data ?? []) as DataSource[]

  // Try to extract the service account email for the "How To" tab
  let serviceAccountEmail: string | null = null
  try {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    if (raw) {
      const parsed = JSON.parse(raw) as { client_email?: string }
      serviceAccountEmail = parsed.client_email ?? null
    }
  } catch {
    // Ignore parse errors
  }

  return (
    <SourcesPageClient
      initialSources={sources}
      serviceAccountEmail={serviceAccountEmail}
    />
  )
}
