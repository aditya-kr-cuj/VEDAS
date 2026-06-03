-- Add tenant_code column to tenants table for multi-tenant login flow
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tenant_code VARCHAR(7) UNIQUE;

-- Backfill existing tenants with generated codes (format: XXX-XXX, e.g. VDT-A7K)
DO $$
DECLARE
  t RECORD;
  new_code VARCHAR(7);
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i INT;
BEGIN
  FOR t IN SELECT id FROM tenants WHERE tenant_code IS NULL LOOP
    LOOP
      new_code := '';
      FOR i IN 1..3 LOOP
        new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      END LOOP;
      new_code := new_code || '-';
      FOR i IN 1..3 LOOP
        new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      END LOOP;
      BEGIN
        UPDATE tenants SET tenant_code = new_code WHERE id = t.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        -- Try again with a different code
      END;
    END LOOP;
  END LOOP;
END $$;

-- Now make it NOT NULL for future inserts
ALTER TABLE tenants ALTER COLUMN tenant_code SET NOT NULL;
