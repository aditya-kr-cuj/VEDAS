import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  markAnnouncementRead
} from './announcement.repository.js';
import { findStudentProfileByUserId } from '../students/student.repository.js';
import { findTeacherProfileByUserId } from '../teachers/teacher.repository.js';

export async function createAnnouncementHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');

  const announcement = await createAnnouncement({
    tenantId,
    title: req.body.title,
    message: req.body.message,
    createdBy: userId,
    announcementType: req.body.announcement_type ?? 'general',
    targetType: req.body.target_type ?? 'all',
    priority: req.body.priority ?? 'medium',
    scheduledAt: req.body.scheduled_at,
    expiresAt: req.body.expires_at,
    isPinned: req.body.is_pinned ?? false,
    batchIds: req.body.batch_ids,
    studentIds: req.body.student_ids,
    teacherIds: req.body.teacher_ids
  });

  res.status(201).json({ announcement });
}

export async function listAnnouncementsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  let studentId: string | undefined;
  let teacherId: string | undefined;

  if (req.role === 'student') {
    const student = await findStudentProfileByUserId(tenantId, req.auth?.userId ?? '');
    studentId = student?.id;
  }
  if (req.role === 'teacher') {
    const teacher = await findTeacherProfileByUserId(tenantId, req.auth?.userId ?? '');
    teacherId = teacher?.id;
  }

  const announcements = await listAnnouncements({
    tenantId,
    studentId,
    teacherId,
    unreadOnly: req.query.unread === 'true',
    pinnedOnly: req.query.pinned === 'true'
  });
  res.status(200).json({ announcements });
}

export async function markReadHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  let studentId: string | undefined;
  let teacherId: string | undefined;

  if (req.role === 'student') {
    const student = await findStudentProfileByUserId(tenantId, req.auth?.userId ?? '');
    studentId = student?.id;
  }
  if (req.role === 'teacher') {
    const teacher = await findTeacherProfileByUserId(tenantId, req.auth?.userId ?? '');
    teacherId = teacher?.id;
  }

  await markAnnouncementRead({ announcementId: req.params.id, studentId, teacherId });
  res.status(200).json({ message: 'Marked read' });
}

export async function deleteAnnouncementHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  await deleteAnnouncement({ tenantId, announcementId: req.params.id });
  res.status(200).json({ message: 'Announcement deleted' });
}
