-- GIN full-text search on static text columns (title, description, topic).
-- PostgreSQL does NOT support subqueries in index expressions,
-- so tags (JSONB) are handled via a separate GIN index below.
CREATE INDEX IF NOT EXISTS idx_study_materials_search
ON study_materials
USING GIN (
  to_tsvector(
    'simple',
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(topic, '')
  )
);

-- Separate GIN index for JSONB tags (@> and ? operator support)
CREATE INDEX IF NOT EXISTS idx_study_materials_tags
ON study_materials
USING GIN (tags);
