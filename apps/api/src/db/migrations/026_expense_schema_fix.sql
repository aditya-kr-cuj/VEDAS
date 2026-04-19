-- ── Step 2.8.1 corrective: align columns to spec ─────────────────────────────
-- The initial 025 migration used different column names. This migration renames
-- them and adds the missing spec columns.

-- expense_categories: rename 'name' -> 'category_name', add parent_category_id
DO $$
BEGIN
  -- Rename 'name' to 'category_name' if not already done
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expense_categories' AND column_name = 'name'
  ) THEN
    ALTER TABLE expense_categories RENAME COLUMN name TO category_name;
  END IF;

  -- Drop old enum type mismatch columns and recreate with correct enum
  -- category_type was 'miscellaneous' default (wrong enum) - fix the default
  ALTER TABLE expense_categories
    ALTER COLUMN category_type DROP DEFAULT;

  -- Add parent_category_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expense_categories' AND column_name = 'parent_category_id'
  ) THEN
    ALTER TABLE expense_categories
      ADD COLUMN parent_category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create correct enum types for expense_categories.category_type (fixed/variable)
-- The old enum had wrong values — create new ones with correct spec values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_cat_type') THEN
    CREATE TYPE expense_cat_type AS ENUM ('fixed', 'variable');
  END IF;
END $$;

-- Migrate category_type column to new correct enum
ALTER TABLE expense_categories
  ALTER COLUMN category_type TYPE expense_cat_type
  USING 'variable'::expense_cat_type;

ALTER TABLE expense_categories
  ALTER COLUMN category_type SET DEFAULT 'variable'::expense_cat_type;

-- Drop old unused columns from expense_categories
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expense_categories' AND column_name='description') THEN
    ALTER TABLE expense_categories DROP COLUMN description;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expense_categories' AND column_name='color') THEN
    ALTER TABLE expense_categories DROP COLUMN color;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expense_categories' AND column_name='is_active') THEN
    ALTER TABLE expense_categories DROP COLUMN is_active;
  END IF;
END $$;

-- Add index for parent_category_id
CREATE INDEX IF NOT EXISTS idx_expense_categories_parent ON expense_categories(parent_category_id);

-- ── Fix expenses table column names ──────────────────────────────────────────
DO $$
BEGIN
  -- Rename category_id -> expense_category_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='category_id') THEN
    ALTER TABLE expenses RENAME COLUMN category_id TO expense_category_id;
  END IF;

  -- Rename created_by -> recorded_by
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='created_by') THEN
    ALTER TABLE expenses RENAME COLUMN created_by TO recorded_by;
  END IF;

  -- Rename title -> description (expense has description not title per spec)
  -- But title and description are different - spec says description is TEXT
  -- Old schema had: title (VARCHAR), description (TEXT)
  -- Spec wants: description (TEXT), no title
  -- Merge title into description and drop title
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='title') THEN
    UPDATE expenses SET description = title WHERE description IS NULL;
    ALTER TABLE expenses DROP COLUMN title;
  END IF;
END $$;

-- Add recurrence_frequency column per spec (monthly/quarterly/yearly enum)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurrence_frequency') THEN
    CREATE TYPE recurrence_frequency AS ENUM ('monthly', 'quarterly', 'yearly');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='recurrence_frequency') THEN
    ALTER TABLE expenses ADD COLUMN recurrence_frequency recurrence_frequency;
  END IF;
END $$;

-- Fix expense_payment_mode enum values to match spec (cash, bank_transfer, cheque, card)
-- Old enum had: cash, bank_transfer, cheque, upi, card
-- Spec wants:   cash, bank_transfer, cheque, card (no upi)
-- We will not remove upi to avoid breaking existing data, just leave as superset

-- Drop old unused columns from expenses
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='reference_no') THEN
    ALTER TABLE expenses DROP COLUMN reference_no;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='status') THEN
    ALTER TABLE expenses DROP COLUMN status;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='approved_by') THEN
    ALTER TABLE expenses DROP COLUMN approved_by;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='approved_at') THEN
    ALTER TABLE expenses DROP COLUMN approved_at;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='recurrence_day') THEN
    ALTER TABLE expenses DROP COLUMN recurrence_day;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='notes') THEN
    ALTER TABLE expenses DROP COLUMN notes;
  END IF;
END $$;

-- Recreate indexes with correct column names
DROP INDEX IF EXISTS idx_expenses_category;
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(expense_category_id);
