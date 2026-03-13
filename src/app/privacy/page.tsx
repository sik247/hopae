import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | Hopae",
  description: "Privacy policy for Hopae Entity Management Platform and its integrations",
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
        ← Back to Hopae
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2">1. Overview</h2>
          <p>
            Hopae Entity Management Platform (“the Platform”) is an internal operations tool used to manage legal entities, compliance deadlines, and related documents. This privacy policy describes how we handle information in the Platform and in connection with third-party integrations (including Notion and Google Drive).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2">2. Data We Process</h2>
          <p>
            The Platform stores and processes entity data (names, jurisdictions, directors, compliance requirements, documents metadata) in our own database (Supabase). When you connect Notion or Google Drive to an entity, we store only <strong>identifiers</strong> (Notion page IDs, Google Drive folder ID) in that entity’s record. We use these identifiers to request read-only access to page titles and file listings from Notion and Google Drive APIs on your behalf. We do not store the full content of your Notion pages or Drive files in our systems.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2">3. Notion Integration</h2>
          <p>
            If you link Notion pages to an entity, we use the Notion API with your integration token to retrieve page titles and last-edited timestamps for display in the Platform. Only pages explicitly shared with the integration are accessible. We do not read page body content unless you use a separate feature that does so and discloses it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2">4. Google Drive Integration</h2>
          <p>
            If you link a Google Drive folder to an entity, we use the Google Drive API (with a service account you configure) to list file names, types, sizes, and last-modified dates in that folder. We do not download or store file contents. The folder must be explicitly shared with the service account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2">5. Use and Retention</h2>
          <p>
            Data is used solely to operate the Platform (e.g. display entity details, compliance deadlines, and linked Notion/Drive references). We retain data according to our internal policies and applicable law. You can remove integration links at any time from the entity’s Integrations tab or by updating entity metadata.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2">6. Security and Sharing</h2>
          <p>
            The Platform is intended for internal use. We use industry-standard measures to protect data in transit and at rest. We do not sell your data. We may share data only as required by law or with service providers (e.g. hosting) under appropriate agreements.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2">7. Contact</h2>
          <p>
            For privacy-related questions about the Platform or these integrations, contact your Hopae administrator or the team that operates the Platform.
          </p>
        </section>
      </div>

      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground mt-8 inline-block">
        ← Back to Hopae
      </Link>
    </div>
  )
}
