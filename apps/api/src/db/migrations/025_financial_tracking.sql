-- ── Step 2.8.1: Expense Recording & Categorization ──────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category_type') THEN
    CREATE TYPE expense_category_type AS ENUM ('fixed', 'variable');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_payment_mode') THEN
    CREATE TYPE expense_payment_mode AS ENUM ('cash', 'bank_transfer', 'cheque', 'card');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurrence_frequency') THEN
    CREATE TYPE recurrence_frequency AS ENUM ('monthly', 'quarterly', 'yearly');
  END IF;
END $$;

-- ── Expense Categories ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_categories (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_name      VARCHAR(120) NOT NULL,
  category_type      expense_category_type NOT NULL DEFAULT 'variable',
  parent_category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, category_name)
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_tenant ON expense_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_parent ON expense_categories(parent_category_id);

-- ── Expenses ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  expense_category_id  UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  amount               DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  expense_date         DATE NOT NULL,
  description          TEXT,
  payment_mode         expense_payment_mode NOT NULL DEFAULT 'cash',
  vendor_name          VARCHAR(200),
  receipt_url          TEXT,
  recorded_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  is_recurring         BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_frequency recurrence_frequency,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_tenant   ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(expense_category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date     ON expenses(expense_date);
