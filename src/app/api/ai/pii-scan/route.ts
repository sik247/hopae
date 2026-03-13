import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runPIIAgent } from '@/lib/pii-agent'
import type { Entity, Jurisdiction, Director } from '@/lib/db/types'

export async function POST(request: Request) {
  try {
    const { entityId, documentText } = await request.json()

    if (!entityId) {
      return NextResponse.json({ error: 'entityId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const [{ data: entity }, { data: directors }] = await Promise.all([
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
    ])

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    const typedEntity = entity as unknown as Entity & { jurisdiction: Jurisdiction }
    const typedDirectors = (directors ?? []) as Director[]

    const result = await runPIIAgent({
      entityId,
      entityName: typedEntity.legal_name,
      jurisdiction: typedEntity.jurisdiction?.country_code ?? 'US',
      entity: typedEntity as unknown as Record<string, unknown>,
      directors: typedDirectors as unknown as Array<Record<string, unknown>>,
      documentText,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('PII scan failed:', error)
    return NextResponse.json(
      { error: 'PII scan failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
