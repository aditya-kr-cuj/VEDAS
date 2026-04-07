DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
    CREATE TYPE question_type AS ENUM ('mcq', 'true_false', 'subjective', 'fill_blanks', 'multi_select');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
    CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic VARCHAR(160),
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL,
  difficulty_level difficulty_level NOT NULL,
  marks NUMERIC(6,2) NOT NULL DEFAULT 1,
  created_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
  media_url TEXT,
  explanation TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_bank_tenant ON question_bank(tenant_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_course ON question_bank(course_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_type ON question_bank(question_type);
CREATE INDEX IF NOT EXISTS idx_question_bank_difficulty ON question_bank(difficulty_level);

CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  option_order INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id);

CREATE TABLE IF NOT EXISTS fill_blank_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  blank_position INTEGER NOT NULL,
  correct_answer TEXT NOT NULL,
  case_sensitive BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_fill_blank_question ON fill_blank_answers(question_id);

CREATE TABLE IF NOT EXISTS subjective_rubric (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  rubric_text TEXT NOT NULL,
  max_marks NUMERIC(6,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_subjective_rubric_question ON subjective_rubric(question_id);
