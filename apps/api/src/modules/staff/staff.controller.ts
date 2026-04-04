import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { createTenantUser } from '../auth/auth.service.js';
import { findUserById, listUsersByTenantAndRole, setUserActiveStatus, updateUserName } from '../users/user.repository.js';

export async function listStaffHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const staff = await listUsersByTenantAndRole(tenantId, 'staff');
  res.status(200).json({ staff });
}

export async function getStaffHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const user = await findUserById(req.params.id);
  if (!user || user.tenant_id !== tenantId || user.role !== 'staff') {
    throw new HttpError(404, 'Staff member not found');
  }

  res.status(200).json({
    staff: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at
    }
  });
}

export async function createStaffHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const staff = await createTenantUser({
    tenantId,
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    role: 'staff'
  });

  res.status(201).json(staff);
}

export async function updateStaffHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const user = await findUserById(req.params.id);
  if (!user || user.tenant_id !== tenantId || user.role !== 'staff') {
    throw new HttpError(404, 'Staff member not found');
  }

  await updateUserName({
    userId: user.id,
    tenantId,
    fullName: req.body.fullName ?? user.full_name
  });

  res.status(200).json({ message: 'Staff updated' });
}

export async function deleteStaffHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const user = await findUserById(req.params.id);
  if (!user || user.tenant_id !== tenantId || user.role !== 'staff') {
    throw new HttpError(404, 'Staff member not found');
  }

  await setUserActiveStatus({ userId: user.id, tenantId, isActive: false });
  res.status(200).json({ message: 'Staff deactivated' });
}
