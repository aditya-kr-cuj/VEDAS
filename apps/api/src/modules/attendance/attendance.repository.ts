import { query, withTransaction } from '../../db/client.js';
import { HttpError } from '../../utils/http-error.js';

export interface AttendanceRecord {
  id: string;
  tenant_id: string;
  batch_id: string;
  course_id: string | null;
  student_id: string;
  teacher_id: string;
  date: string;
  time_slot_id: string | null;
  status: string;
  remarks: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function markAttendanceBulk(payload: {
  tenantId: string;
  batchId: string;
  date: string;
  timeSlotId?: string;
  courseId?: string;
  teacherId: string;
  attendance: Array<{ studentId: string; status: string; remarks?: string }>;
}) {
  return withTransaction(async (client) => {
    const rows = await client.query<{ id: string }>(
      `SELECT id FROM batches WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
      [payload.tenantId, payload.batchId]
    );
    if (!rows.rows[0]) {
      throw new HttpError(404, 'Batch not found');
    }

    const results: Array<{ studentId: string; status: string }> = [];

    for (const entry of payload.attendance) {
      // Optional: ensure student belongs to batch if mapping exists
      const [membership] = await client.query<{ id: string }>(
        `
          SELECT bs.id
          FROM batch_students bs
          JOIN students s ON s.id = bs.student_id
          WHERE bs.batch_id = $1 AND s.id = $2
          LIMIT 1
        `,
        [payload.batchId, entry.studentId]
      );
      if (!membership) {
        throw new HttpError(400, `Student ${entry.studentId} is not assigned to this batch`);
      }

      if (payload.timeSlotId) {
        await client.query(
          `
            INSERT INTO attendance_records (
              tenant_id, batch_id, course_id, student_id, teacher_id, date, time_slot_id, status, remarks
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            ON CONFLICT (student_id, batch_id, date, time_slot_id)
            DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks, teacher_id = EXCLUDED.teacher_id, updated_at = NOW()
          `,
          [
            payload.tenantId,
            payload.batchId,
            payload.courseId ?? null,
            entry.studentId,
            payload.teacherId,
            payload.date,
            payload.timeSlotId,
            entry.status,
            entry.remarks ?? null
          ]
        );
      } else {
        const update = await client.query(
          `
            UPDATE attendance_records
            SET status = $1, remarks = $2, teacher_id = $3, updated_at = NOW()
            WHERE tenant_id = $4 AND batch_id = $5 AND student_id = $6 AND date = $7 AND time_slot_id IS NULL
            RETURNING id
          `,
          [
            entry.status,
            entry.remarks ?? null,
            payload.teacherId,
            payload.tenantId,
            payload.batchId,
            entry.studentId,
            payload.date
          ]
        );

        if (update.rows.length === 0) {
          await client.query(
            `
              INSERT INTO attendance_records (
                tenant_id, batch_id, course_id, student_id, teacher_id, date, time_slot_id, status, remarks
              )
              VALUES ($1,$2,$3,$4,$5,$6,NULL,$7,$8)
            `,
            [
              payload.tenantId,
              payload.batchId,
              payload.courseId ?? null,
              entry.studentId,
              payload.teacherId,
              payload.date,
              entry.status,
              entry.remarks ?? null
            ]
          );
        }
      }

      results.push({ studentId: entry.studentId, status: entry.status });
    }

    return results;
  });
}

export async function listAttendanceForBatch(payload: {
  tenantId: string;
  batchId: string;
  date: string;
  timeSlotId?: string;
}): Promise<AttendanceRecord[]> {
  return query<AttendanceRecord>(
    `
      SELECT *
      FROM attendance_records
      WHERE tenant_id = $1 AND batch_id = $2 AND date = $3
        AND ($4::uuid IS NULL OR time_slot_id = $4)
      ORDER BY created_at DESC
    `,
    [payload.tenantId, payload.batchId, payload.date, payload.timeSlotId ?? null]
  );
}

export async function listAttendanceForStudent(payload: {
  tenantId: string;
  studentId: string;
}): Promise<AttendanceRecord[]> {
  return query<AttendanceRecord>(
    `
      SELECT *
      FROM attendance_records
      WHERE tenant_id = $1 AND student_id = $2
      ORDER BY date DESC
    `,
    [payload.tenantId, payload.studentId]
  );
}

export async function updateAttendanceRecord(payload: {
  tenantId: string;
  id: string;
  status?: string;
  remarks?: string;
}): Promise<void> {
  await query(
    `
      UPDATE attendance_records
      SET status = COALESCE($1, status),
          remarks = COALESCE($2, remarks),
          updated_at = NOW()
      WHERE tenant_id = $3 AND id = $4
    `,
    [payload.status ?? null, payload.remarks ?? null, payload.tenantId, payload.id]
  );
}

export async function markAttendanceSingle(payload: {
  tenantId: string;
  batchId: string;
  courseId?: string;
  studentId: string;
  teacherId: string;
  date: string;
  timeSlotId?: string;
  status: string;
}): Promise<void> {
  if (payload.timeSlotId) {
    await query(
      `
        INSERT INTO attendance_records (
          tenant_id, batch_id, course_id, student_id, teacher_id, date, time_slot_id, status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (student_id, batch_id, date, time_slot_id)
        DO UPDATE SET status = EXCLUDED.status, teacher_id = EXCLUDED.teacher_id, updated_at = NOW()
      `,
      [
        payload.tenantId,
        payload.batchId,
        payload.courseId ?? null,
        payload.studentId,
        payload.teacherId,
        payload.date,
        payload.timeSlotId,
        payload.status
      ]
    );
    return;
  }

  await query(
    `
      INSERT INTO attendance_records (
        tenant_id, batch_id, course_id, student_id, teacher_id, date, time_slot_id, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,NULL,$7)
      ON CONFLICT (student_id, batch_id, date, time_slot_id)
      DO UPDATE SET status = EXCLUDED.status, teacher_id = EXCLUDED.teacher_id, updated_at = NOW()
    `,
    [
      payload.tenantId,
      payload.batchId,
      payload.courseId ?? null,
      payload.studentId,
      payload.teacherId,
      payload.date,
      payload.status
    ]
  );
}
