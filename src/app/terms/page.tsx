import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Use | Hopae",
  description: "Terms of use for Hopae Entity Management Platform and its integrations",
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
        ← Back to Hopae
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Terms of Use</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2">1. Acceptance</h2>
          <p>
            By accessing or using the Hopae Entity Management Platform (“Platform”), you agree to these Terms of Use. The Platform is an internal operations tool for managing legal entities, compliance, and related integrations (including Notion and Google Drive).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2">2. Use of the Platform</h2>
          <p>
            You may use the Platform only for lawful internal business purposes: viewing and managing entity data, compliance deadlines, documents, and linked Notion pages and Google Drive folders. You are responsible for ensuring that any data you add or link (including entity metadata, Notion page IDs, and Drive folder IDs) is accurate and that you have the right to use and link that content.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2">3. Third-Party Integrations</h2>
          <p>
            Use of Notion and Google Drive integrations is subject to Notion’s and Google’s respective terms and policies. By linking Notion pages or Drive folders to entities, you represent that you have the authority to share those resources with the integration (e.g. by sharing pages with the Notion integration or sharing folders with the configured service account). We are not responsible for the availability, content, or policies of third-party services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2">4. No Legal or Tax Advice</h2>
          <p>
            The Platform and any AI-generated drafts (e.g. compliance filings, agreements) are for operational and drafting support only. They do not constitute legal, tax, or compliance advice. You should have qualified professionals review any materials before reliance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2">5. Availability and Changes</h2>
          <p>
            We aim to keep the Platform available but do not guarantee uninterrupted access. We may change or discontinue features, including integrations, with reasonable notice where practicable.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2">6. Limitation of Liability</h2>
          <p>
            To the extent permitted by law, the Platform and its operators are not liable for any indirect, incidental, or consequential damages arising from your use of the Platform or integrations. Liability is limited to the maximum extent permitted by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2">7. Contact</h2>
          <p>
            For questions about these terms, contact your Hopae administrator or the team that operates the Platform.
          </p>
        </section>
      </div>

      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground mt-8 inline-block">
        ← Back to Hopae
      </Link>
    </div>
  )
}
