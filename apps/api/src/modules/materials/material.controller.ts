import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  canStudentAccessMaterial,
  canTeacherAccessMaterial,
  canTeacherManageMaterial,
  createMaterial,
  createTag,
  createCategory,
  findMaterialById,
  getTagNamesByIds,
  listTags,
  listCategories,
  getMaterialDownloadHistory,
  getMostDownloadedMaterials,
  getPerStudentDownloadReport,
  grantMaterialAccess,
  isTeacherAssignedToCourse,
  listMaterialVersions,
  materialAnalyticsSummary,
  listMaterials,
  listMaterialsForTeacher,
  listMaterialsForStudent,
  searchMaterialsForAdmin,
  searchMaterialsForStudent,
  searchMaterialsForTeacher,
  saveMaterialVersion,
  toggleBookmark,
  removeBookmark,
  listBookmarks,
  recordDownload,
  softDeleteMaterial,
  updateMaterial
} from './material.repository.js';
import { uploadToS3, getSignedDownloadUrl } from '../../utils/storage.js';
import { findStudentProfileByUserId } from '../students/student.repository.js';
import { updateMaterialSchema } from './material.schema.js';
import { findCourseById } from '../courses/course.repository.js';

function parseTags(input: unknown) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String);
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return input
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function parseBoolean(input: unknown) {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'string') return input.toLowerCase() === 'true';
  return false;
}

export async function uploadMaterialHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');
  if (!req.file) throw new HttpError(400, 'File is required');

  const title = req.body.title?.toString() ?? '';
  const description = req.body.description?.toString() ?? undefined;
  const courseId = req.body.course_id?.toString();
  const batchId = req.body.batch_id?.toString() ?? null;
  const topic = req.body.topic?.toString() ?? undefined;
  const tags = parseTags(req.body.tags);
  const tagIds = req.body.tag_ids ? parseTags(req.body.tag_ids) : req.body.tagIds;
  const categoryIds = req.body.category_ids ? parseTags(req.body.category_ids) : req.body.categoryIds;
  const isPublic = parseBoolean(req.body.is_public);

  if (!title || !courseId) {
    throw new HttpError(400, 'title and course_id are required');
  }

  const course = await findCourseById(tenantId, courseId);
  if (!course) throw new HttpError(404, 'Course not found');

  if (req.role === 'teacher') {
    const allowed = await isTeacherAssignedToCourse({ tenantId, userId, courseId });
    if (!allowed) throw new HttpError(403, 'Teacher not assigned to this course');
  }

  const uploaded = await uploadToS3({
    buffer: req.file.buffer,
    filename: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    tenantId
  });

  const tagNames = tagIds?.length ? await getTagNamesByIds({ tenantId, tagIds }) : [];
  const material = await createMaterial({
    tenantId,
    title,
    description,
    fileType: uploaded.fileType,
    fileUrl: uploaded.url,
    fileSize: req.file.size,
    uploadedBy: userId,
    courseId,
    batchId,
    topic,
    tags: tagNames.length ? tagNames.map((t) => t.tag_name) : tags,
    isPublic
    ,
    tagIds: Array.isArray(tagIds) ? tagIds : undefined,
    categoryIds: Array.isArray(categoryIds) ? categoryIds : undefined
  });

  res.status(201).json({ material });
}

export async function listMaterialsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const page = Math.max(Number(req.query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 50);
  const courseId = req.query.course_id?.toString();
  const batchId = req.query.batch_id?.toString();
  const fileType = req.query.file_type?.toString();
  const search = req.query.search?.toString();

  if (req.role === 'student') {
    const student = await findStudentProfileByUserId(tenantId, req.auth?.userId ?? '');
    if (!student) throw new HttpError(404, 'Student profile not found');

    const { rows, total } = await listMaterialsForStudent({
      tenantId,
      studentId: student.id,
      courseId,
      batchId,
      fileType,
      search,
      page,
      limit
    });

    const materials = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        download_url: await getSignedDownloadUrl(row.file_url)
      }))
    );

    res.status(200).json({ materials, page, limit, total });
    return;
  }

  if (req.role === 'teacher') {
    const userId = req.auth?.userId ?? '';
    const { rows, total } = await listMaterialsForTeacher({
      tenantId,
      userId,
      courseId,
      batchId,
      fileType,
      search,
      page,
      limit
    });

    const materials = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        download_url: await getSignedDownloadUrl(row.file_url)
      }))
    );

    res.status(200).json({ materials, page, limit, total });
    return;
  }

  const { rows, total } = await listMaterials({
    tenantId,
    courseId,
    batchId,
    fileType,
    search,
    page,
    limit
  });

  const materials = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      download_url: await getSignedDownloadUrl(row.file_url)
    }))
  );

  res.status(200).json({ materials, page, limit, total });
}

