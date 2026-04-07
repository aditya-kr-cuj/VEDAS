DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_type') THEN
    CREATE TYPE test_type AS ENUM ('practice', 'quiz', 'midterm', 'final');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_status') THEN
    CREATE TYPE test_status AS ENUM ('draft', 'scheduled', 'ongoing', 'completed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  created_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
  test_type test_type NOT NULL DEFAULT 'quiz',
  total_marks NUMERIC(8,2) NOT NULL DEFAULT 0,
  passing_marks NUMERIC(8,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  instructions TEXT,
  allow_review BOOLEAN NOT NULL DEFAULT TRUE,
  shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE,
  shuffle_options BOOLEAN NOT NULL DEFAULT FALSE,
  show_result_immediately BOOLEAN NOT NULL DEFAULT FALSE,
  negative_marking NUMERIC(6,2) NOT NULL DEFAULT 0,
  status test_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tests_tenant ON tests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tests_course ON tests(course_id);
CREATE INDEX IF NOT EXISTS idx_tests_batch ON tests(batch_id);
CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);

CREATE TABLE IF NOT EXISTS test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  marks_override NUMERIC(6,2)
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_test_questions ON test_questions(test_id, question_id);
CREATE INDEX IF NOT EXISTS idx_test_questions_test ON test_questions(test_id);
