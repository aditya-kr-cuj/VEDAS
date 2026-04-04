import type { Request, Response } from 'express';
import {
  deleteUser,
  listUsersByTenant,
  listUsersByTenantAndRole,
  findUserById,
  setUserActiveStatus,
  updateUserName,
  updateUserProfile,
  updateUserRole
} from './user.repository.js';
import { HttpError } from '../../utils/http-error.js';
import { createStudentProfile, findStudentProfileByUserId } from '../students/student.repository.js';
import { createTeacherProfile, findTeacherProfileByUserId } from '../teachers/teacher.repository.js';
import { withTransaction } from '../../db/client.js';

export async function listTenantUsersHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const roleFilter = req.query.role?.toString();
  if (roleFilter && !['student', 'teacher', 'staff', 'institute_admin'].includes(roleFilter)) {
    throw new HttpError(400, 'Invalid role filter');
  }
  const users = roleFilter
    ? await listUsersByTenantAndRole(tenantId, roleFilter as never)
    : await listUsersByTenant(tenantId);

  res.status(200).json({ users });
}

export async function updateMyProfileHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId ?? null;
  const userId = req.auth?.userId;

  if (!userId) {
    throw new HttpError(401, 'Unauthorized');
  }

  await updateUserProfile({ userId, tenantId, fullName: req.body.fullName });
  res.status(200).json({ message: 'Profile updated' });
}

export async function updateUserStatusHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  await setUserActiveStatus({
    userId: req.params.id,
    tenantId,
    isActive: req.body.isActive
  });

  res.status(200).json({ message: 'User status updated' });
}

export async function updateUserNameHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  await updateUserName({
    userId: req.params.id,
    tenantId,
    fullName: req.body.fullName
  });

  res.status(200).json({ message: 'User profile updated' });
}

export async function deleteUserHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  await deleteUser({ userId: req.params.id, tenantId });
  res.status(200).json({ message: 'User deleted' });
}

export async function updateUserRoleHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const user = await findUserById(req.params.id);
  if (!user || user.tenant_id !== tenantId) {
    throw new HttpError(404, 'User not found');
  }

  if (user.role === 'super_admin' || user.role === 'institute_admin') {
    throw new HttpError(403, 'Cannot change role for this user');
  }

  const role = req.body.role as 'student' | 'teacher' | 'staff';
  await withTransaction(async (client) => {
    await updateUserRole({ userId: user.id, tenantId, role }, client);

    if (role === 'student') {
      const existing = await findStudentProfileByUserId(tenantId, user.id);
      if (!existing) {
        await createStudentProfile(client, { tenantId, userId: user.id });
      }
    }

    if (role === 'teacher') {
      const existing = await findTeacherProfileByUserId(tenantId, user.id);
      if (!existing) {
        await createTeacherProfile(client, { tenantId, userId: user.id });
      }
    }
  });

  res.status(200).json({ message: 'User role updated' });
}
