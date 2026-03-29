import type { Request, Response } from 'express';
import {
  createTenantUser,
  getCurrentUserProfile,
  login,
  logout,
  refreshAccessToken,
  registerInstituteAdmin,
  verifyEmailToken
} from './auth.service.js';
import { parseCsvToRows } from '../../utils/csv.js';

export async function registerInstituteHandler(req: Request, res: Response): Promise<void> {
  const result = await registerInstituteAdmin(req.body);
  res.status(201).json(result);
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const result = await login(req.body);
  res.status(200).json(result);
}

export async function refreshHandler(req: Request, res: Response): Promise<void> {
  const result = await refreshAccessToken(req.body);
  res.status(200).json(result);
}

export async function verifyEmailHandler(req: Request, res: Response): Promise<void> {
  const result = await verifyEmailToken({ token: req.body.token });
  res.status(200).json(result);
}

export async function logoutHandler(req: Request, res: Response): Promise<void> {
  await logout({
    refreshToken: req.body?.refreshToken,
    userId: req.auth?.userId
  });

  res.status(200).json({ message: 'Logged out successfully' });
}

export async function createTeacherHandler(req: Request, res: Response): Promise<void> {
  const result = await createTenantUser({
    tenantId: req.tenantId as string,
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    role: 'teacher'
  });

  res.status(201).json(result);
}

export async function createStudentHandler(req: Request, res: Response): Promise<void> {
  const result = await createTenantUser({
    tenantId: req.tenantId as string,
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    role: 'student'
  });

  res.status(201).json(result);
}

export async function createStaffHandler(req: Request, res: Response): Promise<void> {
  const result = await createTenantUser({
    tenantId: req.tenantId as string,
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    role: 'staff'
  });

  res.status(201).json(result);
}

export async function bulkCreateStudentsHandler(req: Request, res: Response): Promise<void> {
  const rows = parseCsvToRows(req.body.csv);

  const created: Array<{ email: string; status: string; message?: string }> = [];

  for (const row of rows) {
    const fullName = row.fullName?.trim();
    const email = row.email?.trim();
    const password = row.password?.trim();

    if (!fullName || !email || !password) {
      created.push({ email: email ?? 'unknown', status: 'failed', message: 'Missing fullName/email/password' });
      continue;
    }

    try {
      await createTenantUser({
        tenantId: req.tenantId as string,
        fullName,
        email,
        password,
        role: 'student'
      });
      created.push({ email, status: 'created' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed';
      created.push({ email, status: 'failed', message });
    }
  }

  res.status(200).json({ results: created });
}

export async function meHandler(req: Request, res: Response): Promise<void> {
  const profile = await getCurrentUserProfile(req.auth!.userId);
  res.status(200).json(profile);
}