export async function searchMaterialsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const queryText = (req.query.q ?? req.query.search)?.toString().trim();
  if (!queryText) throw new HttpError(400, 'Search query is required');

  const page = Math.max(Number(req.query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 50);
  const courseId = req.query.course_id?.toString();
  const batchId = req.query.batch_id?.toString();
  const fileType = req.query.file_type?.toString();
  const uploadedBy = req.query.uploaded_by?.toString();
  const dateFrom = req.query.date_from?.toString();
  const dateTo = req.query.date_to?.toString();
  const sort =
    req.query.sort?.toString() === 'most_downloaded'
      ? 'most_downloaded'
      : req.query.sort?.toString() === 'alphabetical'
        ? 'alphabetical'
        : 'newest';

  if (req.role === 'student') {
    const student = await findStudentProfileByUserId(tenantId, req.auth?.userId ?? '');
    if (!student) throw new HttpError(404, 'Student profile not found');
    const { rows, total } = await searchMaterialsForStudent({
      tenantId,
      studentId: student.id,
      query: queryText,
      courseId,
      batchId,
      fileType,
      uploadedBy,
      dateFrom,
      dateTo,
      sort,
      page,
      limit
    });

    const materials = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        download_url: await getSignedDownloadUrl(row.file_url)
      }))
    );

    res.status(200).json({ materials, page, limit, total });
    return;
  }

  if (req.role === 'teacher') {
    const { rows, total } = await searchMaterialsForTeacher({
      tenantId,
      userId: req.auth?.userId ?? '',
      query: queryText,
      courseId,
      batchId,
      fileType,
      uploadedBy,
      dateFrom,
      dateTo,
      sort,
      page,
      limit
    });

    const materials = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        download_url: await getSignedDownloadUrl(row.file_url)
      }))
    );

    res.status(200).json({ materials, page, limit, total });
    return;
  }

  const { rows, total } = await searchMaterialsForAdmin({
    tenantId,
    query: queryText,
    courseId,
    batchId,
    fileType,
    uploadedBy,
    dateFrom,
    dateTo,
    sort,
    page,
    limit
  });

  const materials = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      download_url: await getSignedDownloadUrl(row.file_url)
    }))
  );

  res.status(200).json({ materials, page, limit, total });
}

export async function getMaterialHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const material = await findMaterialById(tenantId, req.params.id);
  if (!material) throw new HttpError(404, 'Material not found');

  if (req.role === 'student') {
    const student = await findStudentProfileByUserId(tenantId, req.auth?.userId ?? '');
    if (!student) throw new HttpError(404, 'Student profile not found');
    const allowed = await canStudentAccessMaterial({
      tenantId,
      studentId: student.id,
      materialId: material.id
    });
    if (!allowed) throw new HttpError(403, 'Access denied');
  }

  if (req.role === 'teacher') {
    const userId = req.auth?.userId ?? '';
    const allowed = await canTeacherAccessMaterial({ tenantId, materialId: material.id, userId });
    if (!allowed) throw new HttpError(403, 'Access denied');
  }

  res.status(200).json({
    material: {
      ...material,
      download_url: await getSignedDownloadUrl(material.file_url)
    }
  });
}

