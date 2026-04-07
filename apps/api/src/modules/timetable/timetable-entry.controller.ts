import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  checkBatchConflict,
  checkRoomCapacity,
  checkRoomConflict,
  checkTeacherAvailability,
  checkTeacherConflict,
  createTimetableEntry,
  deleteTimetableEntry,
  findTimetableEntryById,
  listTimetableForBatch,
  listTimetableForTeacher,
  updateTimetableEntry,
  validateReferences
} from './timetable-entry.repository.js';

async function runConflictChecks(payload: {
  tenantId: string;
  batchId: string;
  courseId: string;
  teacherUserId: string;
  roomId: string;
  timeSlotId: string;
  dayOfWeek: string;
  excludeId?: string;
}) {
  const { startTime, endTime } = await validateReferences(payload);

  await checkBatchConflict({
    tenantId: payload.tenantId,
    batchId: payload.batchId,
    timeSlotId: payload.timeSlotId,
    dayOfWeek: payload.dayOfWeek,
    excludeId: payload.excludeId
  });
  await checkTeacherConflict({
    tenantId: payload.tenantId,
    teacherUserId: payload.teacherUserId,
    timeSlotId: payload.timeSlotId,
    dayOfWeek: payload.dayOfWeek,
    excludeId: payload.excludeId
  });
  await checkRoomConflict({
    tenantId: payload.tenantId,
    roomId: payload.roomId,
    timeSlotId: payload.timeSlotId,
    dayOfWeek: payload.dayOfWeek,
    excludeId: payload.excludeId
  });
  await checkTeacherAvailability({
    tenantId: payload.tenantId,
    teacherUserId: payload.teacherUserId,
    dayOfWeek: payload.dayOfWeek,
    startTime,
    endTime
  });
  await checkRoomCapacity({
    tenantId: payload.tenantId,
    batchId: payload.batchId,
    roomId: payload.roomId
  });
}

export async function createTimetableEntryHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  await runConflictChecks({
    tenantId,
    batchId: req.body.batchId,
    courseId: req.body.courseId,
    teacherUserId: req.body.teacherUserId,
    roomId: req.body.roomId,
    timeSlotId: req.body.timeSlotId,
    dayOfWeek: req.body.dayOfWeek
  });

  const entry = await createTimetableEntry({
    tenantId,
    batchId: req.body.batchId,
    courseId: req.body.courseId,
    teacherUserId: req.body.teacherUserId,
    roomId: req.body.roomId,
    timeSlotId: req.body.timeSlotId,
    dayOfWeek: req.body.dayOfWeek
  });

  res.status(201).json({ entry });
}

export async function updateTimetableEntryHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const existing = await findTimetableEntryById(tenantId, req.params.id);
  if (!existing) throw new HttpError(404, 'Timetable entry not found');

  const merged = {
    batchId: req.body.batchId ?? existing.batch_id,
    courseId: req.body.courseId ?? existing.course_id,
    teacherUserId: req.body.teacherUserId ?? existing.teacher_user_id,
    roomId: req.body.roomId ?? existing.room_id,
    timeSlotId: req.body.timeSlotId ?? existing.time_slot_id,
    dayOfWeek: req.body.dayOfWeek ?? existing.day_of_week
  };

  await runConflictChecks({
    tenantId,
    batchId: merged.batchId,
    courseId: merged.courseId,
    teacherUserId: merged.teacherUserId,
    roomId: merged.roomId,
    timeSlotId: merged.timeSlotId,
    dayOfWeek: merged.dayOfWeek,
    excludeId: existing.id
  });

  await updateTimetableEntry({
    tenantId,
    id: existing.id,
    batchId: req.body.batchId,
    courseId: req.body.courseId,
    teacherUserId: req.body.teacherUserId,
    roomId: req.body.roomId,
    timeSlotId: req.body.timeSlotId,
    dayOfWeek: req.body.dayOfWeek
  });

  res.status(200).json({ message: 'Timetable entry updated' });
}

export async function deleteTimetableEntryHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const existing = await findTimetableEntryById(tenantId, req.params.id);
  if (!existing) throw new HttpError(404, 'Timetable entry not found');

  await deleteTimetableEntry({ tenantId, id: req.params.id });
  res.status(200).json({ message: 'Timetable entry deleted' });
}

export async function listBatchTimetableHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const entries = await listTimetableForBatch({ tenantId, batchId: req.params.batchId });
  res.status(200).json({ entries });
}

export async function listTeacherTimetableHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const entries = await listTimetableForTeacher({ tenantId, teacherUserId: req.params.teacherId });
  res.status(200).json({ entries });
}
