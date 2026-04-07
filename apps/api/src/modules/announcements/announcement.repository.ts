import { query, withTransaction } from '../../db/client.js';

export async function createAnnouncement(payload: {
  tenantId: string;
  title: string;
  message: string;
  createdBy: string;
  announcementType: string;
  targetType: string;
  priority: string;
  scheduledAt?: string;
  expiresAt?: string;
  isPinned: boolean;
  batchIds?: string[];
  studentIds?: string[];
  teacherIds?: string[];
}) {
  return withTransaction(async (client) => {
    const rows = await client.query(
      `
        INSERT INTO announcements (
          tenant_id, title, message, created_by, announcement_type, target_type,
          priority, scheduled_at, expires_at, is_pinned
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *
      `,
      [
        payload.tenantId,
        payload.title,
        payload.message,
        payload.createdBy,
        payload.announcementType,
        payload.targetType,
        payload.priority,
        payload.scheduledAt ?? null,
        payload.expiresAt ?? null,
        payload.isPinned
      ]
    );

    const announcement = rows.rows[0];

    if (payload.targetType === 'batch' && payload.batchIds?.length) {
      for (const batchId of payload.batchIds) {
        await client.query(
          `INSERT INTO announcement_recipients (announcement_id, batch_id) VALUES ($1,$2)`,
          [announcement.id, batchId]
        );
      }
    }
    if (payload.targetType === 'individual') {
      if (payload.studentIds?.length) {
        for (const studentId of payload.studentIds) {
          await client.query(
            `INSERT INTO announcement_recipients (announcement_id, student_id) VALUES ($1,$2)`,
            [announcement.id, studentId]
          );
        }
      }
      if (payload.teacherIds?.length) {
        for (const teacherId of payload.teacherIds) {
          await client.query(
            `INSERT INTO announcement_recipients (announcement_id, teacher_id) VALUES ($1,$2)`,
            [announcement.id, teacherId]
          );
        }
      }
    }

    return announcement;
  });
}

export async function listAnnouncements(payload: {
  tenantId: string;
  studentId?: string;
  teacherId?: string;
  unreadOnly?: boolean;
  pinnedOnly?: boolean;
}) {
  const where: string[] = ['a.tenant_id = $1'];
  const values: Array<string | boolean> = [payload.tenantId];
  let idx = values.length + 1;

  if (payload.unreadOnly) {
    where.push(`ar.read_at IS NULL`);
  }
  if (payload.pinnedOnly) {
    where.push(`a.is_pinned = TRUE`);
  }

  const joinRecipient =
    payload.studentId || payload.teacherId
      ? `
        LEFT JOIN announcement_recipients ar
          ON ar.announcement_id = a.id
      `
      : `
        LEFT JOIN announcement_recipients ar
          ON ar.announcement_id = a.id
      `;

  const targetCondition =
    payload.studentId || payload.teacherId
      ? `
        AND (
          a.target_type = 'all'
          OR (a.target_type = 'batch' AND EXISTS (
            SELECT 1 FROM announcement_recipients ar2
            JOIN batch_students bs ON bs.batch_id = ar2.batch_id
            WHERE ar2.announcement_id = a.id AND bs.student_id = $${idx}
          ))
          OR (a.target_type = 'individual' AND (
            (ar.student_id = $${idx})
            OR (ar.teacher_id = $${idx + 1})
          ))
        )
      `
      : '';

  if (payload.studentId) {
    values.push(payload.studentId, payload.teacherId ?? '');
    idx += 2;
  }

  return query(
    `
      SELECT a.*, ar.read_at
      FROM announcements a
      ${joinRecipient}
      WHERE ${where.join(' AND ')}
        AND (a.scheduled_at IS NULL OR a.scheduled_at <= NOW())
        AND (a.expires_at IS NULL OR a.expires_at >= NOW())
        ${targetCondition}
      ORDER BY a.is_pinned DESC, a.created_at DESC
    `,
    values
  );
}

export async function markAnnouncementRead(payload: { announcementId: string; studentId?: string; teacherId?: string }) {
  if (!payload.studentId && !payload.teacherId) return;
  await query(
    `
      UPDATE announcement_recipients
      SET read_at = NOW()
      WHERE announcement_id = $1 AND (student_id = $2 OR teacher_id = $3)
    `,
    [payload.announcementId, payload.studentId ?? null, payload.teacherId ?? null]
  );
}

export async function deleteAnnouncement(payload: { tenantId: string; announcementId: string }) {
  await query(`DELETE FROM announcements WHERE tenant_id = $1 AND id = $2`, [
    payload.tenantId,
    payload.announcementId
  ]);
}
