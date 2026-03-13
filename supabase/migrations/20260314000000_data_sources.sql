-- Data Sources: stores user-added Notion/Drive links for reverse-scraping into Supabase

CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,              -- 'notion' | 'google_drive'
  name TEXT NOT NULL,                     -- user-friendly label
  url TEXT NOT NULL,                      -- the Notion page URL or Google Drive folder URL
  source_id TEXT,                         -- extracted Notion page ID or Drive folder ID
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'syncing' | 'synced' | 'error'
  last_synced_at TIMESTAMPTZ,
  entity_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_data_sources_source_type ON data_sources(source_type);
CREATE INDEX idx_data_sources_status ON data_sources(status);
