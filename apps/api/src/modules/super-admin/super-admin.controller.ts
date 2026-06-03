import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  getDashboardStats,
  getRecentRegistrations,
  listInstitutes,
  getInstituteDetail,
  updateInstituteStatus,
  updateInstituteDetails,
  deleteInstitute,
  getSignupTimeseries,
  getRevenueByPlan,
  listTenantSummaries
} from './super-admin.repository.js';

/* ─── Dashboard ──────────────────────────────────── */

export async function getDashboardHandler(_req: Request, res: Response): Promise<void> {
  const stats = await getDashboardStats();
  const recentRegistrations = await getRecentRegistrations(10);
  res.status(200).json({ stats, recentRegistrations });
}

/* ─── Institute List ─────────────────────────────── */

export async function listInstitutesHandler(req: Request, res: Response): Promise<void> {
  const { status, plan, search, page, limit } = req.query;
  const result = await listInstitutes({
    status: status as string | undefined,
    plan: plan as string | undefined,
    search: search as string | undefined,
    page: page ? parseInt(page as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined
  });
  res.status(200).json(result);
}

/* ─── Institute Detail ───────────────────────────── */

export async function getInstituteDetailHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const detail = await getInstituteDetail(id);
  if (!detail) {
    throw new HttpError(404, 'Institute not found');
  }
  res.status(200).json(detail);
}

/* ─── Update Institute Details ───────────────────── */

export async function updateInstituteHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const detail = await getInstituteDetail(id);
  if (!detail) {
    throw new HttpError(404, 'Institute not found');
  }
  await updateInstituteDetails(id, req.body);
  res.status(200).json({ message: 'Institute updated' });
}

/* ─── Update Institute Status ────────────────────── */

export async function updateInstituteStatusHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status, is_active } = req.body;
  const nextStatus =
    typeof status === 'string'
      ? status
      : typeof is_active === 'boolean'
      ? is_active
        ? 'active'
        : 'suspended'
      : null;

  if (!nextStatus || !['pending', 'active', 'suspended', 'rejected'].includes(nextStatus)) {
    throw new HttpError(400, 'status must be one of pending, active, suspended, rejected');
  }
  const detail = await getInstituteDetail(id);
  if (!detail) {
    throw new HttpError(404, 'Institute not found');
  }
  await updateInstituteStatus(id, nextStatus as 'pending' | 'active' | 'suspended' | 'rejected');
  res.status(200).json({ message: `Institute status updated to ${nextStatus}` });
}

/* ─── Delete Institute ───────────────────────────── */

export async function deleteInstituteHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const detail = await getInstituteDetail(id);
  if (!detail) {
    throw new HttpError(404, 'Institute not found');
  }
  await deleteInstitute(id);
  res.status(200).json({ message: 'Institute deleted' });
}

/* ─── Analytics ──────────────────────────────────── */

export async function getSignupAnalyticsHandler(_req: Request, res: Response): Promise<void> {
  const data = await getSignupTimeseries();
  res.status(200).json({ data });
}

export async function getRevenueAnalyticsHandler(_req: Request, res: Response): Promise<void> {
  const data = await getRevenueByPlan();
  res.status(200).json({ data });
}

/* ─── Legacy (backwards compat) ──────────────────── */

export async function listTenantsHandler(_req: Request, res: Response): Promise<void> {
  const tenants = await listTenantSummaries();
  res.status(200).json({ tenants });
}
