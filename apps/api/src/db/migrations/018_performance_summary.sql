CREATE TABLE IF NOT EXISTS performance_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  total_tests_taken INTEGER NOT NULL DEFAULT 0,
  average_score NUMERIC(6,2) NOT NULL DEFAULT 0,
  highest_score NUMERIC(6,2) NOT NULL DEFAULT 0,
  lowest_score NUMERIC(6,2) NOT NULL DEFAULT 0,
  attendance_percentage NUMERIC(6,2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_performance_summary_student ON performance_summary(student_id);
CREATE INDEX IF NOT EXISTS idx_performance_summary_course ON performance_summary(course_id);
