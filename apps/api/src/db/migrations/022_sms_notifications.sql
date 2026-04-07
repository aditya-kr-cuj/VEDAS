DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sms_status') THEN
    CREATE TYPE sms_status AS ENUM ('sent', 'failed', 'queued');
  END IF;
END $$;

-- SMS delivery log
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status sms_status NOT NULL DEFAULT 'queued',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  credits_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_tenant_status ON sms_logs (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs (created_at DESC);

-- Per-tenant SMS credit balance
CREATE TABLE IF NOT EXISTS tenant_sms_credits (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  total_credits INTEGER NOT NULL DEFAULT 0,
  used_credits INTEGER NOT NULL DEFAULT 0,
  low_credit_threshold INTEGER NOT NULL DEFAULT 50,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
