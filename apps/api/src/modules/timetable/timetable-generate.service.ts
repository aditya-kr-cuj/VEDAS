import { query } from '../../db/client.js';
import { HttpError } from '../../utils/http-error.js';
import {
  checkBatchConflict,
  checkRoomCapacity,
  checkRoomConflict,
  checkTeacherAvailability,
  checkTeacherConflict,
  createTimetableEntry,
  validateReferences
} from './timetable-entry.repository.js';

type GenerateCourse = {
  courseId: string;
  teacherUserId: string;
  lecturesPerWeek: number;
  preferredTimeSlotIds?: string[];
};

type GeneratedEntry = {
  batchId: string;
  courseId: string;
  teacherUserId: string;
  roomId: string;
  timeSlotId: string;
  dayOfWeek: string;
};

async function getBaseData(tenantId: string, batchId: string, courses: GenerateCourse[]) {
  const timeSlots = await query<{
    id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    slot_number: number;
  }>(
    `SELECT * FROM time_slots WHERE tenant_id = $1 ORDER BY day_of_week, slot_number`,
    [tenantId]
  );

  const rooms = await query<{ id: string; room_name: string; capacity: number; is_available: boolean }>(
    `SELECT id, room_name, capacity, is_available FROM rooms WHERE tenant_id = $1 AND is_available = TRUE`,
    [tenantId]
  );

  const courseIds = courses.map((c) => c.courseId);
  const teacherIds = courses.map((c) => c.teacherUserId);

  const courseRows = await query<{ id: string; name: string }>(
    `SELECT id, name FROM courses WHERE tenant_id = $1 AND id = ANY($2::uuid[])`,
    [tenantId, courseIds]
  );
  const teacherRows = await query<{ id: string; full_name: string }>(
    `SELECT id, full_name FROM users WHERE tenant_id = $1 AND id = ANY($2::uuid[])`,
    [tenantId, teacherIds]
  );

  const existing = await query<{
    id: string;
    batch_id: string;
    teacher_user_id: string;
    room_id: string;
    time_slot_id: string;
    day_of_week: string;
  }>(
    `
      SELECT id, batch_id, teacher_user_id, room_id, time_slot_id, day_of_week
      FROM timetable_entries
      WHERE tenant_id = $1 AND (
        batch_id = $2 OR teacher_user_id = ANY($3::uuid[]) OR room_id = ANY($4::uuid[])
      )
    `,
    [tenantId, batchId, teacherIds, rooms.map((r) => r.id)]
  );

  return { timeSlots, rooms, courseRows, teacherRows, existing };
}

function buildKey(day: string, timeSlotId: string) {
  return `${day}-${timeSlotId}`;
}

