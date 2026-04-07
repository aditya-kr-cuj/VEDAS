import { query } from '../../db/client.js';

export interface RoomRecord {
  id: string;
  tenant_id: string;
  room_name: string;
  room_type: string;
  capacity: number;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function createRoom(payload: {
  tenantId: string;
  roomName: string;
  roomType?: string;
  capacity?: number;
  isAvailable?: boolean;
}): Promise<RoomRecord> {
  const rows = await query<RoomRecord>(
    `
      INSERT INTO rooms (tenant_id, room_name, room_type, capacity, is_available)
      VALUES ($1, $2, COALESCE($3, 'classroom'), COALESCE($4, 0), COALESCE($5, TRUE))
      RETURNING *
    `,
    [
      payload.tenantId,
      payload.roomName,
      payload.roomType ?? null,
      payload.capacity ?? null,
      payload.isAvailable ?? null
    ]
  );

  return rows[0];
}

export async function listRooms(tenantId: string): Promise<RoomRecord[]> {
  return query<RoomRecord>(
    `
      SELECT *
      FROM rooms
      WHERE tenant_id = $1
      ORDER BY room_name
    `,
    [tenantId]
  );
}

export async function findRoomById(tenantId: string, id: string): Promise<RoomRecord | null> {
  const rows = await query<RoomRecord>(
    `
      SELECT *
      FROM rooms
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `,
    [tenantId, id]
  );
  return rows[0] ?? null;
}

export async function updateRoom(payload: {
  tenantId: string;
  id: string;
  roomName?: string;
  roomType?: string;
  capacity?: number;
  isAvailable?: boolean;
}): Promise<void> {
  await query(
    `
      UPDATE rooms
      SET
        room_name = COALESCE($1, room_name),
        room_type = COALESCE($2, room_type),
        capacity = COALESCE($3, capacity),
        is_available = COALESCE($4, is_available),
        updated_at = NOW()
      WHERE tenant_id = $5 AND id = $6
    `,
    [
      payload.roomName ?? null,
      payload.roomType ?? null,
      payload.capacity ?? null,
      payload.isAvailable ?? null,
      payload.tenantId,
      payload.id
    ]
  );
}

export async function deleteRoom(payload: { tenantId: string; id: string }): Promise<void> {
  await query('DELETE FROM rooms WHERE tenant_id = $1 AND id = $2', [payload.tenantId, payload.id]);
}
