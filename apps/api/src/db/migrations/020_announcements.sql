DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_type') THEN
    CREATE TYPE announcement_type AS ENUM ('general', 'urgent', 'event', 'holiday');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_target') THEN
    CREATE TYPE announcement_target AS ENUM ('all', 'batch', 'individual');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_priority') THEN
    CREATE TYPE announcement_priority AS ENUM ('low', 'medium', 'high');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  announcement_type announcement_type NOT NULL DEFAULT 'general',
  target_type announcement_target NOT NULL DEFAULT 'all',
  priority announcement_priority NOT NULL DEFAULT 'medium',
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcement_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_announcement_tenant ON announcements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_announcement_recipients_announcement ON announcement_recipients(announcement_id);
