/**
 * Zod schemas for LangChain structured output.
 * Used by the PII agent to ensure consistent, typed responses from the LLM.
 */

import { z } from 'zod'

/** Schema for a single PII finding — used as structured output from LLM classification */
export const PIIFindingSchema = z.object({
  category: z.enum([
    'full_name', 'email', 'phone', 'address', 'national_id',
    'passport', 'bank_account', 'iban', 'tax_id',
    'registration_number', 'date_of_birth', 'nationality',
    'ip_address', 'other',
  ]).describe('The type of PII detected'),
  value: z.string().describe('The actual PII value found'),
  maskedValue: z.string().describe('Masked version of the value (e.g. J***@email.com)'),
  location: z.string().describe('Where in the data the PII was found (e.g. entity.banking_info.iban)'),
  riskLevel: z.enum(['critical', 'high', 'medium', 'low']).describe('Risk severity'),
  suggestedAction: z.enum(['redact', 'mask', 'tokenize', 'flag', 'retain']).describe('Recommended remediation action'),
  jurisdiction: z.string().nullable().describe('ISO country code if jurisdiction-specific'),
  regulation: z.string().nullable().describe('Applicable regulation (e.g. GDPR Art. 4(1))'),
})

/** Schema for the complete PII scan result — structured output for the final compilation */
export const PIIScanResultSchema = z.object({
  entityId: z.string(),
  entityName: z.string(),
  findings: z.array(PIIFindingSchema),
  totalFindings: z.number(),
  criticalCount: z.number(),
  highCount: z.number(),
  mediumCount: z.number(),
  lowCount: z.number(),
  scannedAt: z.string(),
  scannedFields: z.array(z.string()),
  complianceNotes: z.array(z.string()),
})

/** Schema for LLM-powered PII classification of a single field */
export const PIIClassificationSchema = z.object({
  isPII: z.boolean().describe('Whether this field contains PII'),
  category: z.enum([
    'full_name', 'email', 'phone', 'address', 'national_id',
    'passport', 'bank_account', 'iban', 'tax_id',
    'registration_number', 'date_of_birth', 'nationality',
    'ip_address', 'other', 'none',
  ]).describe('PII category or "none"'),
  riskLevel: z.enum(['critical', 'high', 'medium', 'low', 'none']).describe('Risk level'),
  reason: z.string().describe('Brief explanation of why this is/isn\'t PII'),
  suggestedAction: z.enum(['redact', 'mask', 'tokenize', 'flag', 'retain']).describe('Recommended action'),
  applicableRegulations: z.array(z.string()).describe('Applicable data protection regulations'),
})

/** Schema for batch PII classification */
export const PIIBatchClassificationSchema = z.object({
  classifications: z.array(z.object({
    fieldPath: z.string().describe('The field path that was analyzed'),
    classification: PIIClassificationSchema,
  })),
  overallRiskLevel: z.enum(['critical', 'high', 'medium', 'low', 'none']),
  complianceNotes: z.array(z.string()).describe('Jurisdiction-specific compliance notes'),
})

/** Schema for jurisdiction compliance assessment */
export const JurisdictionAssessmentSchema = z.object({
  jurisdiction: z.string().describe('ISO country code'),
  applicableRegulation: z.string().describe('Primary applicable regulation'),
  complianceStatus: z.enum(['compliant', 'at_risk', 'non_compliant', 'needs_review']),
  requiredActions: z.array(z.object({
    finding: z.string().describe('The PII finding this action addresses'),
    action: z.string().describe('Required action to achieve compliance'),
    priority: z.enum(['immediate', 'soon', 'review']),
    deadline: z.string().optional().describe('Compliance deadline if applicable'),
  })),
  complianceNotes: z.array(z.string()),
})

export type PIIClassification = z.infer<typeof PIIClassificationSchema>
export type PIIBatchClassification = z.infer<typeof PIIBatchClassificationSchema>
export type JurisdictionAssessment = z.infer<typeof JurisdictionAssessmentSchema>
