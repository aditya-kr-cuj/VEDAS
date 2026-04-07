import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  listAttendanceForBatch,
  listAttendanceForStudent,
  markAttendanceBulk,
  updateAttendanceRecord
} from './attendance.repository.js';

export async function markAttendanceHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  if (!req.auth?.userId) throw new HttpError(401, 'Unauthorized');

  const results = await markAttendanceBulk({
    tenantId,
    batchId: req.body.batchId,
    date: req.body.date,
    timeSlotId: req.body.timeSlotId,
    courseId: req.body.courseId,
    teacherId: req.auth.userId,
    attendance: req.body.attendance
  });

  res.status(200).json({ marked: results.length });
}

export async function listBatchAttendanceHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const date = req.query.date?.toString();
  if (!date) throw new HttpError(400, 'date is required');

  const timeSlotId = req.query.timeSlotId?.toString();
  const records = await listAttendanceForBatch({
    tenantId,
    batchId: req.params.batchId,
    date,
    timeSlotId
  });

  res.status(200).json({ records });
}

export async function listStudentAttendanceHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const records = await listAttendanceForStudent({
    tenantId,
    studentId: req.params.studentId
  });
  res.status(200).json({ records });
}

export async function updateAttendanceHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  await updateAttendanceRecord({
    tenantId,
    id: req.params.id,
    status: req.body.status,
    remarks: req.body.remarks
  });
  res.status(200).json({ message: 'Attendance updated' });
}
