import { query, withTransaction } from '../../db/client.js';
import { HttpError } from '../../utils/http-error.js';

export interface MaterialRecord {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  file_type: string;
  file_url: string;
  file_size: string;
  uploaded_by: string | null;
  course_id: string;
  batch_id: string | null;
  topic: string | null;
  tags: unknown;
  is_public: boolean;
  download_count: number;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function isTeacherAssignedToCourse(payload: {
  tenantId: string;
  userId: string;
  courseId: string;
}) {
  const rows = await query(
    `
      SELECT 1
      FROM teachers t
      JOIN course_teachers ct ON ct.teacher_id = t.id
      WHERE t.tenant_id = $1 AND t.user_id = $2 AND ct.course_id = $3
      LIMIT 1
    `,
    [payload.tenantId, payload.userId, payload.courseId]
  );
  return Boolean(rows[0]);
}

export async function createMaterial(payload: {
  tenantId: string;
  title: string;
  description?: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  courseId: string;
  batchId?: string | null;
  topic?: string;
  tags: string[];
  isPublic: boolean;
  tagIds?: string[];
  categoryIds?: string[];
}): Promise<MaterialRecord> {
  return withTransaction(async (client) => {
    const rows = await client.query<MaterialRecord>(
      `
        INSERT INTO study_materials (
          tenant_id, title, description, file_type, file_url, file_size,
          uploaded_by, course_id, batch_id, topic, tags, is_public
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING *
      `,
      [
        payload.tenantId,
        payload.title,
        payload.description ?? null,
        payload.fileType,
        payload.fileUrl,
        payload.fileSize,
        payload.uploadedBy,
        payload.courseId,
        payload.batchId ?? null,
        payload.topic ?? null,
        JSON.stringify(payload.tags ?? []),
        payload.isPublic
      ]
    );

    const material = rows.rows[0];

    if (payload.tagIds?.length) {
      for (const tagId of payload.tagIds) {
        await client.query(
          `INSERT INTO material_tag_links (material_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [material.id, tagId]
        );
      }
    }

    if (payload.categoryIds?.length) {
      for (const categoryId of payload.categoryIds) {
        await client.query(
          `INSERT INTO material_category_links (material_id, category_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [material.id, categoryId]
        );
      }
    }

    return material;
  });
}

export async function listMaterials(payload: {
  tenantId: string;
  courseId?: string;
  batchId?: string;
  fileType?: string;
  search?: string;
  page: number;
  limit: number;
}) {
  const where: string[] = ['tenant_id = $1', 'is_deleted = FALSE'];
  const values: Array<string | number> = [payload.tenantId];
  let idx = values.length + 1;

  if (payload.courseId) {
    where.push(`course_id = $${idx++}`);
    values.push(payload.courseId);
  }
  if (payload.batchId) {
    where.push(`batch_id = $${idx++}`);
    values.push(payload.batchId);
  }
  if (payload.fileType) {
    where.push(`file_type = $${idx++}`);
    values.push(payload.fileType);
  }
  if (payload.search) {
    where.push(`(title ILIKE $${idx} OR description ILIKE $${idx} OR topic ILIKE $${idx})`);
    values.push(`%${payload.search}%`);
    idx += 1;
  }

  const offset = (payload.page - 1) * payload.limit;

  const rows = await query<MaterialRecord>(
    `
      SELECT *
      FROM study_materials
      WHERE ${where.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `,
    [...values, payload.limit, offset]
  );

  const [count] = await query<{ total: string }>(
    `
      SELECT COUNT(*)::text AS total
      FROM study_materials
      WHERE ${where.join(' AND ')}
    `,
    values
  );

  return { rows, total: Number(count?.total ?? 0) };
}

export async function listMaterialsForTeacher(payload: {
  tenantId: string;
  userId: string;
  courseId?: string;
  batchId?: string;
  fileType?: string;
  search?: string;
  page: number;
  limit: number;
}) {
  const where: string[] = ['m.tenant_id = $1', 'm.is_deleted = FALSE'];
  const values: Array<string | number> = [payload.tenantId];
  let idx = values.length + 1;

  where.push(
    `EXISTS (
      SELECT 1
      FROM course_teachers ct
      JOIN teachers t ON t.id = ct.teacher_id
      WHERE ct.course_id = m.course_id AND t.user_id = $${idx}
    )`
  );
  values.push(payload.userId);
  idx += 1;

  if (payload.courseId) {
    where.push(`m.course_id = $${idx++}`);
    values.push(payload.courseId);
  }
  if (payload.batchId) {
    where.push(`m.batch_id = $${idx++}`);
    values.push(payload.batchId);
  }
  if (payload.fileType) {
    where.push(`m.file_type = $${idx++}`);
    values.push(payload.fileType);
  }
  if (payload.search) {
    where.push(`(m.title ILIKE $${idx} OR m.description ILIKE $${idx} OR m.topic ILIKE $${idx})`);
    values.push(`%${payload.search}%`);
    idx += 1;
  }

  const offset = (payload.page - 1) * payload.limit;

  const rows = await query<MaterialRecord>(
    `
      SELECT m.*
      FROM study_materials m
      WHERE ${where.join(' AND ')}
      ORDER BY m.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `,
    [...values, payload.limit, offset]
  );

  const [count] = await query<{ total: string }>(
    `
      SELECT COUNT(*)::text AS total
      FROM study_materials m
      WHERE ${where.join(' AND ')}
    `,
    values
  );

  return { rows, total: Number(count?.total ?? 0) };
}

export async function searchMaterialsForAdmin(payload: {
  tenantId: string;
  query: string;
  courseId?: string;
  batchId?: string;
  fileType?: string;
  uploadedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  sort: 'newest' | 'most_downloaded' | 'alphabetical';
  page: number;
  limit: number;
}) {
  const where: string[] = ['m.tenant_id = $1', 'm.is_deleted = FALSE'];
  const values: Array<string | number> = [payload.tenantId];
  let idx = values.length + 1;

  if (payload.courseId) {
    where.push(`m.course_id = $${idx++}`);
    values.push(payload.courseId);
  }
  if (payload.batchId) {
    where.push(`m.batch_id = $${idx++}`);
    values.push(payload.batchId);
  }
  if (payload.fileType) {
    where.push(`m.file_type = $${idx++}`);
    values.push(payload.fileType);
  }
  if (payload.uploadedBy) {
    where.push(`m.uploaded_by = $${idx++}`);
    values.push(payload.uploadedBy);
  }
  if (payload.dateFrom) {
    where.push(`m.created_at::date >= $${idx++}`);
    values.push(payload.dateFrom);
  }
  if (payload.dateTo) {
    where.push(`m.created_at::date <= $${idx++}`);
    values.push(payload.dateTo);
  }

  const orderBy =
    payload.sort === 'most_downloaded'
      ? 'm.download_count DESC'
      : payload.sort === 'alphabetical'
        ? 'm.title ASC'
        : 'm.created_at DESC';

  const offset = (payload.page - 1) * payload.limit;

  const rows = await query(
    `
      WITH base AS (
        SELECT
          m.*,
          COALESCE((
            SELECT string_agg(value, ' ')
            FROM jsonb_array_elements_text(m.tags) AS t(value)
          ), '') AS tags_text,
          to_tsvector('simple',
            COALESCE(m.title, '') || ' ' ||
            COALESCE(m.description, '') || ' ' ||
            COALESCE(m.topic, '') || ' ' ||
            COALESCE((
              SELECT string_agg(value, ' ')
              FROM jsonb_array_elements_text(m.tags) AS t(value)
            ), '')
          ) AS document
        FROM study_materials m
        WHERE ${where.join(' AND ')}
      )
      SELECT
        *,
        ts_headline('simple', title, plainto_tsquery('simple', $${idx}), 'StartSel=<mark>, StopSel=</mark>') AS highlight_title,
        ts_headline('simple', COALESCE(description, ''), plainto_tsquery('simple', $${idx}), 'StartSel=<mark>, StopSel=</mark>') AS highlight_description,
        ts_headline('simple', tags_text, plainto_tsquery('simple', $${idx}), 'StartSel=<mark>, StopSel=</mark>') AS highlight_tags
      FROM base
      WHERE document @@ plainto_tsquery('simple', $${idx})
      ORDER BY ${orderBy}
      LIMIT $${idx + 1} OFFSET $${idx + 2}
    `,
    [...values, payload.query, payload.limit, offset]
  );

  const [count] = await query<{ total: string }>(
    `
      WITH base AS (
        SELECT
          m.*,
          to_tsvector('simple',
            COALESCE(m.title, '') || ' ' ||
            COALESCE(m.description, '') || ' ' ||
            COALESCE(m.topic, '') || ' ' ||
            COALESCE((
              SELECT string_agg(value, ' ')
              FROM jsonb_array_elements_text(m.tags) AS t(value)
            ), '')
          ) AS document
        FROM study_materials m
        WHERE ${where.join(' AND ')}
      )
      SELECT COUNT(*)::text AS total
      FROM base
      WHERE document @@ plainto_tsquery('simple', $${idx})
    `,
    [...values, payload.query]
  );

  return { rows, total: Number(count?.total ?? 0) };
}

export async function searchMaterialsForTeacher(payload: {
  tenantId: string;
  userId: string;
  query: string;
  courseId?: string;
  batchId?: string;
  fileType?: string;
  uploadedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  sort: 'newest' | 'most_downloaded' | 'alphabetical';
  page: number;
  limit: number;
}) {
  const where: string[] = ['m.tenant_id = $1', 'm.is_deleted = FALSE'];
  const values: Array<string | number> = [payload.tenantId];
  let idx = values.length + 1;

  where.push(
    `EXISTS (
      SELECT 1
      FROM course_teachers ct
      JOIN teachers t ON t.id = ct.teacher_id
      WHERE ct.course_id = m.course_id AND t.user_id = $${idx}
    )`
  );
  values.push(payload.userId);
  idx += 1;

  if (payload.courseId) {
    where.push(`m.course_id = $${idx++}`);
    values.push(payload.courseId);
  }
  if (payload.batchId) {
    where.push(`m.batch_id = $${idx++}`);
    values.push(payload.batchId);
  }
  if (payload.fileType) {
    where.push(`m.file_type = $${idx++}`);
    values.push(payload.fileType);
  }
  if (payload.uploadedBy) {
    where.push(`m.uploaded_by = $${idx++}`);
    values.push(payload.uploadedBy);
  }
  if (payload.dateFrom) {
    where.push(`m.created_at::date >= $${idx++}`);
    values.push(payload.dateFrom);
  }
  if (payload.dateTo) {
    where.push(`m.created_at::date <= $${idx++}`);
    values.push(payload.dateTo);
  }

  const orderBy =
    payload.sort === 'most_downloaded'
      ? 'm.download_count DESC'
      : payload.sort === 'alphabetical'
        ? 'm.title ASC'
        : 'm.created_at DESC';

  const offset = (payload.page - 1) * payload.limit;

  const rows = await query(
    `
      WITH base AS (
        SELECT
          m.*,
          COALESCE((
            SELECT string_agg(value, ' ')
            FROM jsonb_array_elements_text(m.tags) AS t(value)
          ), '') AS tags_text,
          to_tsvector('simple',
            COALESCE(m.title, '') || ' ' ||
            COALESCE(m.description, '') || ' ' ||
            COALESCE(m.topic, '') || ' ' ||
            COALESCE((
              SELECT string_agg(value, ' ')
              FROM jsonb_array_elements_text(m.tags) AS t(value)
            ), '')
          ) AS document
        FROM study_materials m
        WHERE ${where.join(' AND ')}
      )
      SELECT
        *,
        ts_headline('simple', title, plainto_tsquery('simple', $${idx}), 'StartSel=<mark>, StopSel=</mark>') AS highlight_title,
        ts_headline('simple', COALESCE(description, ''), plainto_tsquery('simple', $${idx}), 'StartSel=<mark>, StopSel=</mark>') AS highlight_description,
        ts_headline('simple', tags_text, plainto_tsquery('simple', $${idx}), 'StartSel=<mark>, StopSel=</mark>') AS highlight_tags
      FROM base
      WHERE document @@ plainto_tsquery('simple', $${idx})
      ORDER BY ${orderBy}
      LIMIT $${idx + 1} OFFSET $${idx + 2}
    `,
    [...values, payload.query, payload.limit, offset]
  );

  const [count] = await query<{ total: string }>(
    `
      WITH base AS (
        SELECT
          m.*,
          to_tsvector('simple',
            COALESCE(m.title, '') || ' ' ||
            COALESCE(m.description, '') || ' ' ||
            COALESCE(m.topic, '') || ' ' ||
            COALESCE((
              SELECT string_agg(value, ' ')
              FROM jsonb_array_elements_text(m.tags) AS t(value)
            ), '')
          ) AS document
        FROM study_materials m
        WHERE ${where.join(' AND ')}
      )
      SELECT COUNT(*)::text AS total
      FROM base
      WHERE document @@ plainto_tsquery('simple', $${idx})
    `,
    [...values, payload.query]
  );

  return { rows, total: Number(count?.total ?? 0) };
}

export async function searchMaterialsForStudent(payload: {
  tenantId: string;
  studentId: string;
  query: string;
  courseId?: string;
  batchId?: string;
  fileType?: string;
  uploadedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  sort: 'newest' | 'most_downloaded' | 'alphabetical';
  page: number;
  limit: number;
}) {
  const where: string[] = ['m.tenant_id = $1', 'm.is_deleted = FALSE'];
  const values: Array<string | number> = [payload.tenantId];
  let idx = values.length + 1;

  if (payload.courseId) {
    where.push(`m.course_id = $${idx++}`);
    values.push(payload.courseId);
  }
  if (payload.batchId) {
    where.push(`m.batch_id = $${idx++}`);
    values.push(payload.batchId);
  }
  if (payload.fileType) {
    where.push(`m.file_type = $${idx++}`);
    values.push(payload.fileType);
  }
  if (payload.uploadedBy) {
    where.push(`m.uploaded_by = $${idx++}`);
    values.push(payload.uploadedBy);
  }
  if (payload.dateFrom) {
    where.push(`m.created_at::date >= $${idx++}`);
    values.push(payload.dateFrom);
  }
  if (payload.dateTo) {
    where.push(`m.created_at::date <= $${idx++}`);
    values.push(payload.dateTo);
  }

  where.push(
    `
      (
        (m.is_public = TRUE AND (
          (m.batch_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM batch_students bs WHERE bs.batch_id = m.batch_id AND bs.student_id = $${idx}
          ))
          OR (m.batch_id IS NULL AND EXISTS (
            SELECT 1
            FROM batch_students bs
            JOIN batches b ON b.id = bs.batch_id
            WHERE bs.student_id = $${idx} AND b.course_id = m.course_id
          ))
        ))
        OR (m.batch_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM batch_students bs WHERE bs.batch_id = m.batch_id AND bs.student_id = $${idx}
        ))
        OR EXISTS (
          SELECT 1 FROM material_access ma WHERE ma.material_id = m.id AND ma.student_id = $${idx}
        )
        OR EXISTS (
          SELECT 1
          FROM material_access ma
          JOIN batch_students bs ON bs.batch_id = ma.batch_id
          WHERE ma.material_id = m.id AND bs.student_id = $${idx}
        )
      )
    `
  );
  values.push(payload.studentId);
  idx += 1;

  const orderBy =
    payload.sort === 'most_downloaded'
      ? 'm.download_count DESC'
      : payload.sort === 'alphabetical'
        ? 'm.title ASC'
        : 'm.created_at DESC';

  const offset = (payload.page - 1) * payload.limit;

  const rows = await query(
    `
      WITH base AS (
        SELECT
          m.*,
          COALESCE((
            SELECT string_agg(value, ' ')
            FROM jsonb_array_elements_text(m.tags) AS t(value)
          ), '') AS tags_text,
          to_tsvector('simple',
            COALESCE(m.title, '') || ' ' ||
            COALESCE(m.description, '') || ' ' ||
            COALESCE(m.topic, '') || ' ' ||
            COALESCE((
              SELECT string_agg(value, ' ')
              FROM jsonb_array_elements_text(m.tags) AS t(value)
            ), '')
          ) AS document
        FROM study_materials m
        WHERE ${where.join(' AND ')}
      )
      SELECT
        *,
        ts_headline('simple', title, plainto_tsquery('simple', $${idx}), 'StartSel=<mark>, StopSel=</mark>') AS highlight_title,
        ts_headline('simple', COALESCE(description, ''), plainto_tsquery('simple', $${idx}), 'StartSel=<mark>, StopSel=</mark>') AS highlight_description,
        ts_headline('simple', tags_text, plainto_tsquery('simple', $${idx}), 'StartSel=<mark>, StopSel=</mark>') AS highlight_tags
      FROM base
      WHERE document @@ plainto_tsquery('simple', $${idx})
      ORDER BY ${orderBy}
      LIMIT $${idx + 1} OFFSET $${idx + 2}
    `,
    [...values, payload.query, payload.limit, offset]
  );

  const [count] = await query<{ total: string }>(
    `
      WITH base AS (
        SELECT
          m.*,
          to_tsvector('simple',
            COALESCE(m.title, '') || ' ' ||
            COALESCE(m.description, '') || ' ' ||
            COALESCE(m.topic, '') || ' ' ||
            COALESCE((
              SELECT string_agg(value, ' ')
              FROM jsonb_array_elements_text(m.tags) AS t(value)
            ), '')
          ) AS document
        FROM study_materials m
        WHERE ${where.join(' AND ')}
      )
      SELECT COUNT(*)::text AS total
      FROM base
      WHERE document @@ plainto_tsquery('simple', $${idx})
    `,
    [...values, payload.query]
  );

  return { rows, total: Number(count?.total ?? 0) };
}

export async function listMaterialsForStudent(payload: {
  tenantId: string;
  studentId: string;
  courseId?: string;
  batchId?: string;
  fileType?: string;
  search?: string;
  page: number;
  limit: number;
}) {
  const where: string[] = ['m.tenant_id = $1', 'm.is_deleted = FALSE'];
  const values: Array<string | number> = [payload.tenantId];
  let idx = values.length + 1;

  if (payload.courseId) {
    where.push(`m.course_id = $${idx++}`);
    values.push(payload.courseId);
  }
  if (payload.batchId) {
    where.push(`m.batch_id = $${idx++}`);
    values.push(payload.batchId);
  }
  if (payload.fileType) {
    where.push(`m.file_type = $${idx++}`);
    values.push(payload.fileType);
  }
  if (payload.search) {
    where.push(`(m.title ILIKE $${idx} OR m.description ILIKE $${idx} OR m.topic ILIKE $${idx})`);
    values.push(`%${payload.search}%`);
    idx += 1;
  }

  where.push(
    `
      (
        (m.is_public = TRUE AND (
          (m.batch_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM batch_students bs WHERE bs.batch_id = m.batch_id AND bs.student_id = $${idx}
          ))
          OR (m.batch_id IS NULL AND EXISTS (
            SELECT 1
            FROM batch_students bs
            JOIN batches b ON b.id = bs.batch_id
            WHERE bs.student_id = $${idx} AND b.course_id = m.course_id
          ))
        ))
        OR (m.batch_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM batch_students bs WHERE bs.batch_id = m.batch_id AND bs.student_id = $${idx}
        ))
        OR EXISTS (
          SELECT 1 FROM material_access ma WHERE ma.material_id = m.id AND ma.student_id = $${idx}
        )
        OR EXISTS (
          SELECT 1
          FROM material_access ma
          JOIN batch_students bs ON bs.batch_id = ma.batch_id
          WHERE ma.material_id = m.id AND bs.student_id = $${idx}
        )
      )
    `
  );
  values.push(payload.studentId);
  idx += 1;

  const offset = (payload.page - 1) * payload.limit;

  const rows = await query<MaterialRecord>(
    `
      SELECT m.*
      FROM study_materials m
      WHERE ${where.join(' AND ')}
      ORDER BY m.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `,
    [...values, payload.limit, offset]
  );

  const [count] = await query<{ total: string }>(
    `
      SELECT COUNT(*)::text AS total
      FROM study_materials m
      WHERE ${where.join(' AND ')}
    `,
    values
  );

  return { rows, total: Number(count?.total ?? 0) };
}

export async function findMaterialById(tenantId: string, materialId: string) {
  const rows = await query<MaterialRecord>(
    `
      SELECT *
      FROM study_materials
      WHERE tenant_id = $1 AND id = $2 AND is_deleted = FALSE
      LIMIT 1
    `,
    [tenantId, materialId]
  );
  return rows[0] ?? null;
}

export async function canStudentAccessMaterial(payload: {
  tenantId: string;
  studentId: string;
  materialId: string;
}) {
  const rows = await query(
    `
      SELECT 1
      FROM study_materials m
      WHERE m.tenant_id = $1 AND m.id = $2 AND m.is_deleted = FALSE AND (
        (m.is_public = TRUE AND (
          (m.batch_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM batch_students bs WHERE bs.batch_id = m.batch_id AND bs.student_id = $3
          ))
          OR (m.batch_id IS NULL AND EXISTS (
            SELECT 1
            FROM batch_students bs
            JOIN batches b ON b.id = bs.batch_id
            WHERE bs.student_id = $3 AND b.course_id = m.course_id
          ))
        ))
        OR (m.batch_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM batch_students bs WHERE bs.batch_id = m.batch_id AND bs.student_id = $3
        ))
        OR EXISTS (
          SELECT 1 FROM material_access ma WHERE ma.material_id = m.id AND ma.student_id = $3
        )
        OR EXISTS (
          SELECT 1
          FROM material_access ma
          JOIN batch_students bs ON bs.batch_id = ma.batch_id
          WHERE ma.material_id = m.id AND bs.student_id = $3
        )
      )
      LIMIT 1
    `,
    [payload.tenantId, payload.materialId, payload.studentId]
  );
  return Boolean(rows[0]);
}

export async function canTeacherAccessMaterial(payload: {
  tenantId: string;
  userId: string;
  materialId: string;
}) {
  const rows = await query(
    `
      SELECT 1
      FROM study_materials m
      JOIN course_teachers ct ON ct.course_id = m.course_id
      JOIN teachers t ON t.id = ct.teacher_id
      WHERE m.tenant_id = $1 AND m.id = $2 AND t.user_id = $3
      LIMIT 1
    `,
    [payload.tenantId, payload.materialId, payload.userId]
  );
  return Boolean(rows[0]);
}

export async function updateMaterial(payload: {
  tenantId: string;
  materialId: string;
  title?: string;
  description?: string;
  topic?: string;
  tags?: string[];
  tagIds?: string[];
  categoryIds?: string[];
  isPublic?: boolean;
}) {
  const fields: string[] = [];
  const values: Array<string | boolean> = [];
  let idx = 1;

  if (payload.title !== undefined) {
    fields.push(`title = $${idx++}`);
    values.push(payload.title);
  }
  if (payload.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(payload.description);
  }
  if (payload.topic !== undefined) {
    fields.push(`topic = $${idx++}`);
    values.push(payload.topic);
  }
  if (payload.tags !== undefined) {
    fields.push(`tags = $${idx++}`);
    values.push(JSON.stringify(payload.tags));
  }
  if (payload.isPublic !== undefined) {
    fields.push(`is_public = $${idx++}`);
    values.push(payload.isPublic);
  }

  if (fields.length === 0) {
    throw new HttpError(400, 'No updates provided');
  }

  await withTransaction(async (client) => {
    values.push(payload.tenantId, payload.materialId);
    await client.query(
      `
        UPDATE study_materials
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE tenant_id = $${idx} AND id = $${idx + 1} AND is_deleted = FALSE
      `,
      values
    );

    if (payload.tagIds) {
      await client.query(`DELETE FROM material_tag_links WHERE material_id = $1`, [payload.materialId]);
      for (const tagId of payload.tagIds) {
        await client.query(
          `INSERT INTO material_tag_links (material_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [payload.materialId, tagId]
        );
      }
    }

    if (payload.categoryIds) {
      await client.query(`DELETE FROM material_category_links WHERE material_id = $1`, [payload.materialId]);
      for (const categoryId of payload.categoryIds) {
        await client.query(
          `INSERT INTO material_category_links (material_id, category_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [payload.materialId, categoryId]
        );
      }
    }
  });
}

export async function softDeleteMaterial(payload: { tenantId: string; materialId: string }) {
  await query(
    `
      UPDATE study_materials
      SET is_deleted = TRUE, updated_at = NOW()
      WHERE tenant_id = $1 AND id = $2
    `,
    [payload.tenantId, payload.materialId]
  );
}

export async function grantMaterialAccess(payload: {
  tenantId: string;
  materialId: string;
  studentIds?: string[];
  batchIds?: string[];
}) {
  await withTransaction(async (client) => {
    const [material] = await client.query(
      `SELECT id FROM study_materials WHERE tenant_id = $1 AND id = $2 AND is_deleted = FALSE`,
      [payload.tenantId, payload.materialId]
    );
    if (!material) {
      throw new HttpError(404, 'Material not found');
    }

    if (payload.studentIds?.length) {
      for (const studentId of payload.studentIds) {
        await client.query(
          `
            INSERT INTO material_access (tenant_id, material_id, student_id)
            VALUES ($1,$2,$3)
            ON CONFLICT DO NOTHING
          `,
          [payload.tenantId, payload.materialId, studentId]
        );
      }
    }

    if (payload.batchIds?.length) {
      for (const batchId of payload.batchIds) {
        await client.query(
          `
            INSERT INTO material_access (tenant_id, material_id, batch_id)
            VALUES ($1,$2,$3)
            ON CONFLICT DO NOTHING
          `,
          [payload.tenantId, payload.materialId, batchId]
        );
      }
    }
  });
}

export async function recordDownload(payload: {
  tenantId: string;
  materialId: string;
  studentId: string;
}) {
  await withTransaction(async (client) => {
    await client.query(
      `
        UPDATE study_materials
        SET download_count = download_count + 1, updated_at = NOW()
        WHERE tenant_id = $1 AND id = $2
      `,
      [payload.tenantId, payload.materialId]
    );
    await client.query(
      `
        INSERT INTO material_downloads (tenant_id, material_id, student_id)
        VALUES ($1,$2,$3)
      `,
      [payload.tenantId, payload.materialId, payload.studentId]
    );
  });
}

export async function canTeacherManageMaterial(payload: {
  tenantId: string;
  materialId: string;
  userId: string;
}) {
  const rows = await query(
    `
      SELECT 1
      FROM study_materials m
      WHERE m.tenant_id = $1 AND m.id = $2 AND m.uploaded_by = $3
      LIMIT 1
    `,
    [payload.tenantId, payload.materialId, payload.userId]
  );
  return Boolean(rows[0]);
}

export async function createTag(payload: { tenantId: string; tagName: string; color?: string }) {
  const rows = await query(
    `
      INSERT INTO material_tags (tenant_id, tag_name, color)
      VALUES ($1,$2,$3)
      ON CONFLICT (tenant_id, tag_name) DO UPDATE SET color = EXCLUDED.color
      RETURNING *
    `,
    [payload.tenantId, payload.tagName, payload.color ?? null]
  );
  return rows[0];
}

export async function listTags(tenantId: string) {
  return query(`SELECT * FROM material_tags WHERE tenant_id = $1 ORDER BY tag_name ASC`, [tenantId]);
}

export async function createCategory(payload: {
  tenantId: string;
  categoryName: string;
  parentCategoryId?: string;
}) {
  const rows = await query(
    `
      INSERT INTO material_categories (tenant_id, category_name, parent_category_id)
      VALUES ($1,$2,$3)
      RETURNING *
    `,
    [payload.tenantId, payload.categoryName, payload.parentCategoryId ?? null]
  );
  return rows[0];
}

export async function listCategories(tenantId: string) {
  return query(
    `
      SELECT *
      FROM material_categories
      WHERE tenant_id = $1
      ORDER BY category_name ASC
    `,
    [tenantId]
  );
}

export async function getTagNamesByIds(payload: { tenantId: string; tagIds: string[] }) {
  if (!payload.tagIds.length) return [];
  return query<{ tag_name: string }>(
    `
      SELECT tag_name
      FROM material_tags
      WHERE tenant_id = $1 AND id = ANY($2::uuid[])
    `,
    [payload.tenantId, payload.tagIds]
  );
}

export async function saveMaterialVersion(payload: {
  tenantId: string;
  materialId: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
}) {
  return withTransaction(async (client) => {
    const [current] = await client.query<{ file_type: string; file_url: string; file_size: string }>(
      `SELECT file_type, file_url, file_size FROM study_materials WHERE tenant_id = $1 AND id = $2`,
      [payload.tenantId, payload.materialId]
    );
    if (!current) throw new HttpError(404, 'Material not found');

    const [latest] = await client.query<{ version_number: number }>(
      `SELECT COALESCE(MAX(version_number), 0)::int AS version_number FROM material_versions WHERE material_id = $1`,
      [payload.materialId]
    );
    const nextVersion = (latest?.version_number ?? 0) + 1;

    await client.query(
      `
        INSERT INTO material_versions (
          tenant_id, material_id, version_number, file_type, file_url, file_size
        )
        VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [payload.tenantId, payload.materialId, nextVersion, current.file_type, current.file_url, current.file_size]
    );

    await client.query(
      `
        UPDATE study_materials
        SET file_type = $1, file_url = $2, file_size = $3, updated_at = NOW()
        WHERE tenant_id = $4 AND id = $5
      `,
      [payload.fileType, payload.fileUrl, payload.fileSize, payload.tenantId, payload.materialId]
    );

    return nextVersion;
  });
}

export async function listMaterialVersions(payload: { tenantId: string; materialId: string }) {
  return query(
    `
      SELECT *
      FROM material_versions
      WHERE tenant_id = $1 AND material_id = $2
      ORDER BY version_number DESC
    `,
    [payload.tenantId, payload.materialId]
  );
}

export async function toggleBookmark(payload: { tenantId: string; materialId: string; studentId: string }) {
  await query(
    `
      INSERT INTO material_bookmarks (tenant_id, material_id, student_id)
      VALUES ($1,$2,$3)
      ON CONFLICT (material_id, student_id) DO NOTHING
    `,
    [payload.tenantId, payload.materialId, payload.studentId]
  );
}

export async function removeBookmark(payload: { tenantId: string; materialId: string; studentId: string }) {
  await query(
    `
      DELETE FROM material_bookmarks
      WHERE tenant_id = $1 AND material_id = $2 AND student_id = $3
    `,
    [payload.tenantId, payload.materialId, payload.studentId]
  );
}

export async function listBookmarks(payload: { tenantId: string; studentId: string }) {
  return query(
    `
      SELECT m.*
      FROM material_bookmarks mb
      JOIN study_materials m ON m.id = mb.material_id
      WHERE mb.tenant_id = $1 AND mb.student_id = $2 AND m.is_deleted = FALSE
      ORDER BY mb.created_at DESC
    `,
    [payload.tenantId, payload.studentId]
  );
}

export async function materialAnalyticsSummary(payload: { tenantId: string; from: string; to: string }) {
  const mostDownloaded = await query(
    `
      SELECT id, title, download_count
      FROM study_materials
      WHERE tenant_id = $1 AND is_deleted = FALSE
      ORDER BY download_count DESC
      LIMIT 10
    `,
    [payload.tenantId]
  );

  const uploadTrends = await query(
    `
      SELECT date_trunc('day', created_at) AS day, COUNT(*)::text AS total
      FROM study_materials
      WHERE tenant_id = $1 AND created_at::date BETWEEN $2 AND $3
      GROUP BY day
      ORDER BY day
    `,
    [payload.tenantId, payload.from, payload.to]
  );

  const [storage] = await query<{ total: string }>(
    `
      SELECT COALESCE(SUM(file_size),0)::text AS total
      FROM study_materials
      WHERE tenant_id = $1 AND is_deleted = FALSE
    `,
    [payload.tenantId]
  );

  return {
    mostDownloaded,
    uploadTrends,
    storageBytes: Number(storage?.total ?? 0)
  };
}

export async function getMaterialDownloadHistory(payload: { tenantId: string; materialId: string }) {
  return query(
    `
      SELECT
        md.id,
        md.downloaded_at,
        s.id AS student_id,
        u.full_name AS student_name,
        u.email AS student_email
      FROM material_downloads md
      JOIN students s ON s.id = md.student_id
      JOIN users u ON u.id = s.user_id
      WHERE md.tenant_id = $1 AND md.material_id = $2
      ORDER BY md.downloaded_at DESC
    `,
    [payload.tenantId, payload.materialId]
  );
}

export async function getMostDownloadedMaterials(payload: {
  tenantId: string;
  limit?: number;
  teacherUserId?: string;
}) {
  const limit = payload.limit ?? 5;
  if (payload.teacherUserId) {
    return query(
      `
        SELECT m.id, m.title, m.download_count
        FROM study_materials m
        JOIN course_teachers ct ON ct.course_id = m.course_id
        JOIN teachers t ON t.id = ct.teacher_id
        WHERE m.tenant_id = $1 AND m.is_deleted = FALSE AND t.user_id = $2
        ORDER BY m.download_count DESC
        LIMIT $3
      `,
      [payload.tenantId, payload.teacherUserId, limit]
    );
  }

  return query(
    `
      SELECT id, title, download_count
      FROM study_materials
      WHERE tenant_id = $1 AND is_deleted = FALSE
      ORDER BY download_count DESC
      LIMIT $2
    `,
    [payload.tenantId, limit]
  );
}

export async function getPerStudentDownloadReport(payload: { tenantId: string; materialId: string }) {
  return query(
    `
      SELECT
        s.id AS student_id,
        u.full_name AS student_name,
        u.email AS student_email,
        COUNT(md.id)::text AS downloads
      FROM material_downloads md
      JOIN students s ON s.id = md.student_id
      JOIN users u ON u.id = s.user_id
      WHERE md.tenant_id = $1 AND md.material_id = $2
      GROUP BY s.id, u.full_name, u.email
      ORDER BY downloads DESC
    `,
    [payload.tenantId, payload.materialId]
  );
}
