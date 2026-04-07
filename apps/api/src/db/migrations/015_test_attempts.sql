DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attempt_status') THEN
    CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'evaluated');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ,
  submit_time TIMESTAMPTZ,
  time_taken_seconds INTEGER,
  total_marks_obtained NUMERIC(8,2) NOT NULL DEFAULT 0,
  percentage NUMERIC(6,2) NOT NULL DEFAULT 0,
  status attempt_status NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (test_id, student_id)
);

CREATE TABLE IF NOT EXISTS test_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  answer_data JSONB NOT NULL,
  is_correct BOOLEAN,
  marks_obtained NUMERIC(8,2),
  evaluated_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_attempt_question ON test_answers(attempt_id, question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON test_attempts(student_id);
