DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_status') THEN
    CREATE TYPE whatsapp_status AS ENUM ('sent', 'failed', 'queued');
  END IF;
END $$;

-- WhatsApp message delivery log
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_params JSONB NOT NULL DEFAULT '[]',
  status whatsapp_status NOT NULL DEFAULT 'queued',
  message_id TEXT,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_tenant_status ON whatsapp_logs (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON whatsapp_logs (created_at DESC);

-- Pre-approved WhatsApp message templates (reference copy)
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  body_text TEXT NOT NULL DEFAULT '',
  param_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

-- User opt-in tracking (WhatsApp policy requirement)
CREATE TABLE IF NOT EXISTS whatsapp_optins (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  opted_in BOOLEAN NOT NULL DEFAULT TRUE,
  opted_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, phone)
);
