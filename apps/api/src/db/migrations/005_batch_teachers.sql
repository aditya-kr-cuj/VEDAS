CREATE TABLE IF NOT EXISTS batch_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  teacher_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, batch_id, teacher_user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_teachers_tenant_id ON batch_teachers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_batch_teachers_batch_id ON batch_teachers(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_teachers_teacher_user_id ON batch_teachers(teacher_user_id);
