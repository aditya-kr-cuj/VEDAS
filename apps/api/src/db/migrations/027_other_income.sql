-- ── Step 2.8.2: Other Income & Financial Reports ─────────────────────────────

CREATE TABLE IF NOT EXISTS other_income (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_name   VARCHAR(200) NOT NULL,
  amount        DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  income_date   DATE NOT NULL,
  description   TEXT,
  recorded_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_other_income_tenant ON other_income(tenant_id);
CREATE INDEX IF NOT EXISTS idx_other_income_date   ON other_income(income_date);
