import { createClient } from '@/lib/supabase/server'
import type { Entity, Jurisdiction, Director, IntercompanyAgreement } from '@/lib/db/types'

export async function POST(request: Request) {
  try {
    const { entityId, documentType } = await request.json()

    if (!entityId || !documentType) {
      return new Response(JSON.stringify({ error: 'entityId and documentType required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = await createClient()

    const [{ data: entity }, { data: directors }, { data: agreements }] = await Promise.all([
      supabase
        .from('entities')
        .select('*, jurisdiction:jurisdictions(*)')
        .eq('id', entityId)
        .single(),
      supabase
        .from('directors')
        .select('*')
        .eq('entity_id', entityId)
        .eq('is_current', true),
      supabase
        .from('intercompany_agreements')
        .select('*')
        .eq('entity_id', entityId)
        .limit(5),
    ])

    if (!entity) {
      return new Response(JSON.stringify({ error: 'Entity not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const typedEntity = entity as unknown as Entity & { jurisdiction: Jurisdiction }
    const typedDirectors = (directors ?? []) as Director[]
    const typedAgreements = (agreements ?? []) as IntercompanyAgreement[]

    const directorList = typedDirectors
      .map((d) => `${d.full_name} (${d.role}${d.nationality ? ', ' + d.nationality : ''})`)
      .join('; ')

    const agreementList = typedAgreements
      .map(
        (a) =>
          `${a.title} (${a.agreement_type}, ${a.status}, governing law: ${a.governing_law ?? 'N/A'})`
      )
      .join('; ')

    const entityContext = `Entity: ${typedEntity.legal_name}
Type: ${typedEntity.entity_type}
Jurisdiction: ${typedEntity.jurisdiction?.country_name ?? 'Unknown'} (${typedEntity.jurisdiction?.country_code ?? ''})
Status: ${typedEntity.status}
Incorporation Date: ${typedEntity.incorporation_date ?? 'Unknown'}
Registration Number: ${typedEntity.registration_number ?? 'N/A'}
Directors: ${directorList || 'None on record'}
Existing Agreements: ${agreementList || 'None on record'}`

    let prompt: string
    if (documentType === 'compliance_filing') {
      prompt = `You are a corporate compliance specialist. Draft a compliance filing document for the following entity. The filing should be appropriate for the entity's jurisdiction and include all standard sections.

${entityContext}

Draft a formal annual compliance filing that includes:
1. Entity identification and registration details
2. Current directors and officers
3. Registered agent information
4. Confirmation of continued operations
5. Any jurisdiction-specific declarations required for ${typedEntity.jurisdiction?.country_name ?? 'the jurisdiction'}

Use formal legal language appropriate for corporate filings. Include specific entity details from the context above. Format with clear section headers.`
    } else {
      prompt = `You are a corporate legal specialist. Draft an intercompany agreement between this entity and its parent (Hopae S.a r.l., Luxembourg).

${entityContext}

Draft a formal intercompany service agreement that includes:
1. Parties (this entity and Hopae S.a r.l., Luxembourg HQ)
2. Recitals describing the business relationship
3. Scope of services
4. Compensation and payment terms
5. Term and termination provisions
6. Governing law clause (based on entity jurisdiction)
7. Signature blocks for authorized representatives

Use formal legal language. Include specific entity details from the context above. Reference existing agreements if any. Format with clear section headers and numbered clauses.`
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai')
        const ai = new GoogleGenAI({ apiKey })

        const streamResult = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: prompt,
        })

        const encoder = new TextEncoder()
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of streamResult) {
                const text = chunk.text ?? ''
                if (text) {
                  controller.enqueue(encoder.encode(text))
                }
              }
              controller.close()
            } catch (err) {
              controller.error(err)
            }
          },
        })

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
          },
        })
      } catch {
        // Fall through to template
      }
    }

    // Template fallback
    const fallback =
      documentType === 'compliance_filing'
        ? `ANNUAL COMPLIANCE FILING

Entity: ${typedEntity.legal_name}
Jurisdiction: ${typedEntity.jurisdiction?.country_name ?? 'Unknown'}
Registration Number: ${typedEntity.registration_number ?? 'N/A'}
Filing Date: ${new Date().toISOString().split('T')[0]}

1. ENTITY IDENTIFICATION
${typedEntity.legal_name}, a ${typedEntity.entity_type} incorporated under the laws of ${typedEntity.jurisdiction?.country_name ?? 'the jurisdiction'} on ${typedEntity.incorporation_date ?? 'date unknown'}, registration number ${typedEntity.registration_number ?? 'N/A'}.

2. CURRENT DIRECTORS AND OFFICERS
${typedDirectors.map((d) => `- ${d.full_name}, ${d.role}`).join('\n') || '- None on record'}

3. CONFIRMATION OF OPERATIONS
The entity confirms that it ${typedEntity.status === 'active' ? 'continues to operate' : 'is currently ' + typedEntity.status} as of the date of this filing.

4. DECLARATION
This filing is made in compliance with the corporate filing requirements of ${typedEntity.jurisdiction?.country_name ?? 'the jurisdiction'}.

[This is a template-generated draft. AI generation unavailable.]`
        : `INTERCOMPANY SERVICE AGREEMENT

Between:
(1) Hopae S.a r.l., a company incorporated in Luxembourg ("HQ")
(2) ${typedEntity.legal_name}, a ${typedEntity.entity_type} incorporated in ${typedEntity.jurisdiction?.country_name ?? 'Unknown'} ("Subsidiary")

Date: ${new Date().toISOString().split('T')[0]}

1. RECITALS
The parties are members of the Hopae group of companies. HQ provides centralized management and support services to its subsidiaries.

2. SCOPE OF SERVICES
HQ shall provide management, administrative, and technical support services to the Subsidiary.

3. COMPENSATION
The Subsidiary shall pay HQ a service fee calculated on an arm's length basis in accordance with applicable transfer pricing regulations.

4. TERM
This Agreement shall be effective from the date hereof and shall continue until terminated by either party with 90 days written notice.

5. GOVERNING LAW
This Agreement shall be governed by the laws of ${typedEntity.jurisdiction?.country_name ?? 'Luxembourg'}.

6. SIGNATURES

For Hopae S.a r.l.:
Name: _______________
Title: Director
Date: _______________

For ${typedEntity.legal_name}:
Name: _______________
Title: ${typedDirectors[0]?.role ?? 'Director'}
Date: _______________

[This is a template-generated draft. AI generation unavailable.]`

    return new Response(fallback, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    console.error('Draft generation failed:', error)
    return new Response(JSON.stringify({ error: 'Draft generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
