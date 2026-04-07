import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  canStudentAccessMaterial,
  canTeacherAccessMaterial,
  canTeacherManageMaterial,
  createMaterial,
  findMaterialById,
  getMaterialDownloadHistory,
  getMostDownloadedMaterials,
  getPerStudentDownloadReport,
  grantMaterialAccess,
  isTeacherAssignedToCourse,
  listMaterials,
  listMaterialsForTeacher,
  listMaterialsForStudent,
  searchMaterialsForAdmin,
  searchMaterialsForStudent,
  searchMaterialsForTeacher,
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
    tags,
    isPublic
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
    isPublic: req.body.is_public !== undefined ? parseBoolean(req.body.is_public) : undefined
  });
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.errors.map((e) => e.message).join(', '));
  }

  await updateMaterial({
    tenantId,
    materialId: req.params.id,
    title: parsed.data.title,
    description: parsed.data.description,
    topic: parsed.data.topic,
    tags: parsed.data.tags,
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