export async function updateMaterialHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');

  if (req.role === 'teacher') {
    const canManage = await canTeacherManageMaterial({
      tenantId,
      materialId: req.params.id,
      userId
    });
    if (!canManage) throw new HttpError(403, 'Teachers can only edit their own materials');
  }

  const parsed = updateMaterialSchema.safeParse({
    title: req.body.title,
    description: req.body.description,
    topic: req.body.topic,
    tags: req.body.tags ? parseTags(req.body.tags) : undefined,
    tagIds: req.body.tagIds ?? req.body.tag_ids,
    categoryIds: req.body.categoryIds ?? req.body.category_ids,
    isPublic: req.body.is_public !== undefined ? parseBoolean(req.body.is_public) : undefined
  });
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.errors.map((e) => e.message).join(', '));
  }

  const tagsFromIds =
    parsed.data.tagIds?.length && !parsed.data.tags
      ? (await getTagNamesByIds({ tenantId, tagIds: parsed.data.tagIds })).map((t) => t.tag_name)
      : parsed.data.tags;

  await updateMaterial({
    tenantId,
    materialId: req.params.id,
    title: parsed.data.title,
    description: parsed.data.description,
    topic: parsed.data.topic,
    tags: tagsFromIds,
    tagIds: parsed.data.tagIds,
    categoryIds: parsed.data.categoryIds,
    isPublic: parsed.data.isPublic
  });

  res.status(200).json({ message: 'Material updated' });
}

export async function deleteMaterialHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');

  if (req.role === 'teacher') {
    const canManage = await canTeacherManageMaterial({
      tenantId,
      materialId: req.params.id,
      userId
    });
    if (!canManage) throw new HttpError(403, 'Teachers can only delete their own materials');
  }

  await softDeleteMaterial({ tenantId, materialId: req.params.id });
  res.status(200).json({ message: 'Material deleted' });
}

export async function grantAccessHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');

  if (req.role === 'teacher') {
    const canManage = await canTeacherManageMaterial({
      tenantId,
      materialId: req.params.id,
      userId
    });
    if (!canManage) throw new HttpError(403, 'Teachers can only manage access for their materials');
  }

  const studentIds = req.body.student_ids ?? req.body.studentIds;
  const batchIds = req.body.batch_ids ?? req.body.batchIds;
  if ((!studentIds || studentIds.length === 0) && (!batchIds || batchIds.length === 0)) {
    throw new HttpError(400, 'student_ids or batch_ids required');
  }

  await grantMaterialAccess({
    tenantId,
    materialId: req.params.id,
    studentIds,
    batchIds
  });

  res.status(200).json({ message: 'Access updated' });
}

export async function createTagHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const tag = await createTag({
    tenantId,
    tagName: req.body.tagName,
    color: req.body.color
  });
  res.status(201).json({ tag });
}

export async function listTagsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const tags = await listTags(tenantId);
  res.status(200).json({ tags });
}

export async function createCategoryHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const category = await createCategory({
    tenantId,
    categoryName: req.body.categoryName,
    parentCategoryId: req.body.parentCategoryId
  });
  res.status(201).json({ category });
}

export async function listCategoriesHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const categories = await listCategories(tenantId);
  res.status(200).json({ categories });
}

export async function updateMaterialFileHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');
  if (!req.file) throw new HttpError(400, 'File is required');

  if (req.role === 'teacher') {
    const canManage = await canTeacherManageMaterial({
      tenantId,
      materialId: req.params.id,
      userId
    });
    if (!canManage) throw new HttpError(403, 'Teachers can only update their materials');
  }

  const uploaded = await uploadToS3({
    buffer: req.file.buffer,
    filename: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    tenantId
  });

  const version = await saveMaterialVersion({
    tenantId,
    materialId: req.params.id,
    fileType: uploaded.fileType,
    fileUrl: uploaded.url,
    fileSize: req.file.size
  });

  res.status(200).json({ message: 'Material updated', version });
}

export async function listMaterialVersionsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const versions = await listMaterialVersions({ tenantId, materialId: req.params.id });
  res.status(200).json({ versions });
}

export async function bookmarkMaterialHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const student = await findStudentProfileByUserId(tenantId, req.auth?.userId ?? '');
  if (!student) throw new HttpError(404, 'Student profile not found');
  await toggleBookmark({ tenantId, materialId: req.params.id, studentId: student.id });
  res.status(200).json({ message: 'Bookmarked' });
}

export async function removeBookmarkHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const student = await findStudentProfileByUserId(tenantId, req.auth?.userId ?? '');
  if (!student) throw new HttpError(404, 'Student profile not found');
  await removeBookmark({ tenantId, materialId: req.params.id, studentId: student.id });
  res.status(200).json({ message: 'Removed' });
}