export async function generateTimetable(payload: {
  tenantId: string;
  batchId: string;
  courses: GenerateCourse[];
}) {
  const { timeSlots, rooms, courseRows, teacherRows, existing } = await getBaseData(
    payload.tenantId,
    payload.batchId,
    payload.courses
  );

  if (timeSlots.length === 0) {
    throw new HttpError(400, 'No time slots available');
  }
  if (rooms.length === 0) {
    throw new HttpError(400, 'No rooms available');
  }

  const occupancyBatch = new Set<string>();
  const occupancyTeacher = new Map<string, Set<string>>();
  const occupancyRoom = new Map<string, Set<string>>();

  existing.forEach((entry) => {
    const key = buildKey(entry.day_of_week, entry.time_slot_id);
    if (entry.batch_id === payload.batchId) occupancyBatch.add(key);
    if (!occupancyTeacher.has(entry.teacher_user_id)) occupancyTeacher.set(entry.teacher_user_id, new Set());
    occupancyTeacher.get(entry.teacher_user_id)!.add(key);
    if (!occupancyRoom.has(entry.room_id)) occupancyRoom.set(entry.room_id, new Set());
    occupancyRoom.get(entry.room_id)!.add(key);
  });

  const errors: Array<{ courseId: string; error: string }> = [];
  const generated: GeneratedEntry[] = [];

  for (const course of payload.courses) {
    const preferredSet = new Set(course.preferredTimeSlotIds ?? []);
    const candidateSlots = [
      ...timeSlots.filter((s) => preferredSet.has(s.id)),
      ...timeSlots.filter((s) => !preferredSet.has(s.id))
    ];

    for (let i = 0; i < course.lecturesPerWeek; i += 1) {
      let placed = false;

      for (const slot of candidateSlots) {
        const key = buildKey(slot.day_of_week, slot.id);

        if (occupancyBatch.has(key)) continue;
        const teacherBusy = occupancyTeacher.get(course.teacherUserId)?.has(key);
        if (teacherBusy) continue;

        let selectedRoom: { id: string; capacity: number } | null = null;
        for (const room of rooms) {
          const roomBusy = occupancyRoom.get(room.id)?.has(key);
          if (roomBusy) continue;
          selectedRoom = room;
          break;
        }

        if (!selectedRoom) continue;

        generated.push({
          batchId: payload.batchId,
          courseId: course.courseId,
          teacherUserId: course.teacherUserId,
          roomId: selectedRoom.id,
          timeSlotId: slot.id,
          dayOfWeek: slot.day_of_week
        });

        occupancyBatch.add(key);
        if (!occupancyTeacher.has(course.teacherUserId)) occupancyTeacher.set(course.teacherUserId, new Set());
        occupancyTeacher.get(course.teacherUserId)!.add(key);
        if (!occupancyRoom.has(selectedRoom.id)) occupancyRoom.set(selectedRoom.id, new Set());
        occupancyRoom.get(selectedRoom.id)!.add(key);

        placed = true;
        break;
      }

      if (!placed) {
        errors.push({
          courseId: course.courseId,
          error: `Insufficient slots for course ${course.courseId}`
        });
      }
    }
  }

  const entriesWithMeta = generated.map((entry) => {
    const course = courseRows.find((c) => c.id === entry.courseId);
    const teacher = teacherRows.find((t) => t.id === entry.teacherUserId);
    const slot = timeSlots.find((t) => t.id === entry.timeSlotId);
    const room = rooms.find((r) => r.id === entry.roomId);
    return {
      ...entry,
      courseName: course?.name ?? 'Unknown',
      teacherName: teacher?.full_name ?? 'Unknown',
      startTime: slot?.start_time ?? '',
      endTime: slot?.end_time ?? '',
      roomName: room?.room_name ?? 'Room'
    };
  });

  return { entries: entriesWithMeta, errors };
}

export async function applyTimetable(payload: { tenantId: string; entries: GeneratedEntry[] }) {
  for (const entry of payload.entries) {
    const { startTime, endTime } = await validateReferences({
      tenantId: payload.tenantId,
      batchId: entry.batchId,
      courseId: entry.courseId,
      teacherUserId: entry.teacherUserId,
      roomId: entry.roomId,
      timeSlotId: entry.timeSlotId
    });

    await checkBatchConflict({
      tenantId: payload.tenantId,
      batchId: entry.batchId,
      timeSlotId: entry.timeSlotId,
      dayOfWeek: entry.dayOfWeek
    });
    await checkTeacherConflict({
      tenantId: payload.tenantId,
      teacherUserId: entry.teacherUserId,
      timeSlotId: entry.timeSlotId,
      dayOfWeek: entry.dayOfWeek
    });
    await checkRoomConflict({
      tenantId: payload.tenantId,
      roomId: entry.roomId,
      timeSlotId: entry.timeSlotId,
      dayOfWeek: entry.dayOfWeek
    });
    await checkTeacherAvailability({
      tenantId: payload.tenantId,
      teacherUserId: entry.teacherUserId,
      dayOfWeek: entry.dayOfWeek,
      startTime,
      endTime
    });
    await checkRoomCapacity({
      tenantId: payload.tenantId,
      batchId: entry.batchId,
      roomId: entry.roomId
    });

    await createTimetableEntry({
      tenantId: payload.tenantId,
      batchId: entry.batchId,
      courseId: entry.courseId,
      teacherUserId: entry.teacherUserId,
      roomId: entry.roomId,
      timeSlotId: entry.timeSlotId,
      dayOfWeek: entry.dayOfWeek
    });
  }

  return { created: payload.entries.length };
}
