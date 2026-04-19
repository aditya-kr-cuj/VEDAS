-- ── Step 2.8.3: Budget Planning ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS budgets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  budget_year       INTEGER NOT NULL CHECK (budget_year BETWEEN 2000 AND 2100),
  category_id       UUID NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
  allocated_amount  DECIMAL(12,2) NOT NULL CHECK (allocated_amount >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, budget_year, category_id)
);

CREATE INDEX IF NOT EXISTS idx_budgets_tenant_year ON budgets(tenant_id, budget_year);
