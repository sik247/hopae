// Hand-written TypeScript types mirroring the SQL schema.
// These are used until `supabase gen types` is available.

// --- JSONB field shapes ---

export interface FilingRules {
  annual_filing_month?: number
  tax_deadline_doy?: number
  agent_renewal_month?: number
  fiscal_year_end_month?: number
  fiscal_year_end_day?: number
  grace_period_days?: number
  [key: string]: unknown
}

export interface BankingInfo {
  bank_name?: string
  account_number?: string
  currency?: string
  iban?: string
  [key: string]: unknown
}

export interface RegisteredAgent {
  name?: string
  address?: string
  renewal_date?: string
  email?: string
  [key: string]: unknown
}

/** Integration link IDs stored in entity.metadata for Notion/Drive panels */
export interface EntityIntegrationLinks {
  notion_page_ids?: string[]
  drive_folder_id?: string
  [key: string]: unknown
}

export interface Signatory {
  name: string
  email?: string
  signed_at?: string
}

export interface AgreementParty {
  name: string
  role: string
  entity_id?: string
}

export interface AgreementKeyTerms {
  fee_amount?: number
  payment_terms?: string
  ip_scope?: string
  [key: string]: unknown
}

// --- Table types ---

export interface Jurisdiction {
  id: string
  country_code: string
  country_name: string
  filing_rules: FilingRules
  currency: string | null
  timezone: string | null
  created_at: string
}

export type EntityPurpose = 'provider_key' | 'customer_entity' | 'hq'
export type EntityStatus = 'active' | 'dormant' | 'dissolving' | 'dissolved'

export interface Entity {
  id: string
  name: string
  legal_name: string
  entity_type: string
  entity_purpose: EntityPurpose
  jurisdiction_id: string
  parent_entity_id: string | null
  incorporation_date: string | null
  registration_number: string | null
  status: EntityStatus
  banking_info: BankingInfo
  registered_agent: RegisteredAgent
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Director {
  id: string
  entity_id: string
  full_name: string
  role: string
  nationality: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean
  created_at: string
}

export type ComplianceStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'

export interface ComplianceRequirement {
  id: string
  entity_id: string
  requirement_type: string
  due_date: string
  fiscal_year: number | null
  status: ComplianceStatus
  notes: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type DocumentSource = 'uploaded' | 'ai_drafted' | 'ai_extracted'
export type SignatureStatus = 'not_required' | 'pending' | 'signed'

export interface Document {
  id: string
  entity_id: string
  document_type: string
  title: string
  storage_path: string | null
  source: DocumentSource
  signature_status: SignatureStatus
  signatories: Signatory[]
  extracted_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type AgreementStatus = 'active' | 'expired' | 'terminated' | 'draft'

export interface IntercompanyAgreement {
  id: string
  entity_id: string
  hq_entity_id: string
  agreement_type: string
  title: string
  effective_date: string | null
  expiry_date: string | null
  governing_law: string | null
  parties: AgreementParty[]
  key_terms: AgreementKeyTerms
  document_id: string | null
  status: AgreementStatus
  created_at: string
}

export type AlertType = 'overdue' | 'due_soon' | 'at_risk' | 'info'

export interface Alert {
  id: string
  entity_id: string
  requirement_id: string | null
  alert_type: AlertType
  message: string
  due_date: string | null
  resolved: boolean
  resolved_at: string | null
  created_at: string
}

// --- Data source types ---

export type DataSourceType = 'notion' | 'google_drive'
export type DataSourceStatus = 'pending' | 'syncing' | 'synced' | 'error'

export interface DataSource {
  id: string
  source_type: DataSourceType
  name: string
  url: string
  source_id: string | null
  status: DataSourceStatus
  last_synced_at: string | null
  entity_count: number
  error_message: string | null
  created_at: string
  updated_at: string
}

// --- View types ---

export type RiskLevel = 'critical' | 'warning' | 'ok'

export interface EntityHealthSummary {
  id: string
  name: string
  legal_name: string
  entity_type: string
  entity_purpose: EntityPurpose
  status: EntityStatus
  incorporation_date: string | null
  country_code: string
  country_name: string
  overdue_count: number
  due_soon_count: number
  open_requirements: number
  risk_level: RiskLevel
}
