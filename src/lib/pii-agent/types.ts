/** PII Agent types — classification, scanning results, and agent state */

export type PIICategory =
  | 'full_name'
  | 'email'
  | 'phone'
  | 'address'
  | 'national_id'
  | 'passport'
  | 'bank_account'
  | 'iban'
  | 'tax_id'
  | 'registration_number'
  | 'date_of_birth'
  | 'nationality'
  | 'ip_address'
  | 'other'

export type PIIRiskLevel = 'critical' | 'high' | 'medium' | 'low'

export type PIIAction = 'redact' | 'mask' | 'tokenize' | 'flag' | 'retain'

export interface PIIFinding {
  category: PIICategory
  value: string
  maskedValue: string
  location: string
  riskLevel: PIIRiskLevel
  suggestedAction: PIIAction
  jurisdiction: string | null
  regulation: string | null
}

export interface PIIScanResult {
  entityId: string
  entityName: string
  findings: PIIFinding[]
  totalFindings: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  scannedAt: string
  scannedFields: string[]
  complianceNotes: string[]
}

/** LangGraph agent state */
export interface PIIAgentState {
  messages: Array<{ role: string; content: string }>
  entityData: Record<string, unknown> | null
  documentText: string | null
  findings: PIIFinding[]
  scanComplete: boolean
  complianceNotes: string[]
  currentStep: 'idle' | 'scanning' | 'classifying' | 'assessing' | 'recommending' | 'done'
}
