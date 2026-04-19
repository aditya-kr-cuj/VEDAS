-- ── Step 2.8.5: GST, Tax Settings, Invoice Numbering, Tally Export ─────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tax_regime') THEN
    CREATE TYPE tax_regime AS ENUM ('gst', 'vat', 'none');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS tax_settings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  gst_number                  VARCHAR(50),
  tax_rate                    DECIMAL(6,2) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  tax_regime                  tax_regime NOT NULL DEFAULT 'none',
  financial_year_start_month  INTEGER NOT NULL DEFAULT 4 CHECK (financial_year_start_month BETWEEN 1 AND 12),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE fee_payments
  ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_fee_payments_tenant_invoice_unique
  ON fee_payments(tenant_id, invoice_number)
  WHERE invoice_number IS NOT NULL;

-- Backfill GST values using tenant tax settings (if present)
UPDATE fee_payments fp
SET gst_amount = COALESCE(
  ROUND((fp.amount * ts.tax_rate / 100.0)::numeric, 2),
  0
)
FROM tax_settings ts
WHERE fp.tenant_id = ts.tenant_id
  AND ts.tax_regime = 'gst';

UPDATE expenses e
SET gst_amount = COALESCE(
  ROUND((e.amount * ts.tax_rate / 100.0)::numeric, 2),
  0
)
FROM tax_settings ts
WHERE e.tenant_id = ts.tenant_id
  AND ts.tax_regime = 'gst';
