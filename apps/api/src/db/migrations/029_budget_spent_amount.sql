-- ── Step 2.8.4: Budget spent_amount (calculated) ────────────────────────────

ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS spent_amount DECIMAL(12,2) NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION refresh_budget_spent_amount(
  p_tenant_id UUID,
  p_budget_year INTEGER,
  p_category_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE budgets b
  SET spent_amount = COALESCE((
        SELECT SUM(e.amount)::DECIMAL(12,2)
        FROM expenses e
        WHERE e.tenant_id = p_tenant_id
          AND e.expense_category_id = p_category_id
          AND EXTRACT(YEAR FROM e.expense_date)::INTEGER = p_budget_year
      ), 0)
  WHERE b.tenant_id = p_tenant_id
    AND b.budget_year = p_budget_year
    AND b.category_id = p_category_id;
END;
$$;

CREATE OR REPLACE FUNCTION budgets_spent_amount_expense_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM refresh_budget_spent_amount(
      NEW.tenant_id,
      EXTRACT(YEAR FROM NEW.expense_date)::INTEGER,
      NEW.expense_category_id
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    PERFORM refresh_budget_spent_amount(
      OLD.tenant_id,
      EXTRACT(YEAR FROM OLD.expense_date)::INTEGER,
      OLD.expense_category_id
    );
    PERFORM refresh_budget_spent_amount(
      NEW.tenant_id,
      EXTRACT(YEAR FROM NEW.expense_date)::INTEGER,
      NEW.expense_category_id
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM refresh_budget_spent_amount(
      OLD.tenant_id,
      EXTRACT(YEAR FROM OLD.expense_date)::INTEGER,
      OLD.expense_category_id
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_budgets_spent_amount_on_expenses ON expenses;

CREATE TRIGGER trg_budgets_spent_amount_on_expenses
AFTER INSERT OR UPDATE OR DELETE ON expenses
FOR EACH ROW
EXECUTE FUNCTION budgets_spent_amount_expense_trigger();

-- Backfill spent amounts for existing budgets
UPDATE budgets b
SET spent_amount = COALESCE(agg.total_spent, 0)
FROM (
  SELECT
    e.tenant_id,
    EXTRACT(YEAR FROM e.expense_date)::INTEGER AS budget_year,
    e.expense_category_id AS category_id,
    SUM(e.amount)::DECIMAL(12,2) AS total_spent
  FROM expenses e
  GROUP BY e.tenant_id, EXTRACT(YEAR FROM e.expense_date)::INTEGER, e.expense_category_id
) agg
WHERE b.tenant_id = agg.tenant_id
  AND b.budget_year = agg.budget_year
  AND b.category_id = agg.category_id;

UPDATE budgets
SET spent_amount = 0
WHERE spent_amount IS NULL;
