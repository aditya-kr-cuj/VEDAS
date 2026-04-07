import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { generateSecureToken, sha256 } from '../../utils/crypto.js';
import { createQrToken, findValidQrToken } from './qr.repository.js';
import { markAttendanceSingle } from './attendance.repository.js';
import { findStudentProfileByUserId } from '../students/student.repository.js';

export async function generateQrHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const teacherId = req.auth?.userId;
  if (!tenantId || !teacherId) throw new HttpError(400, 'Tenant context is required');

  const rawToken = generateSecureToken(20);
  const tokenHash = sha256(rawToken);
  const expiresIn = req.body.expiresInMinutes ?? 10;
  const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);

  await createQrToken({
    tenantId,
    batchId: req.body.batchId,
    courseId: req.body.courseId,
    timeSlotId: req.body.timeSlotId,
    teacherId,
    tokenHash,
    expiresAt
  });

  res.status(201).json({ token: rawToken, expiresAt: expiresAt.toISOString() });
}

export async function scanQrHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');

  const student = await findStudentProfileByUserId(tenantId, userId);
  if (!student) throw new HttpError(403, 'Student profile required');

  const tokenHash = sha256(req.body.token);
  const qr = await findValidQrToken({ tenantId, tokenHash });
  if (!qr) throw new HttpError(400, 'Invalid or expired QR token');

  const today = new Date().toISOString().slice(0, 10);
  await markAttendanceSingle({
    tenantId,
    batchId: qr.batch_id,
    courseId: qr.course_id ?? undefined,
    studentId: student.id,
    teacherId: qr.teacher_id,
    date: today,
    timeSlotId: qr.time_slot_id ?? undefined,
    status: 'present'
  });

  res.status(200).json({ marked: true });
}
