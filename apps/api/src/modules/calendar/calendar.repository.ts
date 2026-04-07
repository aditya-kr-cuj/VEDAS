import { query } from '../../db/client.js';

export async function createEvent(payload: {
  tenantId: string;
  title: string;
  description?: string;
  eventType: string;
  startDate: string;
  endDate: string;
  location?: string;
  createdBy: string;
  targetType: string;
  targetId?: string;
}) {
  const rows = await query(
    `
      INSERT INTO events (tenant_id, title, description, event_type, start_date, end_date, location, created_by, target_type, target_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `,
    [
      payload.tenantId,
      payload.title,
      payload.description ?? null,
      payload.eventType,
      payload.startDate,
      payload.endDate,
      payload.location ?? null,
      payload.createdBy,
      payload.targetType,
      payload.targetId ?? null
    ]
  );
  return rows[0];
}

export async function listEvents(payload: {
  tenantId: string;
  from?: string;
  to?: string;
  eventType?: string;
}) {
  const where: string[] = ['tenant_id = $1'];
  const values: Array<string> = [payload.tenantId];
  let idx = 2;

  if (payload.from) {
    where.push(`end_date >= $${idx++}::timestamptz`);
    values.push(payload.from);
  }
  if (payload.to) {
    where.push(`start_date <= $${idx++}::timestamptz`);
    values.push(payload.to);
  }
  if (payload.eventType) {
    where.push(`event_type = $${idx++}`);
    values.push(payload.eventType);
  }

  return query(
    `
      SELECT e.*, u.full_name AS creator_name
      FROM events e
      LEFT JOIN users u ON u.id = e.created_by
      WHERE ${where.join(' AND ')}
      ORDER BY start_date ASC
    `,
    values
  );
}

export async function getEventById(eventId: string, tenantId: string) {
  const rows = await query(
    `
      SELECT e.*, u.full_name AS creator_name
      FROM events e
      LEFT JOIN users u ON u.id = e.created_by
      WHERE e.id = $1 AND e.tenant_id = $2
    `,
    [eventId, tenantId]
  );
  return rows[0] ?? null;
}

export async function updateEvent(payload: {
  eventId: string;
  tenantId: string;
  title?: string;
  description?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  targetType?: string;
  targetId?: string;
}) {
  const sets: string[] = ['updated_at = NOW()'];
  const values: Array<string | null> = [];
  let idx = 1;

  if (payload.title !== undefined) { sets.push(`title = $${idx++}`); values.push(payload.title); }
  if (payload.description !== undefined) { sets.push(`description = $${idx++}`); values.push(payload.description); }
  if (payload.eventType !== undefined) { sets.push(`event_type = $${idx++}`); values.push(payload.eventType); }
  if (payload.startDate !== undefined) { sets.push(`start_date = $${idx++}`); values.push(payload.startDate); }
  if (payload.endDate !== undefined) { sets.push(`end_date = $${idx++}`); values.push(payload.endDate); }
  if (payload.location !== undefined) { sets.push(`location = $${idx++}`); values.push(payload.location); }
  if (payload.targetType !== undefined) { sets.push(`target_type = $${idx++}`); values.push(payload.targetType); }
  if (payload.targetId !== undefined) { sets.push(`target_id = $${idx++}`); values.push(payload.targetId); }

  values.push(payload.eventId);
  values.push(payload.tenantId);

  const rows = await query(
    `UPDATE events SET ${sets.join(', ')} WHERE id = $${idx++} AND tenant_id = $${idx} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function deleteEvent(eventId: string, tenantId: string) {
  const rows = await query(
    `DELETE FROM events WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [eventId, tenantId]
  );
  return rows.length > 0;
}

// For public notice board
export async function listUpcomingEvents(tenantId: string, limit = 20) {
  return query(
    `
      SELECT id, title, description, event_type, start_date, end_date, location
      FROM events
      WHERE tenant_id = $1 AND end_date >= NOW()
      ORDER BY start_date ASC
      LIMIT $2
    `,
    [tenantId, limit]
  );
}
