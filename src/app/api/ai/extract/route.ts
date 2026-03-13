import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { content, entityId } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const prompt = `You are a legal document analyst. Extract structured data from the following legal document text. Return a JSON object with these fields:
- parties: array of { name: string, role: string }
- key_dates: array of { description: string, date: string }
- obligations: array of { party: string, description: string }
- governing_law: string (jurisdiction/governing law)
- document_type: string (e.g., "Service Agreement", "License Agreement", etc.)
- summary: string (2-3 sentence summary)

Document text:
${content.slice(0, 5000)}

Return ONLY valid JSON, no markdown fences.`

    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai')
        const ai = new GoogleGenAI({ apiKey })
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        })

        const text = response.text ?? ''
        // Try to parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0])
          return NextResponse.json({
            extracted,
            entityId,
            extractedAt: new Date().toISOString(),
          })
        }
      } catch {
        // Fall through to template
      }
    }

    // Template fallback with realistic demo data
    const fallback = {
      parties: [
        { name: 'Hopae S.a r.l.', role: 'Service Provider' },
        { name: 'Subsidiary Entity', role: 'Service Recipient' },
      ],
      key_dates: [
        { description: 'Effective Date', date: '2025-01-15' },
        { description: 'Renewal Date', date: '2026-01-15' },
      ],
      obligations: [
        {
          party: 'Service Provider',
          description: 'Provide management and administrative support services',
        },
        {
          party: 'Service Recipient',
          description: 'Pay quarterly service fees within 30 days of invoice',
        },
      ],
      governing_law: 'Luxembourg',
      document_type: 'Intercompany Service Agreement',
      summary:
        'An intercompany service agreement between Hopae S.a r.l. and a subsidiary entity for the provision of management and administrative services. The agreement has a one-year term with automatic renewal.',
    }

    return NextResponse.json({
      extracted: fallback,
      entityId,
      extractedAt: new Date().toISOString(),
      isTemplate: true,
    })
  } catch (error) {
    console.error('Extraction failed:', error)
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
  }
}
