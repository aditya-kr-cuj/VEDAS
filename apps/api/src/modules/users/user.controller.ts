import type { Request, Response } from 'express';
import {
  deleteUser,
  listUsersByTenant,
  listUsersByTenantAndRole,
  setUserActiveStatus,
  updateUserName,
  updateUserProfile
} from './user.repository.js';
import { HttpError } from '../../utils/http-error.js';

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
