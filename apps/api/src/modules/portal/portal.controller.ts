import type { Request, Response } from 'express';
import { listNotificationsForUser } from '../notifications/notification.repository.js';
import { HttpError } from '../../utils/http-error.js';
import { query } from '../../db/client.js';
import { findStudentProfileByUserId } from '../students/student.repository.js';

export async function studentDashboardHandler(req: Request, res: Response): Promise<void> {
  const role = req.role;
  if (role !== 'student') {
    throw new HttpError(403, 'Student access only');
  }

  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');

  const student = await findStudentProfileByUserId(tenantId, userId);
  if (!student) throw new HttpError(404, 'Student profile not found');

  const [attendance] = await query<{ total: string; present: string }>(
    `
      SELECT
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE status IN ('present', 'late', 'excused'))::text AS present
      FROM attendance_records
      WHERE tenant_id = $1 AND student_id = $2
    `,
    [tenantId, student.id]
  );
  const [tests] = await query<{ total: string; avg_score: string }>(
    `
      SELECT COUNT(*)::text AS total, COALESCE(AVG(percentage), 0)::text AS avg_score
      FROM test_attempts ta
      JOIN tests t ON t.id = ta.test_id
      WHERE t.tenant_id = $1 AND ta.student_id = $2 AND ta.status IN ('submitted', 'evaluated')
    `,
    [tenantId, student.id]
  );
  const [fees] = await query<{ pending: string }>(
    `
      SELECT COALESCE(SUM(due_amount), 0)::text AS pending
      FROM student_fees
      WHERE tenant_id = $1 AND student_id = $2 AND status IN ('pending', 'partially_paid', 'overdue')
    `,
    [tenantId, student.id]
  );
  const notifications = await listNotificationsForUser(req.auth!.userId);
  const totalAttendance = Number(attendance?.total ?? 0);
  const presentAttendance = Number(attendance?.present ?? 0);
  const data = {
    attendancePercentage: totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0,
    testsAttempted: Number(tests?.total ?? 0),
    averageScore: Math.round(Number(tests?.avg_score ?? 0)),
    pendingFees: Number(fees?.pending ?? 0)
  };

  res.status(200).json({
    message: 'Welcome student',
    success: true,
    data,
    notifications
  });
}

export async function teacherDashboardHandler(req: Request, res: Response): Promise<void> {
  const role = req.role;
  if (role !== 'teacher') {
    throw new HttpError(403, 'Teacher access only');
  }

  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');

  const [batches] = await query<{ count: string }>(
    `
      SELECT COUNT(DISTINCT batch_id)::text AS count
      FROM batch_teachers
      WHERE teacher_user_id = $1 AND tenant_id = $2
    `,
    [userId, tenantId]
  );
  const [tests] = await query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM tests t
      JOIN teachers teacher ON teacher.id = t.created_by
      WHERE teacher.user_id = $1 AND t.tenant_id = $2
    `,
    [userId, tenantId]
  );
  const [pendingEvaluations] = await query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM test_attempts ta
      JOIN tests test ON test.id = ta.test_id
      JOIN teachers teacher ON teacher.id = test.created_by
      WHERE teacher.user_id = $1 AND test.tenant_id = $2 AND ta.status = 'submitted'
    `,
    [userId, tenantId]
  );
  const [students] = await query<{ count: string }>(
    `
      SELECT COUNT(DISTINCT bs.student_id)::text AS count
      FROM batch_students bs
      JOIN batch_teachers bt ON bt.batch_id = bs.batch_id
      WHERE bt.teacher_user_id = $1 AND bt.tenant_id = $2
    `,
    [userId, tenantId]
  );
  const notifications = await listNotificationsForUser(req.auth!.userId);
  const data = {
    totalStudents: Number(students?.count ?? 0),
    totalBatches: Number(batches?.count ?? 0),
    testsCreated: Number(tests?.count ?? 0),
    pendingEvaluations: Number(pendingEvaluations?.count ?? 0)
  };

  res.status(200).json({
    message: 'Welcome teacher',
    success: true,
    data,
    notifications
  });
}
