import {
  assignTeacherToBatch,
  listBatchesForTeacher,
  listTeachersForBatch,
  removeTeacherFromBatch
} from './batch-teacher.repository.js';

export async function assignTeacherToBatchService(payload: {
  tenantId: string;
  batchId: string;
  teacherUserId: string;
  courseId?: string;
}) {
  return assignTeacherToBatch(payload);
}

export async function removeTeacherFromBatchService(payload: {
  tenantId: string;
  batchId: string;
  teacherUserId: string;
}) {
  await removeTeacherFromBatch(payload);
}

export async function listTeachersForBatchService(payload: { tenantId: string; batchId: string }) {
  return listTeachersForBatch(payload);
}

export async function listBatchesForTeacherService(payload: { tenantId: string; teacherUserId: string }) {
  return listBatchesForTeacher(payload);
}
