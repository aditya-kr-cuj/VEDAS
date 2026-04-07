CREATE INDEX IF NOT EXISTS idx_study_materials_search
ON study_materials
USING GIN (
  to_tsvector(
    'simple',
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(topic, '') || ' ' ||
    COALESCE((
      SELECT string_agg(value, ' ')
      FROM jsonb_array_elements_text(tags) AS t(value)
    ), '')
  )
);
