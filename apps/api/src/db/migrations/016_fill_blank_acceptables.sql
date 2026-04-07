ALTER TABLE fill_blank_answers
ADD COLUMN IF NOT EXISTS acceptable_answers JSONB;
