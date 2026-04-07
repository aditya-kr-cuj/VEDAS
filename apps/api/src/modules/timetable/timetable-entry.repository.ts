import { query } from '../../db/client.js';
import { HttpError } from '../../utils/http-error.js';

export interface TimetableEntryRecord {
  id: string;
  tenant_id: string;
  batch_id: string;
  course_id: string;
  teacher_user_id: string;
  room_id: string;
  time_slot_id: string;
  day_of_week: string;
  created_at: Date;
  updated_at: Date;
}

export async function createTimetableEntry(payload: {
  tenantId: string;
  batchId: string;
  courseId: string;
  teacherUserId: string;
  roomId: string;
  timeSlotId: string;
  dayOfWeek: string;
}): Promise<TimetableEntryRecord> {
  const rows = await query<TimetableEntryRecord>(
    `
      INSERT INTO timetable_entries (tenant_id, batch_id, course_id, teacher_user_id, room_id, time_slot_id, day_of_week)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      payload.tenantId,
      payload.batchId,
      payload.courseId,
      payload.teacherUserId,
      payload.roomId,
      payload.timeSlotId,
      payload.dayOfWeek
    ]
  );

  return rows[0];
}

export async function updateTimetableEntry(payload: {
  tenantId: string;
  id: string;
  batchId?: string;
  courseId?: string;
  teacherUserId?: string;
  roomId?: string;
  timeSlotId?: string;
  dayOfWeek?: string;
}): Promise<void> {
  await query(
    `
      UPDATE timetable_entries
      SET
        batch_id = COALESCE($1, batch_id),
        course_id = COALESCE($2, course_id),
        teacher_user_id = COALESCE($3, teacher_user_id),
        room_id = COALESCE($4, room_id),
        time_slot_id = COALESCE($5, time_slot_id),
        day_of_week = COALESCE($6, day_of_week),
        updated_at = NOW()
      WHERE tenant_id = $7 AND id = $8
    `,
    [
      payload.batchId ?? null,
      payload.courseId ?? null,
      payload.teacherUserId ?? null,
      payload.roomId ?? null,
      payload.timeSlotId ?? null,
      payload.dayOfWeek ?? null,
      payload.tenantId,
      payload.id
    ]
  );
}

export async function deleteTimetableEntry(payload: { tenantId: string; id: string }): Promise<void> {
  await query('DELETE FROM timetable_entries WHERE tenant_id = $1 AND id = $2', [payload.tenantId, payload.id]);
}

export async function findTimetableEntryById(tenantId: string, id: string): Promise<TimetableEntryRecord | null> {
  const rows = await query<TimetableEntryRecord>(
    `
      SELECT *
      FROM timetable_entries
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `,
    [tenantId, id]
  );
  return rows[0] ?? null;
}

export async function listTimetableForBatch(payload: {
  tenantId: string;
  batchId: string;
}): Promise<
  Array<{
    id: string;
    dayOfWeek: string;
    timeSlotId: string;
    startTime: string;
    endTime: string;
    courseId: string;
    courseName: string;
    teacherUserId: string;
    teacherName: string;
    roomId: string;
    roomName: string;
  }>
> {
  return query(
    `
      SELECT
        te.id AS "id",
        te.day_of_week AS "dayOfWeek",
        te.time_slot_id AS "timeSlotId",
        ts.start_time AS "startTime",
        ts.end_time AS "endTime",
        te.course_id AS "courseId",
        c.name AS "courseName",
        te.teacher_user_id AS "teacherUserId",
        u.full_name AS "teacherName",
        te.room_id AS "roomId",
        r.room_name AS "roomName"
      FROM timetable_entries te
      JOIN time_slots ts ON ts.id = te.time_slot_id
      JOIN courses c ON c.id = te.course_id
      JOIN users u ON u.id = te.teacher_user_id
      JOIN rooms r ON r.id = te.room_id
      WHERE te.tenant_id = $1 AND te.batch_id = $2
      ORDER BY te.day_of_week, ts.start_time
    `,
    [payload.tenantId, payload.batchId]
  );
}

export async function listTimetableForTeacher(payload: {
  tenantId: string;
  teacherUserId: string;
}): Promise<
  Array<{
    id: string;
    dayOfWeek: string;
    timeSlotId: string;
    startTime: string;
    endTime: string;
    courseId: string;
    courseName: string;
    batchId: string;
    batchName: string;
    roomId: string;
    roomName: string;
  }>
> {
  return query(
    `
      SELECT
        te.id AS "id",
        te.day_of_week AS "dayOfWeek",
        te.time_slot_id AS "timeSlotId",
        ts.start_time AS "startTime",
        ts.end_time AS "endTime",
        te.course_id AS "courseId",
        c.name AS "courseName",
        te.batch_id AS "batchId",
        b.name AS "batchName",
        te.room_id AS "roomId",
        r.room_name AS "roomName"
      FROM timetable_entries te
      JOIN time_slots ts ON ts.id = te.time_slot_id
      JOIN courses c ON c.id = te.course_id
      JOIN batches b ON b.id = te.batch_id
      JOIN rooms r ON r.id = te.room_id
      WHERE te.tenant_id = $1 AND te.teacher_user_id = $2
      ORDER BY te.day_of_week, ts.start_time
    `,
    [payload.tenantId, payload.teacherUserId]
  );
}

export async function checkBatchConflict(payload: {
  tenantId: string;
  batchId: string;
  timeSlotId: string;
  dayOfWeek: string;
  excludeId?: string;
}): Promise<void> {
  const rows = await query<{ id: string }>(
    `
      SELECT id
      FROM timetable_entries
      WHERE tenant_id = $1
        AND batch_id = $2
        AND time_slot_id = $3
        AND day_of_week = $4
        AND ($5::uuid IS NULL OR id <> $5)
      LIMIT 1
    `,
    [payload.tenantId, payload.batchId, payload.timeSlotId, payload.dayOfWeek, payload.excludeId ?? null]
  );
  if (rows[0]) {
    throw new HttpError(409, 'Batch already has a class at this time');
  }
}

export async function checkTeacherConflict(payload: {
  tenantId: string;
  teacherUserId: string;
  timeSlotId: string;
  dayOfWeek: string;
  excludeId?: string;
}): Promise<void> {
  const rows = await query<{ id: string }>(
    `
      SELECT id
      FROM timetable_entries
      WHERE tenant_id = $1
        AND teacher_user_id = $2
        AND time_slot_id = $3
        AND day_of_week = $4
        AND ($5::uuid IS NULL OR id <> $5)
      LIMIT 1
    `,
    [payload.tenantId, payload.teacherUserId, payload.timeSlotId, payload.dayOfWeek, payload.excludeId ?? null]
  );
  if (rows[0]) {
    throw new HttpError(409, 'Teacher is already assigned at this time');
  }
}

export async function checkRoomConflict(payload: {
  tenantId: string;
  roomId: string;
  timeSlotId: string;
  dayOfWeek: string;
  excludeId?: string;
}): Promise<void> {
  const rows = await query<{ id: string }>(
    `
      SELECT id
      FROM timetable_entries
      WHERE tenant_id = $1
        AND room_id = $2
        AND time_slot_id = $3
        AND day_of_week = $4
        AND ($5::uuid IS NULL OR id <> $5)
      LIMIT 1
    `,
    [payload.tenantId, payload.roomId, payload.timeSlotId, payload.dayOfWeek, payload.excludeId ?? null]
  );
  if (rows[0]) {
    throw new HttpError(409, 'Room is already booked at this time');
  }
}

export async function checkTeacherAvailability(payload: {
  tenantId: string;
  teacherUserId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}): Promise<void> {
  const rows = await query<{ id: string }>(
    `
      SELECT id
      FROM teacher_availability
      WHERE tenant_id = $1
        AND teacher_user_id = $2
        AND day_of_week = $3
        AND is_available = FALSE
        AND start_time < $4
        AND end_time > $5
      LIMIT 1
    `,
    [payload.tenantId, payload.teacherUserId, payload.dayOfWeek, payload.endTime, payload.startTime]
  );
  if (rows[0]) {
    throw new HttpError(409, 'Teacher is marked unavailable at this time');
  }
}

export async function checkRoomCapacity(payload: {
  tenantId: string;
  batchId: string;
  roomId: string;
}): Promise<void> {
  const [room] = await query<{ capacity: number }>(
    `
      SELECT capacity
      FROM rooms
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `,
    [payload.tenantId, payload.roomId]
  );
  if (!room) {
    throw new HttpError(404, 'Room not found');
  }

  const [countRow] = await query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM batch_students bs
      JOIN batches b ON b.id = bs.batch_id
      WHERE b.tenant_id = $1 AND b.id = $2
    `,
    [payload.tenantId, payload.batchId]
  );

  const count = Number(countRow?.count ?? 0);
  if (count > room.capacity) {
    throw new HttpError(409, 'Room capacity is lower than batch size');
  }
}

