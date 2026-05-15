-- Compatibility migration for older budgets table shape.
-- Ensures columns expected by 028+ migrations/repositories are present.

ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS budget_year INTEGER,
  ADD COLUMN IF NOT EXISTS allocated_amount DECIMAL(12,2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  -- Backfill allocated_amount from legacy `amount` column when available.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'budgets'
      AND column_name = 'amount'
  ) THEN
    EXECUTE '
      UPDATE budgets
      SET allocated_amount = COALESCE(NULLIF(allocated_amount, 0), amount, 0)
      WHERE allocated_amount IS NULL OR allocated_amount = 0
    ';
  END IF;

  -- Backfill budget_year from legacy `period_year` column when available.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'budgets'
      AND column_name = 'period_year'
  ) THEN
    EXECUTE '
      UPDATE budgets
      SET budget_year = COALESCE(budget_year, period_year, EXTRACT(YEAR FROM NOW())::INT)
      WHERE budget_year IS NULL
    ';
  ELSE
    EXECUTE '
      UPDATE budgets
      SET budget_year = COALESCE(budget_year, EXTRACT(YEAR FROM NOW())::INT)
      WHERE budget_year IS NULL
    ';
  END IF;
END $$;

ALTER TABLE budgets
  ALTER COLUMN budget_year SET DEFAULT EXTRACT(YEAR FROM NOW())::INT;

UPDATE budgets
SET budget_year = EXTRACT(YEAR FROM NOW())::INT
WHERE budget_year IS NULL;

ALTER TABLE budgets
  ALTER COLUMN budget_year SET NOT NULL;

ALTER TABLE budgets
  ADD CONSTRAINT budgets_budget_year_range_chk
  CHECK (budget_year BETWEEN 2000 AND 2100) NOT VALID;

ALTER TABLE budgets
  VALIDATE CONSTRAINT budgets_budget_year_range_chk;

CREATE INDEX IF NOT EXISTS idx_budgets_tenant_year ON budgets(tenant_id, budget_year);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'budgets_tenant_year_category_uniq'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM budgets
      GROUP BY tenant_id, budget_year, category_id
      HAVING COUNT(*) > 1
    ) THEN
      EXECUTE '
        CREATE UNIQUE INDEX budgets_tenant_year_category_uniq
        ON budgets(tenant_id, budget_year, category_id)
      ';
    END IF;
  END IF;
END $$;
