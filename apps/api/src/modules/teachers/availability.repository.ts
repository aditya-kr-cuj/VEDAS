import { query } from '../../db/client.js';

export interface AvailabilityRecord {
  id: string;
  tenant_id: string;
  teacher_user_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createAvailability(payload: {
  tenantId: string;
  teacherUserId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
  reason?: string;
}): Promise<AvailabilityRecord> {
  const rows = await query<AvailabilityRecord>(
    `
      INSERT INTO teacher_availability (tenant_id, teacher_user_id, day_of_week, start_time, end_time, is_available, reason)
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, FALSE), $7)
      RETURNING *
    `,
    [
      payload.tenantId,
      payload.teacherUserId,
      payload.dayOfWeek,
      payload.startTime,
      payload.endTime,
      payload.isAvailable ?? false,
      payload.reason ?? null
    ]
  );

  return rows[0];
}

export async function listAvailabilityByTeacher(payload: {
  tenantId: string;
  teacherUserId: string;
}): Promise<AvailabilityRecord[]> {
  return query<AvailabilityRecord>(
    `
      SELECT *
      FROM teacher_availability
      WHERE tenant_id = $1 AND teacher_user_id = $2
      ORDER BY day_of_week, start_time
    `,
    [payload.tenantId, payload.teacherUserId]
  );
}

export async function findAvailabilityById(payload: {
  tenantId: string;
  teacherUserId: string;
  availabilityId: string;
}): Promise<AvailabilityRecord | null> {
  const rows = await query<AvailabilityRecord>(
    `
      SELECT *
      FROM teacher_availability
      WHERE tenant_id = $1 AND teacher_user_id = $2 AND id = $3
      LIMIT 1
    `,
    [payload.tenantId, payload.teacherUserId, payload.availabilityId]
  );
  return rows[0] ?? null;
}

export async function updateAvailability(payload: {
  tenantId: string;
  teacherUserId: string;
  availabilityId: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
  reason?: string;
}): Promise<void> {
  await query(
    `
      UPDATE teacher_availability
      SET
        day_of_week = COALESCE($1, day_of_week),
        start_time = COALESCE($2, start_time),
        end_time = COALESCE($3, end_time),
        is_available = COALESCE($4, is_available),
        reason = COALESCE($5, reason),
        updated_at = NOW()
      WHERE tenant_id = $6 AND teacher_user_id = $7 AND id = $8
    `,
    [
      payload.dayOfWeek ?? null,
      payload.startTime ?? null,
      payload.endTime ?? null,
      payload.isAvailable ?? null,
      payload.reason ?? null,
      payload.tenantId,
      payload.teacherUserId,
      payload.availabilityId
    ]
  );
}

export async function deleteAvailability(payload: {
  tenantId: string;
  teacherUserId: string;
  availabilityId: string;
}): Promise<void> {
  await query(
    `DELETE FROM teacher_availability WHERE tenant_id = $1 AND teacher_user_id = $2 AND id = $3`,
    [payload.tenantId, payload.teacherUserId, payload.availabilityId]
  );
}
