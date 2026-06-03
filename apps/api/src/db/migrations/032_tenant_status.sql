-- Add proper status to tenants
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS status VARCHAR(20)
DEFAULT 'active'
CHECK (status IN ('pending', 'active', 'suspended', 'rejected'));

-- Sync status with existing is_active
UPDATE tenants SET status = 'active' WHERE is_active = true;
UPDATE tenants SET status = 'suspended' WHERE is_active = false;

-- Add index
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
