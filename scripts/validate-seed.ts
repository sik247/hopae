// scripts/validate-seed.ts — Post-seed validation for all DATA requirements
// Run with: npm run db:validate (or npx tsx scripts/validate-seed.ts)

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let passed = 0
  let failed = 0
  const failures: string[] = []

  function check(name: string, ok: boolean, detail: string = '') {
    if (ok) {
      passed++
      console.log(`  PASS: ${name}`)
    } else {
      failed++
      const msg = detail ? `${name} — ${detail}` : name
      failures.push(msg)
      console.log(`  FAIL: ${msg}`)
    }
  }

  console.log('Validating seed data...\n')

  // =========================================================================
  // DATA-01: Entity coverage
  // =========================================================================
  console.log('--- DATA-01: Entities ---')

  // Check 1: At least 60 entities
  const { count: entityCount } = await supabase
    .from('entities')
    .select('*', { count: 'exact', head: true })
  check('1. Entity count >= 60', (entityCount ?? 0) >= 60, `got ${entityCount}`)

  // Check 2: At least 20 distinct jurisdictions
  const { data: jurisdictionCounts } = await supabase
    .from('entities')
    .select('jurisdiction_id')
  const distinctJurisdictions = new Set((jurisdictionCounts ?? []).map((e) => e.jurisdiction_id))
  check('2. Distinct jurisdictions >= 20', distinctJurisdictions.size >= 20, `got ${distinctJurisdictions.size}`)

  // Check 3: Spot-check legal name suffixes (JP, DE, SG)
  const { data: jpEntity } = await supabase
    .from('entities')
    .select('legal_name')
    .eq('id', 'b0000000-0000-0000-0000-000000000009') // JP_PROVIDER
    .single()
  const { data: deEntity } = await supabase
    .from('entities')
    .select('legal_name')
    .eq('id', 'b0000000-0000-0000-0000-000000000002') // DE_PROVIDER
    .single()
  const { data: sgEntity } = await supabase
    .from('entities')
    .select('legal_name')
    .eq('id', 'b0000000-0000-0000-0000-000000000008') // SG_PROVIDER
    .single()

  const jpOk = jpEntity?.legal_name?.includes('\u682a\u5f0f\u4f1a\u793e') ?? false
  const deOk = deEntity?.legal_name?.includes('GmbH') ?? false
  const sgOk = sgEntity?.legal_name?.includes('Pte. Ltd.') ?? false
  check('3. Legal name suffixes (JP, DE, SG)', jpOk && deOk && sgOk,
    `JP=${jpOk}(${jpEntity?.legal_name}) DE=${deOk}(${deEntity?.legal_name}) SG=${sgOk}(${sgEntity?.legal_name})`)

  // =========================================================================
  // DATA-02: Jurisdictions
  // =========================================================================
  console.log('\n--- DATA-02: Jurisdictions ---')

  // Check 4: Exactly 23 jurisdictions
  const { count: jurisdictionCount } = await supabase
    .from('jurisdictions')
    .select('*', { count: 'exact', head: true })
  check('4. Jurisdiction count = 23', jurisdictionCount === 23, `got ${jurisdictionCount}`)

  // Check 5: Every jurisdiction has filing_rules with annual_filing_month and fiscal_year_end_month
  const { data: allJurisdictions } = await supabase
    .from('jurisdictions')
    .select('country_code, filing_rules')
  const missingRules = (allJurisdictions ?? []).filter((j) => {
    const rules = j.filing_rules as Record<string, unknown>
    return !rules?.annual_filing_month || !rules?.fiscal_year_end_month
  })
  check('5. All jurisdictions have filing_rules (annual_filing_month, fiscal_year_end_month)',
    missingRules.length === 0,
    missingRules.length > 0 ? `missing in: ${missingRules.map((j) => j.country_code).join(', ')}` : '')

  // =========================================================================
  // DATA-03: Compliance tension
  // =========================================================================
  console.log('\n--- DATA-03: Compliance Tension ---')

  // Check 6: At least 3 overdue compliance requirements
  const { count: overdueCount } = await supabase
    .from('compliance_requirements')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'overdue')
  check('6. Overdue compliance requirements >= 3', (overdueCount ?? 0) >= 3, `got ${overdueCount}`)

  // Check 7: At least 5 pending due within 30 days
  const { count: dueSoonCount } = await supabase
    .from('compliance_requirements')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .gte('due_date', '2026-03-13')
    .lte('due_date', '2026-04-12')
  check('7. Pending due within 30 days >= 5', (dueSoonCount ?? 0) >= 5, `got ${dueSoonCount}`)

  // Check 8: At least 2 dissolving entities
  const { count: dissolvingCount } = await supabase
    .from('entities')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'dissolving')
  check('8. Dissolving entities >= 2', (dissolvingCount ?? 0) >= 2, `got ${dissolvingCount}`)

  // Check 9: At least 3 unresolved overdue alerts
  const { count: overdueAlerts } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('alert_type', 'overdue')
    .eq('resolved', false)
  check('9. Unresolved overdue alerts >= 3', (overdueAlerts ?? 0) >= 3, `got ${overdueAlerts}`)

  // Check 10: At least 5 unresolved due_soon alerts
  const { count: dueSoonAlerts } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('alert_type', 'due_soon')
    .eq('resolved', false)
  check('10. Unresolved due_soon alerts >= 5', (dueSoonAlerts ?? 0) >= 5, `got ${dueSoonAlerts}`)

  // Check 11: At least 2 unresolved at_risk alerts
  const { count: atRiskAlerts } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('alert_type', 'at_risk')
    .eq('resolved', false)
  check('11. Unresolved at_risk alerts >= 2', (atRiskAlerts ?? 0) >= 2, `got ${atRiskAlerts}`)

  // =========================================================================
  // DATA-04: Directors and agreements
  // =========================================================================
  console.log('\n--- DATA-04: Directors & Agreements ---')

  // Check 12: Every entity has at least 1 director
  const { data: allEntities } = await supabase.from('entities').select('id, entity_purpose')
  const { data: allDirectors } = await supabase.from('directors').select('entity_id')
  const directorEntityIds = new Set((allDirectors ?? []).map((d) => d.entity_id))
  const entitiesLackingDirectors = (allEntities ?? []).filter((e) => !directorEntityIds.has(e.id))
  check('12. Every entity has >= 1 director', entitiesLackingDirectors.length === 0,
    entitiesLackingDirectors.length > 0 ? `${entitiesLackingDirectors.length} entities missing directors` : '')

  // Check 13: Every non-HQ entity has at least 1 intercompany agreement
  const { data: allAgreements } = await supabase.from('intercompany_agreements').select('entity_id')
  const agreementEntityIds = new Set((allAgreements ?? []).map((a) => a.entity_id))
  const nonHqEntities = (allEntities ?? []).filter((e) => e.entity_purpose !== 'hq')
  const entitiesLackingAgreements = nonHqEntities.filter((e) => !agreementEntityIds.has(e.id))
  check('13. Every non-HQ entity has >= 1 intercompany agreement', entitiesLackingAgreements.length === 0,
    entitiesLackingAgreements.length > 0 ? `${entitiesLackingAgreements.length} non-HQ entities missing agreements` : '')

  // =========================================================================
  // DATA-05: Entity purpose distribution
  // =========================================================================
  console.log('\n--- DATA-05: Entity Purpose ---')

  // Check 14: entity_purpose counts (reuse allEntities from check 12)
  const purposeCounts = (allEntities ?? []).reduce((acc, e) => {
    acc[e.entity_purpose] = (acc[e.entity_purpose] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const hqCount = purposeCounts['hq'] ?? 0
  const providerCount = purposeCounts['provider_key'] ?? 0
  const customerCount = purposeCounts['customer_entity'] ?? 0
  const purposeOk = hqCount === 1 && providerCount >= 23 && customerCount >= 28
  check('14. Entity purpose: hq=1, provider_key>=23, customer_entity>=28', purposeOk,
    `hq=${hqCount}, provider_key=${providerCount}, customer_entity=${customerCount}, branch=${purposeCounts['branch'] ?? 0}`)

  // =========================================================================
  // Summary
  // =========================================================================
  console.log(`\n${'='.repeat(50)}`)
  console.log(`RESULT: ${passed}/${passed + failed} checks passed`)

  if (failures.length > 0) {
    console.log('\nFailures:')
    for (const f of failures) {
      console.log(`  - ${f}`)
    }
  }

  process.exit(failed > 0 ? 1 : 0)
}

main()
