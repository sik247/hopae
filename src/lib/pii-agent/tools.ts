/**
 * LangChain tools for the PII detection agent.
 * Each tool performs a specialized step in the PII pipeline.
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import type { PIICategory, PIIRiskLevel, PIIAction, PIIFinding } from './types'

// --- Pattern-based PII detector ---
const PII_PATTERNS: Array<{
  category: PIICategory
  pattern: RegExp
  riskLevel: PIIRiskLevel
  action: PIIAction
}> = [
  { category: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, riskLevel: 'high', action: 'mask' },
  { category: 'phone', pattern: /\+?\d[\d\s\-().]{7,}\d/g, riskLevel: 'medium', action: 'mask' },
  { category: 'iban', pattern: /[A-Z]{2}\d{2}[A-Z0-9]{4,30}/g, riskLevel: 'critical', action: 'redact' },
  { category: 'bank_account', pattern: /\b\d{8,18}\b/g, riskLevel: 'critical', action: 'redact' },
  { category: 'national_id', pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, riskLevel: 'critical', action: 'redact' },
  { category: 'passport', pattern: /\b[A-Z]{1,2}\d{6,9}\b/g, riskLevel: 'critical', action: 'redact' },
  { category: 'ip_address', pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, riskLevel: 'low', action: 'flag' },
  { category: 'date_of_birth', pattern: /\b(0[1-9]|[12]\d|3[01])[\/\-](0[1-9]|1[0-2])[\/\-](19|20)\d{2}\b/g, riskLevel: 'high', action: 'mask' },
]

function maskValue(value: string, category: PIICategory): string {
  if (category === 'email') {
    const [local, domain] = value.split('@')
    return `${local[0]}***@${domain}`
  }
  if (category === 'iban' || category === 'bank_account') {
    return value.slice(0, 4) + '*'.repeat(value.length - 8) + value.slice(-4)
  }
  if (category === 'full_name') {
    const parts = value.split(' ')
    return parts.map((p) => p[0] + '***').join(' ')
  }
  if (value.length <= 4) return '****'
  return value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2)
}

// --- Tool: Scan text for PII patterns ---
export const scanTextForPII = tool(
  async ({ text, fieldName }): Promise<string> => {
    const findings: PIIFinding[] = []

    for (const { category, pattern, riskLevel, action } of PII_PATTERNS) {
      const matches = text.matchAll(new RegExp(pattern.source, pattern.flags))
      for (const match of matches) {
        findings.push({
          category,
          value: match[0],
          maskedValue: maskValue(match[0], category),
          location: fieldName,
          riskLevel,
          suggestedAction: action,
          jurisdiction: null,
          regulation: null,
        })
      }
    }

    return JSON.stringify({ fieldName, findingsCount: findings.length, findings })
  },
  {
    name: 'scan_text_for_pii',
    description: 'Scan a text string for PII patterns like emails, phone numbers, IBANs, national IDs, etc.',
    schema: z.object({
      text: z.string().describe('The text to scan for PII'),
      fieldName: z.string().describe('Name of the field being scanned'),
    }),
  }
)

// --- Tool: Scan entity structured data ---
export const scanEntityData = tool(
  async ({ entityJson }): Promise<string> => {
    const entity = JSON.parse(entityJson)
    const findings: PIIFinding[] = []

    // Scan known PII fields directly
    const piiFieldMap: Array<{ path: string; category: PIICategory; riskLevel: PIIRiskLevel }> = [
      { path: 'legal_name', category: 'full_name', riskLevel: 'medium' },
      { path: 'registration_number', category: 'registration_number', riskLevel: 'high' },
      { path: 'banking_info.account_number', category: 'bank_account', riskLevel: 'critical' },
      { path: 'banking_info.iban', category: 'iban', riskLevel: 'critical' },
      { path: 'banking_info.bank_name', category: 'other', riskLevel: 'medium' },
      { path: 'registered_agent.name', category: 'full_name', riskLevel: 'medium' },
      { path: 'registered_agent.email', category: 'email', riskLevel: 'high' },
      { path: 'registered_agent.address', category: 'address', riskLevel: 'high' },
    ]

    for (const { path, category, riskLevel } of piiFieldMap) {
      const parts = path.split('.')
      let val: unknown = entity
      for (const p of parts) {
        val = val && typeof val === 'object' ? (val as Record<string, unknown>)[p] : undefined
      }
      if (val && typeof val === 'string' && val.trim()) {
        findings.push({
          category,
          value: val,
          maskedValue: maskValue(val, category),
          location: `entity.${path}`,
          riskLevel,
          suggestedAction: riskLevel === 'critical' ? 'redact' : riskLevel === 'high' ? 'mask' : 'flag',
          jurisdiction: entity.jurisdiction?.country_code ?? null,
          regulation: null,
        })
      }
    }

    return JSON.stringify({ findingsCount: findings.length, findings })
  },
  {
    name: 'scan_entity_data',
    description: 'Scan structured entity data (JSON) for known PII fields like banking info, registration numbers, agent details.',
    schema: z.object({
      entityJson: z.string().describe('JSON string of entity data to scan'),
    }),
  }
)

// --- Tool: Scan directors for PII ---
export const scanDirectors = tool(
  async ({ directorsJson }): Promise<string> => {
    const directors = JSON.parse(directorsJson) as Array<{
      full_name: string
      role: string
      nationality?: string | null
      start_date?: string | null
    }>

    const findings: PIIFinding[] = directors.flatMap((d, i) => {
      const result: PIIFinding[] = []
      if (d.full_name) {
        result.push({
          category: 'full_name',
          value: d.full_name,
          maskedValue: maskValue(d.full_name, 'full_name'),
          location: `directors[${i}].full_name`,
          riskLevel: 'high',
          suggestedAction: 'mask',
          jurisdiction: null,
          regulation: 'GDPR Art. 4(1)',
        })
      }
      if (d.nationality) {
        result.push({
          category: 'nationality',
          value: d.nationality,
          maskedValue: '***',
          location: `directors[${i}].nationality`,
          riskLevel: 'medium',
          suggestedAction: 'flag',
          jurisdiction: null,
          regulation: 'GDPR Art. 9',
        })
      }
      return result
    })

    return JSON.stringify({ findingsCount: findings.length, findings })
  },
  {
    name: 'scan_directors',
    description: 'Scan director records for personal data including names and nationalities.',
    schema: z.object({
      directorsJson: z.string().describe('JSON array string of director records'),
    }),
  }
)

// --- Tool: Assess jurisdiction-specific compliance ---
export const assessJurisdictionCompliance = tool(
  async ({ jurisdiction, findingsJson }): Promise<string> => {
    const findings = JSON.parse(findingsJson) as PIIFinding[]

    const JURISDICTION_REGULATIONS: Record<string, { regulation: string; notes: string[] }> = {
      LU: { regulation: 'EU GDPR', notes: ['Luxembourg CNPD oversight', 'Cross-border transfer rules apply', 'Data Protection Officer may be required'] },
      DE: { regulation: 'EU GDPR + BDSG', notes: ['German Federal Data Protection Act applies', 'Stricter employee data rules', 'Works council involvement for employee PII'] },
      FR: { regulation: 'EU GDPR + Loi Informatique', notes: ['CNIL oversight', 'French data localization preferences'] },
      NL: { regulation: 'EU GDPR + UAVG', notes: ['Dutch DPA (AP) oversight', 'BSN processing restrictions'] },
      SG: { regulation: 'PDPA', notes: ['Singapore Personal Data Protection Act', 'Consent-based framework', 'Data breach notification within 3 days'] },
      JP: { regulation: 'APPI', notes: ['Act on Protection of Personal Information', 'Cross-border transfer restrictions', 'PPC oversight'] },
      US: { regulation: 'State laws (CCPA/CPRA)', notes: ['No federal privacy law', 'California CCPA/CPRA if applicable', 'State-by-state compliance required'] },
      GB: { regulation: 'UK GDPR + DPA 2018', notes: ['ICO oversight', 'UK adequacy decision from EU', 'International transfer mechanisms needed'] },
      KR: { regulation: 'PIPA', notes: ['Personal Information Protection Act', 'PIPC oversight', 'Strict consent requirements', 'Data localization for certain categories'] },
      HK: { regulation: 'PDPO', notes: ['Personal Data (Privacy) Ordinance', 'PCPD oversight', 'Six data protection principles'] },
      AU: { regulation: 'Privacy Act 1988', notes: ['Australian Privacy Principles (APPs)', 'OAIC oversight', 'Notifiable Data Breaches scheme'] },
    }

    const reg = JURISDICTION_REGULATIONS[jurisdiction] ?? {
      regulation: 'Local data protection law',
      notes: ['Check local jurisdiction requirements'],
    }

    const enrichedFindings = findings.map((f) => ({
      ...f,
      jurisdiction,
      regulation: f.regulation ?? reg.regulation,
    }))

    return JSON.stringify({
      jurisdiction,
      applicableRegulation: reg.regulation,
      complianceNotes: reg.notes,
      enrichedFindings: enrichedFindings,
      totalFindings: enrichedFindings.length,
      criticalCount: enrichedFindings.filter((f) => f.riskLevel === 'critical').length,
    })
  },
  {
    name: 'assess_jurisdiction_compliance',
    description: 'Assess PII findings against jurisdiction-specific data protection regulations (GDPR, PDPA, APPI, etc.)',
    schema: z.object({
      jurisdiction: z.string().describe('ISO country code (e.g. LU, DE, SG, JP)'),
      findingsJson: z.string().describe('JSON array of PII findings to assess'),
    }),
  }
)

// --- Tool: Generate redaction recommendations ---
export const generateRecommendations = tool(
  async ({ findingsJson, jurisdiction }): Promise<string> => {
    const findings = JSON.parse(findingsJson) as PIIFinding[]

    const recommendations: Array<{
      finding: PIIFinding
      recommendation: string
      priority: 'immediate' | 'soon' | 'review'
    }> = findings.map((f) => {
      let recommendation: string
      let priority: 'immediate' | 'soon' | 'review'

      switch (f.riskLevel) {
        case 'critical':
          recommendation = `REDACT ${f.category} at ${f.location}. Replace with tokenized reference. ${jurisdiction ? `Required under ${f.regulation ?? 'applicable law'}.` : ''}`
          priority = 'immediate'
          break
        case 'high':
          recommendation = `MASK ${f.category} at ${f.location}. Apply partial masking (${f.maskedValue}). Limit access to authorized personnel.`
          priority = 'soon'
          break
        case 'medium':
          recommendation = `FLAG ${f.category} at ${f.location} for review. Consider access controls and logging.`
          priority = 'review'
          break
        default:
          recommendation = `MONITOR ${f.category} at ${f.location}. Low risk but track for audit purposes.`
          priority = 'review'
      }

      return { finding: f, recommendation, priority }
    })

    const summary = {
      immediate: recommendations.filter((r) => r.priority === 'immediate').length,
      soon: recommendations.filter((r) => r.priority === 'soon').length,
      review: recommendations.filter((r) => r.priority === 'review').length,
    }

    return JSON.stringify({ recommendations, summary })
  },
  {
    name: 'generate_recommendations',
    description: 'Generate actionable redaction/masking recommendations for PII findings based on risk level and jurisdiction.',
    schema: z.object({
      findingsJson: z.string().describe('JSON array of PII findings'),
      jurisdiction: z.string().optional().describe('Jurisdiction code for regulation-specific advice'),
    }),
  }
)

export const ALL_PII_TOOLS = [
  scanTextForPII,
  scanEntityData,
  scanDirectors,
  assessJurisdictionCompliance,
  generateRecommendations,
]
