DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_file_type') THEN
    CREATE TYPE material_file_type AS ENUM ('pdf', 'video', 'image', 'document', 'other');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  file_type material_file_type NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  topic VARCHAR(120),
  tags JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_materials_tenant ON study_materials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_course ON study_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_batch ON study_materials(batch_id);

CREATE TABLE IF NOT EXISTS material_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  can_download BOOLEAN DEFAULT TRUE,
  can_view BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (
    (student_id IS NOT NULL AND batch_id IS NULL)
    OR (student_id IS NULL AND batch_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_material_access_tenant ON material_access(tenant_id);
CREATE INDEX IF NOT EXISTS idx_material_access_material ON material_access(material_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_material_access_student
  ON material_access(material_id, student_id)
  WHERE student_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_material_access_batch
  ON material_access(material_id, batch_id)
  WHERE batch_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS material_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_downloads_material ON material_downloads(material_id);
CREATE INDEX IF NOT EXISTS idx_material_downloads_student ON material_downloads(student_id);