export async function listBookmarksHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const student = await findStudentProfileByUserId(tenantId, req.auth?.userId ?? '');
  if (!student) throw new HttpError(404, 'Student profile not found');
  const rows = await listBookmarks({ tenantId, studentId: student.id });
  const materials = await Promise.all(
    rows.map(async (row: any) => ({
      ...row,
      download_url: await getSignedDownloadUrl(row.file_url)
    }))
  );
  res.status(200).json({ materials });
}

export async function analyticsSummaryHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const from = req.query.from?.toString() ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = req.query.to?.toString() ?? new Date().toISOString().slice(0, 10);
  const summary = await materialAnalyticsSummary({ tenantId, from, to });
  res.status(200).json({ summary });
}

export async function bulkUploadMaterialsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) throw new HttpError(400, 'Files are required');

  const courseId = req.body.course_id?.toString();
  const batchId = req.body.batch_id?.toString() ?? null;
  const isPublic = parseBoolean(req.body.is_public);
  const topic = req.body.topic?.toString() ?? undefined;
  const tagIds = req.body.tag_ids ? parseTags(req.body.tag_ids) : req.body.tagIds;
  const categoryIds = req.body.category_ids ? parseTags(req.body.category_ids) : req.body.categoryIds;

  if (!courseId) throw new HttpError(400, 'course_id is required');

  if (req.role === 'teacher') {
    const allowed = await isTeacherAssignedToCourse({ tenantId, userId, courseId });
    if (!allowed) throw new HttpError(403, 'Teacher not assigned to this course');
  }

  const tagNames = tagIds?.length ? await getTagNamesByIds({ tenantId, tagIds }) : [];
  const tags = tagNames.length ? tagNames.map((t) => t.tag_name) : [];

  const created: any[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  for (const file of files) {
    try {
      const title = file.originalname.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
      const uploaded = await uploadToS3({
        buffer: file.buffer,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        tenantId
      });

      const material = await createMaterial({
        tenantId,
        title,
        description: req.body.description?.toString() ?? undefined,
        fileType: uploaded.fileType,
        fileUrl: uploaded.url,
        fileSize: file.size,
        uploadedBy: userId,
        courseId,
        batchId,
        topic,
        tags,
        isPublic,
        tagIds: Array.isArray(tagIds) ? tagIds : undefined,
        categoryIds: Array.isArray(categoryIds) ? categoryIds : undefined
      });
      created.push(material);
    } catch (error) {
      errors.push({ file: file.originalname, error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  res.status(201).json({ total: files.length, success: created.length, failed: errors.length, materials: created, errors });
}

export async function downloadMaterialHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const material = await findMaterialById(tenantId, req.params.id);
  if (!material) throw new HttpError(404, 'Material not found');

  if (req.role === 'student') {
    const student = await findStudentProfileByUserId(tenantId, req.auth?.userId ?? '');
    if (!student) throw new HttpError(404, 'Student profile not found');
    const allowed = await canStudentAccessMaterial({
      tenantId,
      studentId: student.id,
      materialId: material.id
    });
    if (!allowed) throw new HttpError(403, 'Access denied');

    await recordDownload({ tenantId, materialId: material.id, studentId: student.id });
  }

  if (req.role === 'teacher') {
    const userId = req.auth?.userId ?? '';
    const allowed = await canTeacherAccessMaterial({ tenantId, materialId: material.id, userId });
    if (!allowed) throw new HttpError(403, 'Access denied');
  }

  const url = await getSignedDownloadUrl(material.file_url, 3600);
  res.status(200).json({ url });
}

export async function materialAnalyticsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId ?? '';
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const material = await findMaterialById(tenantId, req.params.id);
  if (!material) throw new HttpError(404, 'Material not found');

  if (req.role === 'teacher') {
    const allowed = await canTeacherAccessMaterial({ tenantId, materialId: material.id, userId });
    if (!allowed) throw new HttpError(403, 'Access denied');
  }

  const history = await getMaterialDownloadHistory({ tenantId, materialId: material.id });
  const mostDownloaded = await getMostDownloadedMaterials({
    tenantId,
    limit: 5,
    teacherUserId: req.role === 'teacher' ? userId : undefined
  });
  const perStudent = await getPerStudentDownloadReport({ tenantId, materialId: material.id });

  res.status(200).json({
    totalDownloads: material.download_count,
    downloadHistory: history,
    mostDownloaded,
    perStudent
  });
}
