-- supabase/migrations/20260313000000_initial_schema.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Jurisdictions: country-level rule sets
CREATE TABLE jurisdictions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code  TEXT NOT NULL UNIQUE,  -- ISO 3166-1 alpha-2 (e.g., 'JP', 'DE', 'LU')
  country_name  TEXT NOT NULL,
  filing_rules  JSONB NOT NULL DEFAULT '{}',  -- { annual_filing_month, tax_deadline_doy, agent_renewal_month, ... }
  currency      TEXT,
  timezone      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Legal entities (self-referencing hierarchy via parent_entity_id)
CREATE TABLE entities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,          -- display name (e.g., "Hopae Japan")
  legal_name          TEXT NOT NULL,          -- legal name (e.g., "Hopae 株式会社")
  entity_type         TEXT NOT NULL,          -- LLC | Ltd | GmbH | KK | S.A.S | Branch | etc.
  entity_purpose      TEXT NOT NULL DEFAULT 'provider_key',  -- provider_key | customer_entity | hq
  jurisdiction_id     UUID NOT NULL REFERENCES jurisdictions(id),
  parent_entity_id    UUID REFERENCES entities(id),  -- null = top-level (HQ), set for subsidiaries
  incorporation_date  DATE,
  registration_number TEXT,
  status              TEXT NOT NULL DEFAULT 'active',  -- active | dormant | dissolving | dissolved
  banking_info        JSONB NOT NULL DEFAULT '{}',     -- { bank_name, account_number, currency, iban }
  registered_agent    JSONB NOT NULL DEFAULT '{}',     -- { name, address, renewal_date, email }
  metadata            JSONB NOT NULL DEFAULT '{}',     -- flexible: eID provider key ID, customer name, etc.
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Directors / officers per entity
CREATE TABLE directors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id   UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL,       -- Director | Secretary | Statutory Auditor | Manager | etc.
  nationality TEXT,
  start_date  DATE,
  end_date    DATE,                -- NULL = currently serving
  is_current  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compliance requirements (instantiated per entity, computed from jurisdiction rules)
CREATE TABLE compliance_requirements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id        UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL,  -- annual_filing | tax_return | agent_renewal | board_meeting | etc.
  due_date         DATE NOT NULL,
  fiscal_year      INTEGER,
  status           TEXT NOT NULL DEFAULT 'pending',  -- pending | in_progress | completed | overdue
  notes            TEXT,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents (AI-drafted, uploaded, or extracted)
CREATE TABLE documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id        UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  document_type    TEXT NOT NULL,  -- incorporation_cert | intercompany_agreement | filing | tax_return | etc.
  title            TEXT NOT NULL,
  storage_path     TEXT,           -- Supabase Storage path (null if not yet stored)
  source           TEXT NOT NULL DEFAULT 'uploaded',  -- uploaded | ai_drafted | ai_extracted
  signature_status TEXT NOT NULL DEFAULT 'not_required',  -- not_required | pending | signed
  signatories      JSONB NOT NULL DEFAULT '[]',          -- [{ name, email, signed_at }]
  extracted_data   JSONB NOT NULL DEFAULT '{}',          -- AI-extracted: dates, obligations, parties
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Intercompany agreements (entity <-> HQ Luxembourg)
CREATE TABLE intercompany_agreements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  hq_entity_id    UUID NOT NULL REFERENCES entities(id),  -- Luxembourg HQ entity
  agreement_type  TEXT NOT NULL,  -- service_agreement | loan_agreement | ip_license | management_fee | etc.
  title           TEXT NOT NULL,
  effective_date  DATE,
  expiry_date     DATE,           -- NULL = evergreen
  governing_law   TEXT,           -- e.g., "Luxembourg"
  parties         JSONB NOT NULL DEFAULT '[]',  -- [{ name, role, entity_id }]
  key_terms       JSONB NOT NULL DEFAULT '{}',  -- { fee_amount, payment_terms, ip_scope, etc. }
  document_id     UUID REFERENCES documents(id),  -- linked document
  status          TEXT NOT NULL DEFAULT 'active',  -- active | expired | terminated | draft
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alerts (generated by compliance engine; persisted for dashboard display)
CREATE TABLE alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id        UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  requirement_id   UUID REFERENCES compliance_requirements(id) ON DELETE SET NULL,
  alert_type       TEXT NOT NULL,  -- overdue | due_soon | at_risk | info
  message          TEXT NOT NULL,
  due_date         DATE,
  resolved         BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_entities_jurisdiction_id ON entities(jurisdiction_id);
CREATE INDEX idx_entities_parent_entity_id ON entities(parent_entity_id);
CREATE INDEX idx_entities_status ON entities(status);
CREATE INDEX idx_compliance_requirements_entity_id ON compliance_requirements(entity_id);
CREATE INDEX idx_compliance_requirements_due_date ON compliance_requirements(due_date);
CREATE INDEX idx_compliance_requirements_status ON compliance_requirements(status);
CREATE INDEX idx_alerts_entity_id ON alerts(entity_id);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);
CREATE INDEX idx_directors_entity_id ON directors(entity_id);
CREATE INDEX idx_documents_entity_id ON documents(entity_id);
CREATE INDEX idx_intercompany_agreements_entity_id ON intercompany_agreements(entity_id);

-- Entity health summary view (used by Dashboard in Phase 7)
CREATE VIEW entity_health_summary AS
SELECT
  e.id,
  e.name,
  e.legal_name,
  e.entity_type,
  e.entity_purpose,
  e.status,
  e.incorporation_date,
  j.country_code,
  j.country_name,
  COUNT(cr.id) FILTER (WHERE cr.status = 'overdue') AS overdue_count,
  COUNT(cr.id) FILTER (WHERE cr.status = 'pending'
    AND cr.due_date BETWEEN NOW() AND NOW() + INTERVAL '30 days') AS due_soon_count,
  COUNT(cr.id) FILTER (WHERE cr.status IN ('pending', 'in_progress')) AS open_requirements,
  CASE
    WHEN COUNT(cr.id) FILTER (WHERE cr.status = 'overdue') > 0 THEN 'critical'
    WHEN COUNT(cr.id) FILTER (WHERE cr.status = 'pending'
      AND cr.due_date < NOW() + INTERVAL '14 days') > 0 THEN 'warning'
    ELSE 'ok'
  END AS risk_level
FROM entities e
JOIN jurisdictions j ON j.id = e.jurisdiction_id
LEFT JOIN compliance_requirements cr ON cr.entity_id = e.id
GROUP BY e.id, e.name, e.legal_name, e.entity_type, e.entity_purpose,
         e.status, e.incorporation_date, j.country_code, j.country_name;
