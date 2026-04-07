CREATE TABLE IF NOT EXISTS material_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tag_name VARCHAR(60) NOT NULL,
  color VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, tag_name)
);

CREATE TABLE IF NOT EXISTS material_tag_links (
  material_id UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES material_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (material_id, tag_id)
);

CREATE TABLE IF NOT EXISTS material_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_name VARCHAR(120) NOT NULL,
  parent_category_id UUID REFERENCES material_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, category_name, parent_category_id)
);

CREATE TABLE IF NOT EXISTS material_category_links (
  material_id UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES material_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (material_id, category_id)
);

CREATE TABLE IF NOT EXISTS material_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_type material_file_type NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (material_id, version_number)
);

CREATE TABLE IF NOT EXISTS material_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (material_id, student_id)
);
