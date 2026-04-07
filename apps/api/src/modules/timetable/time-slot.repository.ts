import { query } from '../../db/client.js';

export interface TimeSlotRecord {
  id: string;
  tenant_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  slot_number: number;
  created_at: Date;
  updated_at: Date;
}

export async function createTimeSlot(payload: {
  tenantId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotNumber: number;
}): Promise<TimeSlotRecord> {
  const rows = await query<TimeSlotRecord>(
    `
      INSERT INTO time_slots (tenant_id, day_of_week, start_time, end_time, slot_number)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [payload.tenantId, payload.dayOfWeek, payload.startTime, payload.endTime, payload.slotNumber]
  );

  return rows[0];
}

export async function listTimeSlots(tenantId: string): Promise<TimeSlotRecord[]> {
  return query<TimeSlotRecord>(
    `
      SELECT *
      FROM time_slots
      WHERE tenant_id = $1
      ORDER BY day_of_week, slot_number
    `,
    [tenantId]
  );
}

export async function findTimeSlotById(tenantId: string, id: string): Promise<TimeSlotRecord | null> {
  const rows = await query<TimeSlotRecord>(
    `
      SELECT *
      FROM time_slots
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `,
    [tenantId, id]
  );
  return rows[0] ?? null;
}

export async function updateTimeSlot(payload: {
  tenantId: string;
  id: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  slotNumber?: number;
}): Promise<void> {
  await query(
    `
      UPDATE time_slots
      SET
        day_of_week = COALESCE($1, day_of_week),
        start_time = COALESCE($2, start_time),
        end_time = COALESCE($3, end_time),
        slot_number = COALESCE($4, slot_number),
        updated_at = NOW()
      WHERE tenant_id = $5 AND id = $6
    `,
    [
      payload.dayOfWeek ?? null,
      payload.startTime ?? null,
      payload.endTime ?? null,
      payload.slotNumber ?? null,
      payload.tenantId,
      payload.id
    ]
  );
}

export async function deleteTimeSlot(payload: { tenantId: string; id: string }): Promise<void> {
  await query('DELETE FROM time_slots WHERE tenant_id = $1 AND id = $2', [payload.tenantId, payload.id]);
}