export async function validateReferences(payload: {
  tenantId: string;
  batchId: string;
  courseId: string;
  teacherUserId: string;
  roomId: string;
  timeSlotId: string;
}): Promise<{ startTime: string; endTime: string }> {
  const [batch] = await query<{ id: string }>(
    `SELECT id FROM batches WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [payload.tenantId, payload.batchId]
  );
  if (!batch) throw new HttpError(404, 'Batch not found');

  const [course] = await query<{ id: string }>(
    `SELECT id FROM courses WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [payload.tenantId, payload.courseId]
  );
  if (!course) throw new HttpError(404, 'Course not found');

  const [teacher] = await query<{ id: string }>(
    `SELECT id FROM users WHERE tenant_id = $1 AND id = $2 AND role = 'teacher' LIMIT 1`,
    [payload.tenantId, payload.teacherUserId]
  );
  if (!teacher) throw new HttpError(404, 'Teacher not found');

  const [room] = await query<{ id: string }>(
    `SELECT id FROM rooms WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [payload.tenantId, payload.roomId]
  );
  if (!room) throw new HttpError(404, 'Room not found');

  const [slot] = await query<{ id: string; start_time: string; end_time: string }>(
    `SELECT id, start_time, end_time FROM time_slots WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [payload.tenantId, payload.timeSlotId]
  );
  if (!slot) throw new HttpError(404, 'Time slot not found');

  return { startTime: slot.start_time, endTime: slot.end_time };
}
